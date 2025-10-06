import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../lib/auth'

const prisma = new PrismaClient()

// Partnership configurations for Albanian market
const PARTNERSHIP_CONFIG = {
  insurance: {
    partners: [
      {
        name: 'Insig Sh.a.',
        type: 'auto_insurance',
        commissionRate: 0.15, // 15% commission
        basePrice: 2000, // €20 base referral fee
        description: 'Sigurimi i automjeteve në Shqipëri'
      },
      {
        name: 'SIGMA Vienna Insurance Group',
        type: 'comprehensive_insurance',
        commissionRate: 0.12,
        basePrice: 2500,
        description: 'Sigurimi i plotë i automjeteve'
      }
    ]
  },
  financing: {
    partners: [
      {
        name: 'Credins Bank',
        type: 'auto_loan',
        commissionRate: 0.008, // 0.8% of loan amount
        basePrice: 5000, // €50 base fee
        description: 'Kredi për blerjen e automjeteve'
      },
      {
        name: 'Raiffeisen Bank Albania',
        type: 'vehicle_finance',
        commissionRate: 0.01,
        basePrice: 4500,
        description: 'Financimi i automjeteve'
      },
      {
        name: 'Alpha Bank Albania',
        type: 'consumer_loan',
        commissionRate: 0.009,
        basePrice: 4000,
        description: 'Kredi konsumatori për automjete'
      }
    ]
  },
  warranty: {
    partners: [
      {
        name: 'AutoProtect Albania',
        type: 'extended_warranty',
        commissionRate: 0.25, // 25% commission
        basePrice: 1500,
        description: 'Garanci e zgjatur për automjetet'
      }
    ]
  },
  inspection: {
    partners: [
      {
        name: 'AutoCheck Albania',
        type: 'vehicle_inspection',
        commissionRate: 0.30,
        basePrice: 8000, // €80 inspection fee
        description: 'Kontroll teknik profesional'
      },
      {
        name: 'Car Experts Albania',
        type: 'pre_purchase_inspection',
        commissionRate: 0.35,
        basePrice: 12000, // €120 inspection fee
        description: 'Kontroll para blerjes'
      }
    ]
  },
  photography: {
    partners: [
      {
        name: 'AutoPhoto Tirana',
        type: 'professional_photos',
        commissionRate: 0.20,
        basePrice: 3000, // €30 photo package
        description: 'Fotografi profesionale automjetesh'
      },
      {
        name: 'CarMedia Albania',
        type: 'video_360',
        commissionRate: 0.25,
        basePrice: 8000, // €80 video package
        description: 'Video dhe foto 360 gradë'
      }
    ]
  }
}

// POST /api/partnerships - Create partnership revenue record
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
    const {
      partnerType,
      partnerName,
      revenueType,
      amount,
      listingId,
      referenceId,
      metadata
    } = body

    if (!partnerType || !partnerName || !revenueType || !amount) {
      return NextResponse.json(
        { error: 'Partner type, name, revenue type and amount are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate partner configuration
    const partnerConfig = PARTNERSHIP_CONFIG[partnerType as keyof typeof PARTNERSHIP_CONFIG]
    if (!partnerConfig) {
      return NextResponse.json(
        { error: 'Invalid partner type' },
        { status: 400 }
      )
    }

    const partner = partnerConfig.partners.find(p => p.name === partnerName)
    if (!partner) {
      return NextResponse.json(
        { error: 'Invalid partner name' },
        { status: 400 }
      )
    }

    // Calculate commission
    let commission = 0
    if (revenueType === 'commission' || revenueType === 'referral_fee') {
      commission = Math.round(amount * partner.commissionRate)
    } else if (revenueType === 'service_fee') {
      commission = partner.basePrice
    }

    // Validate listing if provided
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId }
      })

      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        )
      }
    }

    // Create partnership revenue record
    const partnershipRevenue = await prisma.partnershipRevenue.create({
      data: {
        userId: user.id,
        listingId: listingId || null,
        partnerType,
        partnerName,
        revenueType,
        amount,
        commission,
        status: 'pending',
        referenceId,
        metadata: {
          ...metadata,
          commissionRate: partner.commissionRate,
          basePrice: partner.basePrice,
          userPlan: user.plan
        }
      }
    })

    return NextResponse.json({
      message: 'Partnership revenue recorded successfully',
      revenue: {
        id: partnershipRevenue.id,
        amount,
        commission,
        partnerName,
        status: 'pending',
        createdAt: partnershipRevenue.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating partnership revenue:', error)
    return NextResponse.json(
      { error: 'Failed to record partnership revenue' },
      { status: 500 }
    )
  }
}

// GET /api/partnerships - Get partnership opportunities and revenue
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
    const type = url.searchParams.get('type')
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

    // Get partnership opportunities
    let availablePartnerships = PARTNERSHIP_CONFIG
    if (type) {
      availablePartnerships = {
        [type]: PARTNERSHIP_CONFIG[type as keyof typeof PARTNERSHIP_CONFIG]
      }
    }

    // Get user's partnership revenue history
    const where: any = { userId: user.id }
    if (listingId) where.listingId = listingId

    const revenueHistory = await prisma.partnershipRevenue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Calculate total earnings
    const totalEarnings = await prisma.partnershipRevenue.aggregate({
      where: { userId: user.id, status: 'paid' },
      _sum: { commission: true }
    })

    const pendingEarnings = await prisma.partnershipRevenue.aggregate({
      where: { userId: user.id, status: { in: ['pending', 'confirmed'] } },
      _sum: { commission: true }
    })

    return NextResponse.json({
      availablePartnerships,
      revenueHistory,
      summary: {
        totalEarnings: totalEarnings._sum.commission || 0,
        pendingEarnings: pendingEarnings._sum.commission || 0,
        userPlan: user.plan
      }
    })

  } catch (error) {
    console.error('Error fetching partnerships:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partnership data' },
      { status: 500 }
    )
  }
}

// PUT /api/partnerships - Update partnership revenue status (admin only)
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
    const { revenueId, status, notes } = body

    if (!revenueId || !status) {
      return NextResponse.json(
        { error: 'Revenue ID and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'confirmed', 'paid', 'disputed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Find partnership revenue
    const revenue = await prisma.partnershipRevenue.findUnique({
      where: { id: revenueId }
    })

    if (!revenue) {
      return NextResponse.json(
        { error: 'Partnership revenue not found' },
        { status: 404 }
      )
    }

    // Update revenue status
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (status === 'confirmed') {
      updateData.confirmedAt = new Date()
    } else if (status === 'paid') {
      updateData.paidAt = new Date()
      if (!revenue.confirmedAt) {
        updateData.confirmedAt = new Date()
      }
    }

    if (notes) {
      updateData.metadata = {
        ...revenue.metadata,
        adminNotes: notes
      }
    }

    const updatedRevenue = await prisma.partnershipRevenue.update({
      where: { id: revenueId },
      data: updateData
    })

    return NextResponse.json({
      message: 'Partnership revenue status updated',
      revenue: updatedRevenue
    })

  } catch (error) {
    console.error('Error updating partnership revenue:', error)
    return NextResponse.json(
      { error: 'Failed to update partnership revenue' },
      { status: 500 }
    )
  }
}