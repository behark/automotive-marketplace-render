import { z } from 'zod'

interface SmsOptions {
  to: string
  message: string
  messageType?: 'alert' | 'verification' | 'marketing'
}

interface SmsTemplate {
  message: string
  language: 'sq' | 'en'
}

interface AlbanianCarrier {
  name: string
  prefixes: string[]
  apiEndpoint?: string
  costPerSms: number // in cents
  maxLength: number
}

// Albanian mobile carriers configuration
const ALBANIAN_CARRIERS: Record<string, AlbanianCarrier> = {
  vodafone_al: {
    name: 'Vodafone Albania',
    prefixes: ['067', '068', '069'],
    costPerSms: 15, // 15 cents
    maxLength: 160
  },
  telekom_al: {
    name: 'Telekom Albania',
    prefixes: ['066', '065'],
    costPerSms: 12, // 12 cents
    maxLength: 160
  },
  one_al: {
    name: 'ONE Albania',
    prefixes: ['064'],
    costPerSms: 18, // 18 cents
    maxLength: 160
  }
}

export class SmsService {
  private apiKey: string
  private fromNumber: string

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || ''
    this.fromNumber = process.env.SMS_FROM_NUMBER || 'AutoMarket'
  }

  // Detect Albanian carrier based on phone number
  detectCarrier(phoneNumber: string): string | null {
    // Clean phone number (remove +355, spaces, etc.)
    const cleaned = phoneNumber.replace(/[^\d]/g, '')
    let prefix = ''

    // Handle Albanian format variations
    if (cleaned.startsWith('355')) {
      prefix = cleaned.substring(3, 6) // Extract prefix after country code
    } else if (cleaned.startsWith('067') || cleaned.startsWith('068') ||
               cleaned.startsWith('069') || cleaned.startsWith('066') ||
               cleaned.startsWith('065') || cleaned.startsWith('064')) {
      prefix = cleaned.substring(0, 3)
    }

    // Find matching carrier
    for (const [carrierId, carrier] of Object.entries(ALBANIAN_CARRIERS)) {
      if (carrier.prefixes.includes(prefix)) {
        return carrierId
      }
    }

    return null
  }

  // Format Albanian phone number
  formatAlbanianNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^\d]/g, '')

    // Add country code if missing
    if (cleaned.startsWith('06')) {
      return `+355${cleaned}`
    } else if (cleaned.startsWith('355')) {
      return `+${cleaned}`
    }

    return phoneNumber
  }

  // Send SMS
  async sendSms({ to, message, messageType = 'alert' }: SmsOptions): Promise<boolean> {
    try {
      const formattedNumber = this.formatAlbanianNumber(to)
      const carrier = this.detectCarrier(formattedNumber)

      // For development, just log the SMS
      if (process.env.NODE_ENV === 'development') {
        console.log('📱 SMS would be sent:')
        console.log(`To: ${formattedNumber} (${carrier})`)
        console.log(`Type: ${messageType}`)
        console.log(`Message: ${message}`)
        return true
      }

      if (!this.apiKey) {
        console.log('⚠️ No SMS service configured. SMS would be sent:', { to: formattedNumber, message })
        return true
      }

      // Calculate cost
      const carrierInfo = carrier ? ALBANIAN_CARRIERS[carrier] : null
      const cost = carrierInfo?.costPerSms || 20 // Default cost

      // Truncate message if too long
      const maxLength = carrierInfo?.maxLength || 160
      const truncatedMessage = message.length > maxLength
        ? message.substring(0, maxLength - 3) + '...'
        : message

      // Here you would integrate with actual SMS providers like:
      // - Twilio
      // - MessageBird
      // - Local Albanian SMS providers
      // - Vonage/Nexmo

      // Example implementation would be:
      const response = await this.sendViaTwilio(formattedNumber, truncatedMessage)

      // Log delivery attempt
      console.log(`📱 SMS sent to ${formattedNumber} via ${carrier || 'unknown'} (${cost} cents)`)

      return response.success
    } catch (error) {
      console.error('SMS sending failed:', error)
      return false
    }
  }

  private async sendViaTwilio(to: string, message: string): Promise<{ success: boolean, messageId?: string }> {
    // Placeholder for Twilio integration
    // In production, you would use the Twilio SDK here
    return { success: true, messageId: 'sim_' + Date.now() }
  }

  // ========================================
  // ALBANIAN SMS TEMPLATES
  // ========================================

  // Saved Search Alert SMS
  getSavedSearchSms(userName: string, matchCount: number, searchName: string): SmsTemplate {
    return {
      message: `🚗 ${matchCount} makina të reja për "${searchName}". Shiko në AutoMarket: automarket.al`,
      language: 'sq'
    }
  }

  // Price Drop Alert SMS
  getPriceDropSms(carTitle: string, oldPrice: number, newPrice: number): SmsTemplate {
    const saving = oldPrice - newPrice
    return {
      message: `💰 Çmim i ulur! ${carTitle} tani €${(newPrice/100).toLocaleString()} (kursim €${(saving/100).toLocaleString()}). Shiko: automarket.al`,
      language: 'sq'
    }
  }

  // New Message Alert SMS
  getNewMessageSms(senderName: string, carTitle: string): SmsTemplate {
    return {
      message: `💬 Mesazh i ri nga ${senderName} për "${carTitle}". Shiko në AutoMarket: automarket.al/messages`,
      language: 'sq'
    }
  }

  // Verification Code SMS
  getVerificationCodeSms(code: string): SmsTemplate {
    return {
      message: `🔐 Kodi juaj i verifikimit për AutoMarket: ${code}. Mos e ndani këtë kod me askënd.`,
      language: 'sq'
    }
  }

  // Two-Factor Authentication SMS
  getTwoFactorSms(code: string): SmsTemplate {
    return {
      message: `🔒 Kodi juaj i sigurisë për AutoMarket: ${code}. Vlefshëm për 5 minuta.`,
      language: 'sq'
    }
  }

  // Security Alert SMS
  getSecurityAlertSms(): SmsTemplate {
    return {
      message: `⚠️ Hyrje e re në llogarinë tuaj AutoMarket. Nëse nuk jeni ju, ndryshoni menjëherë fjalëkalimin.`,
      language: 'sq'
    }
  }

  // Listing Expiry Warning SMS
  getListingExpirySms(carTitle: string, daysLeft: number): SmsTemplate {
    return {
      message: `⏰ Shpallja "${carTitle}" skadon për ${daysLeft} ditë. Rinovoni në AutoMarket: automarket.al/dashboard`,
      language: 'sq'
    }
  }

  // Welcome SMS
  getWelcomeSms(userName: string): SmsTemplate {
    return {
      message: `🇦🇱 Mirë se vini në AutoMarket ${userName}! Filloni kërkimin për makinën tuaj: automarket.al`,
      language: 'sq'
    }
  }

  // Payment Confirmation SMS
  getPaymentConfirmationSms(amount: number, description: string): SmsTemplate {
    return {
      message: `✅ Pagesa e konfirmuar: €${(amount/100).toLocaleString()} për ${description}. Faleminderit! - AutoMarket`,
      language: 'sq'
    }
  }

  // Promotion SMS
  getPromotionSms(promotionText: string): SmsTemplate {
    return {
      message: `🎉 ${promotionText} Detaje: automarket.al/offers`,
      language: 'sq'
    }
  }

  // Critical Alert SMS (High Value Cars)
  getCriticalAlertSms(carTitle: string, price: number): SmsTemplate {
    return {
      message: `🚨 URGJENT: ${carTitle} - €${(price/100).toLocaleString()} u shtua në AutoMarket. Veproni shpejt: automarket.al`,
      language: 'sq'
    }
  }

  // Birthday/Seasonal SMS
  getSeasonalSms(occasion: string, offer?: string): SmsTemplate {
    const baseMessage = `🎊 ${occasion}! `
    const offerText = offer ? `Ofertë speciale: ${offer}. ` : ''
    return {
      message: `${baseMessage}${offerText}Shiko makinat në AutoMarket: automarket.al`,
      language: 'sq'
    }
  }

  // Bulk SMS helper for campaigns
  async sendBulkSms(recipients: string[], template: SmsTemplate): Promise<{ sent: number, failed: number }> {
    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        const success = await this.sendSms({
          to: recipient,
          message: template.message,
          messageType: 'marketing'
        })

        if (success) {
          sent++
        } else {
          failed++
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        failed++
        console.error(`Failed to send SMS to ${recipient}:`, error)
      }
    }

    return { sent, failed }
  }

  // Cost calculation
  calculateSmsCost(phoneNumbers: string[]): { totalCost: number, breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {}
    let totalCost = 0

    for (const number of phoneNumbers) {
      const carrier = this.detectCarrier(number)
      const carrierKey = carrier || 'unknown'
      const cost = carrier ? ALBANIAN_CARRIERS[carrier].costPerSms : 20

      breakdown[carrierKey] = (breakdown[carrierKey] || 0) + cost
      totalCost += cost
    }

    return { totalCost, breakdown }
  }

  // Rate limiting helper
  async checkRateLimit(userId: string, messageType: string): Promise<boolean> {
    // Implementation would check database for user's SMS limits
    // For now, return true (allowed)
    return true
  }

  // Delivery tracking
  async trackDelivery(messageId: string): Promise<{ status: string, deliveredAt?: Date }> {
    // Implementation would check with SMS provider for delivery status
    return { status: 'delivered', deliveredAt: new Date() }
  }

  // Opt-out management
  async handleOptOut(phoneNumber: string): Promise<boolean> {
    // Implementation would add number to opt-out list
    console.log(`📱 Phone number ${phoneNumber} opted out of SMS notifications`)
    return true
  }

  // Smart sending with user preferences
  async sendSmartSms(userId: string, template: SmsTemplate, options: Partial<SmsOptions> = {}): Promise<boolean> {
    try {
      // In production, this would:
      // 1. Fetch user's SMS preferences from database
      // 2. Check if user has opted out
      // 3. Check quiet hours and timezone
      // 4. Check daily SMS limits
      // 5. Apply rate limiting
      // 6. Send SMS and log delivery

      console.log(`📱 Smart SMS queued for user ${userId}: ${template.message.substring(0, 50)}...`)
      return true
    } catch (error) {
      console.error('Smart SMS sending failed:', error)
      return false
    }
  }
}

export const smsService = new SmsService()

// Phone number validation schema for Albanian numbers
export const albanianPhoneSchema = z
  .string()
  .refine((phone) => {
    const cleaned = phone.replace(/[^\d]/g, '')
    return cleaned.match(/^(355)?(06[4-9])\d{6}$/)
  }, {
    message: "Numri i telefonit duhet të jetë një numër valid shqiptar (06X-XXX-XXXX)"
  })

// SMS template validation
export const smsTemplateSchema = z.object({
  message: z.string().min(1).max(160),
  language: z.enum(['sq', 'en'])
})

export type AlbanianCarrierType = keyof typeof ALBANIAN_CARRIERS
export type SmsMessageType = 'alert' | 'verification' | 'marketing'