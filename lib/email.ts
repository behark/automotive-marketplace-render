interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

class EmailService {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || ''
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@automarket.com'
    this.fromName = process.env.FROM_NAME || 'AutoMarket'
  }

  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    try {
      // For development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:')
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log(`Content: ${text || 'HTML content'}`)
        return true
      }

      // TODO: Implement actual email sending based on available service
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendWithSendGrid({ to, subject, html, text })
      } else if (process.env.RESEND_API_KEY) {
        return await this.sendWithResend({ to, subject, html, text })
      } else {
        // Fallback to console log for now
        console.log('⚠️ No email service configured. Email would be sent:', { to, subject })
        return true
      }

    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  private async sendWithSendGrid({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    // SendGrid implementation
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: this.fromEmail, name: this.fromName },
        subject,
        content: [
          ...(text ? [{ type: 'text/plain', value: text }] : []),
          { type: 'text/html', value: html }
        ]
      })
    })

    return response.ok
  }

  private async sendWithResend({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    // Resend implementation
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
        ...(text ? { text } : {})
      })
    })

    return response.ok
  }

  // Email Templates
  getWelcomeEmail(userName: string): EmailTemplate {
    return {
      subject: 'Welcome to AutoMarket! 🚗',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to AutoMarket!</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${userName},</p>

            <p>Welcome to AutoMarket, Europe's trusted automotive marketplace! We're excited to have you join our community of car buyers and sellers.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Get Started:</h3>
              <ul style="color: #6b7280; line-height: 1.6;">
                <li>Browse thousands of quality used cars</li>
                <li>Save your favorite cars to compare later</li>
                <li>List your own car for free</li>
                <li>Connect directly with buyers and sellers</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Start Browsing Cars
              </a>
            </div>

            <p>If you have any questions, our support team is here to help. Just reply to this email or visit our <a href="${process.env.NEXTAUTH_URL}/contact" style="color: #2563eb;">contact page</a>.</p>

            <p>Happy car hunting!<br>
            The AutoMarket Team</p>
          </div>

          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>AutoMarket - Your Trusted Automotive Marketplace</p>
            <p>This email was sent to ${userName}. If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      `,
      text: `Welcome to AutoMarket, ${userName}! Start browsing cars at ${process.env.NEXTAUTH_URL}/listings`
    }
  }

  getNewMessageEmail(recipientName: string, senderName: string, listingTitle: string, messageContent: string): EmailTemplate {
    return {
      subject: `New message about your ${listingTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">New Message from Buyer</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${recipientName},</p>

            <p>You have a new message about your listing: <strong>${listingTitle}</strong></p>

            <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #374151;">Message from ${senderName}:</h4>
              <p style="color: #6b7280; font-style: italic;">"${messageContent}"</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/messages"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Reply to Message
              </a>
            </div>

            <p>Respond quickly to increase your chances of selling your car!</p>

            <p>Best regards,<br>
            The AutoMarket Team</p>
          </div>
        </div>
      `,
      text: `New message from ${senderName} about ${listingTitle}: "${messageContent}". Reply at ${process.env.NEXTAUTH_URL}/messages`
    }
  }

  getListingExpiryEmail(userName: string, listingTitle: string, daysLeft: number): EmailTemplate {
    return {
      subject: `Your listing expires in ${daysLeft} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Listing Expiring Soon</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${userName},</p>

            <p>Your listing "<strong>${listingTitle}</strong>" will expire in ${daysLeft} days.</p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">Don't let your listing expire!</h3>
              <p style="color: #b45309; margin-bottom: 0;">Renew your listing to keep it visible to potential buyers.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Renew Listing
              </a>
            </div>

            <p>Best regards,<br>
            The AutoMarket Team</p>
          </div>
        </div>
      `,
      text: `Your listing "${listingTitle}" expires in ${daysLeft} days. Renew at ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }

  getPaymentConfirmationEmail(userName: string, amount: number, description: string): EmailTemplate {
    return {
      subject: 'Payment Confirmation - AutoMarket',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">Payment Confirmed</h1>
          </div>

          <div style="padding: 30px;">
            <p>Hi ${userName},</p>

            <p>Your payment has been successfully processed!</p>

            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #047857; margin-top: 0;">Payment Details:</h3>
              <p style="color: #065f46;"><strong>Amount:</strong> €${amount}</p>
              <p style="color: #065f46;"><strong>Description:</strong> ${description}</p>
              <p style="color: #065f46;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>

            <p>Your enhanced features are now active! Thank you for choosing AutoMarket.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Dashboard
              </a>
            </div>

            <p>Best regards,<br>
            The AutoMarket Team</p>
          </div>
        </div>
      `,
      text: `Payment confirmed! €${amount} for ${description}. View dashboard at ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }
}

export const emailService = new EmailService()