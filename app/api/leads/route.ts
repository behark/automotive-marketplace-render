import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// Lead pricing based on listing price and user verification
const calculateLeadPrice = (listingPrice: number, buyerVerificationLevel: string): number => {
  let basePrice = 200 // €2.00 in cents

  // Price scaling based on listing value
  if (listingPrice > 5000000) { // >€50,000
    basePrice = 500 // €5.00
  } else if (listingPrice > 2000000) { // >€20,000
    basePrice = 400 // €4.00
  } else if (listingPrice > 1000000) { // >€10,000
    basePrice = 300 // €3.00
  }

  // Quality bonus for verified users
  const verificationMultiplier = {
    'full': 1.5,
    'bank': 1.4,
    'business': 1.3,
    'id': 1.2,
    'phone': 1.1,
    'none': 1.0
  }

  return Math.round(basePrice * (verificationMultiplier[buyerVerificationLevel as keyof typeof verificationMultiplier] || 1.0))
}

// Calculate lead quality score
const calculateQualityScore = (buyer: any, listing: any, message?: string): number => {
  let score = 0

  // Base score from verification level
  const verificationScores = {
    'full': 40,
    'bank': 35,
    'business': 30,
    'id': 25,
    'phone': 15,
    'none': 5
  }
  score += verificationScores[buyer.verificationLevel as keyof typeof verificationScores] || 0

  // Trust score contribution (up to 30 points)
  score += Math.min(30, Math.round(buyer.trustScore * 0.3))

  // Message quality (up to 20 points)
  if (message) {
    const messageLength = message.length
    if (messageLength > 200) score += 20
    else if (messageLength > 100) score += 15
    else if (messageLength > 50) score += 10
    else if (messageLength > 20) score += 5

    // Keywords that indicate serious interest
    const seriousKeywords = ['buy', 'purchase', 'interested', 'financing', 'cash', 'viewing', 'inspection']
    const foundKeywords = seriousKeywords.filter(keyword =>
      message.toLowerCase().includes(keyword)
    ).length
    score += Math.min(10, foundKeywords * 2)
  }

  // Account age (up to 10 points)
  const accountAge = Date.now() - new Date(buyer.createdAt).getTime()
  const daysOld = accountAge / (1000 * 60 * 60 * 24)
  if (daysOld > 365) score += 10
  else if (daysOld > 180) score += 7
  else if (daysOld > 90) score += 5
  else if (daysOld > 30) score += 3

  return Math.min(100, Math.max(0, score))
}

