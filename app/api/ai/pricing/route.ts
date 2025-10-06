// AI Pricing Analysis API Route

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiOrchestrator } from '@/lib/ai/orchestrator';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Verify user owns the listing or is admin
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { user: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Process pricing analysis
    const result = await aiOrchestrator.processListing(listingId, ['pricing']);

    return NextResponse.json({
      success: true,
      data: result.pricing,
      message: 'Analiza e çmimit u kompletua me sukses',
    });
  } catch (error) {
    console.error('Pricing analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze pricing', details: error.message },
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
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Get existing pricing analysis
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        price: true,
        marketPriceScore: true,
        recommendedPrice: true,
        priceAdjustmentReason: true,
        aiProcessedAt: true,
        aiInsights: {
          where: { type: 'price_recommendation' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPrice: listing.price,
        marketPriceScore: listing.marketPriceScore,
        recommendedPrice: listing.recommendedPrice,
        reasoning: listing.priceAdjustmentReason,
        lastAnalyzed: listing.aiProcessedAt,
        insights: listing.aiInsights,
      },
    });
  } catch (error) {
    console.error('Get pricing analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to get pricing analysis', details: error.message },
      { status: 500 }
    );
  }
}