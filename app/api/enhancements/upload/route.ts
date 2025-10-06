import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../../lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const prisma = new PrismaClient()

// Enhanced service pricing for Albanian market
const ENHANCEMENT_SERVICES = {
  video_basic: {
    price: 2500, // €25
    name: 'Basic Video Tour',
    description: 'Professional 2-3 minute video tour of your vehicle',
    features: ['Exterior showcase', 'Interior overview', 'Engine bay view', 'HD quality'],
    duration: null,
    maxFiles: 1
  },
  video_premium: {
    price: 5000, // €50
    name: 'Premium Video Package',
    description: 'Comprehensive video presentation with multiple angles',
    features: ['Exterior 360°', 'Interior detail', 'Engine & mechanics', 'Road test footage', '4K quality', 'Professional editing'],
    duration: null,
    maxFiles: 3
  },
  photos_professional: {
    price: 3000, // €30
    name: 'Professional Photo Package',
    description: 'High-quality professional photography session',
    features: ['20+ high-res photos', 'Multiple angles', 'Interior details', 'Professional lighting', 'Basic editing'],
    duration: null,
    maxFiles: 25
  },
  photos_premium: {
    price: 5000, // €50
    name: 'Premium Photo Package',
    description: 'Studio-quality photography with advanced editing',
    features: ['30+ ultra-high-res photos', '360° exterior shots', 'Detailed interior', 'Engine bay', 'Advanced editing', 'Background removal'],
    duration: null,
    maxFiles: 35
  },
  tour_360: {
    price: 8000, // €80
    name: '360° Virtual Tour',
    description: 'Interactive 360-degree virtual tour experience',
    features: ['Full 360° interior', '360° exterior views', 'Interactive hotspots', 'VR compatible', 'Mobile optimized'],
    duration: null,
    maxFiles: 1
  },
  inspection_basic: {
    price: 8000, // €80
    name: 'Basic Vehicle Inspection',
    description: 'Comprehensive vehicle inspection with report',
    features: ['Engine check', 'Body condition', 'Interior assessment', 'Basic systems test', 'Written report'],
    duration: null,
    maxFiles: 0
  },
  inspection_comprehensive: {
    price: 15000, // €150
    name: 'Comprehensive Inspection',
    description: 'Full mechanical and cosmetic inspection',
    features: ['Complete engine analysis', 'Transmission check', 'Brake system', 'Electrical systems', 'Body & paint analysis', 'Detailed photo report', 'Warranty on inspection'],
    duration: null,
    maxFiles: 0
  },
  valuation_certificate: {
    price: 2000, // €20
    name: 'Market Valuation Certificate',
    description: 'Official market value assessment certificate',
    features: ['Professional appraisal', 'Market analysis', 'Official certificate', 'Insurance accepted', 'Valid for 6 months'],
    duration: 180 * 24, // 180 days
    maxFiles: 0
  },
  warranty_display: {
    price: 1000, // €10
    name: 'Warranty Badge',
    description: 'Display warranty information prominently',
    features: ['Warranty badge', 'Coverage details', 'Trust indicator', 'Increased buyer confidence'],
    duration: null,
    maxFiles: 0
  }
}

