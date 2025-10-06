import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import CryptoJS from 'crypto-js'

const prisma = new PrismaClient()

/**
 * Privacy and Identity Protection Service
 * Implements GDPR compliance and Albanian privacy preferences
 */
export class PrivacyProtectionService {
  private static readonly ENCRYPTION_KEY = process.env.PRIVACY_ENCRYPTION_KEY || 'fallback-privacy-key'

  /**
   * Update user privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    settings: {
      hidePhoneNumber?: boolean
      hideEmail?: boolean
      allowDirectContact?: boolean
      anonymousBrowsing?: boolean
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: settings
      })

      // Log privacy settings change
      await this.logPrivacyAction(userId, 'privacy_settings_updated', {
        settings,
        timestamp: new Date()
      })

      return { success: true }
    } catch (error) {
      console.error('Privacy settings update failed:', error)
      return { success: false, error: 'Përditësimi i cilësimeve të privatësisë dështoi' }
    }
  }

  /**
   * Mask phone number for privacy
   */
  static maskPhoneNumber(phoneNumber: string, showLast4: boolean = true): string {
    if (!phoneNumber) return ''

    if (showLast4 && phoneNumber.length > 4) {
      const masked = '*'.repeat(phoneNumber.length - 4)
      return masked + phoneNumber.slice(-4)
    }

    return '*'.repeat(phoneNumber.length)
  }

  /**
   * Mask email address for privacy
   */
  static maskEmailAddress(email: string): string {
    if (!email || !email.includes('@')) return ''

    const [localPart, domain] = email.split('@')

    if (localPart.length <= 2) {
      return '*'.repeat(localPart.length) + '@' + domain
    }

    const firstChar = localPart.charAt(0)
    const lastChar = localPart.charAt(localPart.length - 1)
    const masked = firstChar + '*'.repeat(localPart.length - 2) + lastChar

    return masked + '@' + domain
  }

