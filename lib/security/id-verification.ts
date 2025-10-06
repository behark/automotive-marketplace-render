import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import CryptoJS from 'crypto-js'

const prisma = new PrismaClient()

export type AlbanianIdType = 'id_card' | 'passport' | 'driving_license'

/**
 * Albanian ID Document Verification Service
 * Handles verification of Albanian identity documents
 */
export class AlbanianIdVerificationService {
  private static readonly ENCRYPTION_KEY = process.env.ID_ENCRYPTION_KEY || 'fallback-key'

  /**
   * Encrypt sensitive ID information
   */
  private static encryptIdData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString()
  }

  /**
   * Decrypt sensitive ID information
   */
  private static decryptIdData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  /**
   * Validate Albanian ID card number format
   */
  static validateAlbanianIdCard(idNumber: string): { isValid: boolean; error?: string } {
    // Albanian ID card format: I########L (I + 8 digits + letter)
    const idRegex = /^I\d{8}[A-Z]$/

    if (!idRegex.test(idNumber)) {
      return {
        isValid: false,
        error: 'Formati i kartës së identitetit duhet të jetë I########L'
      }
    }

    // Check digit validation (simplified - actual algorithm is more complex)
    const digits = idNumber.substring(1, 9)
    const checkLetter = idNumber.charAt(9)

    // Basic validation - in production, implement full check digit algorithm
    if (digits === '00000000') {
      return {
        isValid: false,
        error: 'Numri i kartës së identitetit nuk është i vlefshëm'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate Albanian passport number format
   */
  static validateAlbanianPassport(passportNumber: string): { isValid: boolean; error?: string } {
    // Albanian passport format: AL#######
    const passportRegex = /^AL\d{7}$/

    if (!passportRegex.test(passportNumber)) {
      return {
        isValid: false,
        error: 'Formati i pasaportës duhet të jetë AL#######'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate Albanian driving license number format
   */
  static validateAlbanianDrivingLicense(licenseNumber: string): { isValid: boolean; error?: string } {
    // Albanian driving license format: varies, typically 9 digits
    const licenseRegex = /^\d{9}$/

    if (!licenseRegex.test(licenseNumber)) {
      return {
        isValid: false,
        error: 'Formati i patentës duhet të jetë 9 shifra'
      }
    }

    return { isValid: true }
  }

  /**
   * Validate ID document based on type
   */
  static validateIdDocument(
    idType: AlbanianIdType,
    idNumber: string
  ): { isValid: boolean; error?: string } {
    switch (idType) {
      case 'id_card':
        return this.validateAlbanianIdCard(idNumber)
      case 'passport':
        return this.validateAlbanianPassport(passportNumber)
      case 'driving_license':
        return this.validateAlbanianDrivingLicense(idNumber)
      default:
        return { isValid: false, error: 'Lloji i dokumentit nuk është i vlefshëm' }
    }
  }

  /**
   * Process uploaded ID document
   */
  static async processIdDocument(
    userId: string,
    idType: AlbanianIdType,
    idNumber: string,
    documentFile: Express.Multer.File
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate ID number format
      const validation = this.validateIdDocument(idType, idNumber)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Check if ID is already used by another user
      const existingVerification = await prisma.userVerification.findFirst({
        where: {
          idNumber: this.encryptIdData(idNumber),
          userId: { not: userId }
        }
      })

      if (existingVerification) {
        return {
          success: false,
          error: 'Ky dokument është përdorur tashmë nga një përdorues tjetër'
        }
      }

      // Store document securely (in production, use secure cloud storage)
      const documentUrl = await this.storeDocumentSecurely(userId, documentFile)

      // Update verification record
      await prisma.userVerification.upsert({
        where: { userId },
        create: {
          userId,
          idType,
          idNumber: this.encryptIdData(idNumber),
          idDocumentUrl: documentUrl
        },
        update: {
          idType,
          idNumber: this.encryptIdData(idNumber),
          idDocumentUrl: documentUrl,
          verificationAttempts: { increment: 1 },
          lastVerificationAttempt: new Date()
        }
      })

      // In production, integrate with OCR service for automatic verification
      await this.performOCRVerification(userId, documentFile, idType, idNumber)

      return { success: true }
    } catch (error) {
      console.error('ID verification processing failed:', error)
      return { success: false, error: 'Përpunimi i dokumentit dështoi' }
    }
  }

  /**
   * Store document securely (placeholder for cloud storage)
   */
  private static async storeDocumentSecurely(
    userId: string,
    file: Express.Multer.File
  ): Promise<string> {
    // In production, upload to secure cloud storage (AWS S3, etc.)
    // with proper encryption and access controls

    const fileName = `id-docs/${userId}/${Date.now()}-${file.originalname}`

    // For demo, we'll use a placeholder URL
    // In reality: upload to S3, get secure URL
    return `https://secure-docs.example.com/${fileName}`
  }

  /**
   * Perform OCR verification on document
   */
  private static async performOCRVerification(
    userId: string,
    documentFile: Express.Multer.File,
    idType: AlbanianIdType,
    expectedIdNumber: string
  ): Promise<void> {
    try {
      // In production, integrate with OCR services like:
      // - AWS Textract
      // - Google Cloud Vision API
      // - Azure Form Recognizer
      // - Specialized ID verification services

      console.log(`Performing OCR verification for user ${userId}`)

      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate OCR results
      const ocrResults = {
        extractedText: `ID Number: ${expectedIdNumber}`,
        confidence: 0.95,
        documentType: idType
      }

      // In production, compare OCR results with provided data
      const isDocumentValid = ocrResults.confidence > 0.8

      if (isDocumentValid) {
        // Auto-approve if OCR confidence is high
        await this.approveIdVerification(userId, 'ocr_verification')
      } else {
        // Flag for manual review
        await this.flagForManualReview(userId, 'low_ocr_confidence')
      }
    } catch (error) {
      console.error('OCR verification failed:', error)
      await this.flagForManualReview(userId, 'ocr_failed')
    }
  }

  /**
   * Approve ID verification
   */
  static async approveIdVerification(
    userId: string,
    verificationMethod: string,
    adminId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.userVerification.update({
        where: { userId },
        data: {
          idVerified: true,
          idVerifiedAt: new Date(),
          idVerificationNotes: `Verified via ${verificationMethod}`,
          verifierAdminId: adminId
        }
      })

      // Update user verification level and trust score
      await this.updateUserVerificationLevel(userId)

      return { success: true }
    } catch (error) {
      console.error('ID verification approval failed:', error)
      return { success: false, error: 'Miratimi i verifikimit dështoi' }
    }
  }

  /**
   * Reject ID verification
   */
  static async rejectIdVerification(
    userId: string,
    reason: string,
    adminId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.userVerification.update({
        where: { userId },
        data: {
          idVerified: false,
          idVerificationNotes: `Rejected: ${reason}`,
          verifierAdminId: adminId
        }
      })

      return { success: true }
    } catch (error) {
      console.error('ID verification rejection failed:', error)
      return { success: false, error: 'Refuzimi i verifikimit dështoi' }
    }
  }

  /**
   * Flag verification for manual review
   */
  private static async flagForManualReview(userId: string, reason: string): Promise<void> {
    await prisma.userVerification.update({
      where: { userId },
      data: {
        idVerificationNotes: `Flagged for manual review: ${reason}`
      }
    })

    // In production, notify admin team for manual review
    console.log(`ID verification for user ${userId} flagged for manual review: ${reason}`)
  }

  /**
   * Update user verification level based on completed verifications
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
   * Get pending ID verifications for admin review
   */
  static async getPendingVerifications(): Promise<any[]> {
    const pendingVerifications = await prisma.userVerification.findMany({
      where: {
        AND: [
          { idDocumentUrl: { not: null } },
          { idVerified: false },
          { idVerificationNotes: { contains: 'manual review' } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    })

    return pendingVerifications.map(verification => ({
      ...verification,
      idNumber: verification.idNumber ? this.decryptIdData(verification.idNumber) : null
    }))
  }
}