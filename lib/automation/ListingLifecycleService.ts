import { PrismaClient } from '@prisma/client'
import { emailService } from '../email'
import { smsService } from '../sms'

interface ListingPerformanceMetrics {
  listingId: string
  viewCount: number
  favoriteCount: number
  messageCount: number
  daysSinceListed: number
  pricePerformance: 'overpriced' | 'market_rate' | 'underpriced'
  photoQuality: 'poor' | 'good' | 'excellent'
  descriptionQuality: number // 0-100
  conversionRate: number
  suggestions: string[]
}

export class ListingLifecycleService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // Process all listing lifecycle events
  async processListingLifecycle(): Promise<void> {
    try {
      console.log('🔄 Processing listing lifecycle automation...')

      await this.processExpiryReminders()
      await this.processPerformanceOptimization()
      await this.processRelistingSuggestions()
      await this.processSeasonalOptimization()
      await this.cleanupExpiredListings()

      console.log('✅ Completed listing lifecycle processing')
    } catch (error) {
      console.error('❌ Error processing listing lifecycle:', error)
    }
  }

  // Process expiry reminders
  private async processExpiryReminders(): Promise<void> {
    try {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      const oneDayFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)

      // 7-day reminders
      await this.sendExpiryReminders(sevenDaysFromNow, 7)
      // 3-day reminders
      await this.sendExpiryReminders(threeDaysFromNow, 3)
      // 1-day reminders
      await this.sendExpiryReminders(oneDayFromNow, 1)

      console.log('📅 Processed expiry reminders')
    } catch (error) {
      console.error('Error processing expiry reminders:', error)
    }
  }

  // Send expiry reminders for listings
  private async sendExpiryReminders(expiryDate: Date, daysLeft: number): Promise<void> {
    try {
      const expiringListings = await this.prisma.listing.findMany({
        where: {
          status: 'active',
          expiresAt: {
            gte: new Date(expiryDate.getTime() - 12 * 60 * 60 * 1000), // 12 hours before
            lte: new Date(expiryDate.getTime() + 12 * 60 * 60 * 1000)  // 12 hours after
          }
        },
        include: {
          user: {
            include: {
              automationPreferences: true
            }
          }
        }
      })

      for (const listing of expiringListings) {
        // Check if reminder already sent for this timeframe
        const existingReminder = await this.prisma.notificationLog.findFirst({
          where: {
            userId: listing.userId,
            type: 'lifecycle',
            subtype: `expiry_${daysLeft}day`,
            metadata: { path: ['listingId'], equals: listing.id },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })

        if (!existingReminder) {
          await this.sendExpiryReminderEmail(listing, daysLeft)
        }
      }

      console.log(`📧 Sent ${daysLeft}-day expiry reminders to ${expiringListings.length} users`)
    } catch (error) {
      console.error(`Error sending ${daysLeft}-day expiry reminders:`, error)
    }
  }

  // Send expiry reminder email
  private async sendExpiryReminderEmail(listing: any, daysLeft: number): Promise<void> {
    try {
      const user = listing.user
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications) return

      const emailTemplate = emailService.getListingExpiryAlbanianEmail(
        user.name || 'Shfrytëzues',
        listing,
        daysLeft
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      if (success) {
        await this.logNotification(listing.userId, 'lifecycle', 'email', `expiry_${daysLeft}day`)

        // Send SMS for urgent reminders (1 day)
        if (daysLeft === 1 && preferences.smsNotifications && user.phone) {
          const smsTemplate = smsService.getListingExpirySms(listing.title, daysLeft)
          await smsService.sendSms({
            to: user.phone,
            message: smsTemplate.message,
            messageType: 'alert'
          })
          await this.logNotification(listing.userId, 'lifecycle', 'sms', 'expiry_urgent')
        }
      }
    } catch (error) {
      console.error(`Error sending expiry reminder for listing ${listing.id}:`, error)
    }
  }

  // Process performance optimization suggestions
  private async processPerformanceOptimization(): Promise<void> {
    try {
      // Get listings that are 7+ days old and underperforming
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const underperformingListings = await this.prisma.listing.findMany({
        where: {
          status: 'active',
          createdAt: { lte: sevenDaysAgo }
        },
        include: {
          user: {
            include: {
              automationPreferences: true
            }
          },
          messages: true,
          favorites: true
        }
      })

      for (const listing of underperformingListings) {
        const metrics = await this.analyzeListingPerformance(listing)

        if (metrics.suggestions.length > 0) {
          await this.sendPerformanceOptimizationEmail(listing, metrics)
        }
      }

      console.log(`📈 Processed performance optimization for ${underperformingListings.length} listings`)
    } catch (error) {
      console.error('Error processing performance optimization:', error)
    }
  }

  // Analyze listing performance and generate suggestions
  private async analyzeListingPerformance(listing: any): Promise<ListingPerformanceMetrics> {
    try {
      // Get interaction data
      const interactions = await this.prisma.userEngagement.findMany({
        where: {
          engagementType: 'listing_view',
          metadata: { path: ['listingId'], equals: listing.id }
        }
      })

      const daysSinceListed = Math.floor((Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      const viewCount = interactions.length
      const favoriteCount = listing.favorites.length
      const messageCount = listing.messages.length

      // Calculate metrics
      const viewsPerDay = daysSinceListed > 0 ? viewCount / daysSinceListed : 0
      const conversionRate = viewCount > 0 ? (messageCount / viewCount) * 100 : 0

      // Generate suggestions based on performance
      const suggestions: string[] = []

      // Low views
      if (viewsPerDay < 2) {
        suggestions.push('Përditësoni fotografitë - shtoni foto më cilësore')
        suggestions.push('Përmirësoni titullin me fjalë kyçe të kërkuara')
      }

      // Low engagement
      if (conversionRate < 5 && viewCount > 20) {
        suggestions.push('Rivlerësoni çmimin - mund të jetë shumë i lartë')
        suggestions.push('Shtoni më shumë detaje në përshkrim')
      }

      // No favorites after many views
      if (favoriteCount === 0 && viewCount > 30) {
        suggestions.push('Kontrolloni nëse çmimi është konkurrues')
        suggestions.push('Shtoni informacion për historikun e makinës')
      }

      // Price analysis
      let pricePerformance: 'overpriced' | 'market_rate' | 'underpriced' = 'market_rate'
      if (conversionRate < 3 && viewCount > 50) {
        pricePerformance = 'overpriced'
        suggestions.push('Konsideroni uljen e çmimit për të tërhequr më shumë blerës')
      }

      return {
        listingId: listing.id,
        viewCount,
        favoriteCount,
        messageCount,
        daysSinceListed,
        pricePerformance,
        photoQuality: this.assessPhotoQuality(listing),
        descriptionQuality: this.assessDescriptionQuality(listing),
        conversionRate,
        suggestions
      }
    } catch (error) {
      console.error('Error analyzing listing performance:', error)
      return {
        listingId: listing.id,
        viewCount: 0,
        favoriteCount: 0,
        messageCount: 0,
        daysSinceListed: 0,
        pricePerformance: 'market_rate',
        photoQuality: 'good',
        descriptionQuality: 50,
        conversionRate: 0,
        suggestions: []
      }
    }
  }

  // Assess photo quality
  private assessPhotoQuality(listing: any): 'poor' | 'good' | 'excellent' {
    const images = listing.images ? JSON.parse(listing.images) : []

    if (images.length === 0) return 'poor'
    if (images.length < 3) return 'poor'
    if (images.length >= 5) return 'excellent'
    return 'good'
  }

  // Assess description quality
  private assessDescriptionQuality(listing: any): number {
    const description = listing.description || ''
    let score = 0

    // Length check
    if (description.length > 100) score += 20
    if (description.length > 200) score += 20

    // Keywords check
    const keywords = ['cilësi', 'mirëmbajtur', 'shërbim', 'dëmtim', 'aksidenti', 'pronari']
    keywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) score += 10
    })

    return Math.min(score, 100)
  }

  // Send performance optimization email
  private async sendPerformanceOptimizationEmail(listing: any, metrics: ListingPerformanceMetrics): Promise<void> {
    try {
      const user = listing.user
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications) return

      // Check if optimization email sent in last 14 days
      const recentOptimization = await this.prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'lifecycle',
          subtype: 'performance_optimization',
          metadata: { path: ['listingId'], equals: listing.id },
          createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentOptimization) return

      const optimizationContent = this.createOptimizationEmailContent(
        user.name || 'Shfrytëzues',
        listing,
        metrics
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: optimizationContent.subject,
        html: optimizationContent.html,
        text: optimizationContent.text
      })

      if (success) {
        await this.logNotification(user.id, 'lifecycle', 'email', 'performance_optimization')
      }
    } catch (error) {
      console.error(`Error sending optimization email for listing ${listing.id}:`, error)
    }
  }

  // Create optimization email content
  private createOptimizationEmailContent(userName: string, listing: any, metrics: ListingPerformanceMetrics): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `📈 Përmirësoni shpalljen: ${listing.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📈 Përmirësoni Shpalljen</h1>
            <p style="margin: 5px 0 0 0;">Sugjerime për rritjen e performancës</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Kemi analizuar performancën e shpalljes suaj "<strong>${listing.title}</strong>" dhe kemi disa sugjerime për ta përmirësuar:</p>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">📊 Statistikat e shpalljes:</h3>
              <ul style="color: #1e3a8a; line-height: 1.8;">
                <li><strong>${metrics.viewCount}</strong> shikime në ${metrics.daysSinceListed} ditë</li>
                <li><strong>${metrics.favoriteCount}</strong> shtim në të preferuarat</li>
                <li><strong>${metrics.messageCount}</strong> mesazhe nga të interesuarit</li>
                <li>Shkalla e konvertimit: <strong>${metrics.conversionRate.toFixed(1)}%</strong></li>
              </ul>
            </div>

            ${metrics.suggestions.length > 0 ? `
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #92400e;">💡 Sugjerimet tona:</h3>
                <ul style="color: #b45309; line-height: 1.8;">
                  ${metrics.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Përditëso Shpalljen
              </a>
            </div>

            <p>Shpalljet e optimizuara marrin më shumë shikime dhe shiten më shpejt!</p>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Përditësoni shpalljen "${listing.title}": ${metrics.viewCount} shikime, ${metrics.favoriteCount} të preferuara. Sugjerime: ${metrics.suggestions.join(', ')}. Edito: ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }

  // Process relisting suggestions
  private async processRelistingSuggestions(): Promise<void> {
    try {
      // Get listings that expired in the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const expiredListings = await this.prisma.listing.findMany({
        where: {
          status: 'expired',
          expiresAt: { gte: thirtyDaysAgo }
        },
        include: {
          user: {
            include: {
              automationPreferences: true
            }
          }
        }
      })

      for (const listing of expiredListings) {
        await this.sendRelistingSuggestion(listing)
      }

      console.log(`🔄 Processed relisting suggestions for ${expiredListings.length} expired listings`)
    } catch (error) {
      console.error('Error processing relisting suggestions:', error)
    }
  }

  // Send relisting suggestion email
  private async sendRelistingSuggestion(listing: any): Promise<void> {
    try {
      const user = listing.user
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications) return

      // Check if relisting suggestion already sent
      const existingSuggestion = await this.prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'lifecycle',
          subtype: 'relisting_suggestion',
          metadata: { path: ['listingId'], equals: listing.id }
        }
      })

      if (existingSuggestion) return

      const relistingContent = this.createRelistingEmailContent(
        user.name || 'Shfrytëzues',
        listing
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: relistingContent.subject,
        html: relistingContent.html,
        text: relistingContent.text
      })

      if (success) {
        await this.logNotification(user.id, 'lifecycle', 'email', 'relisting_suggestion')
      }
    } catch (error) {
      console.error(`Error sending relisting suggestion for listing ${listing.id}:`, error)
    }
  }

  // Create relisting email content
  private createRelistingEmailContent(userName: string, listing: any): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `🔄 Rilistoni makinën: ${listing.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🔄 Kohë për Rilistim!</h1>
            <p style="margin: 5px 0 0 0;">Makina juaj ende mund të shitet</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Shpallja juaj për "<strong>${listing.title}</strong>" ka skaduar, por kjo nuk do të thotë që makina nuk mund të shitet!</p>

            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #5b21b6;">🚀 Përfitimet e rilistimit:</h3>
              <ul style="color: #6b21a8; line-height: 1.8;">
                <li>✨ Pozicioni më i mirë në rezultatet e kërkimit</li>
                <li>📈 Makina do të shihet si "e re" për blerësit</li>
                <li>💡 Mundësi për të përmirësuar çmimin dhe përshkrimin</li>
                <li>📱 Promovim automatik në rrjetet sociale</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Rilistoni Tani
              </a>
            </div>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #059669;">
              <p style="margin: 0; color: #047857;"><strong>💡 Këshillë:</strong> Rilistimi gjatë fundjavës zakonisht sjell më shumë shikime!</p>
            </div>

            <p>Jemi këtu për t'ju ndihmuar ta shitni makinën sa më shpejt!</p>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Rilistoni "${listing.title}" për pozicionim më të mirë dhe më shumë shikime. Filloni: ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }

  // Process seasonal optimization
  private async processSeasonalOptimization(): Promise<void> {
    try {
      const currentMonth = new Date().getMonth() + 1 // 1-12
      const seasonalSuggestions = this.getSeasonalSuggestions(currentMonth)

      if (seasonalSuggestions.length === 0) return

      // Get active listings that could benefit from seasonal optimization
      const activeListings = await this.prisma.listing.findMany({
        where: { status: 'active' },
        include: {
          user: {
            include: {
              automationPreferences: true
            }
          }
        },
        take: 100 // Limit to avoid spam
      })

      for (const listing of activeListings) {
        await this.sendSeasonalOptimizationEmail(listing, seasonalSuggestions)
      }

      console.log(`🌤️ Processed seasonal optimization for ${activeListings.length} listings`)
    } catch (error) {
      console.error('Error processing seasonal optimization:', error)
    }
  }

  // Get seasonal suggestions based on month
  private getSeasonalSuggestions(month: number): string[] {
    const suggestions: string[] = []

    // Winter months (December, January, February)
    if ([12, 1, 2].includes(month)) {
      suggestions.push('Përmendni gomurat dimërore në përshkrim')
      suggestions.push('Theksoni sistemin e ngrohjes dhe klimës')
      suggestions.push('Shtoni foto të brendshme të makinës')
    }

    // Spring months (March, April, May)
    if ([3, 4, 5].includes(month)) {
      suggestions.push('Kohë ideale për shitje - theksoni këtë në përshkrim')
      suggestions.push('Përmendni mirëmbajtjen e pranverës së kryer')
      suggestions.push('Shtoni foto të jashtme me dritë natyrore')
    }

    // Summer months (June, July, August)
    if ([6, 7, 8].includes(month)) {
      suggestions.push('Theksoni sistemin e kondicionimit')
      suggestions.push('Përmendni përshtatjen për udhëtime verore')
      suggestions.push('Shtoni foto me çati të hapur (nëse aplikueshme)')
    }

    // Autumn months (September, October, November)
    if ([9, 10, 11].includes(month)) {
      suggestions.push('Përmendni kontrollin e kryer para dimrit')
      suggestions.push('Theksoni gominat dhe sistemin e frenave')
      suggestions.push('Shtoni detaje për historikun e mirëmbajtjes')
    }

    return suggestions
  }

  // Send seasonal optimization email
  private async sendSeasonalOptimizationEmail(listing: any, suggestions: string[]): Promise<void> {
    try {
      const user = listing.user
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications || suggestions.length === 0) return

      // Check if seasonal email sent in last 30 days
      const recentSeasonal = await this.prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'lifecycle',
          subtype: 'seasonal_optimization',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentSeasonal) return

      const seasonalContent = this.createSeasonalEmailContent(
        user.name || 'Shfrytëzues',
        suggestions
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: seasonalContent.subject,
        html: seasonalContent.html,
        text: seasonalContent.text
      })

      if (success) {
        await this.logNotification(user.id, 'lifecycle', 'email', 'seasonal_optimization')
      }
    } catch (error) {
      console.error(`Error sending seasonal optimization email:`, error)
    }
  }

  // Create seasonal email content
  private createSeasonalEmailContent(userName: string, suggestions: string[]): {
    subject: string
    html: string
    text: string
  } {
    const season = this.getCurrentSeason()

    return {
      subject: `🌤️ Optimizimi sezonal - ${season}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🌤️ Optimizimi Sezonal</h1>
            <p style="margin: 5px 0 0 0;">Përditësoni shpalljen për ${season}</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Me fillimin e ${season}, këtu janë disa sugjerime për të optimizuar shpalljen tuaj:</p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">📝 Sugjerimet për ${season}:</h3>
              <ul style="color: #b45309; line-height: 1.8;">
                ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Përditëso Shpalljen
              </a>
            </div>

            <p>Shpalljet e optimizuara sezonalisht marrin më shumë vëmendje nga blerësit!</p>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Optimizoni shpalljen për ${season}: ${suggestions.join(', ')}. Edito: ${process.env.NEXTAUTH_URL}/dashboard`
    }
  }

  // Get current season in Albanian
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1

    if ([12, 1, 2].includes(month)) return 'dimrin'
    if ([3, 4, 5].includes(month)) return 'pranverën'
    if ([6, 7, 8].includes(month)) return 'verën'
    return 'vjeshtën'
  }

  // Cleanup expired listings
  private async cleanupExpiredListings(): Promise<void> {
    try {
      const now = new Date()

      const result = await this.prisma.listing.updateMany({
        where: {
          status: 'active',
          expiresAt: { lt: now }
        },
        data: { status: 'expired' }
      })

      console.log(`🧹 Marked ${result.count} listings as expired`)
    } catch (error) {
      console.error('Error cleaning up expired listings:', error)
    }
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

  // Get lifecycle analytics
  async getLifecycleAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const analytics = await this.prisma.notificationLog.groupBy({
        by: ['subtype'],
        where: {
          type: 'lifecycle',
          createdAt: { gte: startDate }
        },
        _count: true
      })

      const listingStats = await this.prisma.listing.groupBy({
        by: ['status'],
        _count: true
      })

      return {
        notificationsByType: analytics,
        listingsByStatus: listingStats,
        timeframe
      }
    } catch (error) {
      console.error('Error getting lifecycle analytics:', error)
      return null
    }
  }
}

export const listingLifecycleService = new ListingLifecycleService()