  /**
   * Get masked contact information based on user privacy settings
   */
  static async getMaskedContactInfo(
    userId: string,
    requesterId?: string
  ): Promise<{
    phone?: string
    email?: string
    allowDirectContact: boolean
    showRealContacts: boolean
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        email: true,
        hidePhoneNumber: true,
        hideEmail: true,
        allowDirectContact: true
      }
    })

    if (!user) {
      return {
        allowDirectContact: false,
        showRealContacts: false
      }
    }

    // Check if requester should see real contacts
    const showRealContacts = requesterId ? await this.shouldShowRealContacts(userId, requesterId) : false

    return {
      phone: showRealContacts || !user.hidePhoneNumber
        ? user.phone || undefined
        : user.phone ? this.maskPhoneNumber(user.phone) : undefined,
      email: showRealContacts || !user.hideEmail
        ? user.email
        : this.maskEmailAddress(user.email),
      allowDirectContact: user.allowDirectContact,
      showRealContacts
    }
  }

  /**
   * Check if requester should see real contact information
   */
  private static async shouldShowRealContacts(userId: string, requesterId: string): Promise<boolean> {
    // Same user can see their own contacts
    if (userId === requesterId) {
      return true
    }

    // Check if users have established communication
    const hasMessageExchange = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: requesterId, listing: { userId } },
          { senderId: userId, listing: { userId: requesterId } }
        ]
      }
    })

    return !!hasMessageExchange
  }

  /**
   * Process GDPR data request
   */
  static async processGDPRRequest(
    userId: string,
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction',
    requestDetails?: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const request = await prisma.legalCompliance.create({
        data: {
          complianceType: 'gdpr',
          dataSubjectId: userId,
          requestType,
          requestDetails: requestDetails || '',
          requestStatus: 'pending'
        }
      })

      // Process different request types
      switch (requestType) {
        case 'access':
          await this.processDataAccessRequest(userId, request.id)
          break
        case 'erasure':
          await this.processDataErasureRequest(userId, request.id)
          break
        case 'portability':
          await this.processDataPortabilityRequest(userId, request.id)
          break
        default:
          // Other requests require manual processing
          console.log(`GDPR ${requestType} request requires manual processing`)
      }

      return { success: true, requestId: request.id }
    } catch (error) {
      console.error('GDPR request processing failed:', error)
      return { success: false, error: 'Kërkesa GDPR dështoi' }
    }
  }

  /**
   * Process data access request (GDPR Article 15)
   */
  private static async processDataAccessRequest(userId: string, requestId: string): Promise<void> {
    try {
      // Collect all user data
      const userData = await this.collectUserData(userId)

      // Generate data export
      const exportData = {
        user: userData.user,
        listings: userData.listings,
        messages: userData.messages,
        reviews: userData.reviews,
        transactions: userData.transactions,
        verifications: userData.verifications,
        generatedAt: new Date(),
        requestId
      }

      // In production, create secure download link
      const exportUrl = await this.createSecureDataExport(userId, exportData)

      await prisma.legalCompliance.update({
        where: { id: requestId },
        data: {
          requestStatus: 'completed',
          documentUrl: exportUrl
        }
      })

      // Notify user that data export is ready
      await this.notifyUserDataReady(userId, exportUrl)
    } catch (error) {
      console.error('Data access request failed:', error)
      await prisma.legalCompliance.update({
        where: { id: requestId },
        data: { requestStatus: 'rejected' }
      })
    }
  }

  /**
   * Process data erasure request (GDPR Article 17 - Right to be forgotten)
   */
  private static async processDataErasureRequest(userId: string, requestId: string): Promise<void> {
    try {
      // Check if user has active listings or transactions
      const activeListing = await prisma.listing.findFirst({
        where: { userId, status: 'active' }
      })

      const activeEscrow = await prisma.escrowTransaction.findFirst({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
          status: { in: ['initiated', 'funded'] }
        }
      })

      if (activeListing || activeEscrow) {
        await prisma.legalCompliance.update({
          where: { id: requestId },
          data: {
            requestStatus: 'rejected',
            requestDetails: 'Cannot delete data while user has active listings or transactions'
          }
        })
        return
      }

      // Schedule data deletion
      const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      await prisma.legalCompliance.update({
        where: { id: requestId },
        data: {
          requestStatus: 'processing',
          scheduledDeletion: deletionDate
        }
      })

      // Anonymize user data instead of hard deletion (preserves reviews, etc.)
      await this.anonymizeUserData(userId)

      await prisma.legalCompliance.update({
        where: { id: requestId },
        data: { requestStatus: 'completed' }
      })
    } catch (error) {
      console.error('Data erasure request failed:', error)
      await prisma.legalCompliance.update({
        where: { id: requestId },
        data: { requestStatus: 'rejected' }
      })
    }
  }

  /**
   * Process data portability request (GDPR Article 20)
   */
  private static async processDataPortabilityRequest(userId: string, requestId: string): Promise<void> {
    try {
      const userData = await this.collectUserData(userId)

      // Format data in machine-readable format (JSON)
      const portableData = {
        format: 'JSON',
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: userData
      }

      const exportUrl = await this.createSecureDataExport(userId, portableData)

      await prisma.legalCompliance.update({
        where: { id: requestId },
        data: {
          requestStatus: 'completed',
          documentUrl: exportUrl
        }
      })
    } catch (error) {
      console.error('Data portability request failed:', error)
      await prisma.legalCompliance.update({
        where: { id: requestId },
        data: { requestStatus: 'rejected' }
      })
    }
  }

  /**
   * Collect all user data for export
   */
  private static async collectUserData(userId: string): Promise<any> {
    const [user, listings, messages, reviews, transactions, verifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          plan: true,
          trustScore: true,
          verificationLevel: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.listing.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          make: true,
          model: true,
          year: true,
          mileage: true,
          city: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.message.findMany({
        where: { senderId: userId },
        select: {
          id: true,
          content: true,
          listingId: true,
          createdAt: true,
          read: true
        }
      }),
      prisma.review.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          targetId: true,
          listingId: true,
          createdAt: true
        }
      }),
      prisma.escrowTransaction.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }]
        },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          completedAt: true
        }
      }),
      prisma.userVerification.findUnique({
        where: { userId },
        select: {
          phoneVerified: true,
          idVerified: true,
          bankVerified: true,
          businessVerified: true,
          addressVerified: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ])

    return {
      user,
      listings,
      messages,
      reviews,
      transactions,
      verifications
    }
  }

  /**
   * Create secure data export
   */
  private static async createSecureDataExport(userId: string, data: any): Promise<string> {
    // In production, create encrypted file and store in secure location
    const exportId = crypto.randomUUID()
    const fileName = `user-data-export-${userId}-${exportId}.json`

    // For demo, return placeholder URL
    // In production: encrypt data, upload to secure S3 bucket with expiration
    return `https://secure-exports.example.com/${fileName}`
  }

  /**
   * Anonymize user data (for GDPR erasure while preserving platform integrity)
   */
  private static async anonymizeUserData(userId: string): Promise<void> {
    const anonymousId = `anonymous_${crypto.randomBytes(8).toString('hex')}`

    // Update user with anonymized data
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `${anonymousId}@deleted.example.com`,
        name: 'Deleted User',
        phone: null,
        password: null
      }
    })

    // Anonymize verification data
    await prisma.userVerification.deleteMany({
      where: { userId }
    })

    // Update reviews to show anonymous author
    await prisma.review.updateMany({
      where: { authorId: userId },
      data: {
        // Keep reviews but anonymize author
        // This preserves platform integrity while protecting user privacy
      }
    })
  }

  /**
   * Log privacy-related actions for audit trail
   */
  private static async logPrivacyAction(
    userId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    await prisma.securityLog.create({
      data: {
        userId,
        eventType: 'privacy_action',
        eventDescription: action,
        metadata,
        riskLevel: 'low'
      }
    })
  }

  /**
   * Check data retention compliance
   */
  static async checkDataRetention(): Promise<void> {
    // Find users scheduled for deletion
    const scheduledDeletions = await prisma.legalCompliance.findMany({
      where: {
        scheduledDeletion: { lte: new Date() },
        requestStatus: 'processing'
      }
    })

    for (const deletion of scheduledDeletions) {
      if (deletion.dataSubjectId) {
        await this.anonymizeUserData(deletion.dataSubjectId)

        await prisma.legalCompliance.update({
          where: { id: deletion.id },
          data: { requestStatus: 'completed' }
        })
      }
    }
  }

  /**
   * Get user's privacy dashboard data
   */
  static async getPrivacyDashboard(userId: string): Promise<{
    privacySettings: any
    dataRequests: any[]
    dataRetention: any
    contactVisibility: any
  }> {
    const [user, dataRequests] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          hidePhoneNumber: true,
          hideEmail: true,
          allowDirectContact: true,
          anonymousBrowsing: true
        }
      }),
      prisma.legalCompliance.findMany({
        where: { dataSubjectId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    return {
      privacySettings: user || {},
      dataRequests,
      dataRetention: {
        automaticDeletion: false,
        retentionPeriod: '7 years',
        lastUpdated: new Date()
      },
      contactVisibility: {
        phoneNumberVisible: !user?.hidePhoneNumber,
        emailVisible: !user?.hideEmail,
        directContactAllowed: user?.allowDirectContact
      }
    }
  }

  /**
   * Notify user that data export is ready (placeholder)
   */
  private static async notifyUserDataReady(userId: string, exportUrl: string): Promise<void> {
    console.log(`User ${userId} data export ready: ${exportUrl}`)
    // In production, send email notification
  }
}