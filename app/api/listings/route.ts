import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/listings - Get all listings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const search = searchParams.get('search') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const make = searchParams.get('make')
    const fuelType = searchParams.get('fuelType')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    // Build where clause
    const where: any = {
      status: 'active'
    }

    // Add search filters
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (minPrice) {
      where.price = { ...where.price, gte: parseInt(minPrice) * 100 } // Convert to cents
    }

    if (maxPrice) {
      where.price = { ...where.price, lte: parseInt(maxPrice) * 100 } // Convert to cents
    }

    if (make) {
      where.make = make
    }

    if (fuelType) {
      where.fuelType = fuelType
    }

    if (location) {
      where.city = { contains: location, mode: 'insensitive' }
    }

    // Get total count for pagination
    const total = await prisma.listing.count({ where })

    // Get listings with pagination
    const listings = await prisma.listing.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { [sort]: order as 'asc' | 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Convert prices from cents to euros for response
    const formattedListings = listings.map(listing => ({
      ...listing,
      price: listing.price / 100,
      images: listing.images ? listing.images.split(',') : []
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
    console.error('Error fetching listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}

// POST /api/listings - Create new listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Basic validation
    const requiredFields = ['title', 'description', 'price', 'make', 'model', 'year', 'mileage', 'fuelType', 'transmission', 'city']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // TODO: Get user ID from authentication session
    // For now, we'll use the demo user
    const demoUser = await prisma.user.findFirst({
      where: { email: 'demo@automarket.com' }
    })

    if (!demoUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        title: body.title,
        description: body.description,
        price: Math.round(parseFloat(body.price) * 100), // Convert to cents
        make: body.make,
        model: body.model,
        year: parseInt(body.year),
        mileage: parseInt(body.mileage),
        fuelType: body.fuelType,
        transmission: body.transmission,
        bodyType: body.bodyType || '',
        color: body.color || '',
        city: body.city,
        country: body.country || 'DE',
        images: Array.isArray(body.images) ? body.images.join(',') : '',
        status: 'active',
        featured: body.featured || false,
        userId: demoUser.id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Format response
    const formattedListing = {
      ...listing,
      price: listing.price / 100,
      images: listing.images ? listing.images.split(',') : []
    }

    return NextResponse.json(formattedListing, { status: 201 })

  } catch (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}