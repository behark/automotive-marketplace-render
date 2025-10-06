import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Middleware to check admin permissions
async function checkAdminPermissions() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return { error: 'Authentication required', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || user.role !== 'admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, error: null }
}

// GET /api/admin/users - Get all users for admin management
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminPermissions()
  if (adminCheck.error) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = {}

    if (role !== 'all') {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get users with analytics
    const users = await prisma.user.findMany({
      where,
      include: {
        listings: {
          select: { id: true, status: true }
        },
        messages: {
          select: { id: true }
        },
        favorites: {
          select: { id: true }
        },
        payments: {
          select: { id: true, amount: true, status: true }
        },
        subscriptions: {
          where: { status: 'active' },
          select: { id: true, plan: true, currentPeriodEnd: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Format response with user analytics
    const formattedUsers = users.map(user => {
      const activeListings = user.listings.filter(l => l.status === 'active').length
      const totalRevenue = user.payments
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0) / 100 // Convert to euros

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
        analytics: {
          totalListings: user.listings.length,
          activeListings,
          totalMessages: user.messages.length,
          totalFavorites: user.favorites.length,
          totalRevenue,
          hasActiveSubscription: user.subscriptions.length > 0
        }
      }
    })

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users - Update user role or status
export async function PUT(request: NextRequest) {
  const adminCheck = await checkAdminPermissions()
  if (adminCheck.error) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    )
  }

  try {
    const body = await request.json()
    const { userId, action, role, reason } = body
    // action: suspend, unsuspend, change_role, delete

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from modifying other admins
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot modify admin users' },
        { status: 403 }
      )
    }

    let updateData: any = { updatedAt: new Date() }

    switch (action) {
      case 'suspend':
        // Suspend user account (deactivate listings)
        await prisma.listing.updateMany({
          where: { userId: userId },
          data: { status: 'suspended' }
        })
        updateData.subscriptionStatus = 'suspended'
        break

      case 'unsuspend':
        // Reactivate user account
        await prisma.listing.updateMany({
          where: { userId: userId, status: 'suspended' },
          data: { status: 'active' }
        })
        updateData.subscriptionStatus = 'active'
        break

      case 'change_role':
        if (!role || !['user', 'dealer'].includes(role)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          )
        }
        updateData.role = role
        break

      case 'delete':
        // Soft delete - deactivate all listings and mark as deleted
        await prisma.listing.updateMany({
          where: { userId: userId },
          data: { status: 'deleted' }
        })
        updateData.subscriptionStatus = 'deleted'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // TODO: Send notification email to user
    // TODO: Log admin action for audit trail

    return NextResponse.json({
      message: `User ${action} successful`,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error moderating user:', error)
    return NextResponse.json(
      { error: 'Failed to moderate user' },
      { status: 500 }
    )
  }
}