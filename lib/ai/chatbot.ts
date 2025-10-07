// Intelligent Customer Support Chatbot for Albanian Automotive Marketplace

import { AIProviderFactory } from './base';
import { aiConfig, albanianLanguageConfig } from './config';
import { prisma } from '@/lib/prisma';

export interface ChatbotRequest {
  message: string;
  sessionId: string;
  userId?: string;
  context?: {
    listingId?: string;
    previousMessages?: ChatMessage[];
    userProfile?: any;
    language?: 'sq' | 'en';
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'human_agent';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  metadata?: any;
}

export interface ChatbotResponse {
  message: string;
  intent: string;
  confidence: number;
  actions: ChatbotAction[];
  suggestions: string[];
  needsEscalation: boolean;
  conversationContext: any;
  language: string;
}

export interface ChatbotAction {
  type: string;
  description: string;
  data?: any;
}

export interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities: ExtractedEntity[];
  sentiment: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

export class AlbanianChatbotService {
  private provider = AIProviderFactory.getProvider(aiConfig.models.chatbot.provider);

  // Albanian automotive knowledge base
  private knowledgeBase = {
    // Common car terms in Albanian
    carTerms: albanianLanguageConfig.carTerms,

    // Common questions and answers in Albanian
    commonQA: {
      'si të blej makinë': {
        intent: 'buying_process',
        response: 'Për të blerë një makinë në platformën tonë: 1) Kërkoni makinën që dëshironi, 2) Kontaktoni shitësin, 3) Takohuni dhe inspektoni makinën, 4) Negociojeni çmimin, 5) Transferoni pronësinë në policë.',
      },
      'si të shisin makinë': {
        intent: 'selling_process',
        response: 'Për të shitur makinën tuaj: 1) Regjistrohuni në platformë, 2) Krijoni një listim me fotografi dhe detaje, 3) Përcaktoni çmimin e duhur, 4) Pregatisni dokumentet, 5) Bisedoni me blerësit e interesuar.',
      },
      'çfarë dokumentesh duhen': {
        intent: 'documents_required',
        response: 'Dokumentet e nevojshme: Librezë makinë, Çertifikatë regjistrimi, Sigurimi, Kontrolli teknik i vlefshëm, Kontratë blerje-shitje (nëse e keni), dhe Dokumenti i identitetit.',
      },
      'si të paguaj': {
        intent: 'payment_methods',
        response: 'Metodat e pagesës: Mund të paguani me para në dorë, transferim bankar, ose të përdorni shërbimin tonë escrow për siguri shtesë.',
      },
    },

    // Automotive expertise for Albania
    albanianMarketInfo: {
      popularBrands: aiConfig.albanianMarket.popularMakes,
      regions: aiConfig.albanianMarket.regions,
      seasonalTrends: aiConfig.albanianMarket.seasonalFactors,
      averagePrices: {
        'BMW 3 Series': '15000-25000',
        'Mercedes C-Class': '18000-30000',
        'Audi A4': '16000-28000',
        'Toyota Corolla': '8000-15000',
        'Volkswagen Golf': '10000-18000',
      },
      importInfo: {
        'Gjermani': 'Makinat nga Gjermania janë të preferuara për cilësinë dhe mirëmbajtjen e mirë.',
        'Italia': 'Makinat italiane janë popullore por kontrolloni historikun e aksidenteve.',
        'Franca': 'Makinat franceze janë ekonomike por pjesët e rezerva mund të jenë të shtrenjta.',
      },
    },
  };

