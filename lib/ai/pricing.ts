// Intelligent Pricing System for Albanian Automotive Marketplace

import { AIProviderFactory } from './base';
import { aiConfig, albanianLanguageConfig } from './config';
import { prisma } from '@/lib/prisma';

export interface ListingData {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  city: string;
  region?: string;
  price: number;
  description: string;
  images?: string[];
  createdAt: Date;
}

export interface PricingAnalysis {
  recommendedPrice: number;
  currentPriceScore: number; // 0-100, higher is better
  marketPosition: 'underpriced' | 'well_priced' | 'overpriced';
  confidence: number; // 0-1
  reasoning: string;
  priceRange: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  marketFactors: {
    seasonalMultiplier: number;
    regionalMultiplier: number;
    demandScore: number;
    competitionLevel: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
  comparableListings: string[];
}

export class IntelligentPricingService {
  private provider = AIProviderFactory.getProvider(aiConfig.models.pricing.provider);

  async analyzePricing(listing: ListingData): Promise<PricingAnalysis> {
    try {
      // 1. Get market data for similar vehicles
      const marketData = await this.getMarketData(listing);

      // 2. Get comparable listings
      const comparableListings = await this.findComparableListings(listing);

      // 3. Calculate seasonal and regional factors
      const marketFactors = await this.calculateMarketFactors(listing);

      // 4. Get AI-powered pricing analysis
      const aiAnalysis = await this.getAIPricingAnalysis(listing, marketData, comparableListings);

      // 5. Combine all factors for final analysis
      const analysis = await this.synthesizeAnalysis(listing, marketData, comparableListings, marketFactors, aiAnalysis);

      // 6. Store analysis in database
      await this.savePricingAnalysis(listing.id, analysis);

      return analysis;
    } catch (error) {
      console.error('Pricing analysis failed:', error);
      throw new Error(`Pricing analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getMarketData(listing: ListingData) {
    const currentMonth = new Date().toISOString().slice(0, 7);

    return await prisma.marketData.findFirst({
      where: {
        make: listing.make,
        model: listing.model,
        year: listing.year,
        region: listing.region || listing.city,
        period: currentMonth,
      },
    });
  }

  private async findComparableListings(listing: ListingData): Promise<any[]> {
    const yearRange = 2; // ±2 years
    const mileageRange = 20000; // ±20,000 km

    return await prisma.listing.findMany({
      where: {
        make: listing.make,
        model: listing.model,
        year: {
          gte: listing.year - yearRange,
          lte: listing.year + yearRange,
        },
        mileage: {
          gte: Math.max(0, listing.mileage - mileageRange),
          lte: listing.mileage + mileageRange,
        },
        status: 'active',
        id: { not: listing.id },
      },
      take: 20,
      orderBy: [
        { year: 'desc' },
        { mileage: 'asc' },
      ],
    });
  }

  private async calculateMarketFactors(listing: ListingData) {
    const currentSeason = this.getCurrentSeason();
    const seasonalMultiplier = aiConfig.albanianMarket.seasonalFactors[currentSeason] || 1.0;

    // Regional multiplier (Tiranë premium, rural discount)
    const regionalMultiplier = this.getRegionalMultiplier(listing.region || listing.city);

    // Demand score based on make popularity
    const demandScore = this.calculateDemandScore(listing.make, listing.bodyType);

    // Competition level based on similar listings count
    const competitionCount = await prisma.listing.count({
      where: {
        make: listing.make,
        model: listing.model,
        status: 'active',
      },
    });

    const competitionLevel = competitionCount > 10 ? 'high' : competitionCount > 5 ? 'medium' : 'low';

    return {
      seasonalMultiplier,
      regionalMultiplier,
      demandScore,
      competitionLevel,
    };
  }

  private async getAIPricingAnalysis(listing: ListingData, marketData: any, comparableListings: any[]): Promise<any> {
    const prompt = this.buildPricingPrompt(listing, marketData, comparableListings);

    const response = await this.provider.generateText(prompt, {
      model: aiConfig.models.pricing.model,
      temperature: aiConfig.models.pricing.temperature,
      maxTokens: aiConfig.models.pricing.maxTokens,
    });

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI pricing response:', error);
      return { error: 'Failed to parse AI response' };
    }
  }

  private buildPricingPrompt(listing: ListingData, marketData: any, comparableListings: any[]): string {
    const comparable = comparableListings.map(c =>
      `${c.year} ${c.make} ${c.model}, ${c.mileage}km, ${c.price/100}€`
    ).join('\n');

    return `Si ekspert i tregut të automjeteve në Shqipëri, analizoni çmimin e këtij automjeti:

AUTOMJETI:
- ${listing.year} ${listing.make} ${listing.model}
- Kilometrazhi: ${listing.mileage.toLocaleString()} km
- Karburanti: ${listing.fuelType}
- Transmisioni: ${listing.transmission}
- Tipi: ${listing.bodyType}
- Vendndodhja: ${listing.city}${listing.region ? `, ${listing.region}` : ''}
- Çmimi aktual: ${(listing.price / 100).toLocaleString()}€
- Përshkrimi: ${listing.description.slice(0, 200)}...

TË DHËNA TË TREGUT:
${marketData ? `
- Çmimi mesatar: ${(marketData.averagePrice / 100).toLocaleString()}€
- Çmimi median: ${(marketData.medianPrice / 100).toLocaleString()}€
- Numri i listimeve aktive: ${marketData.listingCount}
- Numri i shitura: ${marketData.soldCount}
- Ditë mesatare për t'u shitur: ${marketData.averageDaysToSell || 'N/A'}
- Drejtimi i tregut: ${marketData.trendDirection}
` : 'Nuk ka të dhëna specifike tregu për këtë model.'}

LISTINGJE TË NGJASHME:
${comparable || 'Nuk ka listingje të ngjashme të disponueshme.'}

Ju lutem analizoni dhe ktheni rezultatin në JSON me strukturën e mëposhtme:

{
  "recommendedPrice": number (në cent),
  "currentPriceScore": number (0-100),
  "marketPosition": "underpriced" | "well_priced" | "overpriced",
  "confidence": number (0-1),
  "reasoning": "Shpjegim i detajuar në shqip për vlerësimin",
  "priceRange": {
    "min": number,
    "max": number,
    "average": number,
    "median": number
  },
  "recommendations": ["Rekomandim 1", "Rekomandim 2", ...],
  "keyFactors": ["Faktor 1", "Faktor 2", ...]
}

Konsideroni:
- Tregun shqiptar dhe preferencat lokale
- Gjendjen e automjetit bazuar në përshkrim
- Faktoring sezonal (aktualisht është ${this.getCurrentSeason()})
- Popularitetin e markës në Shqipëri
- Konkurencën në treg`;
  }

  private async synthesizeAnalysis(
    listing: ListingData,
    marketData: any,
    comparableListings: any[],
    marketFactors: any,
    aiAnalysis: any
  ): Promise<PricingAnalysis> {
    const prices = comparableListings.map(l => l.price).filter(p => p > 0);

    const priceRange = {
      min: Math.min(...prices) || listing.price,
      max: Math.max(...prices) || listing.price,
      average: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : listing.price,
      median: prices.length ? this.calculateMedian(prices) : listing.price,
    };

    // Apply market factors to AI recommendation
    let adjustedPrice = aiAnalysis.recommendedPrice || listing.price;
    adjustedPrice = Math.round(adjustedPrice * marketFactors.seasonalMultiplier * marketFactors.regionalMultiplier);

    // Calculate price score
    const idealPrice = priceRange.average;
    const priceDeviation = Math.abs(listing.price - idealPrice) / idealPrice;
    const currentPriceScore = Math.max(0, Math.min(100, 100 - (priceDeviation * 100)));

    // Determine market position
    const marketPosition = listing.price < idealPrice * 0.9 ? 'underpriced' :
                          listing.price > idealPrice * 1.1 ? 'overpriced' : 'well_priced';

    return {
      recommendedPrice: adjustedPrice,
      currentPriceScore,
      marketPosition,
      confidence: aiAnalysis.confidence || 0.7,
      reasoning: aiAnalysis.reasoning || 'Analiza bazuar në të dhënat e disponueshme të tregut.',
      priceRange,
      marketFactors: {
        ...marketFactors,
        demandScore: marketFactors.demandScore,
      },
      recommendations: aiAnalysis.recommendations || [],
      comparableListings: comparableListings.map(l => l.id),
    };
  }

  private async savePricingAnalysis(listingId: string, analysis: PricingAnalysis): Promise<void> {
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        marketPriceScore: analysis.currentPriceScore,
        recommendedPrice: analysis.recommendedPrice,
        priceAdjustmentReason: analysis.reasoning,
        sellProbability: this.calculateSellProbability(analysis),
        similarListings: analysis.comparableListings,
        seasonalDemandScore: analysis.marketFactors.demandScore,
        aiProcessedAt: new Date(),
      },
    });

    // Create AI insight if significant action needed
    if (analysis.marketPosition !== 'well_priced') {
      await prisma.aiInsight.create({
        data: {
          listingId,
          type: 'price_recommendation',
          priority: analysis.marketPosition === 'overpriced' ? 'high' : 'medium',
          title: `Rekomandim çmimi për ${analysis.marketPosition === 'overpriced' ? 'ulje' : 'rritje'}`,
          description: analysis.reasoning,
          actionRequired: true,
          actionType: 'adjust_price',
          confidence: analysis.confidence,
          metadata: {
            currentPrice: analysis.priceRange.average,
            recommendedPrice: analysis.recommendedPrice,
            marketPosition: analysis.marketPosition,
          },
        },
      });
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  private getRegionalMultiplier(region: string): number {
    const multipliers: Record<string, number> = {
      'Tiranë': 1.15,    // 15% premium for capital
      'Durrës': 1.05,    // 5% premium for major port city
      'Vlorë': 1.0,      // Baseline
      'Shkodër': 0.95,   // 5% discount for northern cities
      'Korçë': 0.95,     // 5% discount for southeastern cities
      'Elbasan': 0.9,    // 10% discount for smaller cities
      'Fier': 0.9,
      'Berat': 0.9,
      'Gjirokastër': 0.9,
      'Kukës': 0.85,     // 15% discount for remote areas
      'Lezhë': 0.9,
      'Dibër': 0.85,
    };

    return multipliers[region] || 0.95; // Default 5% discount for unknown regions
  }

  private calculateDemandScore(make: string, bodyType: string): number {
    const makeScore = aiConfig.albanianMarket.popularMakes.includes(make) ? 80 : 60;

    const bodyTypeScores: Record<string, number> = {
      'suv': 90,      // High demand for SUVs in Albania
      'sedan': 80,    // Good demand for sedans
      'hatchback': 75, // Moderate demand for hatchbacks
      'kombi': 70,    // Station wagons popular for families
      'coupe': 60,    // Lower demand for coupes
      'cabriolet': 50, // Lowest demand for convertibles
    };

    const bodyScore = bodyTypeScores[bodyType.toLowerCase()] || 65;

    return (makeScore + bodyScore) / 2;
  }

  private calculateSellProbability(analysis: PricingAnalysis): number {
    let probability = 0.5; // Base probability

    // Adjust based on price position
    if (analysis.marketPosition === 'underpriced') probability += 0.3;
    else if (analysis.marketPosition === 'overpriced') probability -= 0.2;

    // Adjust based on demand score
    probability += (analysis.marketFactors.demandScore - 50) / 100;

    // Adjust based on seasonal factors
    probability *= analysis.marketFactors.seasonalMultiplier;

    // Adjust based on competition
    if (analysis.marketFactors.competitionLevel === 'high') probability -= 0.1;
    else if (analysis.marketFactors.competitionLevel === 'low') probability += 0.1;

    return Math.max(0, Math.min(1, probability));
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  // Batch processing for all listings
  async processAllListings(): Promise<void> {
    const listings = await prisma.listing.findMany({
      where: {
        status: 'active',
        OR: [
          { aiProcessedAt: null },
          { aiProcessedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Older than 7 days
        ],
      },
      take: aiConfig.processing.batchSize,
    });

    for (const listing of listings) {
      try {
        // Transform listing data to match ListingData interface
        const listingData: ListingData = {
          ...listing,
          region: listing.region || undefined,
          images: listing.images as string[] || undefined,
        };
        await this.analyzePricing(listingData);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`Failed to process listing ${listing.id}:`, error);
      }
    }
  }
}

export default IntelligentPricingService;