// POST /api/enhancements/upload - Request enhancement services
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
    const { listingId, serviceType, additionalRequests, contactPreference, scheduledDate } = body

    if (!listingId || !serviceType) {
      return NextResponse.json(
        { error: 'Listing ID and service type are required' },
        { status: 400 }
      )
    }

    const service = ENHANCEMENT_SERVICES[serviceType as keyof typeof ENHANCEMENT_SERVICES]
    if (!service) {
      return NextResponse.json(
        { error: 'Invalid service type' },
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
            type: serviceType,
            status: { in: ['active', 'pending'] }
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
        { error: 'You can only request services for your own listings' },
        { status: 403 }
      )
    }

    if (listing.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot enhance inactive listings' },
        { status: 400 }
      )
    }

    // Check for existing enhancement of same type
    const existingEnhancement = listing.enhancements.find(e => e.type === serviceType)
    if (existingEnhancement) {
      return NextResponse.json(
        { error: `You already have a ${service.name} for this listing` },
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

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: service.price,
      currency: 'eur',
      customer: customerId,
      metadata: {
        type: 'enhancement_service',
        listingId: listingId,
        serviceType: serviceType,
        userId: user.id
      },
      description: `${service.name} for listing: ${listing.title}`
    })

    // Calculate expiration date if applicable
    let expiresAt = null
    if (service.duration) {
      expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + service.duration)
    }

    // Create enhancement service request
    const enhancementRequest = await prisma.listingEnhancement.create({
      data: {
        listingId: listingId,
        userId: user.id,
        type: serviceType,
        status: 'pending',
        price: service.price,
        duration: service.duration,
        metadata: {
          serviceName: service.name,
          description: service.description,
          features: service.features,
          additionalRequests: additionalRequests,
          contactPreference: contactPreference,
          scheduledDate: scheduledDate,
          userPhone: user.phone,
          listingLocation: `${listing.city}, ${listing.country}`,
          vehicleInfo: {
            make: listing.make,
            model: listing.model,
            year: listing.year,
            price: listing.price
          }
        },
        expiresAt: expiresAt,
        stripePaymentId: paymentIntent.id
      }
    })

    return NextResponse.json({
      message: 'Enhancement service request created',
      clientSecret: paymentIntent.client_secret,
      request: {
        id: enhancementRequest.id,
        serviceType: serviceType,
        serviceName: service.name,
        price: service.price,
        priceFormatted: `€${(service.price / 100).toFixed(2)}`,
        status: 'pending',
        features: service.features
      }
    })

  } catch (error) {
    console.error('Error creating enhancement service request:', error)
    return NextResponse.json(
      { error: 'Failed to create service request' },
      { status: 500 }
    )
  }
}

// GET /api/enhancements/upload - Get available services and user requests
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

    // Get available services with pricing
    const availableServices = Object.entries(ENHANCEMENT_SERVICES).map(([type, config]) => ({
      type,
      ...config,
      priceFormatted: `€${(config.price / 100).toFixed(2)}`,
      // Apply plan discounts
      discountedPrice: user.plan === 'enterprise' ? Math.round(config.price * 0.8) :
                      user.plan === 'dealer' ? Math.round(config.price * 0.9) :
                      config.price
    }))

    // Get user's service requests
    const where: any = { userId: user.id }
    if (listingId) where.listingId = listingId

    const serviceRequests = await prisma.listingEnhancement.findMany({
      where: {
        ...where,
        type: { in: Object.keys(ENHANCEMENT_SERVICES) }
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            city: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      availableServices,
      serviceRequests,
      userPlan: user.plan,
      planBenefits: {
        enterprise: { discount: '20%', priorityService: true, freeInspections: 2 },
        dealer: { discount: '10%', priorityService: true, freeInspections: 1 },
        premium: { discount: '0%', priorityService: false, freeInspections: 0 },
        basic: { discount: '0%', priorityService: false, freeInspections: 0 }
      }
    })

  } catch (error) {
    console.error('Error fetching enhancement services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

// PUT /api/enhancements/upload - Update service request status
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
    const { requestId, status, notes, completionData } = body

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
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

    // Find the enhancement request
    const enhancement = await prisma.listingEnhancement.findUnique({
      where: { id: requestId },
      include: { listing: true }
    })

    if (!enhancement) {
      return NextResponse.json(
        { error: 'Enhancement request not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const isOwner = enhancement.userId === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update enhancement status
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (notes) {
      updateData.metadata = {
        ...enhancement.metadata,
        notes: notes,
        updatedBy: user.id
      }
    }

    if (status === 'completed' && completionData) {
      updateData.metadata = {
        ...updateData.metadata || enhancement.metadata,
        completionData: completionData,
        completedAt: new Date()
      }
    }

    const updatedEnhancement = await prisma.listingEnhancement.update({
      where: { id: requestId },
      data: updateData
    })

    return NextResponse.json({
      message: 'Enhancement request updated successfully',
      enhancement: updatedEnhancement
    })

  } catch (error) {
    console.error('Error updating enhancement request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}