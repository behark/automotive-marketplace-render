// AI Content Generation API Route

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

    const {
      type,
      listingId,
      language = 'sq',
      tone = 'professional',
      length = 'medium',
      originalContent,
    } = await request.json();

    const validTypes = ['listing_description', 'seo_title', 'social_post', 'email_template', 'ad_copy'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    let listing = null;
    if (listingId) {
      listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { user: true },
      });

      if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      // Verify user owns the listing or is admin
      if (listing.userId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Prepare content generation request
    const contentRequest = {
      type,
      language,
      context: {
        listing,
        user: session.user,
        tone,
        length,
      },
      originalContent,
    };

    // Generate content
    const result = await aiOrchestrator.generateContent(contentRequest);

    // If this is for a listing description, optionally save it
    if (type === 'listing_description' && listingId) {
      const { saveToListing } = await request.json();
      if (saveToListing) {
        await prisma.listing.update({
          where: { id: listingId },
          data: { aiGeneratedDescription: result.content },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Përmbajtja u krijua me sukses',
    });
  } catch (error) {
    console.error('Content generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', details: error.message },
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
    const contentType = searchParams.get('type');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Get generated content history
    const generatedContent = await prisma.generatedContent.findMany({
      where: {
        listingId,
        ...(contentType && { contentType }),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: generatedContent,
    });
  } catch (error) {
    console.error('Get generated content API error:', error);
    return NextResponse.json(
      { error: 'Failed to get generated content', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { contentId, approved, feedback, rating } = await request.json();

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    // Update generated content with user feedback
    const updatedContent = await prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        approved: approved !== undefined ? approved : undefined,
        feedback: feedback || undefined,
        rating: rating || undefined,
        approvedAt: approved ? new Date() : undefined,
        usageCount: approved ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: 'Feedback u ruajt me sukses',
    });
  } catch (error) {
    console.error('Update generated content API error:', error);
    return NextResponse.json(
      { error: 'Failed to update content', details: error.message },
      { status: 500 }
    );
  }
}