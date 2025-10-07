// AI System Status and Analytics API Route

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'system_status';

    if (type === 'system_status') {
      // Get overall AI system status
      const status = await aiOrchestrator.getSystemStatus();

      return NextResponse.json({
        success: true,
        data: status,
      });
    }

    if (type === 'analytics') {
      // Get processing analytics
      const startDate = new Date(searchParams.get('startDate') || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(searchParams.get('endDate') || Date.now());

      const analytics = await aiOrchestrator.getProcessingAnalytics(startDate, endDate);

      return NextResponse.json({
        success: true,
        data: analytics,
      });
    }

    if (type === 'recommendation_effectiveness') {
      // Get recommendation system effectiveness
      const effectiveness = await aiOrchestrator.getRecommendationEffectiveness();

      return NextResponse.json({
        success: true,
        data: effectiveness,
      });
    }

    if (type === 'queue_status') {
      // Get current job queue status
      const queueStatus = {
        queueSize: aiOrchestrator.metrics.queueSize,
        averageProcessingTime: aiOrchestrator.metrics.averageProcessingTime,
        successRate: aiOrchestrator.metrics.successRate,
        totalProcessedJobs: aiOrchestrator.metrics.totalProcessedJobs,
      };

      return NextResponse.json({
        success: true,
        data: queueStatus,
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('AI status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI status', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'optimize_resources') {
      // Trigger resource optimization
      await aiOrchestrator.optimizeResources();

      return NextResponse.json({
        success: true,
        message: 'Resource optimization triggered',
      });
    }

    if (action === 'process_batch') {
      // Trigger batch processing
      const { operation = 'pricing' } = await request.json();

      // Process in background
      aiOrchestrator.processAllListings(operation).catch(error => {
        console.error('Batch processing failed:', error);
      });

      return NextResponse.json({
        success: true,
        message: `Batch ${operation} processing started`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI status POST API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}