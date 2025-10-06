import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Albanian Content Moderation System
 * AI-powered content filtering with Albanian language support
 */
export class ContentModerationService {
  /**
   * Albanian profanity and inappropriate content patterns
   */
  private static readonly ALBANIAN_PROFANITY = [
    // Albanian curse words and inappropriate terms
    'idiot', 'budall', 'hajvan', 'mut', 'qen', 'kafshë',
    'pis', 'i ndyrë', 'i poshtër', 'mashtro', 'shit',
    // Add more as needed, properly escaped
  ]

  private static readonly SPAM_PATTERNS = [
    /(?:whatsapp|viber|telegram)\s*:?\s*[\+]?\d+/gi,
    /(?:call|thirr|tel)\s*:?\s*[\+]?\d+/gi,
    /(?:email|mail)\s*:?\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    /(?:facebook|instagram|tiktok)\.com\/\w+/gi,
    /(?:ka më shumë|contact me|më kontaktoni)/gi
  ]

  private static readonly FRAUD_INDICATORS = [
    /(?:urgently|urgjent|shpejt|menjëherë).+(?:sell|shit)/gi,
    /(?:desperate|i dëshpëruar|me detyrim).+(?:money|para)/gi,
    /(?:accident|aksident|problem).+(?:cheap|lirë)/gi,
    /(?:leaving country|duke u larguar|emigroj)/gi,
    /(?:below market|nën çmim|shumë lirë)/gi
  ]

  /**
   * Moderate content with AI analysis
   */
  static async moderateContent(
    contentType: 'listing' | 'review' | 'message' | 'profile',
    contentId: string,
    content: string,
    userId?: string,
    language: string = 'sq'
  ): Promise<{
    approved: boolean
    moderationScore: number
    flags: string[]
    action: 'approved' | 'flagged' | 'rejected' | 'requires_review'
  }> {
    try {
      // Perform AI moderation analysis
      const analysis = await this.analyzeContent(content, language)

      // Create moderation record
      const moderation = await prisma.contentModeration.create({
        data: {
          contentType,
          contentId,
          userId,
          aiModerationScore: analysis.moderationScore,
          aiFlags: analysis.flags,
          languageDetected: analysis.detectedLanguage,
          sentimentScore: analysis.sentimentScore,
          culturalAppropriate: analysis.culturalAppropriate,
          localLanguageQuality: analysis.languageQuality,
          regionalRelevance: analysis.regionalRelevance,
          spamScore: analysis.spamScore,
          fraudRisk: analysis.fraudRisk,
          duplicateContent: analysis.isDuplicate,
          suspiciousPatterns: analysis.suspiciousPatterns
        }
      })

      // Determine action based on analysis
      const action = this.determineAction(analysis)

      // Auto-approve, flag, or reject based on scores
      let approved = false
      if (action === 'approved') {
        approved = true
        await this.autoApproveContent(moderation.id)
      } else if (action === 'rejected') {
        await this.autoRejectContent(moderation.id, analysis.flags)
      } else {
        await this.flagForReview(moderation.id, analysis.flags)
      }

      return {
        approved,
        moderationScore: analysis.moderationScore,
        flags: analysis.flags,
        action
      }
    } catch (error) {
      console.error('Content moderation failed:', error)
      // Default to flagging for manual review on error
      return {
        approved: false,
        moderationScore: 0.8,
        flags: ['moderation_error'],
        action: 'requires_review'
      }
    }
  }

  /**
   * Analyze content with Albanian language AI
   */
  private static async analyzeContent(content: string, language: string): Promise<{
    moderationScore: number
    flags: string[]
    detectedLanguage: string
    sentimentScore: number
    culturalAppropriate: boolean
    languageQuality: number
    regionalRelevance: boolean
    spamScore: number
    fraudRisk: 'low' | 'medium' | 'high' | 'critical'
    isDuplicate: boolean
    suspiciousPatterns: string[]
  }> {
    const lowerContent = content.toLowerCase()
    const flags: string[] = []
    const suspiciousPatterns: string[] = []

    // Language detection
    const detectedLanguage = this.detectLanguage(content)

    // Profanity check
    let profanityScore = 0
    for (const word of this.ALBANIAN_PROFANITY) {
      if (lowerContent.includes(word)) {
        profanityScore += 1
        flags.push(`profanity_detected:${word}`)
      }
    }

    // Spam detection
    let spamScore = 0
    for (const pattern of this.SPAM_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        spamScore += matches.length * 0.2
        flags.push('spam_pattern_detected')
        suspiciousPatterns.push(pattern.source)
      }
    }

    // Fraud indicators
    let fraudScore = 0
    for (const pattern of this.FRAUD_INDICATORS) {
      if (pattern.test(content)) {
        fraudScore += 0.3
        flags.push('fraud_indicator_detected')
        suspiciousPatterns.push(pattern.source)
      }
    }

