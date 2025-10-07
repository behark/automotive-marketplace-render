// Fraud Detection & Content Moderation System for Albanian Automotive Marketplace

import { AIProviderFactory } from './base';
import { aiConfig } from './config';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface FraudAnalysisResult {
  riskScore: number; // 0-100, higher = more suspicious
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: FraudFlag[];
  recommendation: 'approve' | 'review' | 'reject' | 'investigate';
  reasoning: string;
  confidence: number;
  autoActions: string[];
}

export interface FraudFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: any;
  confidence: number;
}

export interface ContentModerationResult {
  approved: boolean;
  flags: string[];
  confidence: number;
  language: string;
  sentiment: number;
  culturalAppropriate: boolean;
  autoModerated: boolean;
  humanReviewRequired: boolean;
  suggestions: string[];
}

export class FraudDetectionService {
  private provider = AIProviderFactory.getProvider(aiConfig.models.fraud.provider);

  async analyzeListing(listingId: string): Promise<FraudAnalysisResult> {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          user: {
            include: {
              verification: true,
              reviews: true,
              securityLogs: true,
            },
          },
        },
      });

      if (!listing) {
        throw new Error('Listing not found');
      }

      // Run multiple fraud detection checks in parallel
      const [
        pricingAnalysis,
        contentAnalysis,
        userAnalysis,
        duplicateAnalysis,
        imageAnalysis,
        behaviorAnalysis,
      ] = await Promise.all([
        this.analyzePricingFraud(listing),
        this.analyzeContentFraud(listing),
        this.analyzeUserFraud(listing.user),
        this.analyzeDuplicateContent(listing),
        this.analyzeImageFraud(listing),
        this.analyzeBehaviorFraud(listing.user),
      ]);

      // Combine all analyses
      const allFlags = [
        ...pricingAnalysis.flags,
        ...contentAnalysis.flags,
        ...userAnalysis.flags,
        ...duplicateAnalysis.flags,
        ...imageAnalysis.flags,
        ...behaviorAnalysis.flags,
      ];

      // Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore(allFlags);
      const riskLevel = this.determineRiskLevel(riskScore);
      const recommendation = this.determineRecommendation(riskLevel, allFlags);

      const result: FraudAnalysisResult = {
        riskScore,
        riskLevel,
        flags: allFlags,
        recommendation,
        reasoning: this.generateFraudReasoning(allFlags, riskLevel),
        confidence: this.calculateConfidence(allFlags),
        autoActions: this.determineAutoActions(riskLevel, allFlags),
      };

      // Save fraud analysis to database
      await this.saveFraudAnalysis(listingId, result);

      // Execute auto-actions if needed
      await this.executeAutoActions(listingId, result);

      return result;
    } catch (error) {
      console.error('Fraud analysis failed:', error);
      throw new Error(`Fraud analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzePricingFraud(listing: any): Promise<{ flags: FraudFlag[] }> {
    const flags: FraudFlag[] = [];

    // Get market data for comparison
    const marketData = await prisma.marketData.findFirst({
      where: {
        make: listing.make,
        model: listing.model,
        year: listing.year,
        region: listing.region || listing.city,
      },
    });

    if (marketData) {
      const averagePrice = marketData.averagePrice;
      const priceDifference = (listing.price - averagePrice) / averagePrice;

      // Suspiciously low price
      if (priceDifference < -0.4) { // 40% below market
        flags.push({
          type: 'suspicious_low_price',
          severity: 'high',
          description: `Çmimi është ${Math.abs(priceDifference * 100).toFixed(0)}% nën mesataren e tregut`,
          evidence: {
            listingPrice: listing.price,
            marketAverage: averagePrice,
            deviation: priceDifference,
          },
          confidence: 0.9,
        });
      }

      // Suspiciously high price
      if (priceDifference > 0.5) { // 50% above market
        flags.push({
          type: 'suspicious_high_price',
          severity: 'medium',
          description: `Çmimi është ${(priceDifference * 100).toFixed(0)}% mbi mesataren e tregut`,
          evidence: {
            listingPrice: listing.price,
            marketAverage: averagePrice,
            deviation: priceDifference,
          },
          confidence: 0.8,
        });
      }
    }

    // Round number pricing (potential automated pricing)
    if (listing.price % 100000 === 0) { // Perfectly round numbers like 1000000 (10,000 EUR)
      flags.push({
        type: 'round_number_pricing',
        severity: 'low',
        description: 'Çmimi është numër i rrumbullakët, mund të jetë automatik',
        evidence: { price: listing.price },
        confidence: 0.6,
      });
    }

    return { flags };
  }

  private async analyzeContentFraud(listing: any): Promise<{ flags: FraudFlag[] }> {
    const flags: FraudFlag[] = [];

    // AI-powered content analysis
    const contentPrompt = `Analizoni këtë përshkrim automjeti për shenja mashtrimi në shqip:

    Titulli: "${listing.title}"
    Përshkrimi: "${listing.description}"

    Kontrolloni për:
    - Informacione kontradiktore
    - Premtime të paqena (si "pa aksidente" pa prova)
    - Gjuhë të dyshimtë
    - Mungesë detajesh të rëndësishme
    - Urgjencë artificiale ("shitet sot")
    - Kontakte të shumëfishta

    Ktheni në JSON: {"fraudRisk": 0-1, "flags": ["flag1"], "explanation": "shpjegim"}`;

    try {
      const aiResponse = await this.provider.analyzeText(listing.description + ' ' + listing.title, {
        task: 'fraud_detection',
      });

      if (aiResponse.fraudRisk > 0.7) {
        flags.push({
          type: 'ai_content_fraud',
          severity: 'high',
          description: 'AI ka zbuluar përmbajtje të dyshimtë',
          evidence: aiResponse,
          confidence: aiResponse.fraudRisk || 0.8,
        });
      }
    } catch (error) {
      console.error('AI content analysis failed:', error);
    }

    // Text pattern analysis
    const text = (listing.title + ' ' + listing.description).toLowerCase();

    // Common fraud patterns in Albanian
    const fraudPatterns = [
      { pattern: /urgjent|shitet sot|mbyllet sot/i, type: 'urgency_fraud', severity: 'medium' as const },
      { pattern: /pa aksident|pa aksidente/i, type: 'unverified_claims', severity: 'low' as const },
      { pattern: /import|doganë|zyrë|zyrtare/i, type: 'import_claims', severity: 'low' as const },
      { pattern: /garantë|garanci|warranty/i, type: 'warranty_claims', severity: 'low' as const },
      { pattern: /një pronare|një pronar|një zot/i, type: 'ownership_claims', severity: 'low' as const },
    ];

    fraudPatterns.forEach(({ pattern, type, severity }) => {
      if (pattern.test(text)) {
        flags.push({
          type,
          severity,
          description: `Tekst i dyshimtë: ${pattern.source}`,
          evidence: { pattern: pattern.source, matches: text.match(pattern) },
          confidence: 0.7,
        });
      }
    });

    // Missing critical information
    const criticalFields = ['mileage', 'year', 'fuelType', 'transmission'];
    const missingFields = criticalFields.filter(field => !listing[field]);

    if (missingFields.length > 2) {
      flags.push({
        type: 'missing_critical_info',
        severity: 'medium',
        description: `Mungojnë informacione të rëndësishme: ${missingFields.join(', ')}`,
        evidence: { missingFields },
        confidence: 0.8,
      });
    }

    return { flags };
  }

  private async analyzeUserFraud(user: any): Promise<{ flags: FraudFlag[] }> {
    const flags: FraudFlag[] = [];

    // New user with expensive listing
    const userAge = Date.now() - user.createdAt.getTime();
    const isNewUser = userAge < 7 * 24 * 60 * 60 * 1000; // 7 days

    if (isNewUser) {
      flags.push({
        type: 'new_user_account',
        severity: 'medium',
        description: 'Llogari e re (krijuar brenda 7 ditëve)',
        evidence: { createdAt: user.createdAt, ageInDays: userAge / (24 * 60 * 60 * 1000) },
        confidence: 0.9,
      });
    }

    // Unverified user
    if (!user.verification?.phoneVerified && !user.verification?.idVerified) {
      flags.push({
        type: 'unverified_user',
        severity: 'high',
        description: 'Përdorues i paverifikuar (as telefon as ID)',
        evidence: { phoneVerified: false, idVerified: false },
        confidence: 0.95,
      });
    }

    // Multiple listings with same patterns
    const userListings = await prisma.listing.count({
      where: { userId: user.id, status: 'active' },
    });

    if (userListings > 10) {
      flags.push({
        type: 'high_volume_seller',
        severity: 'medium',
        description: `Përdorues me shumë listingje aktive (${userListings})`,
        evidence: { activeListings: userListings },
        confidence: 0.7,
      });
    }

    // Suspicious security events
    const suspiciousLogs = await prisma.securityLog.count({
      where: {
        userId: user.id,
        riskLevel: { in: ['high', 'critical'] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    if (suspiciousLogs > 0) {
      flags.push({
        type: 'suspicious_security_events',
        severity: 'high',
        description: `${suspiciousLogs} ngjarje të dyshimta sigurie në 30 ditët e fundit`,
        evidence: { suspiciousEvents: suspiciousLogs },
        confidence: 0.8,
      });
    }

    return { flags };
  }

  private async analyzeDuplicateContent(listing: any): Promise<{ flags: FraudFlag[] }> {
    const flags: FraudFlag[] = [];

    // Check for duplicate titles
    const duplicateTitles = await prisma.listing.count({
      where: {
        title: listing.title,
        id: { not: listing.id },
        status: 'active',
      },
    });

    if (duplicateTitles > 0) {
      flags.push({
        type: 'duplicate_title',
        severity: 'high',
        description: `Titull i dublikuar në ${duplicateTitles} listingje të tjera`,
        evidence: { duplicateCount: duplicateTitles },
        confidence: 0.9,
      });
    }

    // Check for similar descriptions (simplified)
    const descriptionHash = crypto.createHash('md5').update(listing.description).digest('hex');
    const similarDescriptions = await prisma.listing.count({
      where: {
        description: listing.description,
        id: { not: listing.id },
        status: 'active',
      },
    });

    if (similarDescriptions > 0) {
      flags.push({
        type: 'duplicate_description',
        severity: 'critical',
        description: `Përshkrim identik në ${similarDescriptions} listingje të tjera`,
        evidence: { duplicateCount: similarDescriptions },
        confidence: 0.95,
      });
    }

    return { flags };
  }

  private async analyzeImageFraud(listing: any): Promise<{ flags: FraudFlag[] }> {
    const flags: FraudFlag[] = [];

    if (!listing.images || !Array.isArray(listing.images) || listing.images.length === 0) {
      flags.push({
        type: 'no_images',
        severity: 'high',
        description: 'Nuk ka imazhe - e dyshimtë për automjete',
        evidence: { imageCount: 0 },
        confidence: 0.9,
      });

      return { flags };
    }

    // Too few images
    if (listing.images.length < 3) {
      flags.push({
        type: 'insufficient_images',
        severity: 'medium',
        description: `Shumë pak imazhe (${listing.images.length})`,
        evidence: { imageCount: listing.images.length },
        confidence: 0.7,
      });
    }

    // Check for stock/generic images (simplified detection)
    const genericImagePatterns = [
      /stock/i,
      /generic/i,
      /placeholder/i,
      /example/i,
      /default/i,
    ];

    let stockImageCount = 0;
    listing.images.forEach((imagePath: string) => {
      if (genericImagePatterns.some(pattern => pattern.test(imagePath))) {
        stockImageCount++;
      }
    });

    if (stockImageCount > 0) {
      flags.push({
        type: 'stock_images',
        severity: 'critical',
        description: `${stockImageCount} imazhe që duken si stock/generike`,
        evidence: { stockImageCount },
        confidence: 0.8,
      });
    }

    return { flags };
  }

  private async analyzeBehaviorFraud(user: any): Promise<{ flags: FraudFlag[] }> {
    const flags: FraudFlag[] = [];

    // Rapid listing creation
    const recentListings = await prisma.listing.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
    });

    if (recentListings > 5) {
      flags.push({
        type: 'rapid_listing_creation',
        severity: 'high',
        description: `${recentListings} listingje të krijuara në 24 orët e fundit`,
        evidence: { listingsLast24h: recentListings },
        confidence: 0.8,
      });
    }

    // Inactive user suddenly active
    const userActivityGap = await this.calculateActivityGap(user.id);
    if (userActivityGap > 90) { // Inactive for 90+ days
      flags.push({
        type: 'dormant_account_reactivation',
        severity: 'medium',
        description: `Llogari që ka qenë joaktive për ${userActivityGap} ditë`,
        evidence: { inactiveDays: userActivityGap },
        confidence: 0.7,
      });
    }

    return { flags };
  }

  private calculateOverallRiskScore(flags: FraudFlag[]): number {
    if (flags.length === 0) return 0;

    const severityWeights = {
      low: 1,
      medium: 2,
      high: 4,
      critical: 8,
    };

    const totalWeight = flags.reduce((sum, flag) => {
      return sum + (severityWeights[flag.severity] * flag.confidence);
    }, 0);

    // Normalize to 0-100 scale
    const maxPossibleWeight = flags.length * 8; // All critical with confidence 1.0
    return Math.min(100, (totalWeight / maxPossibleWeight) * 100);
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  private determineRecommendation(riskLevel: string, flags: FraudFlag[]): 'approve' | 'review' | 'reject' | 'investigate' {
    const criticalFlags = flags.filter(f => f.severity === 'critical');
    const highFlags = flags.filter(f => f.severity === 'high');

    if (criticalFlags.length > 0 || riskLevel === 'critical') {
      return 'investigate';
    }

    if (highFlags.length >= 2 || riskLevel === 'high') {
      return 'reject';
    }

    if (riskLevel === 'medium') {
      return 'review';
    }

    return 'approve';
  }

  private generateFraudReasoning(flags: FraudFlag[], riskLevel: string): string {
    if (flags.length === 0) {
      return 'Nuk u gjetën shenja mashtrimi.';
    }

    const topFlags = flags
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 3);

    const reasons = topFlags.map(flag => flag.description).join('; ');

    return `Niveli i riskut: ${riskLevel}. Arsyet kryesore: ${reasons}`;
  }

  private calculateConfidence(flags: FraudFlag[]): number {
    if (flags.length === 0) return 0.9; // High confidence in no fraud

    const avgConfidence = flags.reduce((sum, flag) => sum + flag.confidence, 0) / flags.length;
    return avgConfidence;
  }

  private determineAutoActions(riskLevel: string, flags: FraudFlag[]): string[] {
    const actions: string[] = [];

    if (riskLevel === 'critical') {
      actions.push('suspend_listing', 'flag_for_manual_review', 'notify_admin');
    } else if (riskLevel === 'high') {
      actions.push('require_additional_verification', 'flag_for_manual_review');
    } else if (riskLevel === 'medium') {
      actions.push('request_user_clarification');
    }

    // Specific actions based on flag types
    const flagTypes = flags.map(f => f.type);

    if (flagTypes.includes('duplicate_description')) {
      actions.push('remove_duplicate_content');
    }

    if (flagTypes.includes('unverified_user')) {
      actions.push('require_phone_verification');
    }

    return actions;
  }

  private async saveFraudAnalysis(listingId: string, result: FraudAnalysisResult): Promise<void> {
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        fraudRiskScore: result.riskScore,
        contentModerationFlags: {
          riskLevel: result.riskLevel,
          flags: result.flags.map(f => ({ type: f.type, severity: f.severity })),
          recommendation: result.recommendation,
          autoActions: result.autoActions,
        },
      },
    });

    // Create fraud alert if high risk
    if (result.riskLevel === 'high' || result.riskLevel === 'critical') {
      await prisma.fraudAlert.create({
        data: {
          listingId,
          alertType: 'automated_detection',
          severity: result.riskLevel,
          description: result.reasoning,
          evidence: JSON.parse(JSON.stringify({
            riskScore: result.riskScore,
            flags: result.flags,
            confidence: result.confidence,
          })),
          autoGenerated: true,
        },
      });
    }
  }

  private async executeAutoActions(listingId: string, result: FraudAnalysisResult): Promise<void> {
    for (const action of result.autoActions) {
      try {
        switch (action) {
          case 'suspend_listing':
            await this.suspendListing(listingId, 'Suspended due to fraud risk');
            break;
          case 'flag_for_manual_review':
            await this.flagForManualReview(listingId, result);
            break;
          case 'require_additional_verification':
            await this.requireAdditionalVerification(listingId);
            break;
          case 'notify_admin':
            await this.notifyAdmin(listingId, result);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute auto action ${action}:`, error);
      }
    }
  }

  private async suspendListing(listingId: string, reason: string): Promise<void> {
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'expired', // or create a 'suspended' status
      },
    });
  }

  private async flagForManualReview(listingId: string, result: FraudAnalysisResult): Promise<void> {
    // This would integrate with an admin review system
    console.log(`Listing ${listingId} flagged for manual review:`, result.reasoning);
  }

  private async requireAdditionalVerification(listingId: string): Promise<void> {
    // This would send a notification to the user requiring more verification
    console.log(`Additional verification required for listing ${listingId}`);
  }

  private async notifyAdmin(listingId: string, result: FraudAnalysisResult): Promise<void> {
    // This would send an alert to administrators
    console.log(`Admin notification for listing ${listingId}:`, result);
  }

  private async calculateActivityGap(userId: string): Promise<number> {
    const lastActivity = await prisma.userInteraction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastActivity) return 0;

    const daysSinceLastActivity = (Date.now() - lastActivity.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    return Math.floor(daysSinceLastActivity);
  }

  // Batch processing for all listings
  async processAllListings(): Promise<void> {
    const listings = await prisma.listing.findMany({
      where: {
        status: 'active',
        fraudRiskScore: null, // Not yet analyzed
      },
      take: aiConfig.processing.batchSize,
    });

    for (const listing of listings) {
      try {
        await this.analyzeListing(listing.id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`Failed to analyze listing ${listing.id}:`, error);
      }
    }
  }
}

