import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '../auth/[...nextauth]/route'
import { emailService } from '../../../lib/email'

const prisma = new PrismaClient()

// POST /api/notifications - Send notifications (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, userId, data } = body

    // Verify this is an internal request (you might want to add API key auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      // For now, we'll allow it but in production add proper auth
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let emailSent = false

    switch (type) {
      case 'welcome':
        const welcomeTemplate = emailService.getWelcomeEmail(user.name || 'there')
        emailSent = await emailService.sendEmail({
          to: user.email,
          subject: welcomeTemplate.subject,
          html: welcomeTemplate.html,
          text: welcomeTemplate.text
        })
        break

      case 'new_message':
        const messageTemplate = emailService.getNewMessageEmail(
          user.name || 'there',
          data.senderName,
          data.listingTitle,
          data.messageContent
        )
        emailSent = await emailService.sendEmail({
          to: user.email,
          subject: messageTemplate.subject,
          html: messageTemplate.html,
          text: messageTemplate.text
        })
        break

      case 'listing_expiry':
        const expiryTemplate = emailService.getListingExpiryEmail(
          user.name || 'there',
          data.listingTitle,
          data.daysLeft
        )
        emailSent = await emailService.sendEmail({
          to: user.email,
          subject: expiryTemplate.subject,
          html: expiryTemplate.html,
          text: expiryTemplate.text
        })
        break

      case 'payment_confirmation':
        const paymentTemplate = emailService.getPaymentConfirmationEmail(
          user.name || 'there',
          data.amount,
          data.description
        )
        emailSent = await emailService.sendEmail({
          to: user.email,
          subject: paymentTemplate.subject,
          html: paymentTemplate.html,
          text: paymentTemplate.text
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: emailSent,
      message: emailSent ? 'Notification sent successfully' : 'Failed to send notification'
    })

  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}

// Helper function to trigger notifications (use this in other API routes)
export async function sendNotification(type: string, userId: string, data: any = {}) {
  try {
    await fetch(`${process.env.NEXTAUTH_URL}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`
      },
      body: JSON.stringify({
        type,
        userId,
        data
      })
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}