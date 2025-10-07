import { PrismaClient } from '@prisma/client'

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
          user: true
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
      // Get the current listing data
      const listing = await this.prisma.listing.findUnique({
        where: { id: watch.listingId }
      })

      if (!listing) return false

      const currentPrice = listing.price
      const watchedPrice = watch.lastPrice || watch.watchPrice

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
      const meetsMinimumDrop = dropAmount >= 500 // Default €5 minimum drop
      const meetsPercentageDrop = dropPercentage >= (watch.threshold * 100)

      if (!meetsMinimumDrop && !meetsPercentageDrop) {
        // Update current price but don't send alert
        await this.updateWatchPrice(watch.id, currentPrice)
        return false
      }

      console.log(`📉 Price drop detected: ${listing.title} dropped by €${(dropAmount / 100).toFixed(2)} (${dropPercentage.toFixed(1)}%)`)

      // Send alerts
      await this.sendPriceDropAlerts(watch, dropAmount, dropPercentage, listing)

      // Update watch with new price and increment alert count
      await this.updateWatchAfterAlert(watch.id, currentPrice)

      return true
    } catch (error) {
      console.error(`❌ Error checking price drop for watch ${watch.id}:`, error)
      return false
    }
  }

  // Send price drop alerts to user
  private async sendPriceDropAlerts(watch: any, dropAmount: number, dropPercentage: number, listing: any): Promise<void> {
    // Get user and listing data
    const user = await this.prisma.user.findUnique({
      where: { id: watch.userId },
      include: { automationPreferences: true }
    })

    if (!user || !listing) return

    const preferences = user.automationPreferences

    // Check if notifications are allowed
    if (!preferences) {
      console.log(`⏰ Skipping price drop alert for user ${user.id} - no preferences`)
      return
    }

    try {
      // Send email notification
      if (preferences.emailEnabled && user.email) {
        console.log(`📧 Sending price drop email to ${user.email}`)
        await this.logNotification(user.id, 'price_drop', 'email', 'price_alert')
      }

      // Send SMS for significant drops (>€1000 or >10%)
      if (preferences.smsEnabled && user.phone &&
        (dropAmount >= 100000 || dropPercentage >= 10)) { // €1000 in cents or 10%
        console.log(`📱 Sending price drop SMS to ${user.phone}`)
        await this.logNotification(user.id, 'price_drop', 'sms', 'significant_drop')
      }

    } catch (error) {
      console.error(`❌ Error sending price drop alerts to user ${user.id}:`, error)
    }
  }

  // Update watch price after checking
  private async updateWatchPrice(watchId: string, newPrice: number): Promise<void> {
    try {
      await this.prisma.priceDropWatch.update({
        where: { id: watchId },
        data: {
          lastPrice: newPrice,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error(`❌ Error updating watch price for watch ${watchId}:`, error)
    }
  }

  // Update watch after sending alert
  private async updateWatchAfterAlert(watchId: string, newPrice: number): Promise<void> {
    await this.prisma.priceDropWatch.update({
      where: { id: watchId },
      data: {
        lastPrice: newPrice,
        updatedAt: new Date()
      }
    })
  }

  // Log notification delivery
  private async logNotification(userId: string, type: string, channel: string, subtype: string): Promise<void> {
    try {
      await this.prisma.notificationLog.create({
        data: {
          userId,
          type,
          category: subtype,
          recipientInfo: channel,
          status: 'sent'
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
      const existingWatch = await this.prisma.priceDropWatch.findFirst({
        where: {
          userId,
          listingId
        }
      })

      if (existingWatch) {
        // Reactivate if inactive
        if (!existingWatch.isActive) {
          return await this.prisma.priceDropWatch.update({
            where: { id: existingWatch.id },
            data: {
              isActive: true,
              lastPrice: listing.price,
              threshold: (options?.percentageDrop || 5.0) / 100, // Convert percentage to decimal
              updatedAt: new Date()
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
          watchPrice: listing.price,
          lastPrice: listing.price,
          threshold: (options?.percentageDrop || 5.0) / 100, // Convert to decimal (5% = 0.05)
          isActive: true
        }
      })

    } catch (error) {
      console.error('Error creating price watch:', error)
      throw error
    }
  }

  // Cleanup old price watches (for sold/expired listings)
  async cleanupOldWatches(): Promise<void> {
    try {
      // Direct approach without relations
      const soldListings = await this.prisma.listing.findMany({
        where: {
          OR: [
            { status: 'sold' },
            { status: 'suspended' }
          ]
        },
        select: { id: true }
      })

      const listingIds = soldListings.map(l => l.id)

      if (listingIds.length > 0) {
        const result = await this.prisma.priceDropWatch.updateMany({
          where: {
            listingId: { in: listingIds }
          },
          data: { isActive: false }
        })

        console.log(`🧹 Deactivated ${result.count} price watches for sold/suspended listings`)
      }
    } catch (error) {
      console.error('❌ Error cleaning up old price watches:', error)
    }
  }
}

export const priceDropService = new PriceDropService()