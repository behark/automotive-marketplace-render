// AI Orchestrator - Central coordinator for all AI services in Albanian Automotive Marketplace

import { IntelligentPricingService } from './pricing';
import { SmartRecommendationService } from './recommendations';
import { FraudDetectionService, ContentModerationService } from './fraud-detection';
import { ContentGenerationService } from './content-generation';
import { PhotoEnhancementService } from './photo-enhancement';
import { AlbanianChatbotService } from './chatbot';
import { DemandForecastingService } from './demand-forecasting';
import { aiConfig } from './config';
import { prisma } from '@/lib/prisma';
import cron from 'node-cron';

export interface AIProcessingJob {
  id: string;
  type: 'pricing' | 'recommendations' | 'fraud_detection' | 'content_generation' | 'photo_analysis' | 'demand_forecast';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  result?: any;
  error?: string;
}

export interface AISystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  services: Record<string, ServiceStatus>;
  metrics: SystemMetrics;
  lastUpdated: Date;
}

export interface ServiceStatus {
  status: 'online' | 'offline' | 'error';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

export interface SystemMetrics {
  totalProcessedJobs: number;
  successRate: number;
  averageProcessingTime: number;
  queueSize: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    apiCalls: number;
  };
}

export class AIOrchestrator {
  private services: {
    pricing: IntelligentPricingService;
    recommendations: SmartRecommendationService;
    fraudDetection: FraudDetectionService;
    contentModeration: ContentModerationService;
    contentGeneration: ContentGenerationService;
    photoEnhancement: PhotoEnhancementService;
    chatbot: AlbanianChatbotService;
    demandForecasting: DemandForecastingService;
  };

  private jobQueue: AIProcessingJob[] = [];
  private isProcessing = false;
  private metrics: SystemMetrics;

  constructor() {
    this.services = {
      pricing: new IntelligentPricingService(),
      recommendations: new SmartRecommendationService(),
      fraudDetection: new FraudDetectionService(),
      contentModeration: new ContentModerationService(),
      contentGeneration: new ContentGenerationService(),
      photoEnhancement: new PhotoEnhancementService(),
      chatbot: new AlbanianChatbotService(),
      demandForecasting: new DemandForecastingService(),
    };

    this.metrics = {
      totalProcessedJobs: 0,
      successRate: 0,
      averageProcessingTime: 0,
      queueSize: 0,
      resourceUsage: {
        cpu: 0,
        memory: 0,
        apiCalls: 0,
      },
    };

    this.initializeScheduledJobs();
    this.startJobProcessor();
  }

  // Main entry points for AI services
  async processListing(listingId: string, operations: string[] = ['all']): Promise<any> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    const results: any = {};