export class ContentModerationService {
  private provider = AIProviderFactory.getProvider(aiConfig.models.content.provider);

  async moderateContent(
    content: string,
    contentType: 'listing' | 'review' | 'message' | 'profile',
    userId?: string
  ): Promise<ContentModerationResult> {
    try {
      // AI-powered content moderation
      const moderationPrompt = `Moderoni këtë përmbajtje në shqip për tregun e automjeteve:

      Përmbajtja: "${content}"
      Tipi: ${contentType}

      Kontrolloni për:
      - Gjuhë e papërshtatshme
      - Përmbajtje seksuale ose dhunë
      - Diskriminim ose fyerje
      - Spam ose reklamë
      - Informacione të rreme
      - Përmbajtje jo-relevante për automjetet
      - Cilësia e gjuhës shqipe

      Ktheni në JSON: {
        "approved": boolean,
        "flags": ["flag1", "flag2"],
        "confidence": 0-1,
        "culturalAppropriate": boolean,
        "suggestions": ["sugjerim1"]
      }`;

      const aiResult = await this.provider.analyzeText(content, {
        task: 'content_moderation',
      });

      // Apply additional Albanian-specific rules
      const albanianResult = this.applyAlbanianModerationRules(content, aiResult);

      // Save moderation result
      if (userId) {
        await this.saveModerationResult(contentType, content, userId, albanianResult);
      }

      return albanianResult;
    } catch (error) {
      console.error('Content moderation failed:', error);

      // Fallback to basic moderation
      return {
        approved: false,
        flags: ['moderation_error'],
        confidence: 0.5,
        language: 'unknown',
        sentiment: 0,
        culturalAppropriate: true,
        autoModerated: false,
        humanReviewRequired: true,
        suggestions: ['Ju lutemi kontaktoni administratorët për verifikim manual.'],
      };
    }
  }

