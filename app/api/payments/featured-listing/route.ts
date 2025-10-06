import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../auth/[...nextauth]/route'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// POST /api/payments/featured-listing - Create payment intent for featured listing
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
    const { listingId, duration = 30 } = body // duration in days

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Find user and listing
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if user owns the listing
    if (listing.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only promote your own listings' },
        { status: 403 }
      )
    }

    // Calculate price based on duration
    const priceMap: { [key: number]: number } = {
      7: 1500,   // €15 for 7 days
      14: 2500,  // €25 for 14 days
      30: 3999,  // €39.99 for 30 days
      60: 6999   // €69.99 for 60 days
    }

    const amount = priceMap[duration] || 3999 // Default to 30 days

    // Ensure user has a Stripe customer ID
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

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      customer: customerId,
      description: `Featured listing for ${listing.title} (${duration} days)`,
      metadata: {
        userId: user.id,
        listingId: listing.id,
        type: 'featured_listing',
        duration: duration.toString()
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      duration,
      listingTitle: listing.title
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}