    // Sentiment analysis
    const sentimentScore = this.analyzeSentiment(content, language)

    // Cultural appropriateness
    const culturalAppropriate = this.assessCulturalAppropriateness(content, language)

    // Language quality for Albanian content
    const languageQuality = language === 'sq' ? this.assessAlbanianLanguageQuality(content) : 1.0

    // Regional relevance (Albanian automotive context)
    const regionalRelevance = this.assessRegionalRelevance(content)

    // Calculate overall moderation score (0 = safe, 1 = unsafe)
    let moderationScore = 0

    moderationScore += Math.min(profanityScore * 0.3, 0.4)
    moderationScore += Math.min(spamScore, 0.3)
    moderationScore += Math.min(fraudScore, 0.3)

    if (!culturalAppropriate) {
      moderationScore += 0.2
      flags.push('culturally_inappropriate')
    }

    if (sentimentScore < -0.7) {
      moderationScore += 0.1
      flags.push('very_negative_sentiment')
    }

    // Determine fraud risk level
    let fraudRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (fraudScore >= 0.7) fraudRisk = 'critical'
    else if (fraudScore >= 0.5) fraudRisk = 'high'
    else if (fraudScore >= 0.3) fraudRisk = 'medium'

    // Duplicate content check (simplified)
    const isDuplicate = await this.checkDuplicateContent(content)

