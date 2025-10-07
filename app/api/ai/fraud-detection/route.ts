// AI Fraud Detection API Route

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

    const { action, listingId, content, contentType } = await request.json();

    if (action === 'analyze_listing') {
      if (!listingId) {
        return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
      }

      // Verify access permissions
      if ((session.user as any).role !== 'admin') {
        const listing = await prisma.listing.findUnique({
          where: { id: listingId },
          select: { userId: true },
        });

        if (!listing || listing.userId !== session.user.id) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }

      // Process fraud detection
      const result = await aiOrchestrator.processListing(listingId, ['fraud_detection']);

      return NextResponse.json({
        success: true,
        data: result.fraudDetection,
        message: 'Analiza e mashtrimit u kompletua me sukses',
      });
    }

    if (action === 'moderate_content') {
      if (!content || !contentType) {
        return NextResponse.json({ error: 'Content and content type are required' }, { status: 400 });
      }

      // Moderate content
      const result = await aiOrchestrator.moderateContent(content, contentType, session.user.id);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Moderimi i përmbajtjes u kompletua me sukses',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Fraud detection API error:', error);
    return NextResponse.json(
      { error: 'Failed to process fraud detection', details: error instanceof Error ? error.message : String(error) },
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
    const type = searchParams.get('type') || 'fraud_alerts';

    if (type === 'fraud_alerts') {
      // Get fraud alerts for a listing or user's listings
      const whereClause: any = {};

      if (listingId) {
        whereClause.listingId = listingId;
      } else if ((session.user as any).role !== 'admin') {
        // Regular users can only see their own listings' alerts
        const userListings = await prisma.listing.findMany({
          where: { userId: session.user.id },
          select: { id: true },
        });
        whereClause.listingId = { in: userListings.map(l => l.id) };
      }

      const fraudAlerts = await prisma.fraudAlert.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              make: true,
              model: true,
              year: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: fraudAlerts,
      });
    }

    if (type === 'statistics' && (session.user as any).role === 'admin') {
      // Get fraud detection statistics (admin only)
      const stats = await prisma.fraudAlert.groupBy({
        by: ['alertType', 'severity'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      const totalAlerts = await prisma.fraudAlert.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const resolvedAlerts = await prisma.fraudAlert.count({
        where: {
          status: 'resolved',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          alertsByType: stats,
          totalAlerts,
          resolvedAlerts,
          resolutionRate: totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type or insufficient permissions' }, { status: 400 });
  } catch (error) {
    console.error('Get fraud detection API error:', error);
    return NextResponse.json(
      { error: 'Failed to get fraud detection data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { alertId, status, resolutionNotes } = await request.json();

    if (!alertId || !status) {
      return NextResponse.json({ error: 'Alert ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'investigating', 'resolved', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update fraud alert
    const updatedAlert = await prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        status,
        resolutionNotes,
        resolvedAt: status === 'resolved' ? new Date() : null,
        assignedTo: session.user.id,
      },
    });

    // If resolving a critical alert, might need to take additional actions
    if (status === 'resolved' && updatedAlert.severity === 'critical') {
      // Could trigger additional security measures here
      console.log(`Critical fraud alert ${alertId} resolved by admin ${session.user.id}`);
    }

    return NextResponse.json({
      success: true,
      data: updatedAlert,
      message: 'Fraud alert updated successfully',
    });
  } catch (error) {
    console.error('Update fraud alert API error:', error);
    return NextResponse.json(
      { error: 'Failed to update fraud alert', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}