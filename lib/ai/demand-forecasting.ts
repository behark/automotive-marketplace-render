// Demand Forecasting System for Albanian Automotive Marketplace

import { AIProviderFactory } from './base';
import { aiConfig } from './config';
import { prisma } from '@/lib/prisma';

export interface DemandForecast {
  make: string;
  model?: string;
  year?: number;
  region: string;
  forecastPeriod: string; // YYYY-MM format
  demandScore: number; // 0-100
  expectedSales: number;
  averageTimeToSell: number; // days
  recommendedListingCount: number;
  priceOptimization: {
    recommendedPriceRange: { min: number; max: number };
    competitivenessScore: number;
  };
  confidence: number;
  influencingFactors: ForecastFactor[];
}

export interface ForecastFactor {
  factor: string;
  impact: number; // -1 to 1
  description: string;
  weight: number;
}

export interface MarketTrends {
  period: string;
  overallDemand: number;
  topPerformingMakes: string[];
  decliningMakes: string[];
  emergingTrends: string[];
  seasonalInsights: SeasonalInsight[];
  regionalVariations: RegionalVariation[];
}

export interface SeasonalInsight {
  season: string;
  demandMultiplier: number;
  topCategories: string[];
  reasoning: string;
}

export interface RegionalVariation {
  region: string;
  demandIndex: number;
  preferences: string[];
  averagePrice: number;
}

export interface InvestmentOpportunity {
  make: string;
  model: string;
  region: string;
  opportunityType: 'buy_low_sell_high' | 'growing_demand' | 'seasonal_arbitrage' | 'regional_arbitrage';
  expectedReturn: number; // percentage
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: number; // months
  description: string;
  confidence: number;
}

export class DemandForecastingService {
  private provider = AIProviderFactory.getProvider('openai');

