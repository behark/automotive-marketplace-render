import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * Fraud Prevention and Vehicle Verification Service
 * Integrates with stolen vehicle databases and performs fraud detection
 */
export class FraudPreventionService {
  /**
   * Verify vehicle against stolen vehicle databases
   */
  static async checkStolenVehicle(
    listingId: string,
    vin?: string,
    licensePlate?: string,
    registrationNumber?: string
  ): Promise<{
    success: boolean
    status: 'clear' | 'flagged' | 'stolen' | 'pending'
    alerts?: string[]
    error?: string
  }> {
    try {
      // Check if verification already exists
      let verification = await prisma.vehicleVerification.findUnique({
        where: { listingId }
      })

      if (!verification) {
        verification = await prisma.vehicleVerification.create({
          data: {
            listingId,
            vin,
            licensePlate,
            registrationNumber
          }
        })
      } else {
        // Update with new information
        verification = await prisma.vehicleVerification.update({
          where: { listingId },
          data: {
            vin: vin || verification.vin,
            licensePlate: licensePlate || verification.licensePlate,
            registrationNumber: registrationNumber || verification.registrationNumber
          }
        })
      }

      const alerts: string[] = []

      // Check Albanian Police Database (placeholder)
      if (vin) {
        const albanianPoliceCheck = await this.checkAlbanianPoliceDatabase(vin)
        if (albanianPoliceCheck.isStolen) {
          await this.updateVerificationStatus(listingId, 'stolen', 'albanian_police')
          return {
            success: true,
            status: 'stolen',
            alerts: ['Automjeti është raportuar i vjedhur në bazën e të dhënave të Policisë së Shqipërisë']
          }
        }
        if (albanianPoliceCheck.isFlagged) {
          alerts.push('Automjeti është i shënuar në bazën e të dhënave të Policisë së Shqipërisë')
        }
      }

      // Check Interpol Database (placeholder)
      if (vin) {
        const interpolCheck = await this.checkInterpolDatabase(vin)
        if (interpolCheck.isStolen) {
          await this.updateVerificationStatus(listingId, 'stolen', 'interpol')
          return {
            success: true,
            status: 'stolen',
            alerts: ['Automjeti është raportuar i vjedhur në bazën e të dhënave të Interpolit']
          }
        }
      }

      // Check insurance databases
      if (vin) {
        const insuranceCheck = await this.checkInsuranceDatabases(vin)
        if (insuranceCheck.hasTheftClaim) {
          alerts.push('Automjeti ka pretendim sigurie për vjedhje')
        }
      }

      // Determine final status
      let finalStatus: 'clear' | 'flagged' | 'stolen' | 'pending' = 'clear'
      if (alerts.length > 0) {
        finalStatus = 'flagged'
      }

      await this.updateVerificationStatus(listingId, finalStatus, 'multiple_sources')

      return { success: true, status: finalStatus, alerts }
    } catch (error) {
      console.error('Stolen vehicle check failed:', error)
      return { success: false, status: 'pending', error: 'Kontrollimi i automjetit dështoi' }
    }
  }

  /**
   * Check Albanian Police Database (placeholder implementation)
   */
  private static async checkAlbanianPoliceDatabase(vin: string): Promise<{
    isStolen: boolean
    isFlagged: boolean
    reportDate?: Date
  }> {
    // In production, integrate with Albanian Police API
    // This is a placeholder implementation

    console.log(`Checking Albanian Police database for VIN: ${vin}`)

    // Simulate database check
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For demo, flag certain VINs as stolen
    const stolenVins = ['TESTVIN123STOLEN', 'DEMO999STOLEN']
    const flaggedVins = ['TESTVIN456FLAG', 'DEMO888FLAG']

    return {
      isStolen: stolenVins.includes(vin),
      isFlagged: flaggedVins.includes(vin),
      reportDate: stolenVins.includes(vin) ? new Date() : undefined
    }
  }

  /**
   * Check Interpol Database (placeholder implementation)
   */
  private static async checkInterpolDatabase(vin: string): Promise<{
    isStolen: boolean
    reportingCountry?: string
  }> {
    // In production, integrate with Interpol database API
    console.log(`Checking Interpol database for VIN: ${vin}`)

    await new Promise(resolve => setTimeout(resolve, 1500))

    // Simulate check
    return {
      isStolen: vin.includes('INTERPOL'),
      reportingCountry: vin.includes('INTERPOL') ? 'Germany' : undefined
    }
  }

