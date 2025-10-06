// Photo Enhancement AI System for Albanian Automotive Marketplace

import { AIProviderFactory } from './base';
import { aiConfig } from './config';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';

export interface PhotoAnalysisResult {
  qualityScore: number; // 0-100
  category: 'exterior' | 'interior' | 'engine' | 'documents' | 'unknown';
  technicalMetrics: {
    resolution: { width: number; height: number };
    brightness: number;
    contrast: number;
    sharpness: number;
    noise: number;
    composition: number;
  };
  issues: PhotoIssue[];
  suggestions: PhotoSuggestion[];
  enhancementOptions: EnhancementOption[];
}

export interface PhotoIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  confidence: number;
}

export interface PhotoSuggestion {
  type: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  actionable: boolean;
}

export interface EnhancementOption {
  type: string;
  description: string;
  expectedImprovement: number;
  processingTime: number;
  cost: number; // Credits or processing cost
}

export interface PhotoSequenceAnalysis {
  coverPhotoScore: number;
  sequenceScore: number;
  completeness: number;
  missingCategories: string[];
  redundantPhotos: number;
  recommendations: string[];
}

export class PhotoEnhancementService {
  private provider = AIProviderFactory.getProvider('openai'); // Use OpenAI for vision tasks

  async analyzePhoto(imagePath: string, listingId?: string): Promise<PhotoAnalysisResult> {
    try {
      // Load and analyze image using Sharp
      const imageBuffer = await this.loadImage(imagePath);
      const metadata = await sharp(imageBuffer).metadata();

      // Perform technical analysis
      const technicalMetrics = await this.analyzeTechnicalQuality(imageBuffer);

      // AI-powered content analysis
      const contentAnalysis = await this.analyzePhotoContent(imageBuffer);

      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore(technicalMetrics, contentAnalysis);

      // Identify issues and generate suggestions
      const issues = this.identifyPhotoIssues(technicalMetrics, contentAnalysis, metadata);
      const suggestions = this.generatePhotoSuggestions(issues, technicalMetrics);
      const enhancementOptions = this.generateEnhancementOptions(issues, technicalMetrics);

      const result: PhotoAnalysisResult = {
        qualityScore,
        category: contentAnalysis.category,
        technicalMetrics,
        issues,
        suggestions,
        enhancementOptions,
      };

      // Save analysis if listing provided
      if (listingId) {
        await this.savePhotoAnalysis(listingId, imagePath, result);
      }

      return result;
    } catch (error) {
      console.error('Photo analysis failed:', error);
      throw new Error(`Photo analysis failed: ${error.message}`);
    }
  }

  async analyzePhotoSequence(imagePaths: string[], listingId: string): Promise<PhotoSequenceAnalysis> {
    try {
      // Analyze each photo individually
      const photoAnalyses = await Promise.all(
        imagePaths.map(path => this.analyzePhoto(path, listingId))
      );

      // Categorize photos
      const categories = this.categorizePhotos(photoAnalyses);

      // Analyze cover photo (first photo)
      const coverPhotoScore = photoAnalyses[0]?.qualityScore || 0;

      // Calculate sequence quality
      const sequenceScore = this.calculateSequenceScore(photoAnalyses);

      // Check completeness
      const { completeness, missingCategories } = this.checkPhotoCompleteness(categories);

      // Count redundant photos
      const redundantPhotos = this.countRedundantPhotos(categories);

      // Generate recommendations
      const recommendations = this.generateSequenceRecommendations(
        categories,
        missingCategories,
        redundantPhotos,
        coverPhotoScore
      );

      const result: PhotoSequenceAnalysis = {
        coverPhotoScore,
        sequenceScore,
        completeness,
        missingCategories,
        redundantPhotos,
        recommendations,
      };

      // Update listing with photo quality scores
      await this.updateListingPhotoScores(listingId, result, photoAnalyses);

      return result;
    } catch (error) {
      console.error('Photo sequence analysis failed:', error);
      throw new Error(`Photo sequence analysis failed: ${error.message}`);
    }
  }

