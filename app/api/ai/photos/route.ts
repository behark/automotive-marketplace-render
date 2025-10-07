// AI Photo Enhancement API Route

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

    const { action, listingId, imagePath, images } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Verify user owns the listing or is admin
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'analyze_single') {
      if (!imagePath) {
        return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
      }

      // Analyze single photo
      const result = await aiOrchestrator.services.photoEnhancement.analyzePhoto(imagePath, listingId);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Analiza e fotografisë u kompletua me sukses',
      });
    }

    if (action === 'analyze_sequence') {
      if (!images || !Array.isArray(images)) {
        return NextResponse.json({ error: 'Images array is required' }, { status: 400 });
      }

      // Analyze photo sequence
      const result = await aiOrchestrator.services.photoEnhancement.analyzePhotoSequence(images, listingId);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Analiza e sekuencës së fotografive u kompletua me sukses',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Photo enhancement API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze photos', details: error instanceof Error ? error.message : String(error) },
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

    // Get photo quality analysis
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        userId: true,
        photoQualityScores: true,
        qualityScore: true,
        images: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Verify access (owner or admin can view)
    if (listing.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        overallQualityScore: listing.qualityScore,
        photoQualityScores: listing.photoQualityScores,
        totalPhotos: Array.isArray(listing.images) ? listing.images.length : 0,
      },
    });
  } catch (error) {
    console.error('Get photo analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to get photo analysis', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}