  private applyAlbanianModerationRules(content: string, aiResult: any): ContentModerationResult {
    const flags: string[] = [...(aiResult.flags || [])];
    let approved = aiResult.approved !== false;
    let culturalAppropriate = aiResult.culturalAppropriate !== false;

    // Albanian-specific offensive words (simplified list)
    const offensiveWords = ['budalla', 'hajvan', 'idiot', 'injorant'];
    const hasOffensiveWords = offensiveWords.some(word =>
      content.toLowerCase().includes(word)
    );

    if (hasOffensiveWords) {
      flags.push('offensive_language_albanian');
      approved = false;
    }

    // Cultural appropriateness for Albanian market
    const culturallyInappropriate = [
      /politik/i, // Avoid political content
      /fetare/i,  // Avoid religious content
      /luftë/i,   // Avoid war references
    ];

    if (culturallyInappropriate.some(pattern => pattern.test(content))) {
      flags.push('culturally_inappropriate');
      culturalAppropriate = false;
    }

    // Language quality check
    const albanianTextQuality = this.assessAlbanianTextQuality(content);

    return {
      approved,
      flags,
      confidence: aiResult.confidence || 0.8,
      language: this.detectLanguage(content),
      sentiment: this.analyzeSentiment(content),
      culturalAppropriate,
      autoModerated: true,
      humanReviewRequired: !approved || flags.length > 2,
      suggestions: this.generateSuggestions(flags, content),
    };
  }

