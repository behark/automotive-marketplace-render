import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../../../lib/auth'

const prisma = new PrismaClient()

// GET /api/messages - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (listingId) {
      // Get messages for specific listing
      const messages = await prisma.message.findMany({
        where: {
          listingId: listingId,
          OR: [
            { senderId: user.id },
            { listing: { userId: user.id } } // User owns the listing
          ]
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true }
          },
          listing: {
            select: { id: true, title: true, userId: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      return NextResponse.json(messages)
    } else {
      // Get all conversations (grouped by listing)
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { listing: { userId: user.id } }
          ]
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true }
          },
          listing: {
            select: { id: true, title: true, userId: true, images: true, price: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Group messages by listing
      const conversationMap = new Map()

      messages.forEach(message => {
        const key = message.listingId
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            listingId: message.listingId,
            listing: {
              ...message.listing,
              price: message.listing.price / 100,
              images: message.listing.images && typeof message.listing.images === 'string' ? message.listing.images.split(',') : []
            },
            lastMessage: message,
            messages: [],
            unreadCount: 0
          })
        }

        conversationMap.get(key).messages.push(message)

        // Count unread messages (where recipient is current user and not read)
        if (message.senderId !== user.id && !message.read) {
          conversationMap.get(key).unreadCount++
        }
      })

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime())

      return NextResponse.json(conversations)
    }

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send new message
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
    const { listingId, content, recipientEmail } = body

    if (!listingId || !content) {
      return NextResponse.json(
        { error: 'Listing ID and message content are required' },
        { status: 400 }
      )
    }

    // Find sender
    const sender = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      )
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        user: { select: { id: true, email: true } }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: sender.id,
        listingId: listingId,
        read: false
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        },
        listing: {
          select: { id: true, title: true, userId: true }
        }
      }
    })

    // TODO: Send real-time notification via Socket.io
    // TODO: Send email notification to listing owner

    return NextResponse.json(message, { status: 201 })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// PUT /api/messages - Mark messages as read
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
    const { listingId } = body

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

    // Mark all messages in this conversation as read (where user is recipient)
    await prisma.message.updateMany({
      where: {
        listingId: listingId,
        senderId: { not: user.id }, // Messages not sent by current user
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({ message: 'Messages marked as read' })

  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}