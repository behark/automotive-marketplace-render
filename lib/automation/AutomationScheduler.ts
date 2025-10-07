import { PrismaClient } from '@prisma/client'
import cron from 'node-cron'
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
      // Weekly Price Drop Digest - Every Monday at 9 AM
      {
        name: 'price_drop_weekly_digest',
        schedule: '0 9 * * 1',
        enabled: true,
        executionCount: 0,
        failures: 0
      },
      // Engagement Campaigns - Daily at 10 AM
      {
        name: 'engagement_campaigns',
        schedule: '0 10 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },
      // Listing Lifecycle Updates - Every 6 hours
      {
        name: 'listing_lifecycle',
        schedule: '0 */6 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },
      // Social Media Posts - Three times daily
      {
        name: 'social_media_posts',
        schedule: '0 9,13,18 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },
      // Lead Nurturing - Daily at 11 AM
      {
        name: 'lead_nurturing',
        schedule: '0 11 * * *',
        enabled: true,
        executionCount: 0,
        failures: 0
      },
      // Weekly Reports - Every Sunday at midnight
      {
        name: 'weekly_reports',
        schedule: '0 0 * * 0',
        enabled: true,
        executionCount: 0,
        failures: 0
      },
      // Cleanup Tasks - Daily at 3 AM
      {
        name: 'cleanup_tasks',
        schedule: '0 3 * * *',
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

    // Start queue processor
    this.startQueueProcessor()

    console.log('✅ Automation scheduler started successfully')
  }

  // Stop the automation scheduler
  stop(): void {
    if (!this.isRunning) {
      console.log('⚠️ Automation scheduler is not running')
      return
    }

    console.log('🛑 Stopping automation scheduler...')
    this.isRunning = false

    // Stop all cron jobs
    // Note: node-cron doesn't have a destroy method, tasks are managed individually

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
          await this.logTaskFailure(taskName, error instanceof Error ? error.message : 'Unknown error')
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

      case 'price_drop_weekly_digest':
        // Weekly digest functionality - simplified version
        console.log('Processing weekly price drop digest')
        break

      case 'engagement_campaigns':
        await engagementService.processEngagementCampaigns()
        break

      case 'listing_lifecycle':
        await listingLifecycleService.processListingLifecycle()
        break

      case 'social_media_posts':
        await socialMediaService.processScheduledPosts()
        break

      case 'lead_nurturing':
        await leadNurturingService.processLeadNurturing()
        break

      case 'weekly_reports':
        await this.processWeeklyReports()
        break

      case 'cleanup_tasks':
        await this.processCleanupTasks()
        break

      default:
        console.warn(`Unknown task: ${taskName}`)
    }
  }

  // Process weekly reports
  private async processWeeklyReports(): Promise<void> {
    try {
      console.log('📈 Processing weekly reports...')

      // Generate analytics reports
      const analytics = await Promise.all([
        savedSearchService.getUserSavedSearches('analytics'),
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
        engagement: analytics[1],
        socialMedia: analytics[2],
        leadNurturing: analytics[3],
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
      console.log('🧹 Running cleanup tasks...')

      // Cleanup old price watches
      await priceDropService.cleanupOldWatches()

      // Cleanup old notifications (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      await this.prisma.notificationLog.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo }
        }
      })

      console.log('✅ Cleanup tasks completed')
    } catch (error) {
      console.error('❌ Cleanup tasks failed:', error)
      throw error
    }
  }

  // Add job to queue
  async addToQueue(job: AutomationJobPayload): Promise<void> {
    try {
      // Add to in-memory queue
      this.jobQueue.push(job)
      
      console.log(`Added job to queue: ${job.type}`)
    } catch (error) {
      console.error('Error adding job to queue:', error)
      throw error
    }
  }

  // Start queue processor
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isRunning || this.isProcessingQueue) return

      await this.processQueue()
    }, 5000) // Process queue every 5 seconds
  }

  // Process job queue
  private async processQueue(): Promise<void> {
    if (this.jobQueue.length === 0) return

    this.isProcessingQueue = true

    try {
      // Process up to 10 jobs from the queue
      const jobsToProcess = this.jobQueue.splice(0, 10)

      for (const job of jobsToProcess) {
        console.log(`Processing job: ${job.type}`)
        
        try {
          const result = await this.processJob(job)
          console.log(`Completed job: ${job.type}`)
        } catch (error) {
          console.error(`Failed job: ${job.type}`, error)
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error)
    } finally {
      this.isProcessingQueue = false
    }
  }

  // Process individual job
  private async processJob(job: AutomationJobPayload): Promise<any> {
    switch (job.type) {
      case JOB_TYPES.SEND_NOTIFICATION:
        return await this.sendNotification(job.data)
      
      case JOB_TYPES.GENERATE_RECOMMENDATIONS:
        return await this.generateRecommendations(job.data)
      
      case JOB_TYPES.UPDATE_USER_SCORE:
        return await this.updateUserScore(job.data)
      
      case JOB_TYPES.PROCESS_SOCIAL_POST:
        // Social media post processing would be implemented here
        console.log('Processing social post:', job.data)
        return { success: true, message: 'Social post processed' }
      
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }
  }

  // Send notification
  private async sendNotification(data: any): Promise<void> {
    console.log('Sending notification:', data)
    // Implementation would send actual notification
  }

  // Generate recommendations
  private async generateRecommendations(data: any): Promise<void> {
    console.log('Generating recommendations:', data)
    // Implementation would generate actual recommendations
  }

  // Update user score
  private async updateUserScore(data: any): Promise<void> {
    console.log('Updating user score:', data)
    // Implementation would update actual user score
  }

  // Log task failure
  private async logTaskFailure(taskName: string, errorMessage: string): Promise<void> {
    try {
      console.error(`Task failure logged: ${taskName} - ${errorMessage}`)
      // In a real implementation, this would log to database
    } catch (error) {
      console.error('Error logging task failure:', error)
    }
  }

  // Get scheduler status
  async getStatus(): Promise<any> {
    try {
      const queueSize = this.jobQueue.length
      
      const tasks = Array.from(this.scheduledTasks.entries()).map(([name, task]) => ({
        name,
        enabled: task.enabled,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
        executionCount: task.executionCount,
        failures: task.failures,
        schedule: task.schedule
      }))

      const stats = await this.getAutomationStats()

      return {
        isRunning: this.isRunning,
        queueSize,
        tasks,
        stats
      }
    } catch (error) {
      console.error('Error getting scheduler status:', error)
      return null
    }
  }

  // Get automation statistics
  private async getAutomationStats(): Promise<any> {
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const notificationCount = await this.prisma.notificationLog.count({
        where: {
          createdAt: { gte: oneDayAgo }
        }
      })

      const byType = await this.prisma.notificationLog.groupBy({
        by: ['type'],
        _count: true,
        where: {
          createdAt: { gte: oneDayAgo }
        }
      })

      return {
        last24Hours: {
          notifications: notificationCount,
          byType: Object.fromEntries(byType.map(t => [t.type, t._count]))
        }
      }
    } catch (error) {
      console.error('Error getting automation stats:', error)
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
