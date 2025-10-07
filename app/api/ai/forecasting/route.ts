// AI Demand Forecasting API Route

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { aiConfig } from '@/lib/ai/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const {
      make,
      model,
      year,
      region,
      forecastMonths = 3,
    } = await request.json();

    if (!make) {
      return NextResponse.json({ error: 'Vehicle make is required' }, { status: 400 });
    }

    // Validate region if provided
    if (region && !aiConfig.albanianMarket.regions.includes(region)) {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }

    // Generate demand forecast
    const forecast = await aiOrchestrator.getForecast(make, model, year, region);

    return NextResponse.json({
      success: true,
      data: forecast,
      message: 'Parashikimi i kërkesës u krijua me sukses',
    });
  } catch (error) {
    console.error('Demand forecasting API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'market_trends';
    const region = searchParams.get('region');
    const period = searchParams.get('period');

    if (type === 'market_trends') {
      // Get market trends
      const trends = await aiOrchestrator.services.demandForecasting.generateMarketTrends(region, period);

      return NextResponse.json({
        success: true,
        data: trends,
      });
    }

    if (type === 'investment_opportunities') {
      // Get investment opportunities (premium feature)
      if (session.user.plan === 'basic') {
        return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
      }

      const opportunities = await aiOrchestrator.services.demandForecasting.identifyInvestmentOpportunities(region);

      return NextResponse.json({
        success: true,
        data: opportunities,
      });
    }

    if (type === 'popular_makes') {
      // Get popular makes for the region
      return NextResponse.json({
        success: true,
        data: {
          popularMakes: aiConfig.albanianMarket.popularMakes,
          regions: aiConfig.albanianMarket.regions,
          seasonalFactors: aiConfig.albanianMarket.seasonalFactors,
        },
      });
    }

    if (type === 'historical_data') {
      // Get historical market data
      const make = searchParams.get('make');
      const model = searchParams.get('model');
      const yearParam = searchParams.get('year');
      const year = yearParam ? parseInt(yearParam) : undefined;

      if (!make) {
        return NextResponse.json({ error: 'Make is required for historical data' }, { status: 400 });
      }

      const historicalData = await prisma.marketData.findMany({
        where: {
          make,
          ...(model && { model }),
          ...(year && { year }),
          ...(region && { region }),
        },
        orderBy: { period: 'desc' },
        take: 12, // Last 12 months
      });

      return NextResponse.json({
        success: true,
        data: historicalData,
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Get forecasting data API error:', error);
    return NextResponse.json(
      { error: 'Failed to get forecasting data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}