  async processMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
    try {
      const { message, sessionId, userId, context = {} } = request;
      const language = context.language || this.detectLanguage(message);

      // Load or create conversation
      let conversation = await this.getOrCreateConversation(sessionId, userId, language);

      // Analyze user intent
      const intentAnalysis = await this.analyzeIntent(message, context, language);

      // Generate response based on intent
      const response = await this.generateResponse(intentAnalysis, context, language);

      // Save message to conversation
      await this.saveMessage(conversation.id, 'user', message, intentAnalysis);
      await this.saveMessage(conversation.id, 'bot', response.message, null, response);

      // Update conversation status
      await this.updateConversationStatus(conversation.id, response);

      return response;
    } catch (error) {
      console.error('Chatbot processing failed:', error);
      return this.generateFallbackResponse(request.context?.language || 'sq');
    }
  }

  private async analyzeIntent(message: string, context: any, language: string): Promise<IntentAnalysis> {
    const messageLower = message.toLowerCase();

    // First, try rule-based intent detection for common patterns
    const ruleBasedIntent = this.detectIntentByRules(messageLower, language);

    if (ruleBasedIntent.confidence > 0.8) {
      return ruleBasedIntent;
    }

    // Fallback to AI-powered intent analysis
    try {
      const prompt = this.buildIntentAnalysisPrompt(message, language);
      const aiResponse = await this.provider.generateText(prompt, {
        model: aiConfig.models.chatbot.model,
        temperature: 0.3,
        maxTokens: 200,
      });

      const aiIntent = this.parseIntentResponse(aiResponse);
      return this.combineIntentAnalyses(ruleBasedIntent, aiIntent);
    } catch (error) {
      console.error('AI intent analysis failed:', error);
      return ruleBasedIntent;
    }
  }

  private detectIntentByRules(message: string, language: string): IntentAnalysis {
    const entities: ExtractedEntity[] = [];
    let intent = 'general_inquiry';
    let confidence = 0.5;
    let sentiment = 0;
    let urgency: 'low' | 'medium' | 'high' = 'medium';

    // Albanian language patterns
    if (language === 'sq') {
      // Buying intent patterns
      if (/(?:dua të blej|më intereson|çmimi|kushte të blerjes)/i.test(message)) {
        intent = 'buying_inquiry';
        confidence = 0.9;
      }

      // Selling intent patterns
      if (/(?:dua të shes|si të shes|listoj makinën|krikoj listim)/i.test(message)) {
        intent = 'selling_inquiry';
        confidence = 0.9;
      }

      // Technical questions
      if (/(?:problem|defekt|motor|fren|transmision|kushte teknike)/i.test(message)) {
        intent = 'technical_question';
        confidence = 0.8;
      }

      // Price questions
      if (/(?:çmim|kosto|vlerë|sa kushton|negocim)/i.test(message)) {
        intent = 'pricing_question';
        confidence = 0.8;
      }

      // Documentation questions
      if (/(?:dokumente|librezë|certifikatë|regjistrim|policë)/i.test(message)) {
        intent = 'documentation_question';
        confidence = 0.9;
      }

      // Financing questions
      if (/(?:financim|hua|këste|kredi|bankë)/i.test(message)) {
        intent = 'financing_question';
        confidence = 0.8;
      }

      // Urgent patterns
      if (/(?:urgjent|menjëherë|sot|shpejt|me nxitim)/i.test(message)) {
        urgency = 'high';
      }

      // Negative sentiment patterns
      if (/(?:problem|shqetësim|ankesë|i pakënaqur|keq)/i.test(message)) {
        sentiment = -0.5;
        urgency = 'high';
      }

      // Positive sentiment patterns
      if (/(?:i kënaqur|faleminderit|perfekt|i mirë|shkëlqyer)/i.test(message)) {
        sentiment = 0.8;
      }
    }

    // Extract car make/model entities
    const carMakes = aiConfig.albanianMarket.popularMakes;
    carMakes.forEach(make => {
      if (message.toLowerCase().includes(make.toLowerCase())) {
        entities.push({
          type: 'car_make',
          value: make,
          confidence: 0.9,
        });
      }
    });

    // Extract price entities
    const pricePattern = /(\d+(?:\.\d{3})*)\s*(?:euro?|eur|€|lek|lekë)/gi;
    const priceMatches = Array.from(message.matchAll(pricePattern));
    priceMatches.forEach(match => {
      entities.push({
        type: 'price',
        value: match[1],
        confidence: 0.8,
      });
    });

    // Extract year entities
    const yearPattern = /\b(19\d{2}|20\d{2})\b/g;
    const yearMatches = Array.from(message.matchAll(yearPattern));
    yearMatches.forEach(match => {
      entities.push({
        type: 'year',
        value: match[1],
        confidence: 0.9,
      });
    });

    return {
      intent,
      confidence,
      entities,
      sentiment,
      urgency,
    };
  }