  /**
   * Check Insurance Databases (placeholder implementation)
   */
  private static async checkInsuranceDatabases(vin: string): Promise<{
    hasTheftClaim: boolean
    hasAccidentHistory: boolean
    totalLossClaim: boolean
  }> {
    console.log(`Checking insurance databases for VIN: ${vin}`)

    await new Promise(resolve => setTimeout(resolve, 800))

    return {
      hasTheftClaim: vin.includes('THEFT'),
      hasAccidentHistory: vin.includes('ACCIDENT'),
      totalLossClaim: vin.includes('TOTALLOSS')
    }
  }

  /**
   * Update verification status
   */
  private static async updateVerificationStatus(
    listingId: string,
    status: string,
    source: string
  ): Promise<void> {
    await prisma.vehicleVerification.update({
      where: { listingId },
      data: {
        stolenCheck: true,
        stolenCheckStatus: status,
        stolenCheckSource: source,
        stolenCheckAt: new Date()
      }
    })
  }

  /**
   * Detect duplicate listings (fraud prevention)
   */
  static async detectDuplicateListings(
    listingId: string,
    vin?: string,
    licensePlate?: string,
    images?: string[]
  ): Promise<{
    isDuplicate: boolean
    duplicateListings?: string[]
    reason?: string
  }> {
    try {
      const duplicateListings: string[] = []

      // Check for same VIN
      if (vin) {
        const vinDuplicates = await prisma.vehicleVerification.findMany({
          where: {
            vin,
            listing: {
              status: 'active',
              id: { not: listingId }
            }
          },
          select: { listingId: true }
        })
        duplicateListings.push(...vinDuplicates.map(v => v.listingId))
      }

      // Check for same license plate
      if (licensePlate) {
        const plateDuplicates = await prisma.vehicleVerification.findMany({
          where: {
            licensePlate,
            listing: {
              status: 'active',
              id: { not: listingId }
            }
          },
          select: { listingId: true }
        })
        duplicateListings.push(...plateDuplicates.map(v => v.listingId))
      }

      // Check for similar images (placeholder - in production use image similarity)
      if (images && images.length > 0) {
        // This would use image similarity algorithms in production
        console.log(`Checking image similarity for listing ${listingId}`)
      }

      // Remove duplicates and current listing
      const uniqueDuplicates = [...new Set(duplicateListings)]

      if (uniqueDuplicates.length > 0) {
        // Create fraud alert
        await this.createFraudAlert(
          listingId,
          'duplicate_listing',
          'high',
          'Multiple active listings found for the same vehicle',
          { duplicateListings: uniqueDuplicates }
        )

        return {
          isDuplicate: true,
          duplicateListings: uniqueDuplicates,
          reason: 'Same VIN or license plate found in other active listings'
        }
      }

      return { isDuplicate: false }
    } catch (error) {
      console.error('Duplicate detection failed:', error)
      return { isDuplicate: false }
    }
  }

