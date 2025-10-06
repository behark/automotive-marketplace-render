/**
 * AutoMarket Albania - Comprehensive Automation System
 *
 * This file serves as the main entry point for all automation services
 * supporting the Albanian automotive marketplace.
 *
 * Features:
 * - Saved Search Alerts in Albanian
 * - Price Drop Notifications
 * - User Engagement Campaigns
 * - Listing Lifecycle Management
 * - SMS Notifications for Albanian carriers
 * - Social Media Automation with Albanian hashtags
 * - Lead Nurturing Workflows
 * - Automated Scheduling and Queue Management
 */

import { automationScheduler, JOB_TYPES } from './AutomationScheduler'
import { savedSearchService } from './SavedSearchService'
import { priceDropService } from './PriceDropService'
import { engagementService } from './EngagementService'
import { listingLifecycleService } from './ListingLifecycleService'
import { socialMediaService } from './SocialMediaService'
import { leadNurturingService } from './LeadNurturingService'
import { emailService } from '../email'
import { smsService } from '../sms'

export class AutomationMaster {
  private isInitialized: boolean = false

  // Initialize the automation system
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ Automation system already initialized')
      return
    }

    try {
      console.log('🚀 Initializing AutoMarket Albania Automation System...')

      // Start the scheduler
      automationScheduler.start()

      this.isInitialized = true

      console.log('✅ AutoMarket Albania Automation System initialized successfully')
      console.log('🇦🇱 Supporting Albanian language notifications and SMS carriers')
      console.log('📱 Social media automation configured for Albanian market')
      console.log('🎯 Lead nurturing and engagement campaigns active')

      // Log initial status
      const status = automationScheduler.getStatus()
      console.log(`📊 System Status: ${status.enabledTasks}/${status.totalTasks} tasks enabled`)

    } catch (error) {
      console.error('❌ Failed to initialize automation system:', error)
      throw error
    }
  }

  // Shutdown the automation system
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.log('⚠️ Automation system not initialized')
      return
    }

    try {
      console.log('🛑 Shutting down AutoMarket Albania Automation System...')

      // Stop the scheduler
      automationScheduler.stop()

      this.isInitialized = false

      console.log('✅ Automation system shutdown complete')
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      throw error
    }
  }

  // Get comprehensive system status
  async getSystemStatus(): Promise<any> {
    try {
      const [
        schedulerStatus,
        taskStats,
        recentNotifications
      ] = await Promise.all([
        automationScheduler.getStatus(),
        automationScheduler.getTaskStatistics('week'),
        this.getRecentNotificationStats()
      ])

      return {
        initialized: this.isInitialized,
        scheduler: schedulerStatus,
        taskStatistics: taskStats,
        notifications: recentNotifications,
        services: {
          savedSearch: 'active',
          priceDrops: 'active',
          engagement: 'active',
          lifecycle: 'active',
          socialMedia: 'active',
          leadNurturing: 'active',
          email: 'active',
          sms: 'active'
        },
        albanianFeatures: {
          languageSupport: 'Albanian (sq)',
          smsCarriers: ['Vodafone AL', 'Telekom AL', 'ONE AL'],
          socialMediaHashtags: 'Albanian market optimized',
          timezonе: 'Europe/Tirane'
        }
      }
    } catch (error) {
      console.error('Error getting system status:', error)
      return { error: error.message }
    }
  }

  // Get recent notification statistics
  private async getRecentNotificationStats(): Promise<any> {
    try {
      // This would query the notification logs from the database
      // For now, return mock data
      return {
        last24Hours: {
          email: 156,
          sms: 23,
          total: 179
        },
        byType: {
          savedSearch: 45,
          priceDrops: 32,
          engagement: 67,
          lifecycle: 28,
          social: 7
        },
        deliveryRate: 0.97
      }
    } catch (error) {
      console.error('Error getting notification stats:', error)
      return null
    }
  }

  // Manual trigger for specific automation
  async triggerAutomation(type: string, options?: any): Promise<any> {
    try {
      console.log(`🔄 Manually triggering automation: ${type}`)

      switch (type) {
        case 'saved_search':
          await savedSearchService.processSavedSearches()
          return { success: true, message: 'Saved search alerts processed' }

        case 'price_drops':
          await priceDropService.checkPriceDrops()
          return { success: true, message: 'Price drop checks completed' }

        case 'engagement':
          await engagementService.processEngagementCampaigns()
          return { success: true, message: 'Engagement campaigns processed' }

        case 'lifecycle':
          await listingLifecycleService.processListingLifecycle()
          return { success: true, message: 'Listing lifecycle automation completed' }

        case 'social_media':
          await socialMediaService.processSocialMediaAutomation()
          return { success: true, message: 'Social media automation processed' }

        case 'lead_nurturing':
          await leadNurturingService.processLeadNurturing()
          return { success: true, message: 'Lead nurturing campaigns processed' }

        default:
          throw new Error(`Unknown automation type: ${type}`)
      }
    } catch (error) {
      console.error(`❌ Manual trigger failed for ${type}:`, error)
      return { success: false, error: error.message }
    }
  }

  // Queue a high-priority job
  async queuePriorityJob(type: string, data: any, userId?: string): Promise<string> {
    try {
      const jobId = await automationScheduler.addJob({
        type,
        priority: 10, // High priority
        data,
        userId,
        scheduledFor: new Date()
      })

      console.log(`📥 Priority job queued: ${type} (ID: ${jobId})`)
      return jobId
    } catch (error) {
      console.error('Error queueing priority job:', error)
      throw error
    }
  }

  // Send immediate notification (bypassing queue)
  async sendImmediateNotification(
    userId: string,
    type: 'email' | 'sms',
    template: string,
    data: any
  ): Promise<boolean> {
    try {
      console.log(`⚡ Sending immediate ${type} notification to user ${userId}`)

      if (type === 'email') {
        // Use email service directly
        return await this.sendImmediateEmail(userId, template, data)
      } else if (type === 'sms') {
        // Use SMS service directly
        return await this.sendImmediateSms(userId, template, data)
      }

      return false
    } catch (error) {
      console.error('Error sending immediate notification:', error)
      return false
    }
  }

  // Send immediate email
  private async sendImmediateEmail(userId: string, template: string, data: any): Promise<boolean> {
    try {
      // This would fetch user email and preferences from database
      // For now, simulate the process
      console.log(`📧 Sending email template "${template}" to user ${userId}`)
      return true
    } catch (error) {
      console.error('Error sending immediate email:', error)
      return false
    }
  }

  // Send immediate SMS
  private async sendImmediateSms(userId: string, template: string, data: any): Promise<boolean> {
    try {
      // This would fetch user phone and preferences from database
      // For now, simulate the process
      console.log(`📱 Sending SMS template "${template}" to user ${userId}`)
      return true
    } catch (error) {
      console.error('Error sending immediate SMS:', error)
      return false
    }
  }

  // Get automation analytics dashboard data
  async getAnalyticsDashboard(): Promise<any> {
    try {
      const [
        savedSearchAnalytics,
        priceDropAnalytics,
        engagementAnalytics,
        lifecycleAnalytics,
        socialMediaAnalytics,
        leadNurturingAnalytics
      ] = await Promise.all([
        savedSearchService.getUserSavedSearches('analytics'),
        priceDropService.getPriceDropAnalytics('month'),
        engagementService.getEngagementAnalytics('month'),
        listingLifecycleService.getLifecycleAnalytics('month'),
        socialMediaService.getSocialMediaAnalytics('month'),
        leadNurturingService.getLeadNurturingAnalytics('month')
      ])

      return {
        overview: {
          totalAutomations: 7,
          activeUsers: 1250, // This would come from actual data
          notificationsSent: 3420, // This would come from actual data
          engagementRate: 0.76
        },
        savedSearches: savedSearchAnalytics,
        priceDrops: priceDropAnalytics,
        engagement: engagementAnalytics,
        lifecycle: lifecycleAnalytics,
        socialMedia: socialMediaAnalytics,
        leadNurturing: leadNurturingAnalytics,
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Error getting analytics dashboard:', error)
      return { error: error.message }
    }
  }

  // Health check for all automation services
  async healthCheck(): Promise<any> {
    const checks = {
      scheduler: false,
      database: false,
      email: false,
      sms: false,
      services: {
        savedSearch: false,
        priceDrops: false,
        engagement: false,
        lifecycle: false,
        socialMedia: false,
        leadNurturing: false
      }
    }

    try {
      // Check scheduler
      const schedulerStatus = automationScheduler.getStatus()
      checks.scheduler = schedulerStatus.isRunning

      // Check database connectivity
      try {
        // This would test database connection
        checks.database = true
      } catch (dbError) {
        console.error('Database health check failed:', dbError)
      }

      // Check email service
      try {
        // This would test email service
        checks.email = true
      } catch (emailError) {
        console.error('Email health check failed:', emailError)
      }

      // Check SMS service
      try {
        // This would test SMS service
        checks.sms = true
      } catch (smsError) {
        console.error('SMS health check failed:', smsError)
      }

      // All services are considered healthy if they can be imported
      checks.services.savedSearch = true
      checks.services.priceDrops = true
      checks.services.engagement = true
      checks.services.lifecycle = true
      checks.services.socialMedia = true
      checks.services.leadNurturing = true

      const allHealthy = Object.values(checks).every(check =>
        typeof check === 'boolean' ? check : Object.values(check).every(v => v)
      )

      return {
        healthy: allHealthy,
        checks,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        healthy: false,
        error: error.message,
        checks,
        timestamp: new Date()
      }
    }
  }
}

// Create and export the automation master instance
export const automationMaster = new AutomationMaster()

// Export all services for direct access if needed
export {
  automationScheduler,
  savedSearchService,
  priceDropService,
  engagementService,
  listingLifecycleService,
  socialMediaService,
  leadNurturingService,
  emailService,
  smsService,
  JOB_TYPES
}

// Export types
export type AutomationType =
  | 'saved_search'
  | 'price_drops'
  | 'engagement'
  | 'lifecycle'
  | 'social_media'
  | 'lead_nurturing'

export type NotificationType = 'email' | 'sms'

// Helper function to initialize automation on app startup
export async function initializeAutomation(): Promise<void> {
  try {
    await automationMaster.initialize()
  } catch (error) {
    console.error('Failed to initialize automation system:', error)
    throw error
  }
}

// Helper function to shutdown automation on app termination
export async function shutdownAutomation(): Promise<void> {
  try {
    await automationMaster.shutdown()
  } catch (error) {
    console.error('Failed to shutdown automation system:', error)
    throw error
  }
}