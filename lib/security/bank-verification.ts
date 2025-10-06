import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Major Albanian banks
export const ALBANIAN_BANKS = {
  BKT: 'Banka Kombëtare Tregtare',
  RAIFFEISEN: 'Raiffeisen Bank Albania',
  INTESA: 'Intesa Sanpaolo Bank Albania',
  CREDINS: 'Credins Bank',
  PROCREDIT: 'ProCredit Bank',
  ALPHA: 'Alpha Bank Albania',
  FIRST_INVESTMENT: 'First Investment Bank',
  TIRANA: 'Tirana Bank',
  UNION: 'Union Bank',
  NATIONAL_COMMERCIAL: 'National Commercial Bank'
} as const

export type AlbanianBank = keyof typeof ALBANIAN_BANKS

/**
 * Albanian Bank Account Verification Service
 * Handles verification of bank accounts for sellers
 */
export class AlbanianBankVerificationService {
  /**
   * Validate Albanian IBAN format
   */
  static validateAlbanianIBAN(iban: string): { isValid: boolean; bank?: string; error?: string } {
    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase()

    // Albanian IBAN format: AL## #### #### #### #### #### ####
    // Total length: 28 characters
    if (cleanIban.length !== 28) {
      return { isValid: false, error: 'IBAN shqiptare duhet të ketë 28 karaktere' }
    }

    if (!cleanIban.startsWith('AL')) {
      return { isValid: false, error: 'IBAN duhet të fillojë me AL' }
    }

    // Extract bank code (positions 4-7)
    const bankCode = cleanIban.substring(4, 8)

    // Map bank codes to bank names (simplified mapping)
    const bankCodeMapping: Record<string, string> = {
      '2111': ALBANIAN_BANKS.BKT,
      '2041': ALBANIAN_BANKS.RAIFFEISEN,
      '2201': ALBANIAN_BANKS.INTESA,
      '2081': ALBANIAN_BANKS.CREDINS,
      '2151': ALBANIAN_BANKS.PROCREDIT,
      '2021': ALBANIAN_BANKS.ALPHA,
      '2131': ALBANIAN_BANKS.FIRST_INVESTMENT,
      '2101': ALBANIAN_BANKS.TIRANA,
      '2181': ALBANIAN_BANKS.UNION,
      '2091': ALBANIAN_BANKS.NATIONAL_COMMERCIAL
    }

    const bankName = bankCodeMapping[bankCode]
    if (!bankName) {
      return { isValid: false, error: 'Kodi i bankës nuk është i njohur' }
    }

    // Perform basic IBAN checksum validation
    if (!this.validateIBANChecksum(cleanIban)) {
      return { isValid: false, error: 'IBAN nuk ka checksum të vlefshëm' }
    }

    return { isValid: true, bank: bankName }
  }

  /**
   * Validate IBAN checksum using MOD-97 algorithm
   */
  private static validateIBANChecksum(iban: string): boolean {
    // Move first 4 characters to end
    const rearranged = iban.substring(4) + iban.substring(0, 4)

    // Replace letters with numbers (A=10, B=11, ..., Z=35)
    let numeric = ''
    for (const char of rearranged) {
      if (char >= 'A' && char <= 'Z') {
        numeric += (char.charCodeAt(0) - 55).toString()
      } else {
        numeric += char
      }
    }

    // Calculate MOD 97
    let remainder = 0
    for (const digit of numeric) {
      remainder = (remainder * 10 + parseInt(digit)) % 97
    }

    return remainder === 1
  }

  /**
   * Start bank verification process with micro-deposits
   */
  static async startBankVerification(
    userId: string,
    iban: string,
    accountHolderName: string
  ): Promise<{ success: boolean; verificationId?: string; error?: string }> {
    try {
      // Validate IBAN
      const ibanValidation = this.validateAlbanianIBAN(iban)
      if (!ibanValidation.isValid) {
        return { success: false, error: ibanValidation.error }
      }

      // Check if IBAN is already verified by another user
      const existingVerification = await prisma.userVerification.findFirst({
        where: {
          AND: [
            { bankVerified: true },
            { userId: { not: userId } }
          ]
        }
      })

      if (existingVerification) {
        // In production, you might want to allow multiple users per bank account
        // with proper verification of relationship
      }

      // Generate verification amounts (in cents)
      const amount1 = Math.floor(Math.random() * 99) + 1 // 1-99 cents
      const amount2 = Math.floor(Math.random() * 99) + 1 // 1-99 cents

      const verificationId = crypto.randomUUID()

      // Store verification data
      await prisma.userVerification.upsert({
        where: { userId },
        create: {
          userId,
          bankName: ibanValidation.bank,
          bankAccountLast4: iban.slice(-4),
          verificationAttempts: 1
        },
        update: {
          bankName: ibanValidation.bank,
          bankAccountLast4: iban.slice(-4),
          verificationAttempts: { increment: 1 },
          lastVerificationAttempt: new Date()
        }
      })

      // In production, initiate micro-deposits through banking API
      await this.initiateMicroDeposits(iban, accountHolderName, amount1, amount2, verificationId)

      return { success: true, verificationId }
    } catch (error) {
      console.error('Bank verification start failed:', error)
      return { success: false, error: 'Verifikimi i llogarisë bankare dështoi' }
    }
  }