  /**
   * Analyze pricing for fraud detection
   */
  static async analyzePricingFraud(
    listingId: string,
    make: string,
    model: string,
    year: number,
    price: number,
    mileage: number
  ): Promise<{
    isSuspicious: boolean
    reason?: string
    marketPrice?: number
    confidence?: number
  }> {
    try {
      // Get market data for similar vehicles
      const marketData = await prisma.marketData.findFirst({
        where: {
          make: { equals: make, mode: 'insensitive' },
          model: { equals: model, mode: 'insensitive' },
          year
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!marketData) {
        return { isSuspicious: false, reason: 'No market data available' }
      }

      const marketPrice = marketData.averagePrice
      const priceRatio = price / marketPrice

      // Flag if price is suspiciously low (potential fraud)
      if (priceRatio < 0.5) {
        await this.createFraudAlert(
          listingId,
          'suspicious_pricing',
          'high',
          `Price €${price/100} is ${Math.round((1-priceRatio)*100)}% below market average of €${marketPrice/100}`,
          { marketPrice, userPrice: price, ratio: priceRatio }
        )

        return {
          isSuspicious: true,
          reason: 'Price significantly below market value',
          marketPrice,
          confidence: 0.8
        }
      }

      // Flag if price is suspiciously high
      if (priceRatio > 2.0) {
        await this.createFraudAlert(
          listingId,
          'suspicious_pricing',
          'medium',
          `Price €${price/100} is ${Math.round((priceRatio-1)*100)}% above market average of €${marketPrice/100}`,
          { marketPrice, userPrice: price, ratio: priceRatio }
        )

        return {
          isSuspicious: true,
          reason: 'Price significantly above market value',
          marketPrice,
          confidence: 0.6
        }
      }

      return { isSuspicious: false, marketPrice }
    } catch (error) {
      console.error('Pricing analysis failed:', error)
      return { isSuspicious: false }
    }
  }

  /**
   * Verify vehicle documents
   */
  static async verifyVehicleDocuments(
    listingId: string,
    documents: {
      registration?: Express.Multer.File
      insurance?: Express.Multer.File
      technicalInspection?: Express.Multer.File
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const verification = await prisma.vehicleVerification.findUnique({
        where: { listingId }
      })

      if (!verification) {
        return { success: false, error: 'Verifikimi i automjetit nuk u gjet' }
      }

      const updates: any = {}

      // Process registration document
      if (documents.registration) {
        const registrationResult = await this.processRegistrationDocument(documents.registration)
        updates.registrationVerified = registrationResult.isValid
      }

      // Process insurance document
      if (documents.insurance) {
        const insuranceResult = await this.processInsuranceDocument(documents.insurance)
        updates.insuranceVerified = insuranceResult.isValid
      }

      // Process technical inspection
      if (documents.technicalInspection) {
        const inspectionResult = await this.processTechnicalInspectionDocument(documents.technicalInspection)
        updates.technicalInspectionValid = inspectionResult.isValid
        if (inspectionResult.expiryDate) {
          updates.technicalInspectionExpiry = inspectionResult.expiryDate
        }
      }

      // Update verification record
      await prisma.vehicleVerification.update({
        where: { listingId },
        data: updates
      })

      return { success: true }
    } catch (error) {
      console.error('Document verification failed:', error)
      return { success: false, error: 'Verifikimi i dokumenteve dështoi' }
    }
  }

  /**
   * Process registration document with OCR
   */
  private static async processRegistrationDocument(file: Express.Multer.File): Promise<{
    isValid: boolean
    extractedData?: any
  }> {
    // In production, use OCR to extract and verify registration data
    console.log(`Processing registration document: ${file.originalname}`)

    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    return {
      isValid: true,
      extractedData: {
        registrationNumber: 'AA123BB',
        ownerName: 'John Doe',
        vehicleModel: 'Toyota Corolla'
      }
    }
  }

  /**
   * Process insurance document
   */
  private static async processInsuranceDocument(file: Express.Multer.File): Promise<{
    isValid: boolean
    expiryDate?: Date
  }> {
    console.log(`Processing insurance document: ${file.originalname}`)

    await new Promise(resolve => setTimeout(resolve, 1500))

    return {
      isValid: true,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  }

  /**
   * Process technical inspection document
   */
  private static async processTechnicalInspectionDocument(file: Express.Multer.File): Promise<{
    isValid: boolean
    expiryDate?: Date
  }> {
    console.log(`Processing technical inspection document: ${file.originalname}`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      isValid: true,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Create fraud alert
   */
  private static async createFraudAlert(
    listingId: string,
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    evidence: any
  ): Promise<void> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true }
    })

    await prisma.fraudAlert.create({
      data: {
        listingId,
        userId: listing?.userId,
        alertType,
        severity,
        description,
        evidence
      }
    })

    // Auto-suspend listing if critical
    if (severity === 'critical') {
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'expired' } // Temporarily suspend
      })
    }
  }

  /**
   * Get fraud alerts for admin review
   */
  static async getFraudAlerts(severity?: string): Promise<any[]> {
    const where: any = {}
    if (severity) {
      where.severity = severity
    }

    return await prisma.fraudAlert.findMany({
      where: {
        ...where,
        status: 'pending'
      },
      include: {
        listing: {
          select: {
            title: true,
            price: true,
            make: true,
            model: true,
            year: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            trustScore: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  /**
   * Resolve fraud alert
   */
  static async resolveFraudAlert(
    alertId: string,
    adminId: string,
    resolution: 'false_positive' | 'confirmed_fraud' | 'requires_action',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.fraudAlert.update({
        where: { id: alertId },
        data: {
          status: 'resolved',
          assignedTo: adminId,
          resolutionNotes: `${resolution}: ${notes || ''}`,
          resolvedAt: new Date()
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Fraud alert resolution failed:', error)
      return { success: false, error: 'Zgjidhja e alertit dështoi' }
    }
  }
}