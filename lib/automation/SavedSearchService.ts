import { PrismaClient } from '@prisma/client'
import { emailService } from '../email'
import { smsService } from '../sms'

interface SearchCriteria {
  make?: string
  model?: string
  yearMin?: number
  yearMax?: number
  priceMin?: number
  priceMax?: number
  city?: string
  region?: string
  fuelType?: string
  transmission?: string
  bodyType?: string
  mileageMax?: number
}

interface SavedSearchMatch {
  id: string
  title: string
  price: number
  city: string
  year: number
  mileage: number
  fuelType: string
  make: string
  model: string
  createdAt: Date
}

export class SavedSearchService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // Check all saved searches for new matches
  async processSavedSearches(): Promise<void> {
    try {
      console.log('🔍 Processing saved searches...')

      // Get all active saved searches
      const savedSearches = await this.prisma.savedSearch.findMany({
        where: {
          isActive: true
        },
        include: {
          user: {
            include: {
              automationPreferences: true
            }
          }
        }
      })

      for (const savedSearch of savedSearches) {
        await this.processIndividualSearch(savedSearch)
      }

      console.log(`✅ Processed ${savedSearches.length} saved searches`)
    } catch (error) {
      console.error('❌ Error processing saved searches:', error)
    }
  }

  // Process individual saved search
  private async processIndividualSearch(savedSearch: any): Promise<void> {
    try {
      const criteria: SearchCriteria = savedSearch.searchCriteria as SearchCriteria
      const lastRun = savedSearch.lastRunAt

      // Find new listings since last run
      const newMatches = await this.findNewMatches(criteria, lastRun)

      if (newMatches.length > 0) {
        console.log(`📧 Found ${newMatches.length} new matches for search "${savedSearch.name}"`)

        // Send notifications based on user preferences
        await this.sendNotifications(savedSearch, newMatches)

        // Update search statistics
        await this.updateSearchStats(savedSearch.id, newMatches.length)
      }

      // Update last run time
      await this.prisma.savedSearch.update({
        where: { id: savedSearch.id },
        data: { lastRunAt: new Date() }
      })

    } catch (error) {
      console.error(`❌ Error processing search ${savedSearch.id}:`, error)
    }
  }

  // Find new listings matching search criteria
  private async findNewMatches(criteria: SearchCriteria, lastRun: Date | null): Promise<SavedSearchMatch[]> {
    const where: any = {
      status: 'active',
      createdAt: lastRun ? { gt: lastRun } : undefined
    }

    // Apply search criteria
    if (criteria.make) where.make = { contains: criteria.make, mode: 'insensitive' }
    if (criteria.model) where.model = { contains: criteria.model, mode: 'insensitive' }
    if (criteria.yearMin || criteria.yearMax) {
      where.year = {}
      if (criteria.yearMin) where.year.gte = criteria.yearMin
      if (criteria.yearMax) where.year.lte = criteria.yearMax
    }
    if (criteria.priceMin || criteria.priceMax) {
      where.price = {}
      if (criteria.priceMin) where.price.gte = criteria.priceMin * 100 // Convert to cents
      if (criteria.priceMax) where.price.lte = criteria.priceMax * 100
    }
    if (criteria.city) where.city = { contains: criteria.city, mode: 'insensitive' }
    if (criteria.region) where.region = { contains: criteria.region, mode: 'insensitive' }
    if (criteria.fuelType) where.fuelType = criteria.fuelType
    if (criteria.transmission) where.transmission = criteria.transmission
    if (criteria.bodyType) where.bodyType = criteria.bodyType
    if (criteria.mileageMax) where.mileage = { lte: criteria.mileageMax }

    const listings = await this.prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to prevent spam
      select: {
        id: true,
        title: true,
        price: true,
        city: true,
        year: true,
        mileage: true,
        fuelType: true,
        make: true,
        model: true,
        createdAt: true
      }
    })

    return listings
  }

  // Send notifications to user
  private async sendNotifications(savedSearch: any, matches: SavedSearchMatch[]): Promise<void> {
    const user = savedSearch.user
    const preferences = user.automationPreferences

    // Check if notifications are allowed
    if (!preferences || this.isInQuietHours(preferences)) {
      console.log(`⏰ Skipping notifications for user ${user.id} - quiet hours`)
      return
    }

    // Check frequency limits
    if (savedSearch.alertFrequency === 'weekly' && this.isWeeklyFrequency(savedSearch.lastMatchAt)) {
      console.log(`📅 Skipping notifications for user ${user.id} - weekly frequency not due`)
      return
    }

    try {
      // Send email notification
      if (preferences.emailNotifications && user.email) {
        const emailTemplate = emailService.getSavedSearchAlertEmail(
          user.name || 'Shfrytëzues',
          savedSearch.name,
          matches
        )

        await emailService.sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        // Log notification
        await this.logNotification(user.id, 'saved_search', 'email', 'new_matches')
      }

      // Send SMS notification (for instant alerts only)
      if (preferences.smsNotifications && user.phone && savedSearch.alertFrequency === 'instant') {
        const smsTemplate = smsService.getSavedSearchSms(
          user.name || 'Shfrytëzues',
          matches.length,
          savedSearch.name
        )

        await smsService.sendSms({
          to: user.phone,
          message: smsTemplate.message,
          messageType: 'alert'
        })

        // Log notification
        await this.logNotification(user.id, 'saved_search', 'sms', 'new_matches')
      }

    } catch (error) {
      console.error(`❌ Error sending notifications to user ${user.id}:`, error)
    }
  }

  // Update search statistics
  private async updateSearchStats(searchId: string, matchCount: number): Promise<void> {
    await this.prisma.savedSearch.update({
      where: { id: searchId },
      data: {
        lastMatchAt: new Date(),
        totalMatches: { increment: matchCount }
      }
    })
  }

  // Check if current time is in user's quiet hours
  private isInQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false
    }

    const now = new Date()
    const currentHour = now.getHours()
    const start = preferences.quietHoursStart
    const end = preferences.quietHoursEnd

    if (start < end) {
      return currentHour >= start && currentHour < end
    } else {
      return currentHour >= start || currentHour < end
    }
  }

  // Check if weekly frequency allows notification
  private isWeeklyFrequency(lastMatchAt: Date | null): boolean {
    if (!lastMatchAt) return false

    const daysSinceLastMatch = (Date.now() - lastMatchAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceLastMatch < 7
  }

  // Log notification delivery
  private async logNotification(userId: string, type: string, channel: string, subtype: string): Promise<void> {
    try {
      await this.prisma.notificationLog.create({
        data: {
          userId,
          type,
          subtype,
          channel,
          recipientInfo: {},
          status: 'sent',
          sentAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }

  // Create new saved search
  async createSavedSearch(userId: string, searchData: {
    name: string
    criteria: SearchCriteria
    alertFrequency?: string
    emailEnabled?: boolean
    smsEnabled?: boolean
  }): Promise<any> {
    return await this.prisma.savedSearch.create({
      data: {
        userId,
        name: searchData.name,
        searchCriteria: searchData.criteria,
        alertFrequency: searchData.alertFrequency || 'daily',
        emailEnabled: searchData.emailEnabled ?? true,
        smsEnabled: searchData.smsEnabled ?? false,
        isActive: true
      }
    })
  }

  // Update saved search
  async updateSavedSearch(searchId: string, updates: Partial<{
    name: string
    criteria: SearchCriteria
    alertFrequency: string
    emailEnabled: boolean
    smsEnabled: boolean
    isActive: boolean
  }>): Promise<any> {
    const updateData: any = {}

    if (updates.name) updateData.name = updates.name
    if (updates.criteria) updateData.searchCriteria = updates.criteria
    if (updates.alertFrequency) updateData.alertFrequency = updates.alertFrequency
    if (updates.emailEnabled !== undefined) updateData.emailEnabled = updates.emailEnabled
    if (updates.smsEnabled !== undefined) updateData.smsEnabled = updates.smsEnabled
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive

    return await this.prisma.savedSearch.update({
      where: { id: searchId },
      data: updateData
    })
  }

  // Get user's saved searches
  async getUserSavedSearches(userId: string): Promise<any[]> {
    return await this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Delete saved search
  async deleteSavedSearch(searchId: string): Promise<void> {
    await this.prisma.savedSearch.delete({
      where: { id: searchId }
    })
  }

  // Process daily digest for users with weekly frequency
  async processDailyDigest(): Promise<void> {
    try {
      console.log('📧 Processing daily digest for saved searches...')

      const users = await this.prisma.user.findMany({
        where: {
          automationPreferences: {
            weeklyDigest: true,
            emailNotifications: true
          }
        },
        include: {
          automationPreferences: true,
          savedSearches: {
            where: { isActive: true }
          }
        }
      })

      for (const user of users) {
        if (this.shouldSendWeeklyDigest(user.automationPreferences)) {
          await this.sendWeeklyDigest(user)
        }
      }

      console.log(`✅ Processed daily digest for ${users.length} users`)
    } catch (error) {
      console.error('❌ Error processing daily digest:', error)
    }
  }

  // Check if user should receive weekly digest today
  private shouldSendWeeklyDigest(preferences: any): boolean {
    if (!preferences || !preferences.weeklyDigest) return false

    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const preferredDay = preferences.weeklyDigestDay || 1 // Default to Monday

    return today === preferredDay
  }

  // Send weekly digest to user
  private async sendWeeklyDigest(user: any): Promise<void> {
    try {
      // Collect matches from all user's saved searches from the past week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      let totalMatches = 0

      for (const savedSearch of user.savedSearches) {
        const criteria: SearchCriteria = savedSearch.searchCriteria as SearchCriteria
        const matches = await this.findNewMatches(criteria, weekAgo)
        totalMatches += matches.length
      }

      if (totalMatches > 0) {
        // Create weekly stats object
        const stats = {
          totalMatches,
          searchCount: user.savedSearches.length,
          week: `${new Date().toLocaleDateString('sq-AL')}`
        }

        // Use weekly digest template
        const emailTemplate = emailService.getWeeklyDigestEmail(
          user.name || 'Shfrytëzues',
          { newListings: totalMatches, priceDrops: 0 }
        )

        await emailService.sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        // Log notification
        await this.logNotification(user.id, 'saved_search', 'email', 'weekly_digest')
      }

    } catch (error) {
      console.error(`❌ Error sending weekly digest to user ${user.id}:`, error)
    }
  }

  // Cleanup old searches (inactive for > 90 days)
  async cleanupOldSearches(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

      const result = await this.prisma.savedSearch.deleteMany({
        where: {
          isActive: false,
          updatedAt: { lt: ninetyDaysAgo }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} old saved searches`)
    } catch (error) {
      console.error('❌ Error cleaning up old searches:', error)
    }
  }
}

export const savedSearchService = new SavedSearchService()