  private buildIntentAnalysisPrompt(message: string, language: string): string {
    if (language === 'sq') {
      return `Analizoni këtë mesazh nga një klient në tregun shqiptar të automjeteve dhe ktheni rezultatin në JSON:

Mesazhi: "${message}"

Identifikoni:
1. Qëllimin kryesor (intent)
2. Nivelin e besimit (0-1)
3. Entitetet e rëndësishme (marka, modeli, çmimi, viti)
4. Sentimentin (-1 deri 1)
5. Urgjencën (low/medium/high)

Qëllimet e mundshme:
- buying_inquiry (interesim për blerje)
- selling_inquiry (interesim për shitje)
- pricing_question (pyetje çmimi)
- technical_question (pyetje teknike)
- documentation_question (pyetje dokumentesh)
- financing_question (pyetje financimi)
- complaint (ankesë)
- general_inquiry (pyetje të përgjithshme)

Ktheni në formatin:
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "entities": [{"type": "car_make", "value": "BMW", "confidence": 0.9}],
  "sentiment": -1.0 deri 1.0,
  "urgency": "low|medium|high"
}`;
    } else {
      return `Analyze this message from a customer in the Albanian automotive market and return the result in JSON:

Message: "${message}"

Identify:
1. Primary intent
2. Confidence level (0-1)
3. Important entities (make, model, price, year)
4. Sentiment (-1 to 1)
5. Urgency (low/medium/high)

Possible intents:
- buying_inquiry
- selling_inquiry
- pricing_question
- technical_question
- documentation_question
- financing_question
- complaint
- general_inquiry

Return in format:
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "entities": [{"type": "car_make", "value": "BMW", "confidence": 0.9}],
  "sentiment": -1.0 to 1.0,
  "urgency": "low|medium|high"
}`;
    }
  }

  private parseIntentResponse(response: string): IntentAnalysis {
    try {
      const parsed = JSON.parse(response);
      return {
        intent: parsed.intent || 'general_inquiry',
        confidence: parsed.confidence || 0.5,
        entities: parsed.entities || [],
        sentiment: parsed.sentiment || 0,
        urgency: parsed.urgency || 'medium',
      };
    } catch (error) {
      return {
        intent: 'general_inquiry',
        confidence: 0.5,
        entities: [],
        sentiment: 0,
        urgency: 'medium',
      };
    }
  }

  private combineIntentAnalyses(rulesBased: IntentAnalysis, aiBased: IntentAnalysis): IntentAnalysis {
    // Use the analysis with higher confidence
    if (rulesBased.confidence > aiBased.confidence) {
      return rulesBased;
    }

    // Combine entities from both analyses
    const combinedEntities = [...rulesBased.entities, ...aiBased.entities];
    const uniqueEntities = combinedEntities.filter((entity, index, self) =>
      index === self.findIndex(e => e.type === entity.type && e.value === entity.value)
    );

    return {
      ...aiBased,
      entities: uniqueEntities,
    };
  }