// POST /api/leads - Create a new lead
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
    const { listingId, message, contactInfo } = body

    if (!listingId || !contactInfo?.email) {
      return NextResponse.json(
        { error: 'Listing ID and contact email are required' },
        { status: 400 }
      )
    }

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: true
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot create lead for inactive listing' },
        { status: 400 }
      )
    }

    // Find the buyer
    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!buyer) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-leads
    if (buyer.id === listing.userId) {
      return NextResponse.json(
        { error: 'Cannot create lead for your own listing' },
        { status: 400 }
      )
    }

    // Check for duplicate leads
    const existingLead = await prisma.lead.findFirst({
      where: {
        listingId: listingId,
        sellerId: listing.userId,
        contactInfo: {
          path: ['email'],
          equals: contactInfo.email
        }
      }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead already exists for this listing and contact' },
        { status: 400 }
      )
    }

    // Calculate price and quality score
    const leadPrice = calculateLeadPrice(listing.price, buyer.verificationLevel || 'none')
    const qualityScore = calculateQualityScore(buyer, listing, message)

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        listingId: listingId,
        sellerId: listing.userId,
        contactInfo: {
          email: contactInfo.email,
          name: contactInfo.name || buyer.name,
          phone: contactInfo.phone || buyer.phone,
          buyerId: buyer.id,
          verificationLevel: buyer.verificationLevel,
          trustScore: buyer.trustScore
        },
        message: message,
        qualityScore: qualityScore,
        price: leadPrice,
        status: 'available'
      }
    })

    return NextResponse.json({
      message: 'Lead created successfully',
      lead: {
        id: lead.id,
        qualityScore: qualityScore,
        price: leadPrice,
        priceFormatted: `€${(leadPrice / 100).toFixed(2)}`,
        status: 'available',
        createdAt: lead.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}

// GET /api/leads - Get leads (for sellers to purchase)
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
    const listingId = url.searchParams.get('listingId')
    const status = url.searchParams.get('status') || 'available'
    const purchased = url.searchParams.get('purchased') === 'true'

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let where: any = {}

    if (purchased) {
      // Get leads purchased by this user
      where.buyerId = user.id
    } else {
      // Get leads for this user's listings
      where.sellerId = user.id
      where.status = status
    }

    if (listingId) {
      where.listingId = listingId
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            make: true,
            model: true,
            year: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // For available leads, hide sensitive contact info
    const sanitizedLeads = leads.map(lead => ({
      ...lead,
      contactInfo: lead.status === 'available' ? {
        // Only show basic info for unpurchased leads
        hasEmail: !!lead.contactInfo?.email,
        hasPhone: !!lead.contactInfo?.phone,
        hasName: !!lead.contactInfo?.name,
        verificationLevel: lead.contactInfo?.verificationLevel,
        trustScore: lead.contactInfo?.trustScore
      } : lead.contactInfo
    }))

    return NextResponse.json({
      leads: sanitizedLeads,
      userCredits: user.leadCredits
    })

  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// PUT /api/leads - Purchase a lead
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { leadId, useCredits = false } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
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

    // Find the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        listing: true
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    if (lead.status !== 'available') {
      return NextResponse.json(
        { error: 'Lead is no longer available' },
        { status: 400 }
      )
    }

    if (lead.sellerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only purchase leads for your own listings' },
        { status: 403 }
      )
    }

    let paymentIntentId = null

    if (useCredits) {
      // Use credits to purchase
      if (user.leadCredits < lead.price) {
        return NextResponse.json(
          { error: 'Insufficient lead credits' },
          { status: 400 }
        )
      }

      // Deduct credits
      await prisma.user.update({
        where: { id: user.id },
        data: {
          leadCredits: {
            decrement: lead.price
          }
        }
      })
    } else {
      // Create Stripe payment for lead
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: lead.price,
          currency: 'eur',
          customer: user.stripeCustomerId || undefined,
          metadata: {
            type: 'lead_purchase',
            leadId: lead.id,
            userId: user.id,
            listingId: lead.listingId
          },
          description: `Lead purchase for listing: ${lead.listing?.title}`
        })

        paymentIntentId = paymentIntent.id

        // Return payment intent for frontend to confirm
        return NextResponse.json({
          requiresPayment: true,
          clientSecret: paymentIntent.client_secret,
          leadId: lead.id,
          amount: lead.price
        })

      } catch (stripeError) {
        console.error('Stripe payment error:', stripeError)
        return NextResponse.json(
          { error: 'Failed to create payment' },
          { status: 500 }
        )
      }
    }

    // Update lead as purchased
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'purchased',
        buyerId: user.id,
        purchasedAt: new Date(),
        stripePaymentId: paymentIntentId
      }
    })

    return NextResponse.json({
      message: 'Lead purchased successfully',
      lead: {
        id: updatedLead.id,
        contactInfo: updatedLead.contactInfo,
        message: updatedLead.message,
        qualityScore: updatedLead.qualityScore,
        purchasedAt: updatedLead.purchasedAt
      },
      paymentMethod: useCredits ? 'credits' : 'card'
    })

  } catch (error) {
    console.error('Error purchasing lead:', error)
    return NextResponse.json(
      { error: 'Failed to purchase lead' },
      { status: 500 }
    )
  }
}