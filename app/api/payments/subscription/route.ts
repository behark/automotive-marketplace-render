import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../../lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// Subscription plans
const PLANS = {
  premium: {
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    name: 'Premium',
    price: 2900, // €29 in cents
    features: ['50 active listings', 'Advanced analytics', 'Priority support'],
    maxListings: 50
  },
  dealer: {
    priceId: 'price_dealer_monthly', // Replace with actual Stripe price ID
    name: 'Dealer',
    price: 9900, // €99 in cents
    features: ['Unlimited listings', 'Dealer badge', 'Bulk upload', 'Advanced tools'],
    maxListings: -1 // unlimited
  }
}

// POST /api/payments/subscription - Create subscription
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
    const { plan } = body // 'premium' or 'dealer'

    if (!plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user already has active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    })

    if (activeSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

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

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS[plan as keyof typeof PLANS].priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success&plan=${plan}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan: plan
      }
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments/subscription - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const activeSubscription = user.subscriptions[0]

    if (!activeSubscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription in Stripe (at period end)
    await stripe.subscriptions.update(activeSubscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    })

    // Update local subscription
    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: {
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Subscription will be canceled at the end of the current period',
      cancelDate: activeSubscription.currentPeriodEnd
    })

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

// GET /api/payments/subscription - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find user with subscription info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const activeSubscription = user.subscriptions[0]

    return NextResponse.json({
      currentPlan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        plan: activeSubscription.plan,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd
      } : null,
      availablePlans: PLANS
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription info' },
      { status: 500 }
    )
  }
}