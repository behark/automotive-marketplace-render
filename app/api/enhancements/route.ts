import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// Enhancement pricing optimized for Albanian market
const ENHANCEMENT_PRICING = {
  bump: {
    price: 500, // €5 to bump listing to top
    duration: 24, // 24 hours
    name: 'Bump to Top',
    description: 'Move your listing to the top of search results for 24 hours'
  },
  featured: {
    price: 1000, // €10 for featured listing
    duration: 168, // 7 days
    name: 'Featured Listing',
    description: 'Highlight your listing with featured badge for 7 days'
  },
  homepage: {
    price: 1500, // €15 for homepage feature
    duration: 72, // 3 days
    name: 'Homepage Feature',
    description: 'Feature your listing on the homepage for 3 days'
  },
  urgent: {
    price: 800, // €8 for urgent badge
    duration: 48, // 2 days
    name: 'Urgent Sale',
    description: 'Add urgent sale badge to attract immediate attention'
  },
  premium_photo: {
    price: 300, // €3 per premium photo slot
    duration: null, // Permanent
    name: 'Premium Photo',
    description: 'Add high-quality professional photos to your listing'
  },
  video: {
    price: 2500, // €25 for video listing
    duration: null, // Permanent
    name: 'Video Listing',
    description: 'Add video tour to showcase your vehicle'
  },
  inspection: {
    price: 5000, // €50 for professional inspection
    duration: null, // Permanent
    name: 'Professional Inspection',
    description: 'Professional vehicle inspection with detailed report'
  },
  warranty: {
    price: 3000, // €30 for extended warranty promotion
    duration: null, // Permanent
    name: 'Warranty Badge',
    description: 'Display warranty coverage information prominently'
  }
}

// POST /api/enhancements - Purchase listing enhancement
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
    const { listingId, enhancementType, quantity = 1, metadata } = body

    if (!listingId || !enhancementType) {
      return NextResponse.json(
        { error: 'Listing ID and enhancement type are required' },
        { status: 400 }
      )
    }

    const enhancement = ENHANCEMENT_PRICING[enhancementType as keyof typeof ENHANCEMENT_PRICING]
    if (!enhancement) {
      return NextResponse.json(
        { error: 'Invalid enhancement type' },
        { status: 400 }
      )
    }

    // Find the listing and verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: true,
        enhancements: {
          where: {
            type: enhancementType,
            status: 'active'
          }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || listing.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only enhance your own listings' },
        { status: 403 }
      )
    }

    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot enhance inactive listings' },
        { status: 400 }
      )
    }

    // Check for existing active enhancements of the same type
    if (enhancementType === 'bump' || enhancementType === 'featured' || enhancementType === 'homepage') {
      const activeEnhancement = listing.enhancements.find(e => e.type === enhancementType)
      if (activeEnhancement && activeEnhancement.expiresAt && activeEnhancement.expiresAt > new Date()) {
        return NextResponse.json(
          { error: `You already have an active ${enhancement.name} enhancement` },
          { status: 400 }
        )
      }
    }

    const totalPrice = enhancement.price * quantity

    // Ensure user has Stripe customer ID
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id
        }
      })

      customerId = customer.id

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice,
      currency: 'eur',
      customer: customerId,
      metadata: {
        type: 'listing_enhancement',
        listingId: listingId,
        enhancementType: enhancementType,
        userId: user.id,
        quantity: quantity.toString()
      },
      description: `${enhancement.name} for listing: ${listing.title}`
    })

    // Calculate expiration date
    let expiresAt = null
    if (enhancement.duration) {
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + enhancement.duration)
    }

    // Create enhancement record (pending payment confirmation)
    const enhancementRecord = await prisma.listingEnhancement.create({
      data: {
        listingId: listingId,
        userId: user.id,
        type: enhancementType,
        status: 'pending', // Will be activated via webhook
        price: totalPrice,
        duration: enhancement.duration,
        metadata: {
          ...metadata,
          quantity: quantity,
          enhancementName: enhancement.name,
          description: enhancement.description
        },
        expiresAt: expiresAt,
        stripePaymentId: paymentIntent.id
      }
    })

    return NextResponse.json({
      message: 'Enhancement payment created',
      clientSecret: paymentIntent.client_secret,
      enhancement: {
        id: enhancementRecord.id,
        type: enhancementType,
        name: enhancement.name,
        price: totalPrice,
        priceFormatted: `€${(totalPrice / 100).toFixed(2)}`,
        duration: enhancement.duration,
        expiresAt: expiresAt
      }
    })

  } catch (error) {
    console.error('Error creating enhancement:', error)
    return NextResponse.json(
      { error: 'Failed to create enhancement' },
      { status: 500 }
    )
  }
}