  private assessAlbanianTextQuality(content: string): number {
    // Simple quality assessment
    const hasProperCapitalization = /^[A-ZËÇË]/.test(content);
    const hasProperPunctuation = /[.!?]$/.test(content.trim());
    const wordCount = content.split(/\s+/).length;
    const avgWordLength = content.replace(/\s+/g, '').length / wordCount;

    let qualityScore = 0.5; // Base score

    if (hasProperCapitalization) qualityScore += 0.1;
    if (hasProperPunctuation) qualityScore += 0.1;
    if (wordCount >= 5) qualityScore += 0.1;
    if (avgWordLength >= 4 && avgWordLength <= 8) qualityScore += 0.1;

    return Math.min(1, qualityScore);
  }

  private detectLanguage(content: string): string {
    // Simple Albanian language detection
    const albanianWords = ['dhe', 'ose', 'por', 'në', 'me', 'nga', 'për', 'të', 'është', 'kam', 'ke', 'ka'];
    const words = content.toLowerCase().split(/\s+/);
    const albanianWordCount = words.filter(word => albanianWords.includes(word)).length;

    return (albanianWordCount / words.length) > 0.1 ? 'sq' : 'unknown';
  }

  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis for Albanian
    const positiveWords = ['i mirë', 'bukur', 'shkëlqyer', 'perfekt', 'të mira'];
    const negativeWords = ['i keq', 'problem', 'dëmtim', 'rrezik', 'gabim'];

