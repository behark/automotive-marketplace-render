import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../../lib/auth'

const prisma = new PrismaClient()

// GET /api/leads/[id] - Get specific lead details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const leadId = params.id
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
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            make: true,
            model: true,
            year: true,
            images: true,
            city: true,
            country: true
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this lead
    const hasAccess = lead.sellerId === user.id || lead.buyerId === user.id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Hide contact info if lead not purchased
    let sanitizedLead = { ...lead }
    if (lead.status === 'available' && lead.sellerId === user.id) {
      const contactInfo = lead.contactInfo as any
      sanitizedLead.contactInfo = {
        hasEmail: !!contactInfo?.email,
        hasPhone: !!contactInfo?.phone,
        hasName: !!contactInfo?.name,
        verificationLevel: contactInfo?.verificationLevel,
        trustScore: contactInfo?.trustScore
      }
    }

    return NextResponse.json({ lead: sanitizedLead })

  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// PUT /api/leads/[id] - Update lead status (mark as contacted, converted, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const leadId = params.id
    const body = await request.json()
    const { action, notes } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
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

    // Check if user owns this lead (as seller)
    if (lead.sellerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only update leads for your own listings' },
        { status: 403 }
      )
    }

    // Prepare update data
    let updateData: any = { updatedAt: new Date() }

    switch (action) {
      case 'contacted':
        if (lead.status !== 'purchased') {
          return NextResponse.json(
            { error: 'Lead must be purchased before marking as contacted' },
            { status: 400 }
          )
        }
        updateData.status = 'contacted'
        updateData.contactedAt = new Date()
        break

      case 'converted':
        if (lead.status !== 'contacted' && lead.status !== 'purchased') {
          return NextResponse.json(
            { error: 'Lead must be contacted before marking as converted' },
            { status: 400 }
          )
        }
        updateData.status = 'converted'
        updateData.convertedAt = new Date()

        // Update listing as sold if not already
        if (lead.listing && lead.listing.status === 'active') {
          await prisma.listing.update({
            where: { id: lead.listingId },
            data: {
              status: 'sold',
              soldDate: new Date(),
              soldPrice: lead.listing.price // Use listing price as sold price
            }
          })
        }
        break

      case 'not_interested':
        updateData.status = 'not_interested'
        break

      case 'invalid':
        updateData.status = 'invalid'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData
    })

    // Calculate conversion analytics
    if (action === 'converted') {
      // Get lead conversion rate for this seller
      const totalPurchasedLeads = await prisma.lead.count({
        where: {
          sellerId: user.id,
          status: { in: ['purchased', 'contacted', 'converted', 'not_interested'] }
        }
      })

      const convertedLeads = await prisma.lead.count({
        where: {
          sellerId: user.id,
          status: 'converted'
        }
      })

      const conversionRate = totalPurchasedLeads > 0 ? (convertedLeads / totalPurchasedLeads) * 100 : 0

      return NextResponse.json({
        message: 'Lead marked as converted successfully',
        lead: updatedLead,
        analytics: {
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalPurchasedLeads,
          convertedLeads
        }
      })
    }

    return NextResponse.json({
      message: `Lead marked as ${action} successfully`,
      lead: updatedLead
    })

  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// DELETE /api/leads/[id] - Delete a lead (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const leadId = params.id
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Find and delete the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    await prisma.lead.delete({
      where: { id: leadId }
    })

    return NextResponse.json({
      message: 'Lead deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}