    return {
      moderationScore: Math.min(moderationScore, 1.0),
      flags,
      detectedLanguage,
      sentimentScore,
      culturalAppropriate,
      languageQuality,
      regionalRelevance,
      spamScore: Math.min(spamScore, 1.0),
      fraudRisk,
      isDuplicate,
      suspiciousPatterns
    }
  }

  /**
   * Detect content language
   */
  private static detectLanguage(content: string): string {
    // Simple Albanian language detection
    const albanianWords = ['dhe', 'një', 'është', 'me', 'të', 'për', 'nga', 'në', 'si', 'ka', 'do', 'i', 'e']
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'with', 'on']

    const lowerContent = content.toLowerCase()
    let albanianCount = 0
    let englishCount = 0

    for (const word of albanianWords) {
      if (lowerContent.includes(` ${word} `) || lowerContent.startsWith(`${word} `) || lowerContent.endsWith(` ${word}`)) {
        albanianCount++
      }
    }

    for (const word of englishWords) {
      if (lowerContent.includes(` ${word} `) || lowerContent.startsWith(`${word} `) || lowerContent.endsWith(` ${word}`)) {
        englishCount++
      }
    }

    return albanianCount > englishCount ? 'sq' : 'en'
  }

  /**
   * Analyze sentiment for Albanian content
   */
  private static analyzeSentiment(content: string, language: string): number {
    if (language !== 'sq') {
      return 0 // Neutral for non-Albanian content
    }

    const positiveWords = ['mirë', 'bukur', 'perfekt', 'ekscelent', 'fantastik', 'i mrekullueshëm']
    const negativeWords = ['keq', 'i keq', 'problem', 'i tmerrshëm', 'i neveritshëm']

    const lowerContent = content.toLowerCase()
    let positiveScore = 0
    let negativeScore = 0

    for (const word of positiveWords) {
      if (lowerContent.includes(word)) positiveScore++
    }

    for (const word of negativeWords) {
      if (lowerContent.includes(word)) negativeScore++
    }

    const total = positiveScore + negativeScore
    if (total === 0) return 0

    return (positiveScore - negativeScore) / total
  }

  /**
   * Assess cultural appropriateness for Albanian context
   */
  private static assessCulturalAppropriateness(content: string, language: string): boolean {
    const inappropriatePatterns = [
      /(?:racist|raciste)/gi,
      /(?:hate|urrejtje)/gi,
      /(?:discrimination|diskriminim)/gi
    ]

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(content)) {
        return false
      }
    }

    return true
  }

  /**
   * Assess Albanian language quality
   */
  private static assessAlbanianLanguageQuality(content: string): number {
    // Check for Albanian diacritics and proper grammar
    const albanianChars = /[ëçüöä]/g
    const hasAlbanianChars = albanianChars.test(content)

    // Check for common Albanian automotive terms
    const automotiveTerms = ['makinë', 'automjet', 'veturë', 'motor', 'benzinë', 'dizel', 'kilometra']
    let termCount = 0

    for (const term of automotiveTerms) {
      if (content.toLowerCase().includes(term)) {
        termCount++
      }
    }

    let qualityScore = 0.5

    if (hasAlbanianChars) qualityScore += 0.3
    if (termCount > 0) qualityScore += 0.2

    return Math.min(qualityScore, 1.0)
  }

  /**
   * Assess regional relevance to Albanian market
   */
  private static assessRegionalRelevance(content: string): boolean {
    const albanianCities = ['tiranë', 'durrës', 'vlorë', 'shkodër', 'elbasan', 'korçë', 'fier', 'berat']
    const lowerContent = content.toLowerCase()

    return albanianCities.some(city => lowerContent.includes(city))
  }

  /**
   * Check for duplicate content
   */
  private static async checkDuplicateContent(content: string): Promise<boolean> {
    // Simple duplicate check - in production use more sophisticated algorithms
    const contentHash = require('crypto').createHash('md5').update(content).digest('hex')

    const existing = await prisma.contentModeration.findFirst({
      where: {
        // In production, store content hashes for comparison
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })

    return false // Simplified for demo
  }

  /**
   * Determine moderation action based on analysis
   */
  private static determineAction(analysis: any): 'approved' | 'flagged' | 'rejected' | 'requires_review' {
    // Auto-reject for critical fraud risk or very high moderation score
    if (analysis.fraudRisk === 'critical' || analysis.moderationScore > 0.8) {
      return 'rejected'
    }

    // Auto-approve for low-risk, high-quality content
    if (analysis.moderationScore < 0.2 && analysis.fraudRisk === 'low' && analysis.culturalAppropriate) {
      return 'approved'
    }

    // Flag for review for moderate risk
    if (analysis.moderationScore > 0.5 || analysis.fraudRisk === 'high') {
      return 'requires_review'
    }

    // Default to flagged for manual review
    return 'flagged'
  }

  /**
   * Auto-approve content
   */
  private static async autoApproveContent(moderationId: string): Promise<void> {
    await prisma.contentModeration.update({
      where: { id: moderationId },
      data: {
        moderationDecision: 'approved',
        actionTaken: 'none',
        moderatedAt: new Date()
      }
    })
  }

  /**
   * Auto-reject content
   */
  private static async autoRejectContent(moderationId: string, flags: string[]): Promise<void> {
    await prisma.contentModeration.update({
      where: { id: moderationId },
      data: {
        moderationDecision: 'rejected',
        actionTaken: 'content_hidden',
        actionReason: `Auto-rejected: ${flags.join(', ')}`,
        actionTakenAt: new Date(),
        moderatedAt: new Date()
      }
    })
  }

  /**
   * Flag content for manual review
   */
  private static async flagForReview(moderationId: string, flags: string[]): Promise<void> {
    await prisma.contentModeration.update({
      where: { id: moderationId },
      data: {
        moderationDecision: 'flagged',
        moderatorNotes: `Flagged for review: ${flags.join(', ')}`
      }
    })
  }

  /**
   * Get pending content for admin review
   */
  static async getPendingModerations(): Promise<any[]> {
    return await prisma.contentModeration.findMany({
      where: {
        humanReviewed: false,
        moderationDecision: { in: ['flagged', 'requires_edit'] }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, trustScore: true }
        }
      },
      orderBy: [
        { aiModerationScore: 'desc' },
        { createdAt: 'asc' }
      ]
    })
  }

  /**
   * Manual moderation by admin
   */
  static async moderateManually(
    moderationId: string,
    moderatorId: string,
    decision: 'approved' | 'rejected' | 'requires_edit',
    notes?: string,
    actionType?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.contentModeration.update({
        where: { id: moderationId },
        data: {
          humanReviewed: true,
          moderatorId,
          moderationDecision: decision,
          moderatorNotes: notes,
          moderatedAt: new Date(),
          actionTaken: actionType || 'none',
          actionTakenAt: actionType ? new Date() : undefined
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Manual moderation failed:', error)
      return { success: false, error: 'Moderimi manual dështoi' }
    }
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats(): Promise<{
    totalModerations: number
    autoApproved: number
    autoRejected: number
    pendingReview: number
    averageScore: number
    topFlags: Array<{ flag: string; count: number }>
  }> {
    const [total, autoApproved, autoRejected, pending] = await Promise.all([
      prisma.contentModeration.count(),
      prisma.contentModeration.count({
        where: { moderationDecision: 'approved', humanReviewed: false }
      }),
      prisma.contentModeration.count({
        where: { moderationDecision: 'rejected', humanReviewed: false }
      }),
      prisma.contentModeration.count({
        where: { humanReviewed: false, moderationDecision: 'flagged' }
      })
    ])

    // Calculate average moderation score
    const avgResult = await prisma.contentModeration.aggregate({
      _avg: { aiModerationScore: true }
    })

    return {
      totalModerations: total,
      autoApproved,
      autoRejected,
      pendingReview: pending,
      averageScore: avgResult._avg.aiModerationScore || 0,
      topFlags: [] // In production, aggregate flags data
    }
  }
}