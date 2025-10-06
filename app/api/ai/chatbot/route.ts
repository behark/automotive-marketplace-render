// AI Chatbot API Route

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      sessionId,
      context = {},
    } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and session ID are required' }, { status: 400 });
    }

    // Get user session if available
    const session = await getServerSession();
    const userId = session?.user?.id;

    // Prepare chatbot request
    const chatbotRequest = {
      message,
      sessionId,
      userId,
      context: {
        ...context,
        userProfile: session?.user ? {
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        } : null,
      },
    };

    // Process message with chatbot
    const response = await aiOrchestrator.processChatMessage(chatbotRequest);

    // Return response
    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process message',
        details: error.message,
        fallbackResponse: {
          message: 'Më vjen keq, por kam një problem teknik. Ju lutem provoni përsëri ose kontaktoni mbështetjen.',
          intent: 'error',
          confidence: 0.1,
          actions: [],
          suggestions: ['Kontaktoni mbështetjen', 'Provoni përsëri'],
          needsEscalation: true,
          language: 'sq',
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (action === 'history') {
      // Get conversation history
      const history = await aiOrchestrator.services.chatbot.getConversationHistory(sessionId);

      return NextResponse.json({
        success: true,
        data: { messages: history },
      });
    }

    if (action === 'analytics') {
      // Get conversation analytics (admin only)
      const session = await getServerSession();
      if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      const startDate = new Date(searchParams.get('startDate') || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(searchParams.get('endDate') || Date.now());

      const analytics = await aiOrchestrator.services.chatbot.getConversationAnalytics(startDate, endDate);

      return NextResponse.json({
        success: true,
        data: analytics,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Chatbot GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to get chatbot data', details: error.message },
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

    const { action, sessionId, data } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    if (action === 'escalate') {
      // Escalate conversation to human agent
      const { reason = 'User requested human assistance' } = data || {};

      await aiOrchestrator.services.chatbot.escalateToHuman(sessionId, reason);

      return NextResponse.json({
        success: true,
        message: 'Biseda u dërgua tek një agjent njerëzor. Do të kontaktoheni së shpejti.',
      });
    }

    if (action === 'feedback') {
      // Record conversation feedback
      const { rating, helpful, comments } = data || {};

      // Store feedback (this would typically go to analytics database)
      console.log('Chatbot feedback:', {
        sessionId,
        userId: session.user.id,
        rating,
        helpful,
        comments,
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Faleminderit për feedback-un!',
      });
    }

    if (action === 'resolve') {
      // Mark conversation as resolved (admin only)
      if (session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Mark conversation as resolved
      await prisma.chatbotConversation.updateMany({
        where: { sessionId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Conversation marked as resolved',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Chatbot PUT API error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation', details: error.message },
      { status: 500 }
    );
  }
}