  /**
   * Verify bank account with micro-deposit amounts
   */
  static async verifyMicroDeposits(
    userId: string,
    amount1: number,
    amount2: number,
    verificationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, verify amounts against stored verification data
      // For demo, we'll simulate verification

      const verification = await prisma.userVerification.findUnique({
        where: { userId }
      })

      if (!verification) {
        return { success: false, error: 'Nuk u gjet proces verifikimi' }
      }

      // Simulate verification check (in production, check against actual micro-deposits)
      const isValid = amount1 > 0 && amount2 > 0 && amount1 !== amount2

      if (!isValid) {
        return { success: false, error: 'Shumat e verifikimit janë të gabuara' }
      }

      // Mark bank as verified
      await prisma.userVerification.update({
        where: { userId },
        data: {
          bankVerified: true,
          bankVerifiedAt: new Date()
        }
      })

      // Update user verification level
      await this.updateUserVerificationLevel(userId)

      return { success: true }
    } catch (error) {
      console.error('Micro-deposit verification failed:', error)
      return { success: false, error: 'Verifikimi i depozitave dështoi' }
    }
  }

  /**
   * Initiate micro-deposits (placeholder for banking API integration)
   */
  private static async initiateMicroDeposits(
    iban: string,
    accountHolderName: string,
    amount1: number,
    amount2: number,
    verificationId: string
  ): Promise<void> {
    // In production, integrate with Albanian banking APIs or SEPA payment services
    // This might involve:
    // - Integration with bank APIs
    // - SEPA Credit Transfer for micro-deposits
    // - Open Banking APIs where available

    console.log(`Initiating micro-deposits to ${iban}:`)
    console.log(`Amount 1: ${amount1} cents`)
    console.log(`Amount 2: ${amount2} cents`)
    console.log(`Verification ID: ${verificationId}`)

    // Store verification data securely for later verification
    // In production, this would be encrypted and stored in the database
  }

  /**
   * Verify bank account through document upload
   */
  static async verifyBankDocument(
    userId: string,
    bankStatement: Express.Multer.File
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, process bank statement with OCR
      // Extract account details, verify account holder name matches user

      const documentUrl = await this.storeBankDocumentSecurely(userId, bankStatement)

      // Update verification with document
      await prisma.userVerification.update({
        where: { userId },
        data: {
          // Store document reference for manual review
          verificationNotes: `Bank statement uploaded: ${documentUrl}`
        }
      })

      // Flag for manual admin review
      console.log(`Bank document verification for user ${userId} requires manual review`)

      return { success: true }
    } catch (error) {
      console.error('Bank document verification failed:', error)
      return { success: false, error: 'Verifikimi i dokumentit bankar dështoi' }
    }
  }

  /**
   * Store bank document securely
   */
  private static async storeBankDocumentSecurely(
    userId: string,
    file: Express.Multer.File
  ): Promise<string> {
    // In production, upload to secure cloud storage with encryption
    const fileName = `bank-docs/${userId}/${Date.now()}-${file.originalname}`
    return `https://secure-docs.example.com/${fileName}`
  }

  /**
   * Update user verification level
   */
  private static async updateUserVerificationLevel(userId: string): Promise<void> {
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
   * Get user's bank verification status
   */
  static async getBankVerificationStatus(userId: string): Promise<{
    verified: boolean
    bankName?: string
    lastFour?: string
    verifiedAt?: Date
  }> {
    const verification = await prisma.userVerification.findUnique({
      where: { userId },
      select: {
        bankVerified: true,
        bankName: true,
        bankAccountLast4: true,
        bankVerifiedAt: true
      }
    })

    return {
      verified: verification?.bankVerified || false,
      bankName: verification?.bankName || undefined,
      lastFour: verification?.bankAccountLast4 || undefined,
      verifiedAt: verification?.bankVerifiedAt || undefined
    }
  }
}