    try {
      // Queue or execute operations based on priority
      if (operations.includes('all') || operations.includes('fraud_detection')) {
        const fraudJob = this.queueJob({
          type: 'fraud_detection',
          priority: 'high',
          data: { listingId },
        });
        results.fraudDetection = await this.processJob(fraudJob);
      }

      if (operations.includes('all') || operations.includes('pricing')) {
        const pricingJob = this.queueJob({
          type: 'pricing',
          priority: 'medium',
          data: { listingId },
        });
        results.pricing = await this.processJob(pricingJob);
      }

      if (operations.includes('all') || operations.includes('content_generation')) {
        const contentJob = this.queueJob({
          type: 'content_generation',
          priority: 'low',
          data: { listingId, type: 'listing_description' },
        });
        results.contentGeneration = await this.processJob(contentJob);
      }

      if (operations.includes('all') || operations.includes('photo_analysis')) {
        const photoJob = this.queueJob({
          type: 'photo_analysis',
          priority: 'medium',
          data: { listingId },
        });
        results.photoAnalysis = await this.processJob(photoJob);
      }

      return results;
    } catch (error) {
      console.error('AI processing failed for listing:', listingId, error);
      throw error;
    }
  }

  async getRecommendations(userId: string, type: string, options: any = {}): Promise<any> {
    const job = this.queueJob({
      type: 'recommendations',
      priority: 'medium',
      data: { userId, type, options },
    });

    return await this.processJob(job);
  }

  async moderateContent(content: string, contentType: string, userId?: string): Promise<any> {
    const job = this.queueJob({
      type: 'fraud_detection', // Content moderation is part of fraud detection service
      priority: 'high',
      data: { content, contentType, userId, operation: 'content_moderation' },
    });

    return await this.processJob(job);
  }

  async generateContent(request: any): Promise<any> {
    const job = this.queueJob({
      type: 'content_generation',
      priority: 'low',
      data: request,
    });

    return await this.processJob(job);
  }

  async processChatMessage(request: any): Promise<any> {
    // Chatbot responses should be immediate
    return await this.services.chatbot.processMessage(request);
  }

  async getForecast(make: string, model?: string, year?: number, region?: string): Promise<any> {
    const job = this.queueJob({
      type: 'demand_forecast',
      priority: 'low',
      data: { make, model, year, region },
    });

    return await this.processJob(job);
  }

  // Job management
  private queueJob(jobData: Partial<AIProcessingJob>): AIProcessingJob {
    const job: AIProcessingJob = {
      id: this.generateJobId(),
      type: jobData.type!,
      priority: jobData.priority || 'medium',
      data: jobData.data,
      status: 'pending',
      createdAt: new Date(),
    };

    this.jobQueue.push(job);
    this.sortJobsByPriority();
    this.metrics.queueSize = this.jobQueue.length;

    return job;
  }

  private async processJob(job: AIProcessingJob): Promise<any> {
    job.status = 'processing';
    const startTime = Date.now();

    try {
      let result: any;

      switch (job.type) {
        case 'pricing':
          result = await this.services.pricing.analyzePricing(job.data);
          break;

        case 'recommendations':
          result = await this.services.recommendations.getRecommendations(job.data);
          break;

        case 'fraud_detection':
          if (job.data.operation === 'content_moderation') {
            result = await this.services.contentModeration.moderateContent(
              job.data.content,
              job.data.contentType,
              job.data.userId
            );
          } else {
            result = await this.services.fraudDetection.analyzeListing(job.data.listingId);
          }
          break;

        case 'content_generation':
          result = await this.services.contentGeneration.generateContent(job.data);
          break;

        case 'photo_analysis':
          if (job.data.images) {
            result = await this.services.photoEnhancement.analyzePhotoSequence(
              job.data.images,
              job.data.listingId
            );
          } else {
            result = await this.services.photoEnhancement.analyzePhoto(
              job.data.imagePath,
              job.data.listingId
            );
          }
          break;

        case 'demand_forecast':
          result = await this.services.demandForecasting.generateDemandForecast(
            job.data.make,
            job.data.model,
            job.data.year,
            job.data.region
          );
          break;

        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = 'completed';
      job.result = result;
      job.processedAt = new Date();

      this.updateMetrics(startTime, true);

      return result;
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.processedAt = new Date();

      this.updateMetrics(startTime, false);

      throw error;
    } finally {
      this.removeFromQueue(job.id);
    }
  }

  private startJobProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.jobQueue.length > 0) {
        this.processNextJob();
      }
    }, 1000); // Check every second
  }

  private async processNextJob(): Promise<void> {
    if (this.jobQueue.length === 0) return;

    this.isProcessing = true;
    const job = this.jobQueue[0];

    try {
      await this.processJob(job);
    } catch (error) {
      console.error('Job processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private sortJobsByPriority(): void {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

    this.jobQueue.sort((a, b) => {
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      // Same priority, sort by creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private removeFromQueue(jobId: string): void {
    this.jobQueue = this.jobQueue.filter(job => job.id !== jobId);
    this.metrics.queueSize = this.jobQueue.length;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateMetrics(startTime: number, success: boolean): void {
    const processingTime = Date.now() - startTime;

    this.metrics.totalProcessedJobs++;
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (this.metrics.totalProcessedJobs - 1) + processingTime) /
      this.metrics.totalProcessedJobs;

    // Recalculate success rate
    const successfulJobs = Math.round(this.metrics.successRate * (this.metrics.totalProcessedJobs - 1) / 100);
    this.metrics.successRate =
      ((successfulJobs + (success ? 1 : 0)) / this.metrics.totalProcessedJobs) * 100;
  }

  // System monitoring
  async getSystemStatus(): Promise<AISystemStatus> {
    const serviceStatuses = await this.checkAllServices();
    const overallStatus = this.determineOverallStatus(serviceStatuses);

    return {
      status: overallStatus,
      services: serviceStatuses,
      metrics: this.metrics,
      lastUpdated: new Date(),
    };
  }

  private async checkAllServices(): Promise<Record<string, ServiceStatus>> {
    const statuses: Record<string, ServiceStatus> = {};

    for (const [serviceName, service] of Object.entries(this.services)) {
      statuses[serviceName] = await this.checkServiceHealth(serviceName, service);
    }

    return statuses;
  }

  private async checkServiceHealth(serviceName: string, service: any): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      // Simple health check - could be more sophisticated
      if (typeof service.healthCheck === 'function') {
        await service.healthCheck();
      }

      const responseTime = Date.now() - startTime;

      return {
        status: 'online',
        responseTime,
        errorRate: 0, // Would be calculated from historical data
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        errorRate: 100,
        lastCheck: new Date(),
      };
    }
  }

  private determineOverallStatus(serviceStatuses: Record<string, ServiceStatus>): 'healthy' | 'degraded' | 'down' {
    const statuses = Object.values(serviceStatuses);
    const onlineCount = statuses.filter(s => s.status === 'online').length;
    const totalCount = statuses.length;

    if (onlineCount === totalCount) return 'healthy';
    if (onlineCount > totalCount * 0.7) return 'degraded';
    return 'down';
  }

  // Scheduled jobs
  private initializeScheduledJobs(): void {
    // Daily pricing analysis for all active listings
    cron.schedule('0 2 * * *', async () => {
      console.log('Running daily pricing analysis...');
      await this.services.pricing.processAllListings();
    });

    // Daily fraud detection scan
    cron.schedule('0 3 * * *', async () => {
      console.log('Running daily fraud detection scan...');
      await this.services.fraudDetection.processAllListings();
    });

    // Weekly photo analysis
    cron.schedule('0 4 * * 0', async () => {
      console.log('Running weekly photo analysis...');
      await this.services.photoEnhancement.processAllListingPhotos();
    });

    // Monthly demand forecasting
    cron.schedule('0 6 1 * *', async () => {
      console.log('Running monthly demand forecasting...');
      const popularMakes = aiConfig.albanianMarket.popularMakes.slice(0, 5);

      for (const make of popularMakes) {
        try {
          await this.services.demandForecasting.generateDemandForecast(make);
        } catch (error) {
          console.error(`Failed to generate forecast for ${make}:`, error);
        }
      }
    });

    // Hourly system health check
    cron.schedule('0 * * * *', async () => {
      const status = await this.getSystemStatus();
      if (status.status !== 'healthy') {
        console.warn('AI system health degraded:', status);
        // Could send alerts to administrators here
      }
    });
  }

  // Batch processing methods
  async processAllListings(operation: string): Promise<void> {
    const batchSize = aiConfig.processing.batchSize;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const listings = await prisma.listing.findMany({
        where: { status: 'active' },
        take: batchSize,
        skip: offset,
      });

      if (listings.length === 0) {
        hasMore = false;
        break;
      }

      // Process listings in parallel (with rate limiting)
      const promises = listings.map(async (listing, index) => {
        // Stagger requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, index * 100));

        try {
          await this.processListing(listing.id, [operation]);
        } catch (error) {
          console.error(`Failed to process listing ${listing.id}:`, error);
        }
      });

      await Promise.all(promises);

      offset += batchSize;
      console.log(`Processed ${offset} listings for operation: ${operation}`);
    }
  }

  // Analytics and reporting
  async getProcessingAnalytics(startDate: Date, endDate: Date): Promise<any> {
    // In a real implementation, this would query a logging/analytics database
    return {
      period: { start: startDate, end: endDate },
      totalJobs: this.metrics.totalProcessedJobs,
      successRate: this.metrics.successRate,
      averageProcessingTime: this.metrics.averageProcessingTime,
      jobTypeDistribution: {
        pricing: 25,
        recommendations: 20,
        fraud_detection: 30,
        content_generation: 15,
        photo_analysis: 8,
        demand_forecast: 2,
      },
      costAnalysis: {
        apiCalls: this.metrics.resourceUsage.apiCalls,
        estimatedCost: this.metrics.resourceUsage.apiCalls * 0.002, // $0.002 per call estimate
      },
    };
  }

  async getRecommendationEffectiveness(): Promise<any> {
    // Analyze recommendation click-through rates and conversion
    const interactions = await prisma.userInteraction.findMany({
      where: {
        type: { in: ['view', 'contact'] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return {
      totalRecommendations: interactions.length,
      clickThroughRate: 0.15, // Would be calculated from actual data
      conversionRate: 0.08,   // Would be calculated from actual data
      effectiveness: 'good',
    };
  }

  // Resource management
  async optimizeResources(): Promise<void> {
    // Clear completed jobs older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // In a real implementation, this would clean up a persistent job store

    // Adjust processing priorities based on system load
    if (this.jobQueue.length > 100) {
      // Prioritize high-priority jobs more aggressively
      console.log('High queue size detected, optimizing job priorities...');
      this.sortJobsByPriority();
    }

    // Scale down non-essential operations if resource usage is high
    if (this.metrics.resourceUsage.cpu > 80) {
      console.log('High CPU usage detected, reducing non-essential operations...');
      // Could pause low-priority batch operations
    }
  }
}

// Singleton instance
export const aiOrchestrator = new AIOrchestrator();

export default aiOrchestrator;