// GET /api/enhancements - Get available enhancements and user's active ones
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get available enhancement types with pricing
    const availableEnhancements = Object.entries(ENHANCEMENT_PRICING).map(([type, config]) => ({
      type,
      ...config,
      priceFormatted: `€${(config.price / 100).toFixed(2)}`
    }))

    let activeEnhancements = []

    if (listingId) {
      // Get active enhancements for specific listing
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          enhancements: {
            where: {
              status: 'active',
              OR: [
                { expiresAt: null }, // Permanent enhancements
                { expiresAt: { gt: new Date() } } // Non-expired timed enhancements
              ]
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (listing && listing.userId === user.id) {
        activeEnhancements = listing.enhancements
      }
    } else {
      // Get all active enhancements for user's listings
      activeEnhancements = await prisma.listingEnhancement.findMany({
        where: {
          userId: user.id,
          status: 'active',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              make: true,
              model: true,
              year: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({
      availableEnhancements,
      activeEnhancements,
      userPlan: user.plan
    })

  } catch (error) {
    console.error('Error fetching enhancements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enhancements' },
      { status: 500 }
    )
  }
}

// PUT /api/enhancements - Activate enhancement (webhook handler)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { enhancementId, activate = true } = body

    if (!enhancementId) {
      return NextResponse.json(
        { error: 'Enhancement ID is required' },
        { status: 400 }
      )
    }

    const enhancement = await prisma.listingEnhancement.findUnique({
      where: { id: enhancementId },
      include: {
        listing: true
      }
    })

    if (!enhancement) {
      return NextResponse.json(
        { error: 'Enhancement not found' },
        { status: 404 }
      )
    }

    if (activate && enhancement.status === 'pending') {
      // Activate the enhancement
      const updatedEnhancement = await prisma.listingEnhancement.update({
        where: { id: enhancementId },
        data: {
          status: 'active',
          updatedAt: new Date()
        }
      })

      // Apply enhancement effects to listing
      let listingUpdates: any = {}

      switch (enhancement.type) {
        case 'bump':
          listingUpdates.bumpedAt = new Date()
          listingUpdates.priorityPlacement = 100 // High priority for bumped listings
          break

        case 'featured':
          listingUpdates.featured = true
          listingUpdates.priorityPlacement = 75
          break

        case 'homepage':
          listingUpdates.homepageFeature = true
          listingUpdates.priorityPlacement = 90
          break

        case 'urgent':
          listingUpdates.priorityPlacement = 80
          break
      }

      if (Object.keys(listingUpdates).length > 0) {
        await prisma.listing.update({
          where: { id: enhancement.listingId },
          data: listingUpdates
        })
      }

      return NextResponse.json({
        message: 'Enhancement activated successfully',
        enhancement: updatedEnhancement
      })
    }

    return NextResponse.json({
      message: 'Enhancement status unchanged',
      enhancement
    })

  } catch (error) {
    console.error('Error updating enhancement:', error)
    return NextResponse.json(
      { error: 'Failed to update enhancement' },
      { status: 500 }
    )
  }
}