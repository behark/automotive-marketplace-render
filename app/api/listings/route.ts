import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../lib/auth'

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
      images: Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : [])
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

    // Check authentication first
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      // For demo purposes, allow unauthenticated users and use demo user
      console.log('No session found, using demo user for listing creation')
    }

    // Basic validation with better error messages
    const requiredFields = ['title', 'description', 'price', 'make', 'model', 'year', 'mileage', 'fuelType', 'transmission', 'city']
    for (const field of requiredFields) {
      if (!body[field] || body[field] === '' || body[field] === null) {
        console.log(`Missing required field: ${field}, received:`, body[field])
        return NextResponse.json(
          { error: `Missing required field: ${field}. Please fill in all required information.` },
          { status: 400 }
        )
      }
    }

    // Validate data types and ranges
    const price = parseFloat(body.price)
    const year = parseInt(body.year)
    const mileage = parseInt(body.mileage)

    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a valid positive number' },
        { status: 400 }
      )
    }

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: 'Year must be a valid year between 1900 and next year' },
        { status: 400 }
      )
    }

    if (isNaN(mileage) || mileage < 0) {
      return NextResponse.json(
        { error: 'Mileage must be a valid positive number' },
        { status: 400 }
      )
    }

    // Get user (authenticated or demo user for testing)
    let user
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
    }

    // Fallback to demo user if no authenticated user
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: 'demo@automarket.com' }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User authentication required. Please sign in to create listings.' },
        { status: 401 }
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
        images: Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []),
        status: 'active',
        featured: body.featured || false,
        userId: user.id
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
      images: Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : [])
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