  private async generateResponse(intentAnalysis: IntentAnalysis, context: any, language: string): Promise<ChatbotResponse> {
    const { intent, entities, sentiment, urgency } = intentAnalysis;

    // Check if we have a quick answer in knowledge base
    const quickAnswer = this.getQuickAnswer(intent, language);
    if (quickAnswer) {
      return this.buildChatbotResponse(quickAnswer, intent, intentAnalysis, language);
    }

    // Generate AI-powered response
    const aiResponse = await this.generateAIResponse(intentAnalysis, context, language);
    return aiResponse;
  }

  private getQuickAnswer(intent: string, language: string): string | null {
    if (language === 'sq') {
      const quickAnswers: Record<string, string> = {
        buying_inquiry: 'Mirë se erdhët! Unë jam këtu për t\'ju ndihmuar me blerjen e makinës. Mund të më tregoni çfarë lloj makine po kërkoni dhe buxhetin tuaj?',
        selling_inquiry: 'Faleminderit që zgjodhët platformën tonë për të shitur makinën tuaj! Unë do t\'ju ndihmoj me procesin. A keni fotografi dhe detaje të makinës gati?',
        pricing_question: 'Për çmimin më të saktë, ju lutem më tregoni markën, modelin, vitin dhe kilometrazhin e makinës që ju intereson.',
        documentation_question: 'Dokumentet kryesore që duhen janë: Librezë makine, Çertifikatë regjistrimi, Sigurimi i vlefshëm, Kontrolli teknik, dhe Dokumenti juaj i identitetit.',
        financing_question: 'Ne bashkëpunojmë me disa banka dhe institucione financiare për të ofruar mundësi financimi. A dëshironi të dini më shumë për opcionet?',
        general_inquiry: 'Mirë se erdhët në platformën tonë të automjeteve! Si mund t\'ju ndihmoj sot? Mund të pyesni për blerjen, shitjen, çmimet, ose çdo gjë tjetër.',
      };

      return quickAnswers[intent] || null;
    }

    return null; // English quick answers could be added here
  }

  private async generateAIResponse(intentAnalysis: IntentAnalysis, context: any, language: string): Promise<ChatbotResponse> {
    const prompt = this.buildResponsePrompt(intentAnalysis, context, language);

    try {
      const response = await this.provider.generateText(prompt, {
        model: aiConfig.models.chatbot.model,
        temperature: aiConfig.models.chatbot.temperature,
        maxTokens: aiConfig.models.chatbot.maxTokens,
        systemPrompt: aiConfig.models.chatbot.systemPrompt,
      });

      return this.buildChatbotResponse(response, intentAnalysis.intent, intentAnalysis, language);
    } catch (error) {
      console.error('AI response generation failed:', error);
      return this.generateFallbackResponse(language);
    }
  }

  private buildResponsePrompt(intentAnalysis: IntentAnalysis, context: any, language: string): string {
    const { intent, entities, sentiment, urgency } = intentAnalysis;

    if (language === 'sq') {
      return `Si asistent i ekspert për tregun shqiptar të automjeteve, përgjigjuni në këtë pyetje:

Qëllimi: ${intent}
Entitetet: ${JSON.stringify(entities)}
Sentimenti: ${sentiment}
Urgjenca: ${urgency}

${context.listingId ? `Lidhur me listingun: ${context.listingId}` : ''}

Jepni një përgjigje të dobishme dhe profesionale në shqip. Përfshini:
1. Përgjigje direkte në pyetje
2. Informacion relevant shtesë
3. Hapat e ardhshëm (nëse është e nevojshme)
4. Ofrim ndihmë të mëtejshme

Mbani një ton miqësor dhe profesional. Maksimumi 150 fjalë.`;
    } else {
      return `As an expert assistant for the Albanian automotive market, respond to this inquiry:

Intent: ${intent}
Entities: ${JSON.stringify(entities)}
Sentiment: ${sentiment}
Urgency: ${urgency}

${context.listingId ? `Related to listing: ${context.listingId}` : ''}

Provide a helpful and professional response in English. Include:
1. Direct answer to the question
2. Relevant additional information
3. Next steps (if applicable)
4. Offer further assistance

Maintain a friendly and professional tone. Maximum 150 words.`;
    }
  }

