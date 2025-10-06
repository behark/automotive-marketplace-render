import { PrismaClient } from '@prisma/client'
import { emailService } from '../email'
import { smsService } from '../sms'

interface PriceDropAlert {
  id: string
  userId: string
  listingId: string
  oldPrice: number
  newPrice: number
  dropAmount: number
  dropPercentage: number
  listing: {
    id: string
    title: string
    make: string
    model: string
    year: number
    mileage: number
    city: string
    price: number
  }
  user: {
    id: string
    name: string | null
    email: string
    phone: string | null
    automationPreferences?: any
  }
}

export class PriceDropService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // Main method to check all price drops
  async checkPriceDrops(): Promise<void> {
    try {
      console.log('💰 Checking for price drops...')

      // Get all active price drop watches
      const priceWatches = await this.prisma.priceDropWatch.findMany({
        where: { isActive: true },
        include: {
          user: {
            include: {
              automationPreferences: true
            }
          },
          listing: true
        }
      })

      console.log(`📊 Found ${priceWatches.length} active price watches`)

      let alertsSent = 0

      for (const watch of priceWatches) {
        const hasDropped = await this.checkIndividualPriceDrop(watch)
        if (hasDropped) {
          alertsSent++
        }
      }

      console.log(`✅ Sent ${alertsSent} price drop alerts`)
    } catch (error) {
      console.error('❌ Error checking price drops:', error)
    }
  }

  // Check individual price drop watch
  private async checkIndividualPriceDrop(watch: any): Promise<boolean> {
    try {
      const listing = watch.listing
      const currentPrice = listing.price
      const watchedPrice = watch.currentPrice

      // Check if price has dropped
      if (currentPrice >= watchedPrice) {
        // Price hasn't dropped, update current price if it increased
        if (currentPrice > watchedPrice) {
          await this.updateWatchPrice(watch.id, currentPrice)
        }
        return false
      }

      const dropAmount = watchedPrice - currentPrice
      const dropPercentage = (dropAmount / watchedPrice) * 100

      // Check if drop meets user's criteria
      const meetsMinimumDrop = dropAmount >= watch.minimumDrop
      const meetsPercentageDrop = dropPercentage >= watch.percentageDrop

      if (!meetsMinimumDrop && !meetsPercentageDrop) {
        // Update current price but don't send alert
        await this.updateWatchPrice(watch.id, currentPrice)
        return false
      }

      console.log(`📉 Price drop detected: ${listing.title} dropped by €${(dropAmount / 100).toFixed(2)} (${dropPercentage.toFixed(1)}%)`)

      // Send alerts
      await this.sendPriceDropAlerts(watch, dropAmount, dropPercentage)

      // Update watch with new price and increment alert count
      await this.updateWatchAfterAlert(watch.id, currentPrice)

      return true
    } catch (error) {
      console.error(`❌ Error checking price drop for watch ${watch.id}:`, error)
      return false
    }
  }

  // Send price drop alerts to user
  private async sendPriceDropAlerts(watch: any, dropAmount: number, dropPercentage: number): Promise<void> {
    const user = watch.user
    const listing = watch.listing
    const preferences = user.automationPreferences

    // Check if notifications are allowed
    if (!preferences || this.isInQuietHours(preferences)) {
      console.log(`⏰ Skipping price drop alert for user ${user.id} - quiet hours`)
      return
    }

    try {
      // Send email notification
      if (preferences.emailNotifications && preferences.priceAlerts && user.email) {
        const emailTemplate = emailService.getPriceDropAlertEmail(
          user.name || 'Shfrytëzues',
          listing,
          watch.currentPrice,
          listing.price
        )

        await emailService.sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        })

        await this.logNotification(user.id, 'price_drop', 'email', 'price_alert')
      }

      // Send SMS for significant drops (>€1000 or >10%)
      if (preferences.smsNotifications && user.phone &&
          (dropAmount >= 100000 || dropPercentage >= 10)) { // €1000 in cents or 10%

        const smsTemplate = smsService.getPriceDropSms(
          listing.title,
          watch.currentPrice,
          listing.price
        )

        await smsService.sendSms({
          to: user.phone,
          message: smsTemplate.message,
          messageType: 'alert'
        })

        await this.logNotification(user.id, 'price_drop', 'sms', 'significant_drop')
      }

    } catch (error) {
      console.error(`❌ Error sending price drop alerts to user ${user.id}:`, error)
    }
  }

  // Update watch price after checking
  private async updateWatchPrice(watchId: string, newPrice: number): Promise<void> {
    await this.prisma.priceDropWatch.update({
      where: { id: watchId },
      data: {
        currentPrice: newPrice,
        lastCheckedAt: new Date()
      }
    })
  }

  // Update watch after sending alert
  private async updateWatchAfterAlert(watchId: string, newPrice: number): Promise<void> {
    await this.prisma.priceDropWatch.update({
      where: { id: watchId },
      data: {
        currentPrice: newPrice,
        lastCheckedAt: new Date(),
        alertsTriggered: { increment: 1 }
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

  // Create price drop watch when user favorites a listing
  async createPriceWatch(userId: string, listingId: string, options?: {
    minimumDrop?: number
    percentageDrop?: number
  }): Promise<any> {
    try {
      // Get current listing price
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        select: { price: true }
      })

      if (!listing) {
        throw new Error('Listing not found')
      }

      // Check if watch already exists
      const existingWatch = await this.prisma.priceDropWatch.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId
          }
        }
      })

      if (existingWatch) {
        // Reactivate if inactive
        if (!existingWatch.isActive) {
          return await this.prisma.priceDropWatch.update({
            where: { id: existingWatch.id },
            data: {
              isActive: true,
              currentPrice: listing.price,
              minimumDrop: options?.minimumDrop || 500,
              percentageDrop: options?.percentageDrop || 5.0,
              lastCheckedAt: new Date()
            }
          })
        }
        return existingWatch
      }

      // Create new watch
      return await this.prisma.priceDropWatch.create({
        data: {
          userId,
          listingId,
          originalPrice: listing.price,
          currentPrice: listing.price,
          minimumDrop: options?.minimumDrop || 500, // €5 default
          percentageDrop: options?.percentageDrop || 5.0, // 5% default
          isActive: true,
          lastCheckedAt: new Date()
        }
      })

    } catch (error) {
      console.error('Error creating price watch:', error)
      throw error
    }
  }

  // Remove price watch when user unfavorites
  async removePriceWatch(userId: string, listingId: string): Promise<void> {
    try {
      await this.prisma.priceDropWatch.updateMany({
        where: { userId, listingId },
        data: { isActive: false }
      })
    } catch (error) {
      console.error('Error removing price watch:', error)
    }
  }

  // Get user's price watches
  async getUserPriceWatches(userId: string): Promise<any[]> {
    return await this.prisma.priceDropWatch.findMany({
      where: { userId, isActive: true },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            make: true,
            model: true,
            year: true,
            price: true,
            city: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Update price watch settings
  async updatePriceWatch(watchId: string, updates: {
    minimumDrop?: number
    percentageDrop?: number
    isActive?: boolean
  }): Promise<any> {
    return await this.prisma.priceDropWatch.update({
      where: { id: watchId },
      data: updates
    })
  }

  // Process weekly price drop digest
  async processWeeklyPriceDropDigest(): Promise<void> {
    try {
      console.log('📊 Processing weekly price drop digest...')

      const users = await this.prisma.user.findMany({
        where: {
          automationPreferences: {
            weeklyDigest: true,
            emailNotifications: true,
            priceAlerts: true
          }
        },
        include: {
          automationPreferences: true,
          priceDropWatches: {
            where: { isActive: true },
            include: {
              listing: true
            }
          }
        }
      })

      for (const user of users) {
        if (this.shouldSendWeeklyDigest(user.automationPreferences)) {
          await this.sendWeeklyPriceDropDigest(user)
        }
      }

      console.log(`✅ Processed weekly price drop digest for ${users.length} users`)
    } catch (error) {
      console.error('❌ Error processing weekly price drop digest:', error)
    }
  }

  // Check if user should receive weekly digest today
  private shouldSendWeeklyDigest(preferences: any): boolean {
    if (!preferences || !preferences.weeklyDigest) return false

    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const preferredDay = preferences.weeklyDigestDay || 1 // Default to Monday

    return today === preferredDay
  }

  // Send weekly price drop digest
  private async sendWeeklyPriceDropDigest(user: any): Promise<void> {
    try {
      const watches = user.priceDropWatches
      if (watches.length === 0) return

      // Calculate weekly stats
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      let priceDrops = 0
      let totalSavings = 0

      for (const watch of watches) {
        const dropAmount = watch.originalPrice - watch.currentPrice
        if (dropAmount > 0 && watch.lastCheckedAt > weekAgo) {
          priceDrops++
          totalSavings += dropAmount
        }
      }

      if (priceDrops > 0) {
        const stats = {
          priceDrops,
          totalSavings: Math.round(totalSavings / 100), // Convert to euros
          watchedCars: watches.length
        }

        // Create digest content in Albanian
        const digestContent = this.createPriceDropDigestContent(user.name || 'Shfrytëzues', stats, watches.slice(0, 5))

        await emailService.sendEmail({
          to: user.email,
          subject: `📉 Përmbledhja javore e çmimeve - ${priceDrops} ulje çmimi`,
          html: digestContent.html,
          text: digestContent.text
        })

        await this.logNotification(user.id, 'price_drop', 'email', 'weekly_digest')
      }

    } catch (error) {
      console.error(`❌ Error sending weekly price drop digest to user ${user.id}:`, error)
    }
  }

  // Create price drop digest content
  private createPriceDropDigestContent(userName: string, stats: any, topWatches: any[]): { html: string, text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📉 Përmbledhja Javore e Çmimeve</h1>
          <p style="margin: 5px 0 0 0;">AutoMarket Shqipëria</p>
        </div>

        <div style="padding: 30px;">
          <p>Përshëndetje ${userName},</p>

          <p>Ja një përmbledhje e ndryshimeve të çmimeve për makinat që po i ndiqni këtë javë:</p>

          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #059669;">
            <h3 style="margin-top: 0; color: #065f46;">📊 Statistikat e kësaj jave:</h3>
            <ul style="color: #047857; line-height: 1.8;">
              <li><strong>${stats.priceDrops}</strong> ulje çmimi</li>
              <li><strong>€${stats.totalSavings}</strong> kursim total</li>
              <li><strong>${stats.watchedCars}</strong> makina në ndjekje</li>
            </ul>
          </div>

          ${topWatches.length > 0 ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">🔥 Makinat me ulje çmimi:</h3>
              ${topWatches.map(watch => {
                const dropAmount = watch.originalPrice - watch.currentPrice
                const dropPercentage = ((dropAmount / watch.originalPrice) * 100).toFixed(1)
                return `
                  <div style="border-bottom: 1px solid #fde68a; padding: 10px 0;">
                    <h4 style="margin: 0; color: #78350f;">${watch.listing.title}</h4>
                    <p style="margin: 5px 0; color: #92400e;">
                      €${(watch.currentPrice / 100).toLocaleString()}
                      <span style="color: #065f46; font-weight: bold;">(-€${(dropAmount / 100).toLocaleString()}, -${dropPercentage}%)</span>
                    </p>
                  </div>
                `
              }).join('')}
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/favorites"
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Shiko të gjitha makinat
            </a>
          </div>

          <p>Përshëndetje të ngrohta,<br>
          Ekipi AutoMarket Shqipëria</p>
        </div>
      </div>
    `

    const text = `Përmbledhja javore: ${stats.priceDrops} ulje çmimi, €${stats.totalSavings} kursim total. Shiko: ${process.env.NEXTAUTH_URL}/favorites`

    return { html, text }
  }

  // Cleanup old price watches (for sold/expired listings)
  async cleanupOldWatches(): Promise<void> {
    try {
      const result = await this.prisma.priceDropWatch.updateMany({
        where: {
          listing: {
            OR: [
              { status: 'sold' },
              { status: 'expired' },
              { expiresAt: { lt: new Date() } }
            ]
          }
        },
        data: { isActive: false }
      })

      console.log(`🧹 Deactivated ${result.count} price watches for sold/expired listings`)
    } catch (error) {
      console.error('❌ Error cleaning up old price watches:', error)
    }
  }

  // Get price drop analytics
  async getPriceDropAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const analytics = await this.prisma.priceDropWatch.aggregate({
        where: {
          alertsTriggered: { gt: 0 },
          lastCheckedAt: { gte: startDate }
        },
        _count: { id: true },
        _sum: { alertsTriggered: true },
        _avg: { alertsTriggered: true }
      })

      return {
        totalWatches: analytics._count.id,
        totalAlerts: analytics._sum.alertsTriggered,
        averageAlertsPerWatch: analytics._avg.alertsTriggered,
        timeframe
      }
    } catch (error) {
      console.error('Error getting price drop analytics:', error)
      return null
    }
  }
}

export const priceDropService = new PriceDropService()