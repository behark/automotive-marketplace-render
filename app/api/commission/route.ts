import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// Commission rates by subscription tier
const COMMISSION_RATES = {
  basic: 0.05,     // 5% for basic users
  premium: 0.04,   // 4% for premium users
  dealer: 0.035,   // 3.5% for dealer users
  enterprise: 0.03 // 3% for enterprise users
}

// POST /api/commission - Mark listing as sold and calculate commission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { listingId, soldPrice, buyerInfo } = body

    if (!listingId || !soldPrice || soldPrice <= 0) {
      return NextResponse.json(
        { error: 'Listing ID and valid sold price are required' },
        { status: 400 }
      )
    }

    // Find the listing and verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: true,
        commission: true
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify the user owns this listing
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || listing.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only mark your own listings as sold' },
        { status: 403 }
      )
    }

    // Check if already sold
    if (listing.status === 'sold') {
      return NextResponse.json(
        { error: 'This listing is already marked as sold' },
        { status: 400 }
      )
    }

    // Calculate commission
    const commissionRate = COMMISSION_RATES[user.plan as keyof typeof COMMISSION_RATES] || COMMISSION_RATES.basic
    const commissionAmount = Math.round(soldPrice * commissionRate)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30) // Commission due in 30 days

    // Update listing as sold
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'sold',
        soldPrice: soldPrice,
        soldDate: new Date(),
        commissionRate: commissionRate
      }
    })

    // Create commission record
    const commission = await prisma.commission.create({
      data: {
        listingId: listingId,
        sellerId: user.id,
        salePrice: soldPrice,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        dueDate: dueDate,
        status: 'pending'
      }
    })

    // Update user's total commission owed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalCommissionOwed: {
          increment: commissionAmount
        }
      }
    })

    // Create a lead if buyer info was provided
    if (buyerInfo && buyerInfo.email) {
      await prisma.lead.create({
        data: {
          listingId: listingId,
          sellerId: user.id,
          contactInfo: buyerInfo,
          status: 'converted',
          price: 0, // No cost since it converted directly
          qualityScore: 100, // Perfect score for direct conversion
          purchasedAt: new Date(),
          contactedAt: new Date(),
          convertedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      message: 'Listing marked as sold successfully',
      commission: {
        id: commission.id,
        amount: commissionAmount,
        rate: commissionRate,
        dueDate: dueDate,
        status: 'pending'
      },
      listing: {
        id: updatedListing.id,
        status: updatedListing.status,
        soldPrice: soldPrice,
        soldDate: updatedListing.soldDate
      }
    })

  } catch (error) {
    console.error('Error marking listing as sold:', error)
    return NextResponse.json(
      { error: 'Failed to mark listing as sold' },
      { status: 500 }
    )
  }
}

// GET /api/commission - Get commission status and history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const listingId = url.searchParams.get('listingId')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build query filters
    const where: any = { sellerId: user.id }
    if (status) where.status = status
    if (listingId) where.listingId = listingId

    // Get commissions
    const commissions = await prisma.commission.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            make: true,
            model: true,
            year: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get summary statistics
    const totalOwed = await prisma.commission.aggregate({
      where: { sellerId: user.id, status: { in: ['pending', 'invoiced'] } },
      _sum: { commissionAmount: true }
    })

    const totalPaid = await prisma.commission.aggregate({
      where: { sellerId: user.id, status: 'paid' },
      _sum: { commissionAmount: true }
    })

    const overdue = await prisma.commission.count({
      where: {
        sellerId: user.id,
        status: { in: ['pending', 'invoiced'] },
        dueDate: { lt: new Date() }
      }
    })

    return NextResponse.json({
      commissions,
      summary: {
        totalOwed: totalOwed._sum.commissionAmount || 0,
        totalPaid: totalPaid._sum.commissionAmount || 0,
        overdueCount: overdue,
        userTotalOwed: user.totalCommissionOwed,
        userTotalPaid: user.totalCommissionPaid
      }
    })

  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    )
  }
}

// PUT /api/commission - Pay commission (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { commissionId, paymentIntentId, notes } = body

    if (!commissionId) {
      return NextResponse.json(
        { error: 'Commission ID is required' },
        { status: 400 }
      )
    }

    // Find commission
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: { seller: true }
    })

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission not found' },
        { status: 404 }
      )
    }

    if (commission.status === 'paid') {
      return NextResponse.json(
        { error: 'Commission already paid' },
        { status: 400 }
      )
    }

    // Update commission as paid
    const updatedCommission = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: 'paid',
        paidDate: new Date(),
        stripePaymentId: paymentIntentId,
        notes: notes
      }
    })

    // Update user's total paid amount
    await prisma.user.update({
      where: { id: commission.sellerId },
      data: {
        totalCommissionPaid: {
          increment: commission.commissionAmount
        },
        totalCommissionOwed: {
          decrement: commission.commissionAmount
        }
      }
    })

    return NextResponse.json({
      message: 'Commission marked as paid',
      commission: updatedCommission
    })

  } catch (error) {
    console.error('Error updating commission payment:', error)
    return NextResponse.json(
      { error: 'Failed to update commission payment' },
      { status: 500 }
    )
  }
}