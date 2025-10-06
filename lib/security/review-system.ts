import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Albanian Review and Reputation System
 * Handles reviews with Albanian language support and cultural sentiment analysis
 */
export class AlbanianReviewSystem {
  /**
   * Albanian sentiment keywords for cultural analysis
   */
  private static readonly ALBANIAN_POSITIVE_WORDS = [
    'shumë mirë', 'perfekt', 'ekscelent', 'fantastik', 'i shkëlqyer',
    'profesional', 'i besueshëm', 'i sinqertë', 'cilësi', 'rekomandoj',
    'korrekt', 'serioz', 'i ndershëm', 'shpejt', 'efikas'
  ]

  private static readonly ALBANIAN_NEGATIVE_WORDS = [
    'keq', 'i keq', 'problem', 'vonesa', 'mashtrim', 'jo profesional',
    'i pabesueshëm', 'jo serioz', 'jo cilësor', 'shtrenjtë', 'jo korrekt',
    'nuk rekomandoj', 'të metë', 'defekte', 'problem'
  ]

  private static readonly ALBANIAN_NEUTRAL_WORDS = [
    'normale', 'mesatar', 'okej', 'pranueshëm', 'standardit'
  ]

  /**
   * Create a new review
   */
  static async createReview(
    authorId: string,
    targetId: string,
    listingId: string | null,
    transactionId: string | null,
    rating: number,
    title: string | null,
    content: string,
    language: string = 'sq'
  ): Promise<{ success: boolean; reviewId?: string; error?: string }> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Vlerësimi duhet të jetë midis 1 dhe 5' }
      }

      // Check if user can review this target
      const canReview = await this.canUserReview(authorId, targetId, listingId)
      if (!canReview.allowed) {
        return { success: false, error: canReview.reason }
      }

      // Perform content analysis
      const contentAnalysis = this.analyzeAlbanianContent(content, language)

      // Create review
      const review = await prisma.review.create({
        data: {
          authorId,
          targetId,
          listingId,
          transactionId,
          rating,
          title,
          content,
          language,
          sentimentScore: contentAnalysis.sentimentScore,
          culturalScore: contentAnalysis.culturalScore,
          languageQuality: contentAnalysis.languageQuality
        }
      })

      // Update target user's reputation
      await this.updateUserReputation(targetId)

      // Check for review authenticity
      await this.checkReviewAuthenticity(review.id)

      return { success: true, reviewId: review.id }
    } catch (error) {
      console.error('Review creation failed:', error)
      return { success: false, error: 'Krijimi i recensionit dështoi' }
    }
  }

  /**
   * Check if user can review another user
   */
  private static async canUserReview(
    authorId: string,
    targetId: string,
    listingId: string | null
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Can't review yourself
    if (authorId === targetId) {
      return { allowed: false, reason: 'Nuk mund të recensioni veten' }
    }

    // Check if already reviewed this user for this listing
    if (listingId) {
      const existingReview = await prisma.review.findFirst({
        where: {
          authorId,
          targetId,
          listingId
        }
      })

      if (existingReview) {
        return { allowed: false, reason: 'Ju keni recensuar tashmë këtë përdorues për këtë shpallje' }
      }
    }

    // Check if users have interacted (message exchange)
    const hasInteraction = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: authorId, listing: { userId: targetId } },
          { senderId: targetId, listing: { userId: authorId } }
        ]
      }
    })

    if (!hasInteraction) {
      return { allowed: false, reason: 'Mund të recensioni vetëm përdorues me të cilët keni komunikuar' }
    }

    // Check review frequency limits (prevent spam)
    const recentReviews = await prisma.review.count({
      where: {
        authorId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    if (recentReviews >= 5) {
      return { allowed: false, reason: 'Ju mund të lini maksimum 5 recensione në ditë' }
    }

    return { allowed: true }
  }

  /**
   * Analyze Albanian content for sentiment and cultural appropriateness
   */
  private static analyzeAlbanianContent(content: string, language: string): {
    sentimentScore: number
    culturalScore: number
    languageQuality: number
  } {
    const lowerContent = content.toLowerCase()

    // Calculate sentiment score
    let positiveScore = 0
    let negativeScore = 0

    for (const word of this.ALBANIAN_POSITIVE_WORDS) {
      if (lowerContent.includes(word)) {
        positiveScore += 1
      }
    }

    for (const word of this.ALBANIAN_NEGATIVE_WORDS) {
      if (lowerContent.includes(word)) {
        negativeScore += 1
      }
    }

    // Sentiment score between -1 and 1
    const totalSentimentWords = positiveScore + negativeScore
    const sentimentScore = totalSentimentWords > 0
      ? (positiveScore - negativeScore) / totalSentimentWords
      : 0

    // Cultural appropriateness (check for respectful language)
    const culturalScore = this.calculateCulturalScore(lowerContent, language)

    // Language quality (basic check for Albanian language)
    const languageQuality = this.calculateLanguageQuality(content, language)

    return {
      sentimentScore,
      culturalScore,
      languageQuality
    }
  }

  /**
   * Calculate cultural appropriateness score
   */
  private static calculateCulturalScore(content: string, language: string): number {
    // Check for inappropriate language or content
    const inappropriateWords = [
      'idiot', 'budall', 'hajvan', 'mashtro', // Disrespectful terms
      // Add more inappropriate words as needed
    ]

    let inappropriateCount = 0
    for (const word of inappropriateWords) {
      if (content.includes(word)) {
        inappropriateCount += 1
      }
    }

    // Cultural score based on respectfulness
    const baseScore = 1.0
    const penalty = inappropriateCount * 0.2
    return Math.max(0, baseScore - penalty)
  }

  /**
   * Calculate language quality score
   */
  private static calculateLanguageQuality(content: string, language: string): number {
    if (language !== 'sq') {
      return 1.0 // Don't penalize non-Albanian content
    }

    // Basic checks for Albanian language quality
    const albanianCharacters = /[ëçüöä]/g
    const hasAlbanianChars = albanianCharacters.test(content)

    // Common Albanian words check
    const commonAlbanianWords = [
      'dhe', 'një', 'është', 'me', 'të', 'për', 'nga', 'në', 'si', 'ka'
    ]

    let albanianWordCount = 0
    for (const word of commonAlbanianWords) {
      if (content.toLowerCase().includes(word)) {
        albanianWordCount += 1
      }
    }

    // Calculate quality score
    let qualityScore = 0.5 // Base score

    if (hasAlbanianChars) {
      qualityScore += 0.3
    }

    if (albanianWordCount >= 2) {
      qualityScore += 0.2
    }

    return Math.min(1.0, qualityScore)
  }

  /**
   * Check review authenticity to prevent fake reviews
   */
  private static async checkReviewAuthenticity(reviewId: string): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author: true,
        target: true
      }
    })

    if (!review) return

    let suspiciousFactors = 0

    // Check if author has very few reviews
    const authorReviewCount = await prisma.review.count({
      where: { authorId: review.authorId }
    })

    if (authorReviewCount <= 2) {
      suspiciousFactors += 1
    }

    // Check if review is very short (might be fake)
    if (review.content.length < 20) {
      suspiciousFactors += 1
    }

    // Check if author account is very new
    const authorAge = Date.now() - review.author.createdAt.getTime()
    const daysSinceCreation = authorAge / (1000 * 60 * 60 * 24)

    if (daysSinceCreation < 7) {
      suspiciousFactors += 1
    }

    // Check for similar content patterns (basic check)
    const similarReviews = await prisma.review.findMany({
      where: {
        authorId: review.authorId,
        content: {
          contains: review.content.substring(0, 20) // First 20 characters
        }
      }
    })

    if (similarReviews.length > 1) {
      suspiciousFactors += 2
    }

    // Flag for manual review if suspicious
    if (suspiciousFactors >= 2) {
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          isFlagged: true,
          flagReason: `Suspicious authenticity: ${suspiciousFactors} factors`
        }
      })
    }
  }

  /**
   * Update user reputation based on reviews
   */
  private static async updateUserReputation(userId: string): Promise<void> {
    // Calculate average rating
    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      select: { rating: true, sentimentScore: true, isVerified: true }
    })

    if (reviews.length === 0) return

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    const averageSentiment = reviews.reduce((sum, review) => sum + (review.sentimentScore || 0), 0) / reviews.length
    const verifiedReviewsCount = reviews.filter(r => r.isVerified).length

    // Calculate trust score adjustment
    let trustScoreBonus = 0

    if (reviews.length >= 5 && averageRating >= 4) {
      trustScoreBonus += 5
    }

    if (verifiedReviewsCount >= 3) {
      trustScoreBonus += 3
    }

    if (averageSentiment > 0.3) {
      trustScoreBonus += 2
    }

    // Update user trust score
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true }
    })

    if (user) {
      const newTrustScore = Math.min(100, user.trustScore + trustScoreBonus)

      await prisma.user.update({
        where: { id: userId },
        data: { trustScore: newTrustScore }
      })
    }
  }

  /**
   * Get user's reputation summary
   */
  static async getUserReputation(userId: string): Promise<{
    averageRating: number
    totalReviews: number
    verifiedReviews: number
    positiveReviews: number
    negativeReviews: number
    trustScore: number
  }> {
    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      select: { rating: true, sentimentScore: true, isVerified: true }
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true }
    })

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

    const positiveReviews = reviews.filter(r => r.rating >= 4).length
    const negativeReviews = reviews.filter(r => r.rating <= 2).length
    const verifiedReviews = reviews.filter(r => r.isVerified).length

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      verifiedReviews,
      positiveReviews,
      negativeReviews,
      trustScore: user?.trustScore || 50
    }
  }

  /**
   * Report a review as fake or inappropriate
   */
  static async reportReview(
    reviewId: string,
    reporterId: string,
    reason: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already reported this review
      const existingReport = await prisma.reviewReport.findFirst({
        where: { reviewId, reporterId }
      })

      if (existingReport) {
        return { success: false, error: 'Ju keni raportuar tashmë këtë recension' }
      }

      await prisma.reviewReport.create({
        data: {
          reviewId,
          reporterId,
          reason,
          description
        }
      })

      // Update review report count
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          reportCount: { increment: 1 }
        }
      })

      // Auto-flag if multiple reports
      const reportCount = await prisma.reviewReport.count({
        where: { reviewId }
      })

      if (reportCount >= 3) {
        await prisma.review.update({
          where: { id: reviewId },
          data: {
            isFlagged: true,
            flagReason: 'Multiple user reports'
          }
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Review report failed:', error)
      return { success: false, error: 'Raportimi i recensionit dështoi' }
    }
  }

  /**
   * Respond to a review
   */
  static async respondToReview(
    reviewId: string,
    authorId: string,
    content: string,
    language: string = 'sq'
  ): Promise<{ success: boolean; responseId?: string; error?: string }> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      })

      if (!review) {
        return { success: false, error: 'Recensioni nuk u gjet' }
      }

      // Only the target of the review can respond
      if (review.targetId !== authorId) {
        return { success: false, error: 'Vetëm marrësi i recensionit mund të përgjigjet' }
      }

      // Check if already responded
      const existingResponse = await prisma.reviewResponse.findFirst({
        where: { reviewId, authorId }
      })

      if (existingResponse) {
        return { success: false, error: 'Ju keni përgjigjur tashmë në këtë recension' }
      }

      const response = await prisma.reviewResponse.create({
        data: {
          reviewId,
          authorId,
          content,
          language
        }
      })

      // Mark review as having response
      await prisma.review.update({
        where: { id: reviewId },
        data: { hasResponse: true }
      })

      return { success: true, responseId: response.id }
    } catch (error) {
      console.error('Review response failed:', error)
      return { success: false, error: 'Përgjigjja në recension dështoi' }
    }
  }
}