  private buildChatbotResponse(
    message: string,
    intent: string,
    analysis: IntentAnalysis,
    language: string
  ): ChatbotResponse {
    const actions = this.generateActions(intent, analysis.entities);
    const suggestions = this.generateSuggestions(intent, language);
    const needsEscalation = this.determineEscalationNeed(analysis);

    return {
      message: message.trim(),
      intent,
      confidence: analysis.confidence,
      actions,
      suggestions,
      needsEscalation,
      conversationContext: {
        lastIntent: intent,
        entities: analysis.entities,
        sentiment: analysis.sentiment,
      },
      language,
    };
  }

  private generateActions(intent: string, entities: ExtractedEntity[]): ChatbotAction[] {
    const actions: ChatbotAction[] = [];

    switch (intent) {
      case 'buying_inquiry':
        actions.push({
          type: 'search_suggestions',
          description: 'Suggest relevant car listings',
          data: { entities },
        });
        break;

      case 'selling_inquiry':
        actions.push({
          type: 'create_listing_help',
          description: 'Guide user through listing creation',
        });
        break;

      case 'pricing_question':
        actions.push({
          type: 'price_analysis',
          description: 'Provide market price analysis',
          data: { entities },
        });
        break;

      case 'documentation_question':
        actions.push({
          type: 'document_checklist',
          description: 'Provide documentation checklist',
        });
        break;
    }

    return actions;
  }

  private generateSuggestions(intent: string, language: string): string[] {
    if (language === 'sq') {
      const suggestions: Record<string, string[]> = {
        buying_inquiry: [
          'Shikoni makinat e rekomanduara për ju',
          'Mësoni më shumë për procesin e blerjes',
          'Kontaktoni një këshilltar',
        ],
        selling_inquiry: [
          'Krijoni një listim të ri',
          'Mësoni si të bëni fotografi të mira',
          'Shikoni këshillat për çmimin',
        ],
        pricing_question: [
          'Krahasoni çmimet e ngjashme',
          'Marr vlerësim falas të makinës',
          'Mësoni për negocimin',
        ],
        general_inquiry: [
          'Shikoni pyetjet e shpeshta',
          'Kontaktoni mbështetjen',
          'Mësoni më shumë për platformën',
        ],
      };

      return suggestions[intent] || suggestions.general_inquiry;
    }

    return [
      'Browse recommended cars',
      'Learn about our services',
      'Contact support',
    ];
  }

  private determineEscalationNeed(analysis: IntentAnalysis): boolean {
    // Escalate if sentiment is very negative
    if (analysis.sentiment < -0.7) return true;

    // Escalate if high urgency and specific intents
    if (analysis.urgency === 'high' && ['complaint', 'technical_question'].includes(analysis.intent)) {
      return true;
    }

    // Escalate if confidence is very low
    if (analysis.confidence < 0.3) return true;

    return false;
  }

  private generateFallbackResponse(language: string): ChatbotResponse {
    const message = language === 'sq' ?
      'Më vjen keq, por nuk e kuptova plotësisht pyetjen tuaj. Mund ta formuloni ndryshe ose të kontaktoni ekipin tonë për ndihmë?' :
      'I\'m sorry, but I didn\'t fully understand your question. Could you rephrase it or contact our support team for help?';

    return {
      message,
      intent: 'unclear',
      confidence: 0.1,
      actions: [],
      suggestions: language === 'sq' ?
        ['Kontaktoni mbështetjen', 'Shikoni pyetjet e shpeshta'] :
        ['Contact support', 'View FAQ'],
      needsEscalation: true,
      conversationContext: {},
      language,
    };
  }

