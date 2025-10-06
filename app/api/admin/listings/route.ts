import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../../lib/auth'

const prisma = new PrismaClient()

// Middleware to check admin permissions
async function checkAdminPermissions(request: NextRequest) {
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

// GET /api/admin/listings - Get all listings for moderation
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminPermissions(request)
  if (adminCheck.error) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {}

    if (status !== 'all') {
      where.status = status
    }

    // Get total count
    const total = await prisma.listing.count({ where })

    // Get listings
    const listings = await prisma.listing.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        messages: {
          select: { id: true }
        },
        favorites: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Format response with analytics
    const formattedListings = listings.map(listing => ({
      ...listing,
      price: listing.price / 100,
      images: listing.images ? listing.images.split(',') : [],
      messageCount: listing.messages.length,
      favoriteCount: listing.favorites.length
    }))

    return NextResponse.json({
      listings: formattedListings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching admin listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/listings - Moderate listing (approve/reject/feature)
export async function PUT(request: NextRequest) {
  const adminCheck = await checkAdminPermissions(request)
  if (adminCheck.error) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    )
  }

  try {
    const body = await request.json()
    const { listingId, action, reason } = body // action: approve, reject, feature, unfeature, delete

    if (!listingId || !action) {
      return NextResponse.json(
        { error: 'Listing ID and action are required' },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Perform action
    let updateData: any = { updatedAt: new Date() }

    switch (action) {
      case 'approve':
        updateData.status = 'active'
        break
      case 'reject':
        updateData.status = 'rejected'
        break
      case 'feature':
        updateData.featured = true
        break
      case 'unfeature':
        updateData.featured = false
        break
      case 'delete':
        updateData.status = 'deleted'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: updateData
    })

    // TODO: Send notification email to listing owner
    // TODO: Log admin action for audit trail

    return NextResponse.json({
      message: `Listing ${action}ed successfully`,
      listing: updatedListing
    })

  } catch (error) {
    console.error('Error moderating listing:', error)
    return NextResponse.json(
      { error: 'Failed to moderate listing' },
      { status: 500 }
    )
  }
}