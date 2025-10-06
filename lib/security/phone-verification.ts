import { PrismaClient } from '@prisma/client'
import { parsePhoneNumber, CountryCode } from 'libphonenumber-js'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Albanian mobile carriers
export const ALBANIAN_CARRIERS = {
  VODAFONE: 'vodafone_al',
  TELEKOM: 'telekom_al',
  ONE: 'one_al'
} as const

export type AlbanianCarrier = typeof ALBANIAN_CARRIERS[keyof typeof ALBANIAN_CARRIERS]

// Albanian mobile number prefixes
const CARRIER_PREFIXES = {
  [ALBANIAN_CARRIERS.VODAFONE]: ['069', '067', '068'],
  [ALBANIAN_CARRIERS.TELEKOM]: ['066', '067'],
  [ALBANIAN_CARRIERS.ONE]: ['068', '069']
}

/**
 * Albanian Phone Verification Service
 * Handles phone number validation and SMS verification for Albanian carriers
 */
export class AlbanianPhoneVerificationService {
  /**
   * Validate Albanian phone number and detect carrier
   */
  static validateAlbanianPhone(phoneNumber: string): {
    isValid: boolean
    carrier?: AlbanianCarrier
    formattedNumber?: string
    error?: string
  } {
    try {
      // Parse phone number assuming it's Albanian
      const parsed = parsePhoneNumber(phoneNumber, 'AL' as CountryCode)

      if (!parsed || !parsed.isValid()) {
        return { isValid: false, error: 'Numri i telefonit nuk është i vlefshëm' }
      }

      // Check if it's a mobile number
      if (parsed.getType() !== 'MOBILE') {
        return { isValid: false, error: 'Vetëm numrat celularë janë të lejuar' }
      }

      const nationalNumber = parsed.getNationalNumber()
      const prefix = nationalNumber.substring(0, 3)

      // Detect carrier based on prefix
      let carrier: AlbanianCarrier | undefined
      for (const [carrierName, prefixes] of Object.entries(CARRIER_PREFIXES)) {
        if (prefixes.includes(prefix)) {
          carrier = carrierName as AlbanianCarrier
          break
        }
      }

      if (!carrier) {
        return { isValid: false, error: 'Operatori celular nuk është i njohur' }
      }

      return {
        isValid: true,
        carrier,
        formattedNumber: parsed.format('E.164')
      }
    } catch (error) {
      return { isValid: false, error: 'Formati i numrit të telefonit është i gabuar' }
    }
  }

  /**
   * Generate verification code
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Send verification SMS (placeholder - integrate with SMS provider)
   */
  static async sendVerificationSMS(
    phoneNumber: string,
    code: string,
    carrier: AlbanianCarrier
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // In production, integrate with SMS providers like:
      // - Twilio
      // - Albanian SMS providers (Alb Telecom, etc.)
      // - Carrier-specific APIs

      console.log(`Sending SMS to ${phoneNumber} via ${carrier}: Code ${code}`)

      // Simulate SMS sending
      const messageTemplate = `
Kodi i verifikimit për AutoMjetet.al: ${code}
Mos e ndani këtë kod me askënd.
Vlefshëm për 10 minuta.
      `.trim()

      // Here you would integrate with actual SMS service
      // For now, we'll simulate success
      const messageId = crypto.randomUUID()

      return {
        success: true,
        messageId
      }
    } catch (error) {
      console.error('SMS sending failed:', error)
      return {
        success: false,
        error: 'Dërimi i SMS-it dështoi'
      }
    }
  }

  /**
   * Start phone verification process
   */
  static async startPhoneVerification(
    userId: string,
    phoneNumber: string
  ): Promise<{ success: boolean; expiresAt?: Date; error?: string }> {
    try {
      // Validate phone number
      const validation = this.validateAlbanianPhone(phoneNumber)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Generate verification code
      const code = this.generateVerificationCode()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store verification data
      await prisma.userVerification.upsert({
        where: { userId },
        create: {
          userId,
          phoneNumber: validation.formattedNumber,
          phoneCarrier: validation.carrier,
          phoneVerificationCode: code,
          phoneVerificationExpires: expiresAt
        },
        update: {
          phoneNumber: validation.formattedNumber,
          phoneCarrier: validation.carrier,
          phoneVerificationCode: code,
          phoneVerificationExpires: expiresAt,
          verificationAttempts: { increment: 1 },
          lastVerificationAttempt: new Date()
        }
      })

      // Send SMS
      const smsResult = await this.sendVerificationSMS(
        validation.formattedNumber!,
        code,
        validation.carrier!
      )

      if (!smsResult.success) {
        return { success: false, error: smsResult.error }
      }

      return { success: true, expiresAt }
    } catch (error) {
      console.error('Phone verification start failed:', error)
      return { success: false, error: 'Verifikimi i telefonit dështoi' }
    }
  }

  /**
   * Verify phone number with provided code
   */
  static async verifyPhoneCode(
    userId: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const verification = await prisma.userVerification.findUnique({
        where: { userId }
      })

      if (!verification) {
        return { success: false, error: 'Nuk u gjet proces verifikimi' }
      }

      if (!verification.phoneVerificationCode) {
        return { success: false, error: 'Nuk ka kod verifikimi aktiv' }
      }

      if (!verification.phoneVerificationExpires ||
          verification.phoneVerificationExpires < new Date()) {
        return { success: false, error: 'Kodi i verifikimit ka skaduar' }
      }

      if (verification.phoneVerificationCode !== code) {
        return { success: false, error: 'Kodi i verifikimit është i gabuar' }
      }

      // Mark phone as verified
      await prisma.userVerification.update({
        where: { userId },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          phoneVerificationCode: null,
          phoneVerificationExpires: null
        }
      })

      // Update user verification level
      await this.updateUserVerificationLevel(userId)

      return { success: true }
    } catch (error) {
      console.error('Phone verification failed:', error)
      return { success: false, error: 'Verifikimi dështoi' }
    }
  }

  /**
   * Update user verification level based on completed verifications
   */
  private static async updateUserVerificationLevel(userId: string) {
    const verification = await prisma.userVerification.findUnique({
      where: { userId }
    })

    if (!verification) return

    let level = 'none'
    let trustScore = 50

    if (verification.phoneVerified) {
      level = 'phone'
      trustScore = 60
    }

    if (verification.phoneVerified && verification.idVerified) {
      level = 'id'
      trustScore = 75
    }

    if (verification.phoneVerified && verification.idVerified && verification.businessVerified) {
      level = 'business'
      trustScore = 85
    }

    if (verification.phoneVerified && verification.idVerified &&
        verification.bankVerified && verification.addressVerified) {
      level = 'bank'
      trustScore = 90
    }

    if (verification.phoneVerified && verification.idVerified &&
        verification.bankVerified && verification.addressVerified &&
        verification.businessVerified) {
      level = 'full'
      trustScore = 95
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationLevel: level,
        trustScore
      }
    })
  }

  /**
   * Check if phone verification is required again (for security)
   */
  static async requiresReverification(userId: string): Promise<boolean> {
    const verification = await prisma.userVerification.findUnique({
      where: { userId }
    })

    if (!verification || !verification.phoneVerified) {
      return true
    }

    // Require reverification every 6 months for security
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
    return !verification.phoneVerifiedAt || verification.phoneVerifiedAt < sixMonthsAgo
  }
}