  private detectLanguage(message: string): 'sq' | 'en' {
    const albanianWords = ['dhe', 'ose', 'por', 'në', 'me', 'nga', 'për', 'të', 'është', 'kam', 'makinë', 'automjet'];
    const words = message.toLowerCase().split(/\s+/);
    const albanianWordCount = words.filter(word => albanianWords.includes(word)).length;

    return (albanianWordCount / words.length) > 0.1 ? 'sq' : 'en';
  }

  private async getOrCreateConversation(sessionId: string, userId?: string, language: string = 'sq') {
    let conversation = await prisma.chatbotConversation.findFirst({
      where: { sessionId },
    });

    if (!conversation) {
      conversation = await prisma.chatbotConversation.create({
        data: {
          sessionId,
          userId,
          language,
          status: 'active',
        },
      });
    }

    return conversation;
  }

  private async saveMessage(
    conversationId: string,
    sender: 'user' | 'bot' | 'human_agent',
    content: string,
    intentAnalysis?: IntentAnalysis | null,
    response?: ChatbotResponse | null
  ): Promise<void> {
    await prisma.chatbotMessage.create({
      data: {
        conversationId,
        sender,
        content,
        intent: intentAnalysis?.intent || response?.intent,
        confidence: intentAnalysis?.confidence || response?.confidence,
        context: intentAnalysis ? JSON.parse(JSON.stringify({
          entities: intentAnalysis.entities,
          sentiment: intentAnalysis.sentiment,
          urgency: intentAnalysis.urgency,
        })) : undefined,
        needsEscalation: response?.needsEscalation || false,
      },
    });
  }

  private async updateConversationStatus(conversationId: string, response: ChatbotResponse): Promise<void> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (response.needsEscalation) {
      updateData.status = 'escalated';
      updateData.escalatedAt = new Date();
    }

    // Detect conversation category
    if (response.intent) {
      const categoryMap: Record<string, string> = {
        buying_inquiry: 'buying',
        selling_inquiry: 'selling',
        pricing_question: 'pricing',
        technical_question: 'technical',
        documentation_question: 'documentation',
        financing_question: 'financing',
        complaint: 'complaint',
      };

      updateData.category = categoryMap[response.intent] || 'general';
    }

    await prisma.chatbotConversation.update({
      where: { id: conversationId },
      data: updateData,
    });
  }

  // Get conversation history
  async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    const conversation = await prisma.chatbotConversation.findFirst({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) return [];

    return conversation.messages.map(msg => ({
      id: msg.id,
      sender: msg.sender as 'user' | 'bot' | 'human_agent',
      content: msg.content,
      timestamp: msg.createdAt,
      intent: msg.intent || undefined,
      confidence: msg.confidence || undefined,
      metadata: msg.context,
    }));
  }

  // Escalate to human agent
  async escalateToHuman(sessionId: string, reason: string): Promise<void> {
    await prisma.chatbotConversation.updateMany({
      where: { sessionId },
      data: {
        status: 'escalated',
        escalatedAt: new Date(),
      },
    });

    // In a real implementation, this would notify human agents
    console.log(`Conversation ${sessionId} escalated to human agent. Reason: ${reason}`);
  }

  // Analytics methods
  async getConversationAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const conversations = await prisma.chatbotConversation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        messages: true,
      },
    });

    const totalConversations = conversations.length;
    const escalatedConversations = conversations.filter(c => c.status === 'escalated').length;
    const resolvedConversations = conversations.filter(c => c.status === 'resolved').length;
    const avgMessagesPerConversation = conversations.reduce((sum, c) => sum + c.messages.length, 0) / totalConversations;

    const intentDistribution = conversations.reduce((acc, conversation) => {
      const category = conversation.category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalConversations,
      escalatedConversations,
      resolvedConversations,
      escalationRate: (escalatedConversations / totalConversations) * 100,
      resolutionRate: (resolvedConversations / totalConversations) * 100,
      avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 100) / 100,
      intentDistribution,
    };
  }
}

export default AlbanianChatbotService;