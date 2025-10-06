import { PrismaClient } from '@prisma/client'
import * as cron from 'node-cron'
import { savedSearchService } from './SavedSearchService'
import { priceDropService } from './PriceDropService'
import { engagementService } from './EngagementService'
import { listingLifecycleService } from './ListingLifecycleService'
import { socialMediaService } from './SocialMediaService'
import { leadNurturingService } from './LeadNurturingService'

interface AutomationJobPayload {
  type: string
  priority: number
  data: any
  userId?: string
  scheduledFor?: Date
}

interface ScheduledTask {
  name: string
  schedule: string
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  executionCount: number
  failures: number
}

export class AutomationScheduler {
  private prisma: PrismaClient
  private isRunning: boolean = false
  private scheduledTasks: Map<string, ScheduledTask> = new Map()
  private jobQueue: AutomationJobPayload[] = []
  private isProcessingQueue: boolean = false

  constructor() {
    this.prisma = new PrismaClient()
    this.initializeScheduledTasks()
  }

  // Initialize all scheduled tasks
  private initializeScheduledTasks(): void {
    const tasks: ScheduledTask[] = [
      // Saved Search Alerts - Every 30 minutes during business hours
      {
        name: 'saved_search_alerts',
        schedule: '*/30 8-22 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Price Drop Checks - Every hour
      {
        name: 'price_drop_checks',
        schedule: '0 * * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // User Engagement Campaigns - Every 4 hours
      {
        name: 'engagement_campaigns',
        schedule: '0 */4 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Listing Lifecycle - Every 6 hours
      {
        name: 'listing_lifecycle',
        schedule: '0 */6 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Social Media Automation - Every 2 hours during day
      {
        name: 'social_media_automation',
        schedule: '0 */2 8-22 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Lead Nurturing - Every 8 hours
      {
        name: 'lead_nurturing',
        schedule: '0 */8 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Daily Digest Processing - Once per day at 6 AM
      {
        name: 'daily_digest',
        schedule: '0 6 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Weekly Reports - Mondays at 9 AM
      {
        name: 'weekly_reports',
        schedule: '0 9 * * 1',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Cleanup Tasks - Daily at 2 AM
      {
        name: 'cleanup_tasks',
        schedule: '0 2 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },

      // Queue Processing - Every 5 minutes
      {
        name: 'queue_processing',
        schedule: '*/5 * * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      }
    ]

    tasks.forEach(task => {
      this.scheduledTasks.set(task.name, task)
    })
  }

  // Start the automation scheduler
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Automation scheduler is already running')
      return
    }

    console.log('🚀 Starting automation scheduler...')
    this.isRunning = true

    // Schedule all tasks
    this.scheduledTasks.forEach((task, name) => {
      if (task.enabled) {
        this.scheduleTask(name, task)
      }
    })

    console.log(`✅ Automation scheduler started with ${this.scheduledTasks.size} tasks`)
  }

  // Stop the automation scheduler
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Automation scheduler is not running')
      return
    }

    console.log('🛑 Stopping automation scheduler...')
    this.isRunning = false

    // Destroy all cron jobs
    cron.destroy()

    console.log('✅ Automation scheduler stopped')
  }

  // Schedule individual task
  private scheduleTask(taskName: string, task: ScheduledTask): void {
    try {
      cron.schedule(task.schedule, async () => {
        if (!this.isRunning) return

        const taskInfo = this.scheduledTasks.get(taskName)
        if (!taskInfo || !taskInfo.enabled) return

        console.log(`🔄 Executing task: ${taskName}`)

        try {
          await this.executeTask(taskName)

          // Update task stats
          taskInfo.lastRun = new Date()
          taskInfo.executionCount++
          this.scheduledTasks.set(taskName, taskInfo)

          console.log(`✅ Task completed: ${taskName}`)
        } catch (error) {
          console.error(`❌ Task failed: ${taskName}`, error)

          // Update failure count
          taskInfo.failures++
          this.scheduledTasks.set(taskName, taskInfo)

          // Log failure to database
          await this.logTaskFailure(taskName, error.message)
        }
      }, {
        scheduled: true,
        timezone: 'Europe/Tirane'
      })

      console.log(`📅 Scheduled task: ${taskName} (${task.schedule})`)
    } catch (error) {
      console.error(`❌ Failed to schedule task: ${taskName}`, error)
    }
  }

  // Execute specific task
  private async executeTask(taskName: string): Promise<void> {
    switch (taskName) {
      case 'saved_search_alerts':
        await savedSearchService.processSavedSearches()
        break

      case 'price_drop_checks':
        await priceDropService.checkPriceDrops()
        break

      case 'engagement_campaigns':
        await engagementService.processEngagementCampaigns()
        break

      case 'listing_lifecycle':
        await listingLifecycleService.processListingLifecycle()
        break

      case 'social_media_automation':
        await socialMediaService.processSocialMediaAutomation()
        break

      case 'lead_nurturing':
        await leadNurturingService.processLeadNurturing()
        break

      case 'daily_digest':
        await this.processDailyDigest()
        break

      case 'weekly_reports':
        await this.processWeeklyReports()
        break

      case 'cleanup_tasks':
        await this.processCleanupTasks()
        break

      case 'queue_processing':
        await this.processJobQueue()
        break

      default:
        throw new Error(`Unknown task: ${taskName}`)
    }
  }

  // Process daily digest
  private async processDailyDigest(): Promise<void> {
    try {
      console.log('📊 Processing daily digest...')

      await Promise.all([
        savedSearchService.processDailyDigest(),
        priceDropService.processWeeklyPriceDropDigest()
      ])

      console.log('✅ Daily digest completed')
    } catch (error) {
      console.error('❌ Daily digest failed:', error)
      throw error
    }
  }

  // Process weekly reports
  private async processWeeklyReports(): Promise<void> {
    try {
      console.log('📈 Processing weekly reports...')

      // Generate analytics reports
      const analytics = await Promise.all([
        savedSearchService.getUserSavedSearches('analytics'),
        priceDropService.getPriceDropAnalytics('week'),
        engagementService.getEngagementAnalytics('week'),
        socialMediaService.getSocialMediaAnalytics('week'),
        leadNurturingService.getLeadNurturingAnalytics('week')
      ])

      // Store weekly report
      await this.storeWeeklyReport(analytics)

      console.log('✅ Weekly reports completed')
    } catch (error) {
      console.error('❌ Weekly reports failed:', error)
      throw error
    }
  }

  // Store weekly report
  private async storeWeeklyReport(analytics: any[]): Promise<void> {
    try {
      const reportData = {
        savedSearches: analytics[0],
        priceDrops: analytics[1],
        engagement: analytics[2],
        socialMedia: analytics[3],
        leadNurturing: analytics[4],
        generatedAt: new Date()
      }

      // In a real implementation, this would be stored in a reports table
      console.log('📊 Weekly report generated:', {
        timestamp: reportData.generatedAt,
        sections: Object.keys(reportData).length - 1
      })
    } catch (error) {
      console.error('Error storing weekly report:', error)
    }
  }

  // Process cleanup tasks
  private async processCleanupTasks(): Promise<void> {
    try {
      console.log('🧹 Processing cleanup tasks...')

      await Promise.all([
        savedSearchService.cleanupOldSearches(),
        priceDropService.cleanupOldWatches(),
        this.cleanupOldJobs(),
        this.cleanupOldNotifications()
      ])

      console.log('✅ Cleanup tasks completed')
    } catch (error) {
      console.error('❌ Cleanup tasks failed:', error)
      throw error
    }
  }

  // Clean up old automation jobs
  private async cleanupOldJobs(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const result = await this.prisma.automationJob.deleteMany({
        where: {
          status: { in: ['completed', 'failed', 'cancelled'] },
          completedAt: { lt: thirtyDaysAgo }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} old automation jobs`)
    } catch (error) {
      console.error('Error cleaning up old jobs:', error)
    }
  }

  // Clean up old notifications
  private async cleanupOldNotifications(): Promise<void> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

      const result = await this.prisma.notificationLog.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo }
        }
      })

      console.log(`🧹 Cleaned up ${result.count} old notification logs`)
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
    }
  }

  // Add job to queue
  async addJob(payload: AutomationJobPayload): Promise<string> {
    try {
      const job = await this.prisma.automationJob.create({
        data: {
          type: payload.type,
          priority: payload.priority,
          payload: payload.data,
          scheduledFor: payload.scheduledFor || new Date(),
          status: 'pending'
        }
      })

      console.log(`📥 Job queued: ${payload.type} (priority: ${payload.priority})`)
      return job.id
    } catch (error) {
      console.error('Error adding job to queue:', error)
      throw error
    }
  }

  // Process job queue
  private async processJobQueue(): Promise<void> {
    if (this.isProcessingQueue) return

    this.isProcessingQueue = true

    try {
      // Get pending jobs ordered by priority and scheduled time
      const pendingJobs = await this.prisma.automationJob.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: new Date() }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' }
        ],
        take: 10 // Process up to 10 jobs at a time
      })

      for (const job of pendingJobs) {
        await this.processJob(job)
      }

      if (pendingJobs.length > 0) {
        console.log(`📤 Processed ${pendingJobs.length} queued jobs`)
      }
    } catch (error) {
      console.error('❌ Error processing job queue:', error)
    } finally {
      this.isProcessingQueue = false
    }
  }

  // Process individual job
  private async processJob(job: any): Promise<void> {
    try {
      // Mark job as running
      await this.prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: 'running',
          startedAt: new Date(),
          attempts: { increment: 1 }
        }
      })

      // Execute job based on type
      let result: any = null

      switch (job.type) {
        case 'send_notification':
          result = await this.processNotificationJob(job.payload)
          break

        case 'generate_recommendations':
          result = await this.processRecommendationJob(job.payload)
          break

        case 'update_user_score':
          result = await this.processScoreUpdateJob(job.payload)
          break

        case 'process_social_post':
          result = await this.processSocialPostJob(job.payload)
          break

        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      // Mark job as completed
      await this.prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          result: result
        }
      })

      console.log(`✅ Job completed: ${job.type}`)
    } catch (error) {
      console.error(`❌ Job failed: ${job.type}`, error)

      // Check if we should retry
      const shouldRetry = job.attempts < job.maxAttempts

      await this.prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? 'pending' : 'failed',
          failureReason: error.message,
          scheduledFor: shouldRetry ? new Date(Date.now() + 30 * 60 * 1000) : undefined // Retry in 30 minutes
        }
      })
    }
  }

  // Process notification job
  private async processNotificationJob(payload: any): Promise<any> {
    // This would integrate with email/SMS services
    console.log('📧 Processing notification job:', payload.type)
    return { sent: true, timestamp: new Date() }
  }

  // Process recommendation job
  private async processRecommendationJob(payload: any): Promise<any> {
    // This would generate personalized recommendations
    console.log('🎯 Processing recommendation job for user:', payload.userId)
    return { recommendations: [], generatedAt: new Date() }
  }

  // Process score update job
  private async processScoreUpdateJob(payload: any): Promise<any> {
    // This would update user engagement scores
    console.log('📊 Processing score update job for user:', payload.userId)
    return { scoreUpdated: true, newScore: payload.score }
  }

  // Process social post job
  private async processSocialPostJob(payload: any): Promise<any> {
    // This would post to social media
    console.log('📱 Processing social post job:', payload.platform)
    return { posted: true, postId: `post_${Date.now()}` }
  }

  // Log task failure
  private async logTaskFailure(taskName: string, errorMessage: string): Promise<void> {
    try {
      // In a real implementation, this would log to a failures table
      console.log(`📝 Logging task failure: ${taskName} - ${errorMessage}`)
    } catch (error) {
      console.error('Error logging task failure:', error)
    }
  }

  // Get scheduler status
  getStatus(): {
    isRunning: boolean
    totalTasks: number
    enabledTasks: number
    queueSize: number
    taskStats: Record<string, any>
  } {
    const enabledTasks = Array.from(this.scheduledTasks.values()).filter(task => task.enabled).length
    const taskStats: Record<string, any> = {}

    this.scheduledTasks.forEach((task, name) => {
      taskStats[name] = {
        enabled: task.enabled,
        lastRun: task.lastRun,
        executionCount: task.executionCount,
        failures: task.failures,
        schedule: task.schedule
      }
    })

    return {
      isRunning: this.isRunning,
      totalTasks: this.scheduledTasks.size,
      enabledTasks,
      queueSize: this.jobQueue.length,
      taskStats
    }
  }

  // Enable/disable specific task
  async setTaskEnabled(taskName: string, enabled: boolean): Promise<boolean> {
    const task = this.scheduledTasks.get(taskName)
    if (!task) {
      throw new Error(`Task not found: ${taskName}`)
    }

    task.enabled = enabled
    this.scheduledTasks.set(taskName, task)

    console.log(`${enabled ? '✅' : '❌'} Task ${taskName} ${enabled ? 'enabled' : 'disabled'}`)

    if (this.isRunning && enabled) {
      // Restart the scheduler to pick up the enabled task
      this.stop()
      this.start()
    }

    return true
  }

  // Get task statistics
  async getTaskStatistics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const jobStats = await this.prisma.automationJob.groupBy({
        by: ['type', 'status'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: true
      })

      const notificationStats = await this.prisma.notificationLog.groupBy({
        by: ['type', 'channel', 'status'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: true
      })

      return {
        jobStatistics: jobStats,
        notificationStatistics: notificationStats,
        timeframe,
        schedulerStatus: this.getStatus()
      }
    } catch (error) {
      console.error('Error getting task statistics:', error)
      return null
    }
  }
}

// Create global scheduler instance
export const automationScheduler = new AutomationScheduler()

// Export job types for type safety
export const JOB_TYPES = {
  SEND_NOTIFICATION: 'send_notification',
  GENERATE_RECOMMENDATIONS: 'generate_recommendations',
  UPDATE_USER_SCORE: 'update_user_score',
  PROCESS_SOCIAL_POST: 'process_social_post'
} as const

export type JobType = typeof JOB_TYPES[keyof typeof JOB_TYPES]