import { PrismaClient } from '@prisma/client'
import { emailService } from '../email'
import { smsService } from '../sms'

interface EngagementAnalytics {
  userId: string
  lastLoginAt: Date | null
  daysSinceLastLogin: number
  listingViews: number
  messagesSent: number
  favoritesAdded: number
  searchesPerformed: number
  engagementScore: number
  segment: 'new' | 'active' | 'at_risk' | 'inactive' | 'churned'
}

export class EngagementService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // Process user engagement campaigns
  async processEngagementCampaigns(): Promise<void> {
    try {
      console.log('🎯 Processing user engagement campaigns...')

      // Analyze user engagement
      const userAnalytics = await this.analyzeUserEngagement()

      // Process different engagement campaigns
      await this.processWelcomeCampaign()
      await this.processReEngagementCampaign(userAnalytics)
      await this.processWinBackCampaign(userAnalytics)
      await this.processSuccessStoryCampaign()

      console.log('✅ Completed engagement campaign processing')
    } catch (error) {
      console.error('❌ Error processing engagement campaigns:', error)
    }
  }

  // Analyze user engagement patterns
  private async analyzeUserEngagement(): Promise<EngagementAnalytics[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const users = await this.prisma.user.findMany({
        where: {
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // At least 1 day old
        },
        include: {
          _count: {
            select: {
              messages: {
                where: { createdAt: { gte: thirtyDaysAgo } }
              },
              favorites: {
                where: { createdAt: { gte: thirtyDaysAgo } }
              }
            }
          }
        }
      })

      const analytics: EngagementAnalytics[] = []

      for (const user of users) {
        // Get recent user interactions
        const interactions = await this.prisma.userEngagement.findMany({
          where: {
            userId: user.id,
            createdAt: { gte: thirtyDaysAgo }
          }
        })

        const daysSinceLastLogin = user.lastActiveAt
          ? Math.floor((Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        const listingViews = interactions.filter(i => i.engagementType === 'listing_view').length
        const searchesPerformed = interactions.filter(i => i.engagementType === 'search').length

        // Calculate engagement score (0-100)
        const engagementScore = this.calculateEngagementScore({
          daysSinceLastLogin,
          listingViews,
          messagesSent: user._count.messages,
          favoritesAdded: user._count.favorites,
          searchesPerformed
        })

        // Determine user segment
        const segment = this.determineUserSegment(user, daysSinceLastLogin, engagementScore)

        analytics.push({
          userId: user.id,
          lastLoginAt: user.lastActiveAt,
          daysSinceLastLogin,
          listingViews,
          messagesSent: user._count.messages,
          favoritesAdded: user._count.favorites,
          searchesPerformed,
          engagementScore,
          segment
        })
      }

      return analytics
    } catch (error) {
      console.error('Error analyzing user engagement:', error)
      return []
    }
  }

  // Calculate user engagement score
  private calculateEngagementScore(metrics: {
    daysSinceLastLogin: number
    listingViews: number
    messagesSent: number
    favoritesAdded: number
    searchesPerformed: number
  }): number {
    let score = 0

    // Login recency (40 points max)
    if (metrics.daysSinceLastLogin <= 1) score += 40
    else if (metrics.daysSinceLastLogin <= 7) score += 30
    else if (metrics.daysSinceLastLogin <= 14) score += 20
    else if (metrics.daysSinceLastLogin <= 30) score += 10

    // Activity levels (60 points max)
    score += Math.min(metrics.listingViews * 2, 20) // 20 points max for views
    score += Math.min(metrics.messagesSent * 5, 20) // 20 points max for messages
    score += Math.min(metrics.favoritesAdded * 3, 10) // 10 points max for favorites
    score += Math.min(metrics.searchesPerformed * 2, 10) // 10 points max for searches

    return Math.min(score, 100)
  }

  // Determine user segment based on behavior
  private determineUserSegment(user: any, daysSinceLastLogin: number, engagementScore: number): EngagementAnalytics['segment'] {
    const userAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))

    if (userAge <= 7) return 'new'
    if (daysSinceLastLogin > 60) return 'churned'
    if (daysSinceLastLogin > 30) return 'inactive'
    if (engagementScore < 30 && daysSinceLastLogin > 7) return 'at_risk'
    return 'active'
  }

  // Process welcome campaign for new users
  private async processWelcomeCampaign(): Promise<void> {
    try {
      // Get users registered in the last 24 hours who haven't received welcome email
      const newUsers = await this.prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() - 2 * 60 * 60 * 1000) // At least 2 hours old
          }
        },
        include: {
          automationPreferences: true
        }
      })

      for (const user of newUsers) {
        // Check if welcome email already sent
        const existingNotification = await this.prisma.notificationLog.findFirst({
          where: {
            userId: user.id,
            type: 'engagement',
            subtype: 'welcome_email'
          }
        })

        if (!existingNotification) {
          await this.sendWelcomeEmail(user)
        }
      }

      console.log(`📧 Processed welcome campaign for ${newUsers.length} new users`)
    } catch (error) {
      console.error('Error processing welcome campaign:', error)
    }
  }

  // Send welcome email to new user
  private async sendWelcomeEmail(user: any): Promise<void> {
    try {
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications) return

      const emailTemplate = emailService.getAlbanianWelcomeEmail(user.name || 'Shfrytëzues')

      const success = await emailService.sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      if (success) {
        await this.logNotification(user.id, 'engagement', 'email', 'welcome_email')

        // Send welcome SMS if phone provided
        if (preferences.smsNotifications && user.phone) {
          const smsTemplate = smsService.getWelcomeSms(user.name || 'Shfrytëzues')
          await smsService.sendSms({
            to: user.phone,
            message: smsTemplate.message,
            messageType: 'marketing'
          })
          await this.logNotification(user.id, 'engagement', 'sms', 'welcome_sms')
        }
      }
    } catch (error) {
      console.error(`Error sending welcome email to user ${user.id}:`, error)
    }
  }

  // Process re-engagement campaign for at-risk users
  private async processReEngagementCampaign(analytics: EngagementAnalytics[]): Promise<void> {
    try {
      const atRiskUsers = analytics.filter(a => a.segment === 'at_risk')

      for (const userAnalytic of atRiskUsers) {
        const user = await this.prisma.user.findUnique({
          where: { id: userAnalytic.userId },
          include: { automationPreferences: true }
        })

        if (user) {
          await this.sendReEngagementEmail(user, userAnalytic.daysSinceLastLogin)
        }
      }

      console.log(`🎯 Processed re-engagement campaign for ${atRiskUsers.length} at-risk users`)
    } catch (error) {
      console.error('Error processing re-engagement campaign:', error)
    }
  }

  // Send re-engagement email
  private async sendReEngagementEmail(user: any, daysSinceLastVisit: number): Promise<void> {
    try {
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications) return

      // Check if re-engagement email sent in last 14 days
      const recentReEngagement = await this.prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'engagement',
          subtype: 're_engagement',
          createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentReEngagement) return

      const emailTemplate = emailService.getReEngagementEmail(
        user.name || 'Shfrytëzues',
        daysSinceLastVisit
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      })

      if (success) {
        await this.logNotification(user.id, 'engagement', 'email', 're_engagement')
      }
    } catch (error) {
      console.error(`Error sending re-engagement email to user ${user.id}:`, error)
    }
  }

  // Process win-back campaign for churned users
  private async processWinBackCampaign(analytics: EngagementAnalytics[]): Promise<void> {
    try {
      const churnedUsers = analytics.filter(a => a.segment === 'churned')

      for (const userAnalytic of churnedUsers) {
        const user = await this.prisma.user.findUnique({
          where: { id: userAnalytic.userId },
          include: { automationPreferences: true }
        })

        if (user) {
          await this.sendWinBackEmail(user, userAnalytic.daysSinceLastLogin)
        }
      }

      console.log(`🔄 Processed win-back campaign for ${churnedUsers.length} churned users`)
    } catch (error) {
      console.error('Error processing win-back campaign:', error)
    }
  }

  // Send win-back email with special offer
  private async sendWinBackEmail(user: any, daysSinceLastVisit: number): Promise<void> {
    try {
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications || !preferences?.promotionalEmails) return

      // Check if win-back email sent in last 30 days
      const recentWinBack = await this.prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'engagement',
          subtype: 'win_back',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentWinBack) return

      // Create special win-back email content
      const winBackContent = this.createWinBackContent(user.name || 'Shfrytëzues', daysSinceLastVisit)

      const success = await emailService.sendEmail({
        to: user.email,
        subject: winBackContent.subject,
        html: winBackContent.html,
        text: winBackContent.text
      })

      if (success) {
        await this.logNotification(user.id, 'engagement', 'email', 'win_back')
      }
    } catch (error) {
      console.error(`Error sending win-back email to user ${user.id}:`, error)
    }
  }

  // Create win-back email content
  private createWinBackContent(userName: string, daysSinceLastVisit: number): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `${userName}, na mungoni shumë! 🎁 Ofertë speciale për ju`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎁 Na Mungoni Shumë!</h1>
            <p style="margin: 5px 0 0 0;">Ofertë speciale vetëm për ju</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>E kemi vënë re që nuk keni vizituar AutoMarket prej ${daysSinceLastVisit} ditësh. Na mungoni shumë!</p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">🎁 Ofertë Speciale Vetëm Për Ju:</h3>
              <ul style="color: #b45309; line-height: 1.8;">
                <li>✨ Listim i shpalljes tuaj FALAS për 60 ditë</li>
                <li>📱 Promovim në rrjetet sociale pa pagesë</li>
                <li>🔝 Pozicionim i privilegjuar në kërkim</li>
                <li>💰 Komision i reduktuar për shitje</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/sell?promo=welcome_back"
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Shfrytëzoni Ofertën Tani
              </a>
            </div>

            <p>Kjo ofertë është e vlefshme vetëm për 7 ditët e ardhshme. Mos e humbisni!</p>

            <p>Jemi të emocionuar për t'ju parë përsëri,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `${userName}, na mungoni! Ofertë speciale: Listim FALAS + promovim. Shfrytëzoni: ${process.env.NEXTAUTH_URL}/sell?promo=welcome_back`
    }
  }

  // Process success story campaign
  private async processSuccessStoryCampaign(): Promise<void> {
    try {
      // Get recent successful sales for success stories
      const recentSales = await this.prisma.listing.findMany({
        where: {
          status: 'sold',
          soldDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          user: {
            include: {
              automationPreferences: true
            }
          }
        },
        take: 10
      })

      // Send congratulations to sellers
      for (const listing of recentSales) {
        await this.sendSuccessStoryEmail(listing)
      }

      console.log(`🎉 Processed success story campaign for ${recentSales.length} recent sales`)
    } catch (error) {
      console.error('Error processing success story campaign:', error)
    }
  }

  // Send success story email to seller
  private async sendSuccessStoryEmail(listing: any): Promise<void> {
    try {
      const user = listing.user
      const preferences = user.automationPreferences

      if (!preferences?.emailNotifications) return

      // Check if success email already sent for this listing
      const existingNotification = await this.prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          type: 'engagement',
          subtype: 'success_story',
          metadata: { path: ['listingId'], equals: listing.id }
        }
      })

      if (existingNotification) return

      const successContent = this.createSuccessStoryContent(
        user.name || 'Shfrytëzues',
        listing.title,
        listing.soldPrice || listing.price
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: successContent.subject,
        html: successContent.html,
        text: successContent.text
      })

      if (success) {
        await this.logNotification(user.id, 'engagement', 'email', 'success_story')
      }
    } catch (error) {
      console.error(`Error sending success story email:`, error)
    }
  }

  // Create success story email content
  private createSuccessStoryContent(userName: string, carTitle: string, salePrice: number): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `🎉 Urime ${userName}! Makina u shit me sukses`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎉 Urime!</h1>
            <p style="margin: 5px 0 0 0;">Makina juaj u shit me sukses</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Urime! Makina juaj "<strong>${carTitle}</strong>" u shit me sukses për <strong>€${(salePrice / 100).toLocaleString()}</strong>!</p>

            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #059669;">
              <h3 style="margin-top: 0; color: #065f46;">🚀 A keni makina të tjera për shitje?</h3>
              <p style="color: #047857;">AutoMarket ju ndihmon të shitni makina shpejt dhe me çmime të mira. Listoni makinën tuaj tjetër tani!</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/sell"
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Listo makinë tjetër
              </a>
            </div>

            <p>Faleminderit që zgjodhët AutoMarket!</p>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Urime ${userName}! ${carTitle} u shit për €${(salePrice / 100).toLocaleString()}. Listo makina të tjera: ${process.env.NEXTAUTH_URL}/sell`
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

  // Track user engagement event
  async trackEngagement(userId: string, engagementType: string, metadata?: any): Promise<void> {
    try {
      await this.prisma.userEngagement.create({
        data: {
          userId,
          engagementType,
          metadata,
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  // Get engagement analytics for dashboard
  async getEngagementAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const analytics = await this.prisma.userEngagement.groupBy({
        by: ['engagementType'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: true
      })

      const campaignStats = await this.prisma.notificationLog.groupBy({
        by: ['type', 'subtype'],
        where: {
          createdAt: { gte: startDate },
          type: 'engagement'
        },
        _count: true
      })

      return {
        engagementByType: analytics,
        campaignPerformance: campaignStats,
        timeframe
      }
    } catch (error) {
      console.error('Error getting engagement analytics:', error)
      return null
    }
  }
}

export const engagementService = new EngagementService()