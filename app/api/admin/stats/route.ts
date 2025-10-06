import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../../lib/auth'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

// GET /api/admin/stats - Get platform statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get comprehensive statistics
    const [
      totalUsers,
      totalListings,
      activeListings,
      pendingListings,
      rejectedListings,
      totalMessages,
      totalFavorites,
      totalPayments,
      recentSignups
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total listings
      prisma.listing.count(),

      // Active listings
      prisma.listing.count({
        where: { status: 'active' }
      }),

      // Pending listings
      prisma.listing.count({
        where: { status: 'pending' }
      }),

      // Rejected listings
      prisma.listing.count({
        where: { status: 'rejected' }
      }),

      // Total messages
      prisma.message.count(),

      // Total favorites
      prisma.favorite.count(),

      // Total successful payments
      prisma.payment.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true },
        _count: { id: true }
      }),

      // Recent signups (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          }
        }
      })
    ])

    // Calculate revenue in euros
    const totalRevenue = (totalPayments._sum.amount || 0) / 100

    // Get listing status breakdown
    const listingsByStatus = await prisma.listing.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    // Get user role breakdown
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    })

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const recentActivity = {
      newListings: await prisma.listing.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      newUsers: await prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      newMessages: await prisma.message.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      revenueThisMonth: (await prisma.payment.aggregate({
        where: {
          status: 'succeeded',
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { amount: true }
      }))._sum.amount || 0
    }

    return NextResponse.json({
      // Overview stats
      totalUsers,
      totalListings,
      activeListings,
      pendingListings,
      rejectedListings,
      totalMessages,
      totalFavorites,
      totalRevenue,
      recentSignups,

      // Breakdown data
      listingsByStatus,
      usersByRole,

      // Recent activity
      recentActivity: {
        ...recentActivity,
        revenueThisMonth: recentActivity.revenueThisMonth / 100 // Convert to euros
      },

      // Growth metrics
      growthMetrics: {
        userGrowthRate: recentSignups / Math.max(totalUsers - recentSignups, 1) * 100,
        listingGrowthRate: recentActivity.newListings / Math.max(totalListings - recentActivity.newListings, 1) * 100
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}