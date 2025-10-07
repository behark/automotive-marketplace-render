// AI Recommendations API Route

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'personalized';
    const listingId = searchParams.get('listingId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const context = searchParams.get('context') || 'viewing';

    const session = await getServerSession();
    const userId = session?.user?.id;

    // Validate parameters
    const validTypes = ['similar', 'personalized', 'trending', 'alternative', 'cross_sell'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid recommendation type' }, { status: 400 });
    }

    if ((type === 'similar' || type === 'alternative' || type === 'cross_sell') && !listingId) {
      return NextResponse.json({ error: 'Listing ID is required for this recommendation type' }, { status: 400 });
    }

    if (type === 'personalized' && !userId) {
      return NextResponse.json({ error: 'User authentication required for personalized recommendations' }, { status: 401 });
    }

    // Prepare recommendation options
    const options = {
      userId,
      listingId,
      limit,
      type: type as any,
      context: context as any,
    };

    // Get recommendations
    const result = await aiOrchestrator.getRecommendations(userId || 'anonymous', type, options);

    // Log interaction for learning (if user is authenticated)
    if (userId && listingId) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/interactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            listingId,
            type: 'recommendation_view',
            metadata: { recommendationType: type, context },
          }),
        });
      } catch (error) {
        console.error('Failed to log interaction:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Rekomandimet u gjeneruan me sukses',
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { action, listingId, recommendationType } = await request.json();

    if (action === 'feedback') {
      // Record user feedback on recommendations
      const { rating, helpful } = await request.json();

      // Store feedback for improving recommendations
      // This would typically go to an analytics database
      console.log('Recommendation feedback:', {
        userId: session.user.id,
        listingId,
        recommendationType,
        rating,
        helpful,
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Faleminderit për feedback-un!',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Recommendations POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}