    const words = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => words.includes(word)).length;
    const negativeCount = negativeWords.filter(word => words.includes(word)).length;

    return (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount);
  }

  private generateSuggestions(flags: string[], content: string): string[] {
    const suggestions: string[] = [];

    if (flags.includes('offensive_language_albanian')) {
      suggestions.push('Ju lutemi përdorni gjuhë më të përshtatshme.');
    }

    if (flags.includes('culturally_inappropriate')) {
      suggestions.push('Shmangni temat politike dhe fetare.');
    }

    if (flags.includes('spam')) {
      suggestions.push('Mos përsëritni të njëjtin përmbajtje në listingje të ndryshme.');
    }

    if (content.length < 50) {
      suggestions.push('Shtoni më shumë detaje për të bërë listingun tuaj më tërheqës.');
    }

    return suggestions;
  }

  private async saveModerationResult(
    contentType: string,
    content: string,
    userId: string,
    result: ContentModerationResult
  ): Promise<void> {
    await prisma.contentModeration.create({
      data: {
        contentType,
        contentId: 'pending', // Would be set after content creation
        userId,
        aiModerationScore: 1 - result.confidence,
        aiFlags: result.flags,
        languageDetected: result.language,
        sentimentScore: result.sentiment,
        culturalAppropriate: result.culturalAppropriate,
        fraudRisk: result.approved ? 'low' : 'medium',
        humanReviewed: false,
        actionTaken: result.approved ? 'none' : 'content_flagged',
      },
    });
  }
}

const fraudDetectionService = new FraudDetectionService();
const contentModerationService = new ContentModerationService();

export {
  fraudDetectionService,
  contentModerationService,
};