// Smart Car Recommendation Engine for Albanian Automotive Marketplace

import { AIProviderFactory } from './base';
import { aiConfig } from './config';
import { prisma } from '@/lib/prisma';
import similarity from 'similarity';

export interface RecommendationOptions {
  userId?: string;
  listingId?: string;
  limit?: number;
  type: 'similar' | 'personalized' | 'trending' | 'alternative' | 'cross_sell';
  userPreferences?: UserPreferences;
  context?: 'viewing' | 'search' | 'favorites' | 'checkout';
}

export interface UserPreferences {
  preferredMakes: string[];
  preferredBodyTypes: string[];
  priceRange: { min: number; max: number };
  fuelTypePreference: string[];
  transmissionPreference: string[];
  maxMileage?: number;
  maxAge?: number;
  preferredRegions: string[];
}

export interface RecommendationResult {
  listingId: string;
  score: number;
  reasoning: string;
  type: string;
  metadata: any;
}

export interface RecommendationResponse {
  recommendations: RecommendationResult[];
  totalCount: number;
  algorithm: string;
  generatedAt: Date;
  context: any;
}

export class SmartRecommendationService {
  private provider = AIProviderFactory.getProvider(aiConfig.models.recommendations.provider);

  async getRecommendations(options: RecommendationOptions): Promise<RecommendationResponse> {
    try {
      const { type, userId, listingId, limit = 10 } = options;

      let recommendations: RecommendationResult[] = [];

      switch (type) {
        case 'similar':
          recommendations = await this.getSimilarListings(listingId!, limit);
          break;
        case 'personalized':
          recommendations = await this.getPersonalizedRecommendations(userId!, limit, options.context);
          break;
        case 'trending':
          recommendations = await this.getTrendingRecommendations(limit, userId);
          break;
        case 'alternative':
          recommendations = await this.getAlternativeRecommendations(listingId!, limit);
          break;
        case 'cross_sell':
          recommendations = await this.getCrossSellRecommendations(listingId!, limit);
          break;
        default:
          throw new Error(`Unknown recommendation type: ${type}`);
      }

      // Apply Albanian market context and filtering
      recommendations = await this.applyAlbanianMarketContext(recommendations, options);

      // Log interaction for learning
      await this.logRecommendationInteraction(options, recommendations);

      return {
        recommendations,
        totalCount: recommendations.length,
        algorithm: `${type}_recommendations_v2.0`,
        generatedAt: new Date(),
        context: {
          userId,
          listingId,
          type,
          market: 'albanian_automotive',
        },
      };
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      throw new Error(`Recommendation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getSimilarListings(listingId: string, limit: number): Promise<RecommendationResult[]> {
    const targetListing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!targetListing) {
      throw new Error('Target listing not found');
    }

    // Find similar listings using multiple criteria
    const similarListings = await prisma.listing.findMany({
      where: {
        id: { not: listingId },
        status: 'active',
        make: targetListing.make,
        year: {
          gte: targetListing.year - 3,
          lte: targetListing.year + 3,
        },
        price: {
          gte: Math.floor(targetListing.price * 0.7),
          lte: Math.floor(targetListing.price * 1.3),
        },
      },
      include: { user: true },
      take: limit * 3, // Get more to apply scoring
    });

    // Calculate similarity scores
    const recommendations: RecommendationResult[] = [];

    for (const listing of similarListings) {
      const score = this.calculateSimilarityScore(targetListing, listing);

      if (score >= aiConfig.models.recommendations.similarityThreshold) {
        recommendations.push({
          listingId: listing.id,
          score,
          reasoning: this.generateSimilarityReasoning(targetListing, listing),
          type: 'similar',
          metadata: {
            make: listing.make,
            model: listing.model,
            year: listing.year,
            price: listing.price,
            matchFactors: this.getMatchFactors(targetListing, listing),
          },
        });
      }
    }

    // Sort by score and return top results
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getPersonalizedRecommendations(userId: string, limit: number, context?: string): Promise<RecommendationResult[]> {
    // Get user preferences from interactions
    const userPreferences = await this.getUserPreferences(userId);

    // Get user's recent interactions
    const recentInteractions = await prisma.userInteraction.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Build preference profile
    const preferenceProfile = this.buildPreferenceProfile(recentInteractions, userPreferences);

    // Find matching listings
    const candidateListings = await this.findCandidateListings(preferenceProfile, limit * 3);

    // Score candidates based on user preferences
    const recommendations: RecommendationResult[] = [];

    for (const listing of candidateListings) {
      const score = this.calculatePersonalizationScore(listing, preferenceProfile, recentInteractions);

      if (score > 0.3) { // Minimum threshold
        recommendations.push({
          listingId: listing.id,
          score,
          reasoning: this.generatePersonalizationReasoning(listing, preferenceProfile),
          type: 'personalized',
          metadata: {
            preferenceMatches: this.getPreferenceMatches(listing, preferenceProfile),
            novelty: this.calculateNoveltyScore(listing, recentInteractions),
            popularity: await this.getPopularityScore(listing.id),
          },
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getTrendingRecommendations(limit: number, userId?: string): Promise<RecommendationResult[]> {
    // Get trending listings based on recent activity
    const trendingData = await prisma.$queryRaw`
      SELECT
        l.id,
        l.make,
        l.model,
        l.year,
        l.price,
        COUNT(ui.id) as interaction_count,
        COUNT(DISTINCT ui.user_id) as unique_users,
        AVG(ui.duration) as avg_duration
      FROM listings l
      LEFT JOIN user_interactions ui ON l.id = ui.listing_id
      WHERE
        l.status = 'active' AND
        ui.created_at >= NOW() - INTERVAL '7 days'
        ${userId ? `AND ui.user_id != '${userId}'` : ''}
      GROUP BY l.id, l.make, l.model, l.year, l.price
      HAVING interaction_count >= 5
      ORDER BY
        (interaction_count * 0.5 + unique_users * 0.3 + COALESCE(avg_duration, 0) * 0.2) DESC
      LIMIT ${limit * 2}
    ` as any[];

    const recommendations: RecommendationResult[] = [];

    for (const item of trendingData) {
      const trendScore = this.calculateTrendScore(item);

      recommendations.push({
        listingId: item.id,
        score: trendScore,
        reasoning: `Popullar në Shqipëri - ${item.interaction_count} vizime nga ${item.unique_users} përdorues të ndryshëm.`,
        type: 'trending',
        metadata: {
          interactionCount: item.interaction_count,
          uniqueUsers: item.unique_users,
          avgDuration: item.avg_duration,
          trendFactor: 'weekly_popular',
        },
      });
    }

    return recommendations.slice(0, limit);
  }

  private async getAlternativeRecommendations(listingId: string, limit: number): Promise<RecommendationResult[]> {
    const targetListing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!targetListing) {
      throw new Error('Target listing not found');
    }

    // Find alternatives in similar price range but different characteristics
    const alternatives = await prisma.listing.findMany({
      where: {
        id: { not: listingId },
        status: 'active',
        price: {
          gte: Math.floor(targetListing.price * 0.8),
          lte: Math.floor(targetListing.price * 1.2),
        },
        OR: [
          { make: { not: targetListing.make } }, // Different make
          { bodyType: { not: targetListing.bodyType } }, // Different body type
          { fuelType: { not: targetListing.fuelType } }, // Different fuel type
        ],
      },
      take: limit * 2,
    });

    const recommendations: RecommendationResult[] = [];

    for (const listing of alternatives) {
      const score = this.calculateAlternativeScore(targetListing, listing);

      recommendations.push({
        listingId: listing.id,
        score,
        reasoning: this.generateAlternativeReasoning(targetListing, listing),
        type: 'alternative',
        metadata: {
          priceDifference: listing.price - targetListing.price,
          alternativeType: this.getAlternativeType(targetListing, listing),
          valueProposition: this.getValueProposition(targetListing, listing),
        },
      });
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getCrossSellRecommendations(listingId: string, limit: number): Promise<RecommendationResult[]> {
    const targetListing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!targetListing) {
      throw new Error('Target listing not found');
    }

    // Cross-sell different categories
    const crossSellItems = await prisma.listing.findMany({
      where: {
        id: { not: listingId },
        status: 'active',
        OR: [
          // Accessories or related services
          { bodyType: 'accessories' },
          { bodyType: 'motorcycle' }, // Motorcycles for car buyers
          // Different price segments
          {
            price: {
              gte: Math.floor(targetListing.price * 0.3),
              lte: Math.floor(targetListing.price * 0.7),
            },
          },
          {
            price: {
              gte: Math.floor(targetListing.price * 1.3),
              lte: Math.floor(targetListing.price * 2.0),
            },
          },
        ],
      },
      take: limit * 2,
    });

    const recommendations: RecommendationResult[] = [];

    for (const listing of crossSellItems) {
      const score = this.calculateCrossSellScore(targetListing, listing);

      recommendations.push({
        listingId: listing.id,
        score,
        reasoning: this.generateCrossSellReasoning(targetListing, listing),
        type: 'cross_sell',
        metadata: {
          crossSellType: this.getCrossSellType(targetListing, listing),
          priceSegment: this.getPriceSegment(listing.price),
          marketOpportunity: this.getMarketOpportunity(targetListing, listing),
        },
      });
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private calculateSimilarityScore(target: any, candidate: any): number {
    let score = 0;

    // Exact make match
    if (target.make === candidate.make) score += 0.3;

    // Model similarity
    const modelSimilarity = similarity(target.model.toLowerCase(), candidate.model.toLowerCase());
    score += modelSimilarity * 0.25;

    // Year proximity
    const yearDiff = Math.abs(target.year - candidate.year);
    const yearScore = Math.max(0, 1 - (yearDiff / 5));
    score += yearScore * 0.15;

    // Price proximity
    const priceDiff = Math.abs(target.price - candidate.price) / target.price;
    const priceScore = Math.max(0, 1 - priceDiff);
    score += priceScore * 0.15;

    // Same body type
    if (target.bodyType === candidate.bodyType) score += 0.1;

    // Same fuel type
    if (target.fuelType === candidate.fuelType) score += 0.05;

    return Math.min(1, score);
  }

  private generateSimilarityReasoning(target: any, similar: any): string {
    const reasons = [];

    if (target.make === similar.make) {
      reasons.push(`e njëjtë markë (${target.make})`);
    }

    const yearDiff = Math.abs(target.year - similar.year);
    if (yearDiff <= 2) {
      reasons.push(`vit i ngjashëm (${similar.year})`);
    }

    if (target.bodyType === similar.bodyType) {
      reasons.push(`i njëjti tip (${similar.bodyType})`);
    }

    const priceDiff = Math.abs(target.price - similar.price) / target.price;
    if (priceDiff < 0.15) {
      reasons.push('çmim i ngjashëm');
    }

    return `I ngjashëm sepse ka ${reasons.join(', ')}.`;
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Analyze user's interaction history to build preferences
    const interactions = await prisma.userInteraction.findMany({
      where: { userId },
      include: { listing: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { listing: true },
    });

    // Extract preferences from data
    const preferredMakes = this.extractTopPreferences(
      [...interactions.map(i => i.listing.make), ...favorites.map(f => f.listing.make)]
    );

    const preferredBodyTypes = this.extractTopPreferences(
      [...interactions.map(i => i.listing.bodyType), ...favorites.map(f => f.listing.bodyType)]
    );

    const prices = [...interactions.map(i => i.listing.price), ...favorites.map(f => f.listing.price)];
    const priceRange = {
      min: Math.min(...prices) || 0,
      max: Math.max(...prices) || 100000000, // 1M EUR in cents
    };

    return {
      preferredMakes,
      preferredBodyTypes,
      priceRange,
      fuelTypePreference: this.extractTopPreferences(
        [...interactions.map(i => i.listing.fuelType), ...favorites.map(f => f.listing.fuelType)]
      ),
      transmissionPreference: this.extractTopPreferences(
        [...interactions.map(i => i.listing.transmission), ...favorites.map(f => f.listing.transmission)]
      ),
      preferredRegions: this.extractTopPreferences(
        [...interactions.map(i => i.listing.city), ...favorites.map(f => f.listing.city)]
      ),
    };
  }

  private extractTopPreferences(items: string[]): string[] {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([item]) => item);
  }

  private buildPreferenceProfile(interactions: any[], userPreferences: UserPreferences): any {
    return {
      ...userPreferences,
      interactionPatterns: {
        avgViewDuration: interactions.reduce((sum, i) => sum + (i.duration || 0), 0) / interactions.length,
        favoriteRate: interactions.filter(i => i.type === 'favorite').length / interactions.length,
        contactRate: interactions.filter(i => i.type === 'contact').length / interactions.length,
      },
    };
  }

  private async findCandidateListings(profile: any, limit: number): Promise<any[]> {
    return await prisma.listing.findMany({
      where: {
        status: 'active',
        AND: [
          profile.preferredMakes.length > 0 ? {
            make: { in: profile.preferredMakes }
          } : {},
          {
            price: {
              gte: profile.priceRange.min,
              lte: profile.priceRange.max,
            }
          },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculatePersonalizationScore(listing: any, profile: any, interactions: any[]): number {
    let score = 0;

    // Preferred make bonus
    if (profile.preferredMakes.includes(listing.make)) {
      score += 0.3;
    }

    // Preferred body type bonus
    if (profile.preferredBodyTypes.includes(listing.bodyType)) {
      score += 0.2;
    }

    // Price range fit
    if (listing.price >= profile.priceRange.min && listing.price <= profile.priceRange.max) {
      score += 0.25;
    }

    // Novelty factor (haven't seen similar recently)
    const novelty = this.calculateNoveltyScore(listing, interactions);
    score += novelty * 0.15;

    // Quality score bonus
    if (listing.qualityScore && listing.qualityScore > 80) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private calculateNoveltyScore(listing: any, interactions: any[]): number {
    const similarInteractions = interactions.filter(i =>
      i.listing.make === listing.make &&
      i.listing.model === listing.model
    );

    // More novel if user hasn't seen similar listings recently
    return Math.max(0, 1 - (similarInteractions.length / 10));
  }

  private async getPopularityScore(listingId: string): Promise<number> {
    const interactionCount = await prisma.userInteraction.count({
      where: { listingId },
    });

    // Normalize to 0-1 scale
    return Math.min(1, interactionCount / 50);
  }

  private generatePersonalizationReasoning(listing: any, profile: any): string {
    const reasons = [];

    if (profile.preferredMakes.includes(listing.make)) {
      reasons.push(`preferon markën ${listing.make}`);
    }

    if (profile.preferredBodyTypes.includes(listing.bodyType)) {
      reasons.push(`preferon tipin ${listing.bodyType}`);
    }

    if (listing.price >= profile.priceRange.min && listing.price <= profile.priceRange.max) {
      reasons.push('në gamën tuaj të çmimeve');
    }

    return `Rekomandohet sepse ${reasons.join(', ')}.`;
  }

  private async applyAlbanianMarketContext(recommendations: RecommendationResult[], options: RecommendationOptions): Promise<RecommendationResult[]> {
    // Apply Albanian market-specific adjustments
    for (const rec of recommendations) {
      const listing = await prisma.listing.findUnique({
        where: { id: rec.listingId },
      });

      if (listing) {
        // Boost popular Albanian makes
        if (aiConfig.albanianMarket.popularMakes.includes(listing.make)) {
          rec.score *= 1.1;
        }

        // Boost listings from major Albanian cities
        if (['Tiranë', 'Durrës', 'Vlorë'].includes(listing.city)) {
          rec.score *= 1.05;
        }

        // Apply seasonal adjustments
        const season = this.getCurrentSeason();
        const seasonalFactor = aiConfig.albanianMarket.seasonalFactors[season] || 1.0;
        rec.score *= seasonalFactor;

        // Update metadata with Albanian context
        rec.metadata.albanianMarketRelevance = {
          popularMake: aiConfig.albanianMarket.popularMakes.includes(listing.make),
          majorCity: ['Tiranë', 'Durrës', 'Vlorë'].includes(listing.city),
          seasonalFactor,
        };
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  private async logRecommendationInteraction(options: RecommendationOptions, recommendations: RecommendationResult[]): Promise<void> {
    // Log for learning and improvement
    try {
      // This would typically go to a analytics/logging service
      console.log('Recommendation generated:', {
        type: options.type,
        userId: options.userId,
        listingId: options.listingId,
        resultCount: recommendations.length,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to log recommendation interaction:', error);
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  // Additional helper methods for scoring and reasoning
  private getMatchFactors(target: any, candidate: any): string[] {
    const factors = [];
    if (target.make === candidate.make) factors.push('make');
    if (target.bodyType === candidate.bodyType) factors.push('bodyType');
    if (target.fuelType === candidate.fuelType) factors.push('fuelType');
    if (Math.abs(target.year - candidate.year) <= 2) factors.push('year');
    return factors;
  }

  private getPreferenceMatches(listing: any, profile: any): string[] {
    const matches = [];
    if (profile.preferredMakes.includes(listing.make)) matches.push('preferredMake');
    if (profile.preferredBodyTypes.includes(listing.bodyType)) matches.push('preferredBodyType');
    return matches;
  }

  private calculateTrendScore(item: any): number {
    const interactionWeight = Math.min(1, item.interaction_count / 20);
    const uniqueUserWeight = Math.min(1, item.unique_users / 10);
    const durationWeight = Math.min(1, (item.avg_duration || 0) / 300); // 5 minutes max

    return (interactionWeight * 0.5 + uniqueUserWeight * 0.3 + durationWeight * 0.2);
  }

  private calculateAlternativeScore(target: any, alternative: any): number {
    let score = 0.5; // Base score

    // Price proximity bonus
    const priceDiff = Math.abs(target.price - alternative.price) / target.price;
    score += Math.max(0, 0.3 - priceDiff);

    // Different characteristics bonus
    if (target.make !== alternative.make) score += 0.1;
    if (target.bodyType !== alternative.bodyType) score += 0.1;

    return Math.min(1, score);
  }

  private generateAlternativeReasoning(target: any, alternative: any): string {
    const reasons = [];

    if (target.make !== alternative.make) {
      reasons.push(`markë alternative (${alternative.make})`);
    }

    if (target.bodyType !== alternative.bodyType) {
      reasons.push(`tip i ndryshëm (${alternative.bodyType})`);
    }

    const priceDiff = alternative.price - target.price;
    if (priceDiff > 0) {
      reasons.push('më i shtrenjtë por me më shumë veçori');
    } else if (priceDiff < 0) {
      reasons.push('më i lirë por po aq i mirë');
    }

    return `Alternativë e mirë: ${reasons.join(', ')}.`;
  }

  private calculateCrossSellScore(target: any, crossSell: any): number {
    // Simple cross-sell scoring
    return 0.6; // Base cross-sell relevance
  }

  private generateCrossSellReasoning(target: any, crossSell: any): string {
    return 'Mund t\'ju interesojë gjithashtu.';
  }

  private getAlternativeType(target: any, alternative: any): string {
    if (target.make !== alternative.make) return 'different_make';
    if (target.bodyType !== alternative.bodyType) return 'different_type';
    if (target.fuelType !== alternative.fuelType) return 'different_fuel';
    return 'similar_alternative';
  }

  private getValueProposition(target: any, alternative: any): string {
    const priceDiff = alternative.price - target.price;
    if (priceDiff > target.price * 0.1) return 'premium_option';
    if (priceDiff < -target.price * 0.1) return 'budget_option';
    return 'similar_value';
  }

  private getCrossSellType(target: any, crossSell: any): string {
    if (crossSell.bodyType === 'accessories') return 'accessories';
    if (crossSell.price < target.price * 0.7) return 'lower_segment';
    if (crossSell.price > target.price * 1.3) return 'higher_segment';
    return 'related_category';
  }

  private getPriceSegment(price: number): string {
    if (price < 500000) return 'budget';      // < 5,000 EUR
    if (price < 1500000) return 'mid_range';  // < 15,000 EUR
    if (price < 3000000) return 'premium';    // < 30,000 EUR
    return 'luxury';
  }

  private getMarketOpportunity(target: any, crossSell: any): string {
    return 'additional_vehicle';
  }
}

export default SmartRecommendationService;