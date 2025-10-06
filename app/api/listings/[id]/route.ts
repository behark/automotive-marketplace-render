import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/listings/[id] - Get single listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.listing.findUnique({
      where: {
        id: params.id,
        status: 'active'
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Format response
    const formattedListing = {
      ...listing,
      price: listing.price / 100,
      images: listing.images ? listing.images.split(',') : [],
      features: [], // TODO: Implement features as separate table
      seller: {
        name: listing.user.name || 'Anonymous',
        phone: listing.user.phone || '',
        email: listing.user.email,
        location: `${listing.city}, ${listing.country}`
      }
    }

    return NextResponse.json(formattedListing)

  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

// PUT /api/listings/[id] - Update listing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Check if listing exists
    const existingListing = await prisma.listing.findUnique({
      where: { id: params.id }
    })

    if (!existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // TODO: Check if user owns this listing (authentication)

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id: params.id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.price && { price: Math.round(parseFloat(body.price) * 100) }),
        ...(body.make && { make: body.make }),
        ...(body.model && { model: body.model }),
        ...(body.year && { year: parseInt(body.year) }),
        ...(body.mileage && { mileage: parseInt(body.mileage) }),
        ...(body.fuelType && { fuelType: body.fuelType }),
        ...(body.transmission && { transmission: body.transmission }),
        ...(body.bodyType && { bodyType: body.bodyType }),
        ...(body.color && { color: body.color }),
        ...(body.city && { city: body.city }),
        ...(body.images && { images: Array.isArray(body.images) ? body.images.join(',') : body.images }),
        ...(body.status && { status: body.status }),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Format response
    const formattedListing = {
      ...updatedListing,
      price: updatedListing.price / 100,
      images: updatedListing.images ? updatedListing.images.split(',') : []
    }

    return NextResponse.json(formattedListing)

  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

// DELETE /api/listings/[id] - Delete listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if listing exists
    const existingListing = await prisma.listing.findUnique({
      where: { id: params.id }
    })

    if (!existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // TODO: Check if user owns this listing (authentication)

    // Soft delete - update status instead of deleting
    await prisma.listing.update({
      where: { id: params.id },
      data: {
        status: 'deleted',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Listing deleted successfully' })

  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}