  async generateDemandForecast(
    make: string,
    model?: string,
    year?: number,
    region?: string,
    forecastMonths: number = 3
  ): Promise<DemandForecast[]> {
    try {
      const forecasts: DemandForecast[] = [];
      const regions = region ? [region] : aiConfig.albanianMarket.regions.slice(0, 5); // Top 5 regions

      for (let i = 0; i < forecastMonths; i++) {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i + 1);
        const forecastPeriod = forecastDate.toISOString().slice(0, 7); // YYYY-MM

        for (const targetRegion of regions) {
          const forecast = await this.generateRegionalForecast(
            make,
            model,
            year,
            targetRegion,
            forecastPeriod
          );
          forecasts.push(forecast);
        }
      }

      // Save forecasts to database
      await this.saveForecasts(forecasts);

      return forecasts;
    } catch (error) {
      console.error('Demand forecasting failed:', error);
      throw new Error(`Demand forecasting failed: ${error.message}`);
    }
  }

  private async generateRegionalForecast(
    make: string,
    model?: string,
    year?: number,
    region: string = 'Tiranë',
    forecastPeriod: string = new Date().toISOString().slice(0, 7)
  ): Promise<DemandForecast> {
    // Get historical data
    const historicalData = await this.getHistoricalData(make, model, year, region);

    // Analyze current market conditions
    const marketConditions = await this.analyzeCurrentMarket(make, model, region);

    // Calculate seasonal factors
    const seasonalFactors = this.calculateSeasonalFactors(forecastPeriod);

    // Get economic indicators (simplified)
    const economicFactors = await this.getEconomicFactors(region);

    // AI-powered demand prediction
    const aiPrediction = await this.getAIDemandPrediction(
      make,
      model,
      year,
      region,
      forecastPeriod,
      historicalData,
      marketConditions
    );

    // Combine all factors
    const demandScore = this.calculateDemandScore(
      historicalData,
      marketConditions,
      seasonalFactors,
      economicFactors,
      aiPrediction
    );

    // Generate detailed forecast
    return {
      make,
      model,
      year,
      region,
      forecastPeriod,
      demandScore,
      expectedSales: this.calculateExpectedSales(demandScore, historicalData),
      averageTimeToSell: this.calculateTimeToSell(demandScore, historicalData),
      recommendedListingCount: this.calculateOptimalListingCount(demandScore, marketConditions),
      priceOptimization: this.calculatePriceOptimization(demandScore, marketConditions),
      confidence: this.calculateConfidence(historicalData, aiPrediction),
      influencingFactors: this.identifyInfluencingFactors(
        seasonalFactors,
        economicFactors,
        marketConditions
      ),
    };
  }

  private async getHistoricalData(make: string, model?: string, year?: number, region?: string) {
    const monthsBack = 12;
    const dates = [];

    for (let i = 1; i <= monthsBack; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      dates.push(date.toISOString().slice(0, 7));
    }

    const historicalData = await prisma.marketData.findMany({
      where: {
        make,
        ...(model && { model }),
        ...(year && { year }),
        ...(region && { region }),
        period: { in: dates },
      },
      orderBy: { period: 'desc' },
    });

    // Calculate trends
    const sales = historicalData.map(d => d.soldCount);
    const listings = historicalData.map(d => d.listingCount);
    const averagePrices = historicalData.map(d => d.averagePrice);

    return {
      historicalSales: sales,
      historicalListings: listings,
      historicalPrices: averagePrices,
      salesTrend: this.calculateTrend(sales),
      priceTrend: this.calculateTrend(averagePrices),
      demandSupplyRatio: sales.map((s, i) => s / Math.max(1, listings[i])),
      averageDaysToSell: historicalData.map(d => d.averageDaysToSell || 30),
    };
  }

  private async analyzeCurrentMarket(make: string, model?: string, region?: string) {
    const currentListings = await prisma.listing.count({
      where: {
        make,
        ...(model && { model }),
        ...(region && { OR: [{ city: region }, { region }] }),
        status: 'active',
      },
    });

    const recentSales = await prisma.listing.count({
      where: {
        make,
        ...(model && { model }),
        ...(region && { OR: [{ city: region }, { region }] }),
        status: 'sold',
        soldDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    const avgPrice = await prisma.listing.aggregate({
      where: {
        make,
        ...(model && { model }),
        ...(region && { OR: [{ city: region }, { region }] }),
        status: 'active',
      },
      _avg: { price: true },
    });

    const competitionLevel = this.assessCompetitionLevel(currentListings, recentSales);

    return {
      currentListings,
      recentSales,
      averageCurrentPrice: avgPrice._avg.price || 0,
      demandSupplyRatio: recentSales / Math.max(1, currentListings),
      competitionLevel,
      marketSaturation: this.calculateMarketSaturation(currentListings, recentSales),
    };
  }

  private calculateSeasonalFactors(forecastPeriod: string) {
    const month = parseInt(forecastPeriod.split('-')[1]);
    const season = this.getSeasonFromMonth(month);

    const seasonalMultipliers = aiConfig.albanianMarket.seasonalFactors;
    const baseMultiplier = seasonalMultipliers[season] || 1.0;

    // Additional Albanian-specific seasonal factors
    const albanianFactors = {
      1: 0.7,  // January - low demand after holidays
      2: 0.8,  // February - winter continues
      3: 1.1,  // March - spring buying starts
      4: 1.2,  // April - peak spring demand
      5: 1.3,  // May - best weather, highest demand
      6: 1.2,  // June - summer starts
      7: 1.1,  // July - vacation season
      8: 0.9,  // August - vacation continues
      9: 1.0,  // September - back to normal
      10: 0.9, // October - autumn decline
      11: 0.8, // November - pre-winter
      12: 0.6, // December - holiday season, lowest demand
    };

    return {
      seasonalMultiplier: baseMultiplier,
      monthlyMultiplier: albanianFactors[month] || 1.0,
      season,
      isHighSeason: baseMultiplier > 1.0,
    };
  }

  private async getEconomicFactors(region: string) {
    // In a real implementation, this would fetch actual economic data
    // For now, we'll simulate based on known Albanian economic patterns

    const economicIndicators = {
      unemploymentRate: this.getRegionalUnemployment(region),
      averageIncome: this.getRegionalIncome(region),
      inflationRate: 2.5, // Approximate Albanian inflation
      currencyStability: 0.9, // EUR/ALL stability
      touristSeason: this.isTouristSeason(),
      remittances: this.getRemittancesFactor(), // Important for Albanian economy
    };

    return {
      ...economicIndicators,
      economicIndex: this.calculateEconomicIndex(economicIndicators),
    };
  }

  private async getAIDemandPrediction(
    make: string,
    model?: string,
    year?: number,
    region?: string,
    forecastPeriod?: string,
    historicalData?: any,
    marketConditions?: any
  ) {
    const prompt = `Si ekspert i tregut të automjeteve në Shqipëri, parashikoni kërkesën për:

AUTOMJETI:
- Marka: ${make}
${model ? `- Modeli: ${model}` : ''}
${year ? `- Viti: ${year}` : ''}
- Rajoni: ${region}
- Periudha: ${forecastPeriod}

TË DHËNA HISTORIKE:
- Shitje të fundit: ${historicalData?.historicalSales?.slice(0, 3).join(', ') || 'N/A'}
- Tendenca e çmimeve: ${historicalData?.priceTrend || 'stabile'}
- Raport kërkesë/ofertë: ${marketConditions?.demandSupplyRatio?.toFixed(2) || 'N/A'}

KONDITAT AKTUALE:
- Listingje aktive: ${marketConditions?.currentListings || 0}
- Shitje të fundit (30 ditë): ${marketConditions?.recentSales || 0}
- Niveli i konkurrencës: ${marketConditions?.competitionLevel || 'medium'}

Konsideroni:
1. Preferencat shqiptare (SUV, sedan, markat e preferuara)
2. Faktoring sezonal (dimër vs verë)
3. Ekonominë lokale dhe remitancat
4. Trendet e importit
5. Rregulloret dhe taksat

Ktheni parashikimin në JSON:
{
  "demandScore": 0-100,
  "expectedSales": numër,
  "confidence": 0-1,
  "keyFactors": ["faktor1", "faktor2"],
  "risks": ["rrezik1", "rrezik2"],
  "opportunities": ["mundësi1", "mundësi2"]
}`;

    try {
      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 500,
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('AI demand prediction failed:', error);
      return {
        demandScore: 50,
        expectedSales: historicalData?.historicalSales?.[0] || 5,
        confidence: 0.5,
        keyFactors: ['historical_data'],
        risks: ['data_uncertainty'],
        opportunities: ['market_growth'],
      };
    }
  }

  private calculateDemandScore(
    historicalData: any,
    marketConditions: any,
    seasonalFactors: any,
    economicFactors: any,
    aiPrediction: any
  ): number {
    const weights = {
      historical: 0.25,
      market: 0.25,
      seasonal: 0.15,
      economic: 0.15,
      ai: 0.20,
    };

    // Historical score
    const historicalScore = this.calculateHistoricalScore(historicalData);

    // Market conditions score
    const marketScore = this.calculateMarketScore(marketConditions);

    // Seasonal score
    const seasonalScore = seasonalFactors.seasonalMultiplier * 50;

    // Economic score
    const economicScore = economicFactors.economicIndex * 100;

    // AI prediction score
    const aiScore = aiPrediction.demandScore || 50;

    const weightedScore =
      historicalScore * weights.historical +
      marketScore * weights.market +
      seasonalScore * weights.seasonal +
      economicScore * weights.economic +
      aiScore * weights.ai;

    return Math.max(0, Math.min(100, Math.round(weightedScore)));
  }

  private calculateHistoricalScore(historicalData: any): number {
    if (!historicalData.historicalSales || historicalData.historicalSales.length === 0) {
      return 50; // Default
    }

    const recentSales = historicalData.historicalSales.slice(0, 3);
    const avgRecentSales = recentSales.reduce((a, b) => a + b, 0) / recentSales.length;

    // Normalize to 0-100 scale (assuming max 50 sales per month for a specific model)
    const normalizedSales = Math.min(100, (avgRecentSales / 50) * 100);

    // Apply trend bonus/penalty
    const trendBonus = historicalData.salesTrend * 20; // -20 to +20

    return Math.max(0, Math.min(100, normalizedSales + trendBonus));
  }

  private calculateMarketScore(marketConditions: any): number {
    let score = 50; // Base score

    // Demand-supply ratio scoring
    const ratio = marketConditions.demandSupplyRatio;
    if (ratio > 0.5) score += 30; // High demand relative to supply
    else if (ratio > 0.3) score += 15;
    else if (ratio > 0.1) score += 5;
    else score -= 10; // Oversupply

    // Competition level impact
    if (marketConditions.competitionLevel === 'low') score += 15;
    else if (marketConditions.competitionLevel === 'high') score -= 15;

    // Market saturation impact
    if (marketConditions.marketSaturation < 0.3) score += 10;
    else if (marketConditions.marketSaturation > 0.7) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private calculateExpectedSales(demandScore: number, historicalData: any): number {
    const baseSales = historicalData.historicalSales?.[0] || 5;
    const demandMultiplier = demandScore / 50; // 50 is neutral

    return Math.round(baseSales * demandMultiplier);
  }

  private calculateTimeToSell(demandScore: number, historicalData: any): number {
    const baseTime = historicalData.averageDaysToSell?.[0] || 30;
    const demandFactor = 100 / Math.max(10, demandScore); // Higher demand = faster sales

    return Math.round(baseTime * demandFactor);
  }

  private calculateOptimalListingCount(demandScore: number, marketConditions: any): number {
    const currentListings = marketConditions.currentListings;
    const demandMultiplier = demandScore / 50;

    // Optimal listing count based on demand
    const optimalCount = Math.round(currentListings * demandMultiplier);

    return Math.max(1, optimalCount);
  }

  private calculatePriceOptimization(demandScore: number, marketConditions: any) {
    const basePrice = marketConditions.averageCurrentPrice;
    const demandFactor = demandScore / 50;

    return {
      recommendedPriceRange: {
        min: Math.round(basePrice * 0.9 * demandFactor),
        max: Math.round(basePrice * 1.1 * demandFactor),
      },
      competitivenessScore: Math.min(100, demandScore * 1.2),
    };
  }

  private calculateConfidence(historicalData: any, aiPrediction: any): number {
    let confidence = 0.5; // Base confidence

    // Historical data availability
    if (historicalData.historicalSales && historicalData.historicalSales.length >= 6) {
      confidence += 0.2;
    }

    // AI prediction confidence
    if (aiPrediction.confidence) {
      confidence = (confidence + aiPrediction.confidence) / 2;
    }

    // Data consistency
    const salesVariance = this.calculateVariance(historicalData.historicalSales || []);
    if (salesVariance < 0.5) confidence += 0.1; // Low variance = more predictable

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private identifyInfluencingFactors(seasonalFactors: any, economicFactors: any, marketConditions: any): ForecastFactor[] {
    const factors: ForecastFactor[] = [];

    // Seasonal factor
    if (seasonalFactors.isHighSeason) {
      factors.push({
        factor: 'seasonal_demand',
        impact: (seasonalFactors.seasonalMultiplier - 1) * 0.5,
        description: `${seasonalFactors.season} është sezon i lartë për shitjen e automjeteve`,
        weight: 0.15,
      });
    }

    // Economic factors
    if (economicFactors.economicIndex > 0.6) {
      factors.push({
        factor: 'economic_conditions',
        impact: 0.3,
        description: 'Kushtet ekonomike të favorshme mbështesin kërkesën',
        weight: 0.15,
      });
    }

    // Market saturation
    if (marketConditions.marketSaturation > 0.7) {
      factors.push({
        factor: 'market_saturation',
        impact: -0.4,
        description: 'Tregu është i saturuar, konkurrencë e lartë',
        weight: 0.20,
      });
    }

    // Competition level
    if (marketConditions.competitionLevel === 'low') {
      factors.push({
        factor: 'low_competition',
        impact: 0.25,
        description: 'Konkurrencë e ulët krijon mundësi të mira',
        weight: 0.15,
      });
    }

    return factors;
  }

  async generateMarketTrends(region?: string, period?: string): Promise<MarketTrends> {
    const currentPeriod = period || new Date().toISOString().slice(0, 7);

    // Analyze overall market demand
    const overallDemand = await this.calculateOverallDemand(region, currentPeriod);

    // Identify top performing makes
    const topPerformingMakes = await this.getTopPerformingMakes(region, currentPeriod);

    // Identify declining makes
    const decliningMakes = await this.getDecliningMakes(region, currentPeriod);

    // Identify emerging trends
    const emergingTrends = await this.identifyEmergingTrends(region);

    // Generate seasonal insights
    const seasonalInsights = this.generateSeasonalInsights();

    // Calculate regional variations
    const regionalVariations = await this.calculateRegionalVariations(currentPeriod);

    return {
      period: currentPeriod,
      overallDemand,
      topPerformingMakes,
      decliningMakes,
      emergingTrends,
      seasonalInsights,
      regionalVariations,
    };
  }

  async identifyInvestmentOpportunities(region?: string): Promise<InvestmentOpportunity[]> {
    const opportunities: InvestmentOpportunity[] = [];

    // Find undervalued vehicles with growing demand
    const undervalued = await this.findUndervaluedVehicles(region);
    opportunities.push(...undervalued);

    // Find seasonal arbitrage opportunities
    const seasonal = await this.findSeasonalOpportunities(region);
    opportunities.push(...seasonal);

    // Find regional arbitrage opportunities
    const regional = await this.findRegionalOpportunities();
    opportunities.push(...regional);

    return opportunities.sort((a, b) => b.expectedReturn - a.expectedReturn);
  }

  // Helper methods
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.max(-1, Math.min(1, slope / 10)); // Normalize to -1 to 1
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 1;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return variance / (mean * mean); // Coefficient of variation
  }

  private getSeasonFromMonth(month: number): string {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  private assessCompetitionLevel(currentListings: number, recentSales: number): 'low' | 'medium' | 'high' {
    const ratio = currentListings / Math.max(1, recentSales);
    if (ratio > 10) return 'high';
    if (ratio > 5) return 'medium';
    return 'low';
  }

  private calculateMarketSaturation(currentListings: number, recentSales: number): number {
    const ratio = currentListings / Math.max(1, recentSales * 3); // 3 months of sales
    return Math.min(1, ratio / 2); // Normalize to 0-1
  }

  private getRegionalUnemployment(region: string): number {
    // Simplified regional unemployment rates for Albania
    const rates: Record<string, number> = {
      'Tiranë': 8.5,
      'Durrës': 9.2,
      'Vlorë': 11.1,
      'Shkodër': 12.3,
      'Korçë': 10.8,
      'Elbasan': 11.5,
    };
    return rates[region] || 10.0;
  }

  private getRegionalIncome(region: string): number {
    // Simplified average income by region (in EUR)
    const incomes: Record<string, number> = {
      'Tiranë': 550,
      'Durrës': 480,
      'Vlorë': 420,
      'Shkodër': 390,
      'Korçë': 400,
      'Elbasan': 410,
    };
    return incomes[region] || 450;
  }

  private isTouristSeason(): boolean {
    const month = new Date().getMonth() + 1;
    return month >= 5 && month <= 9; // May to September
  }

  private getRemittancesFactor(): number {
    // Albanian remittances are typically higher in summer and end of year
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 8) return 1.2; // Summer
    if (month === 12) return 1.3; // December
    return 1.0;
  }

  private calculateEconomicIndex(indicators: any): number {
    // Simplified economic index calculation
    let index = 0.5; // Base

    // Unemployment impact (lower = better)
    index += (15 - indicators.unemploymentRate) / 30;

    // Income impact
    index += (indicators.averageIncome - 300) / 600;

    // Other factors
    if (indicators.touristSeason) index += 0.1;
    index += (indicators.remittances - 1) * 0.2;

    return Math.max(0, Math.min(1, index));
  }

  // Additional helper methods for market analysis
  private async calculateOverallDemand(region?: string, period?: string): Promise<number> {
    // Implementation would calculate overall market demand
    return 75; // Placeholder
  }

  private async getTopPerformingMakes(region?: string, period?: string): Promise<string[]> {
    // Implementation would identify top performing makes
    return ['Mercedes-Benz', 'BMW', 'Audi'];
  }

  private async getDecliningMakes(region?: string, period?: string): Promise<string[]> {
    // Implementation would identify declining makes
    return ['Opel', 'Fiat'];
  }

  private async identifyEmergingTrends(region?: string): Promise<string[]> {
    return ['Electric vehicles', 'Hybrid popularity', 'SUV dominance'];
  }

  private generateSeasonalInsights(): SeasonalInsight[] {
    return [
      {
        season: 'spring',
        demandMultiplier: 1.1,
        topCategories: ['sedan', 'hatchback'],
        reasoning: 'Fillimi i sezonit të mirë për blerje automjetesh',
      },
      {
        season: 'summer',
        demandMultiplier: 1.2,
        topCategories: ['suv', 'cabriolet'],
        reasoning: 'Kërkesa më e lartë për pushime dhe udhëtime',
      },
    ];
  }

  private async calculateRegionalVariations(period: string): Promise<RegionalVariation[]> {
    return [
      {
        region: 'Tiranë',
        demandIndex: 120,
        preferences: ['SUV', 'Premium brands'],
        averagePrice: 18000,
      },
      {
        region: 'Durrës',
        demandIndex: 95,
        preferences: ['Sedan', 'Practical cars'],
        averagePrice: 14000,
      },
    ];
  }

  private async findUndervaluedVehicles(region?: string): Promise<InvestmentOpportunity[]> {
    // Implementation would find undervalued vehicles
    return [];
  }

  private async findSeasonalOpportunities(region?: string): Promise<InvestmentOpportunity[]> {
    // Implementation would find seasonal opportunities
    return [];
  }

  private async findRegionalOpportunities(): Promise<InvestmentOpportunity[]> {
    // Implementation would find regional arbitrage opportunities
    return [];
  }

  private async saveForecasts(forecasts: DemandForecast[]): Promise<void> {
    // Save forecasts to database for future reference
    try {
      for (const forecast of forecasts) {
        await prisma.marketData.upsert({
          where: {
            make_model_year_region_period: {
              make: forecast.make,
              model: forecast.model || '',
              year: forecast.year || 0,
              region: forecast.region,
              period: forecast.forecastPeriod,
            },
          },
          update: {
            demandScore: forecast.demandScore,
            trendDirection: forecast.demandScore > 60 ? 'up' : forecast.demandScore < 40 ? 'down' : 'stable',
            updatedAt: new Date(),
          },
          create: {
            make: forecast.make,
            model: forecast.model || '',
            year: forecast.year || 0,
            region: forecast.region,
            period: forecast.forecastPeriod,
            averagePrice: forecast.priceOptimization.recommendedPriceRange.min,
            medianPrice: forecast.priceOptimization.recommendedPriceRange.max,
            listingCount: forecast.recommendedListingCount,
            soldCount: forecast.expectedSales,
            averageDaysToSell: forecast.averageTimeToSell,
            demandScore: forecast.demandScore,
            trendDirection: forecast.demandScore > 60 ? 'up' : forecast.demandScore < 40 ? 'down' : 'stable',
            seasonalFactor: 1.0,
            dataSource: 'ai_forecast',
          },
        });
      }
    } catch (error) {
      console.error('Failed to save forecasts:', error);
    }
  }
}

export default DemandForecastingService;