  private async loadImage(imagePath: string): Promise<Buffer> {
    // In a real implementation, this would load from various sources
    // (local file system, S3, CDN, etc.)
    try {
      if (imagePath.startsWith('http')) {
        // Load from URL
        const response = await fetch(imagePath);
        return Buffer.from(await response.arrayBuffer());
      } else {
        // Load from local file system
        const fs = await import('fs/promises');
        return await fs.readFile(imagePath);
      }
    } catch (error) {
      throw new Error(`Failed to load image: ${error.message}`);
    }
  }

  private async analyzeTechnicalQuality(imageBuffer: Buffer): Promise<any> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const stats = await image.stats();

    // Calculate technical metrics
    const resolution = {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };

    // Simple brightness calculation from channel means
    const brightness = this.calculateBrightness(stats);
    const contrast = this.calculateContrast(stats);
    const sharpness = await this.calculateSharpness(image);
    const noise = this.calculateNoise(stats);
    const composition = this.calculateComposition(resolution);

    return {
      resolution,
      brightness,
      contrast,
      sharpness,
      noise,
      composition,
    };
  }

  private async analyzePhotoContent(imageBuffer: Buffer): Promise<any> {
    try {
      // Convert buffer to base64 for AI analysis
      const base64Image = imageBuffer.toString('base64');

      // Use AI vision model to analyze content
      const prompt = `Analizoni këtë fotografi automjeti dhe ktheni rezultatin në JSON:

      Identifikoni:
      1. Kategorinë (exterior, interior, engine, documents, unknown)
      2. Çfarë shihet në fotografi
      3. Cilësinë e fotografisë (0-100)
      4. Problemet kryesore
      5. Sugjerimi për përmirësim

      Ktheni në format: {
        "category": "exterior|interior|engine|documents|unknown",
        "description": "përshkrim i asaj që shihet",
        "qualityAssessment": "vlerësim i cilësisë",
        "visibleIssues": ["problem1", "problem2"],
        "suggestions": ["sugjerim1", "sugjerim2"]
      }`;

      // Note: In a real implementation, you would use a vision model API
      // For now, we'll provide a basic categorization based on image analysis
      return this.basicContentAnalysis(imageBuffer);
    } catch (error) {
      console.error('AI content analysis failed:', error);
      return this.basicContentAnalysis(imageBuffer);
    }
  }

  private basicContentAnalysis(imageBuffer: Buffer): any {
    // Fallback content analysis without AI
    // This would use traditional computer vision techniques

    return {
      category: 'unknown',
      description: 'Fotografia e automjetit',
      qualityAssessment: 'Cilësi mesatare',
      visibleIssues: [],
      suggestions: ['Sigurohuni që fotografija të jetë e qartë dhe e ndriçuar mirë'],
    };
  }

  private calculateBrightness(stats: any): number {
    // Calculate average brightness from RGB channels
    const channels = stats.channels || [];
    if (channels.length >= 3) {
      const avgBrightness = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
      return Math.min(100, (avgBrightness / 255) * 100);
    }
    return 50; // Default
  }

  private calculateContrast(stats: any): number {
    // Calculate contrast from standard deviation
    const channels = stats.channels || [];
    if (channels.length >= 3) {
      const avgStdDev = (channels[0].stdev + channels[1].stdev + channels[2].stdev) / 3;
      return Math.min(100, (avgStdDev / 128) * 100);
    }
    return 50; // Default
  }

  private async calculateSharpness(image: sharp.Sharp): Promise<number> {
    try {
      // Apply Laplacian filter to detect edges (sharpness indicator)
      const edgeImage = await image
        .clone()
        .greyscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
        })
        .raw()
        .toBuffer();

      // Calculate variance of edge response (higher = sharper)
      const values = Array.from(edgeImage);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

      return Math.min(100, variance / 1000); // Normalize to 0-100
    } catch (error) {
      return 50; // Default sharpness
    }
  }

  private calculateNoise(stats: any): number {
    // Estimate noise from high-frequency content
    const channels = stats.channels || [];
    if (channels.length >= 3) {
      // Higher standard deviation might indicate more noise
      const avgStdDev = (channels[0].stdev + channels[1].stdev + channels[2].stdev) / 3;
      const noiseEstimate = Math.min(100, (avgStdDev / 64) * 100);
      return 100 - noiseEstimate; // Invert so higher score = less noise
    }
    return 70; // Default
  }

  private calculateComposition(resolution: { width: number; height: number }): number {
    const { width, height } = resolution;

    let score = 50; // Base score

    // Aspect ratio scoring
    const aspectRatio = width / height;
    if (aspectRatio >= 1.3 && aspectRatio <= 1.8) {
      score += 20; // Good aspect ratio for car photos
    }

    // Resolution scoring
    const megapixels = (width * height) / 1000000;
    if (megapixels >= 2) score += 15;
    if (megapixels >= 5) score += 10;
    if (megapixels >= 8) score += 5;

    // Minimum resolution check
    if (width < 800 || height < 600) {
      score -= 30; // Penalty for low resolution
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateQualityScore(technicalMetrics: any, contentAnalysis: any): number {
    const weights = {
      brightness: 0.15,
      contrast: 0.15,
      sharpness: 0.25,
      noise: 0.15,
      composition: 0.20,
      content: 0.10,
    };

    const contentScore = this.assessContentQuality(contentAnalysis);

    const weightedScore =
      technicalMetrics.brightness * weights.brightness +
      technicalMetrics.contrast * weights.contrast +
      technicalMetrics.sharpness * weights.sharpness +
      technicalMetrics.noise * weights.noise +
      technicalMetrics.composition * weights.composition +
      contentScore * weights.content;

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  private assessContentQuality(contentAnalysis: any): number {
    // Basic content quality assessment
    let score = 60; // Base score

    if (contentAnalysis.category !== 'unknown') {
      score += 20; // Bonus for clear categorization
    }

    if (contentAnalysis.visibleIssues.length === 0) {
      score += 20; // Bonus for no visible issues
    }

    return Math.max(0, Math.min(100, score));
  }

  private identifyPhotoIssues(technicalMetrics: any, contentAnalysis: any, metadata: any): PhotoIssue[] {
    const issues: PhotoIssue[] = [];

    // Technical issues
    if (technicalMetrics.brightness < 30) {
      issues.push({
        type: 'low_brightness',
        severity: 'high',
        description: 'Fotografija është shumë e errët',
        confidence: 0.9,
      });
    }

    if (technicalMetrics.brightness > 85) {
      issues.push({
        type: 'overexposed',
        severity: 'medium',
        description: 'Fotografija është tepër e ndriçuar',
        confidence: 0.8,
      });
    }

    if (technicalMetrics.sharpness < 40) {
      issues.push({
        type: 'blurry',
        severity: 'high',
        description: 'Fotografija është e turbullt',
        confidence: 0.85,
      });
    }

    if (technicalMetrics.noise < 50) {
      issues.push({
        type: 'noisy',
        severity: 'medium',
        description: 'Fotografija ka shumë zhurmë/grain',
        confidence: 0.7,
      });
    }

    // Resolution issues
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width < 800 || height < 600) {
      issues.push({
        type: 'low_resolution',
        severity: 'high',
        description: 'Rezolucioni është shumë i ulët për cilësi të mirë',
        confidence: 0.95,
      });
    }

    if (technicalMetrics.composition < 40) {
      issues.push({
        type: 'poor_composition',
        severity: 'medium',
        description: 'Kompozimi i fotografisë mund të përmirësohet',
        confidence: 0.6,
      });
    }

    return issues;
  }

  private generatePhotoSuggestions(issues: PhotoIssue[], technicalMetrics: any): PhotoSuggestion[] {
    const suggestions: PhotoSuggestion[] = [];

    issues.forEach(issue => {
      switch (issue.type) {
        case 'low_brightness':
          suggestions.push({
            type: 'lighting',
            priority: 'high',
            description: 'Fotografoni gjatë ditës ose përdorni dritë shtesë',
            actionable: true,
          });
          break;

        case 'overexposed':
          suggestions.push({
            type: 'exposure',
            priority: 'medium',
            description: 'Zvogëloni ekspozimin ose fotografoni në hije',
            actionable: true,
          });
          break;

        case 'blurry':
          suggestions.push({
            type: 'stability',
            priority: 'high',
            description: 'Përdorni tripod ose mbajeni kamerën më stabil',
            actionable: true,
          });
          break;

        case 'low_resolution':
          suggestions.push({
            type: 'quality',
            priority: 'high',
            description: 'Përdorni cilësinë më të lartë të kamerës',
            actionable: true,
          });
          break;

        case 'poor_composition':
          suggestions.push({
            type: 'composition',
            priority: 'medium',
            description: 'Përpiquni të centroni automjetin dhe përdorni rregullin e të tretave',
            actionable: true,
          });
          break;
      }
    });

    // General suggestions
    if (technicalMetrics.qualityScore < 60) {
      suggestions.push({
        type: 'general',
        priority: 'medium',
        description: 'Konsideroni të ri-fotografoni automjetin në kushte më të mira',
        actionable: true,
      });
    }

    return suggestions;
  }

  private generateEnhancementOptions(issues: PhotoIssue[], technicalMetrics: any): EnhancementOption[] {
    const options: EnhancementOption[] = [];

    // Brightness adjustment
    if (technicalMetrics.brightness < 30 || technicalMetrics.brightness > 85) {
      options.push({
        type: 'brightness_adjustment',
        description: 'Rregullim automatik i ndriçimit',
        expectedImprovement: 15,
        processingTime: 2,
        cost: 1,
      });
    }

    // Contrast enhancement
    if (technicalMetrics.contrast < 50) {
      options.push({
        type: 'contrast_enhancement',
        description: 'Përmirësim i kontrastit',
        expectedImprovement: 12,
        processingTime: 3,
        cost: 1,
      });
    }

    // Noise reduction
    if (technicalMetrics.noise < 50) {
      options.push({
        type: 'noise_reduction',
        description: 'Reduktim i zhurmës së fotografisë',
        expectedImprovement: 10,
        processingTime: 5,
        cost: 2,
      });
    }

    // Sharpening
    if (technicalMetrics.sharpness < 60) {
      options.push({
        type: 'sharpening',
        description: 'Mprehje e fotografisë',
        expectedImprovement: 8,
        processingTime: 3,
        cost: 1,
      });
    }

    return options;
  }

  private categorizePhotos(analyses: PhotoAnalysisResult[]): Record<string, number> {
    const categories = {
      exterior: 0,
      interior: 0,
      engine: 0,
      documents: 0,
      unknown: 0,
    };

    analyses.forEach(analysis => {
      categories[analysis.category]++;
    });

    return categories;
  }

  private calculateSequenceScore(analyses: PhotoAnalysisResult[]): number {
    if (analyses.length === 0) return 0;

    const avgQuality = analyses.reduce((sum, analysis) => sum + analysis.qualityScore, 0) / analyses.length;
    const varietyBonus = this.calculateVarietyBonus(analyses);
    const sequenceBonus = this.calculateSequenceBonus(analyses);

    return Math.min(100, avgQuality + varietyBonus + sequenceBonus);
  }

  private calculateVarietyBonus(analyses: PhotoAnalysisResult[]): number {
    const categories = new Set(analyses.map(a => a.category));
    const uniqueCategories = categories.size;

    // Bonus for having multiple categories
    if (uniqueCategories >= 4) return 10;
    if (uniqueCategories >= 3) return 7;
    if (uniqueCategories >= 2) return 4;
    return 0;
  }

  private calculateSequenceBonus(analyses: PhotoAnalysisResult[]): number {
    // Bonus for having a good cover photo
    const coverPhoto = analyses[0];
    if (coverPhoto && coverPhoto.qualityScore >= 80) {
      return 5;
    }
    return 0;
  }

  private checkPhotoCompleteness(categories: Record<string, number>): { completeness: number; missingCategories: string[] } {
    const requiredCategories = ['exterior', 'interior'];
    const optionalCategories = ['engine', 'documents'];

    const missingRequired = requiredCategories.filter(cat => categories[cat] === 0);
    const missingOptional = optionalCategories.filter(cat => categories[cat] === 0);

    const requiredCompleteness = (requiredCategories.length - missingRequired.length) / requiredCategories.length;
    const optionalCompleteness = (optionalCategories.length - missingOptional.length) / optionalCategories.length;

    const completeness = (requiredCompleteness * 0.8 + optionalCompleteness * 0.2) * 100;

    return {
      completeness: Math.round(completeness),
      missingCategories: [...missingRequired, ...missingOptional],
    };
  }

  private countRedundantPhotos(categories: Record<string, number>): number {
    let redundant = 0;

    // Consider more than 5 exterior photos as redundant
    if (categories.exterior > 5) {
      redundant += categories.exterior - 5;
    }

    // Consider more than 3 interior photos as redundant
    if (categories.interior > 3) {
      redundant += categories.interior - 3;
    }

    return redundant;
  }

  private generateSequenceRecommendations(
    categories: Record<string, number>,
    missingCategories: string[],
    redundantPhotos: number,
    coverPhotoScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (coverPhotoScore < 70) {
      recommendations.push('Fotografija e parë (cover) duhet të jetë cilësia më e lartë - kjo shihet së pari nga blerësit');
    }

    if (missingCategories.includes('exterior')) {
      recommendations.push('Shtoni fotografi të jashtme të automjetit nga këndvështrime të ndryshme');
    }

    if (missingCategories.includes('interior')) {
      recommendations.push('Shtoni fotografi të brendshme për të treguar gjendjen e ulëseve dhe të bordit');
    }

    if (missingCategories.includes('engine')) {
      recommendations.push('Konsideroni të shtoni një fotografi të motorit për transparencë');
    }

    if (categories.exterior < 3) {
      recommendations.push('Shtoni më shumë fotografi të jashtme (para, pas, anët)');
    }

    if (redundantPhotos > 0) {
      recommendations.push(`Konsideroni të hiqni ${redundantPhotos} fotografi të tepërta për fokus më të mirë`);
    }

    if (categories.exterior > 0 && categories.interior === 0) {
      recommendations.push('Shtoni fotografi të brendshme për një prezantim të plotë');
    }

    return recommendations;
  }

  private async savePhotoAnalysis(listingId: string, imagePath: string, analysis: PhotoAnalysisResult): Promise<void> {
    try {
      // Update listing with photo quality scores
      const existingListing = await prisma.listing.findUnique({
        where: { id: listingId },
      });

      if (existingListing) {
        const currentScores = existingListing.photoQualityScores as any[] || [];
        currentScores.push({
          imagePath,
          qualityScore: analysis.qualityScore,
          category: analysis.category,
          issues: analysis.issues.length,
          analyzedAt: new Date(),
        });

        await prisma.listing.update({
          where: { id: listingId },
          data: {
            photoQualityScores: currentScores,
            qualityScore: this.calculateOverallPhotoQuality(currentScores),
          },
        });
      }
    } catch (error) {
      console.error('Failed to save photo analysis:', error);
    }
  }

  private async updateListingPhotoScores(
    listingId: string,
    sequenceAnalysis: PhotoSequenceAnalysis,
    photoAnalyses: PhotoAnalysisResult[]
  ): Promise<void> {
    try {
      const photoScores = photoAnalyses.map((analysis, index) => ({
        position: index,
        qualityScore: analysis.qualityScore,
        category: analysis.category,
        issues: analysis.issues.length,
      }));

      await prisma.listing.update({
        where: { id: listingId },
        data: {
          photoQualityScores: photoScores,
          qualityScore: sequenceAnalysis.sequenceScore,
        },
      });
    } catch (error) {
      console.error('Failed to update listing photo scores:', error);
    }
  }

  private calculateOverallPhotoQuality(photoScores: any[]): number {
    if (photoScores.length === 0) return 0;

    const avgScore = photoScores.reduce((sum, score) => sum + score.qualityScore, 0) / photoScores.length;
    const coverPhotoBonus = photoScores[0]?.qualityScore >= 80 ? 5 : 0;
    const varietyBonus = new Set(photoScores.map(s => s.category)).size >= 2 ? 5 : 0;

    return Math.min(100, avgScore + coverPhotoBonus + varietyBonus);
  }

  // Batch processing for all listing photos
  async processAllListingPhotos(): Promise<void> {
    const listings = await prisma.listing.findMany({
      where: {
        status: 'active',
        photoQualityScores: null, // Not yet analyzed
        images: { not: null },
      },
      take: aiConfig.processing.batchSize,
    });

    for (const listing of listings) {
      try {
        const images = listing.images as string[] || [];
        if (images.length > 0) {
          await this.analyzePhotoSequence(images, listing.id);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to process photos for listing ${listing.id}:`, error);
      }
    }
  }
}

export default PhotoEnhancementService;