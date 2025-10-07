import { PrismaClient } from '@prisma/client'
import { emailService } from '../email'
import { smsService } from '../sms'

interface LeadProfile {
  userId: string
  leadType: 'hot' | 'warm' | 'cold' | 'dormant'
  engagementScore: number
  lastActivity: Date | null
  preferredPriceRange: { min: number, max: number } | null
  preferredBrands: string[]
  preferredLocations: string[]
  interestedListings: string[]
  interactionHistory: LeadInteraction[]
  conversionProbability: number
}

interface LeadInteraction {
  type: 'view' | 'contact' | 'favorite' | 'search' | 'message'
  listingId?: string
  timestamp: Date
  value: number // Interaction value score
  metadata?: any
}

export class LeadNurturingService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  // Process lead nurturing campaigns
  async processLeadNurturing(): Promise<void> {
    try {
      console.log('🎯 Processing lead nurturing automation...')

      const leadProfiles = await this.analyzeAllLeads()

      await this.processHotLeads(leadProfiles.filter(l => l.leadType === 'hot'))
      await this.processWarmLeads(leadProfiles.filter(l => l.leadType === 'warm'))
      await this.processColdLeads(leadProfiles.filter(l => l.leadType === 'cold'))
      await this.processDormantLeads(leadProfiles.filter(l => l.leadType === 'dormant'))

      console.log('✅ Completed lead nurturing processing')
    } catch (error) {
      console.error('❌ Error processing lead nurturing:', error)
    }
  }

  // Analyze all users and classify as leads
  private async analyzeAllLeads(): Promise<LeadProfile[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const users = await this.prisma.user.findMany({
        where: {
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // At least 1 day old
        },
        include: {
          favorites: {
            include: {
              listing: true
            }
          },
          messages: {
            where: {
              createdAt: { gte: thirtyDaysAgo }
            },
            include: {
              listing: true
            }
          },
          automationPreferences: true
        }
      })

      const leadProfiles: LeadProfile[] = []

      for (const user of users) {
        const profile = await this.createLeadProfile(user)
        leadProfiles.push(profile)
      }

      return leadProfiles
    } catch (error) {
      console.error('Error analyzing leads:', error)
      return []
    }
  }

  // Create lead profile for user
  private async createLeadProfile(user: any): Promise<LeadProfile> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      // Get user interactions
      const interactions = await this.prisma.userInteraction.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: thirtyDaysAgo }
        }
      })

      // Build interaction history
      const interactionHistory: LeadInteraction[] = []

      // Add view interactions
      interactions
        .filter(i => i.type === 'view')
        .forEach(i => {
          interactionHistory.push({
            type: 'view',
            listingId: i.listingId,
            timestamp: i.createdAt,
            value: 1
          })
        })

      // Add favorites
      user.favorites.forEach((fav: any) => {
        interactionHistory.push({
          type: 'favorite',
          listingId: fav.listingId,
          timestamp: fav.createdAt,
          value: 3
        })
      })

      // Add messages
      user.messages.forEach((msg: any) => {
        interactionHistory.push({
          type: 'message',
          listingId: msg.listingId,
          timestamp: msg.createdAt,
          value: 5
        })
      })

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(interactionHistory, user)

      // Determine lead type
      const leadType = this.classifyLead(engagementScore, user.lastActiveAt, interactionHistory)

      // Extract preferences
      const preferences = this.extractUserPreferences(user, interactionHistory)

      // Calculate conversion probability
      const conversionProbability = this.calculateConversionProbability(engagementScore, leadType, interactionHistory)

      return {
        userId: user.id,
        leadType,
        engagementScore,
        lastActivity: user.lastActiveAt,
        preferredPriceRange: preferences.priceRange,
        preferredBrands: preferences.brands,
        preferredLocations: preferences.locations,
        interestedListings: preferences.listings,
        interactionHistory,
        conversionProbability
      }
    } catch (error) {
      console.error(`Error creating lead profile for user ${user.id}:`, error)
      return {
        userId: user.id,
        leadType: 'cold',
        engagementScore: 0,
        lastActivity: null,
        preferredPriceRange: null,
        preferredBrands: [],
        preferredLocations: [],
        interestedListings: [],
        interactionHistory: [],
        conversionProbability: 0
      }
    }
  }

  // Calculate engagement score
  private calculateEngagementScore(interactions: LeadInteraction[], user: any): number {
    let score = 0

    // Base score from interactions
    interactions.forEach(interaction => {
      score += interaction.value
    })

    // Recency bonus
    const daysSinceLastActivity = user.lastActiveAt
      ? Math.floor((Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceLastActivity <= 1) score += 20
    else if (daysSinceLastActivity <= 7) score += 10
    else if (daysSinceLastActivity <= 14) score += 5

    // Frequency bonus
    const interactionDays = [...new Set(interactions.map(i => i.timestamp.toDateString()))].length
    score += interactionDays * 2

    return Math.min(score, 100)
  }

  // Classify lead based on behavior
  private classifyLead(engagementScore: number, lastActiveAt: Date | null, interactions: LeadInteraction[]): LeadProfile['leadType'] {
    const daysSinceLastActivity = lastActiveAt
      ? Math.floor((Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    const hasHighValueInteractions = interactions.some(i => i.value >= 5)
    const hasRecentActivity = daysSinceLastActivity <= 7

    if (engagementScore >= 50 && hasHighValueInteractions && hasRecentActivity) return 'hot'
    if (engagementScore >= 30 && hasRecentActivity) return 'warm'
    if (daysSinceLastActivity > 30) return 'dormant'
    return 'cold'
  }

  // Extract user preferences from behavior
  private extractUserPreferences(user: any, interactions: LeadInteraction[]): {
    priceRange: { min: number, max: number } | null
    brands: string[]
    locations: string[]
    listings: string[]
  } {
    const brands: string[] = []
    const locations: string[] = []
    const listings: string[] = []
    const prices: number[] = []

    // Extract from favorites
    user.favorites.forEach((fav: any) => {
      if (fav.listing) {
        brands.push(fav.listing.make)
        locations.push(fav.listing.city)
        listings.push(fav.listing.id)
        prices.push(fav.listing.price)
      }
    })

    // Extract from messages
    user.messages.forEach((msg: any) => {
      if (msg.listing) {
        brands.push(msg.listing.make)
        locations.push(msg.listing.city)
        listings.push(msg.listing.id)
        prices.push(msg.listing.price)
      }
    })

    // Calculate price range
    let priceRange = null
    if (prices.length > 0) {
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

      priceRange = {
        min: Math.max(0, avgPrice * 0.8), // 20% below average
        max: avgPrice * 1.2 // 20% above average
      }
    }

    return {
      priceRange,
      brands: [...new Set(brands)],
      locations: [...new Set(locations)],
      listings: [...new Set(listings)]
    }
  }

  // Calculate conversion probability
  private calculateConversionProbability(engagementScore: number, leadType: LeadProfile['leadType'], interactions: LeadInteraction[]): number {
    let probability = 0

    // Base probability from lead type
    switch (leadType) {
      case 'hot': probability = 0.7; break
      case 'warm': probability = 0.4; break
      case 'cold': probability = 0.15; break
      case 'dormant': probability = 0.05; break
    }

    // Adjust based on engagement score
    probability *= (engagementScore / 100)

    // Adjust based on interaction quality
    const highValueInteractions = interactions.filter(i => i.value >= 5).length
    if (highValueInteractions > 0) {
      probability += 0.1 * highValueInteractions
    }

    return Math.min(probability, 0.95)
  }

  // Process hot leads
  private async processHotLeads(hotLeads: LeadProfile[]): Promise<void> {
    try {
      for (const lead of hotLeads) {
        await this.sendHotLeadCampaign(lead)
      }

      console.log(`🔥 Processed ${hotLeads.length} hot leads`)
    } catch (error) {
      console.error('Error processing hot leads:', error)
    }
  }

  // Send hot lead campaign
  private async sendHotLeadCampaign(lead: LeadProfile): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: lead.userId },
        include: { automationPreferences: true }
      })

      if (!user || !user.automationPreferences?.emailEnabled) return

      // Check if hot lead email sent recently
      const recentHotLead = await this.prisma.notificationLog.findFirst({
        where: {
          userId: lead.userId,
          type: 'lead_nurturing',
          category: 'hot_lead_campaign',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentHotLead) return

      // Get personalized recommendations
      const recommendations = await this.getPersonalizedRecommendations(lead)

      const hotLeadContent = this.createHotLeadEmailContent(
        user.name || 'Shfrytëzues',
        lead,
        recommendations
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: hotLeadContent.subject,
        html: hotLeadContent.html,
        text: hotLeadContent.text
      })

      if (success) {
        await this.logNotification(lead.userId, 'lead_nurturing', 'email', 'hot_lead_campaign')

        // Send SMS for very high probability leads
        if (lead.conversionProbability > 0.8 && user.phone && user.automationPreferences.smsEnabled) {
          const smsContent = `🔥 AutoMarket: Makina të reja që ju pëlqejnë! ${recommendations.slice(0, 1).map(r => r.title).join(', ')}. Shiko: automarket.al`

          await smsService.sendSms({
            to: user.phone,
            message: smsContent,
            messageType: 'marketing'
          })

          await this.logNotification(lead.userId, 'lead_nurturing', 'sms', 'hot_lead_urgent')
        }
      }
    } catch (error) {
      console.error(`Error sending hot lead campaign to ${lead.userId}:`, error)
    }
  }

  // Get personalized recommendations for lead
  private async getPersonalizedRecommendations(lead: LeadProfile, limit: number = 5): Promise<any[]> {
    try {
      const where: any = {
        status: 'active'
      }

      // Filter by preferred brands
      if (lead.preferredBrands.length > 0) {
        where.make = { in: lead.preferredBrands }
      }

      // Filter by preferred locations
      if (lead.preferredLocations.length > 0) {
        where.city = { in: lead.preferredLocations }
      }

      // Filter by price range
      if (lead.preferredPriceRange) {
        where.price = {
          gte: lead.preferredPriceRange.min,
          lte: lead.preferredPriceRange.max
        }
      }

      const recommendations = await this.prisma.listing.findMany({
        where,
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        select: {
          id: true,
          title: true,
          make: true,
          model: true,
          year: true,
          price: true,
          city: true,
          images: true
        }
      })

      return recommendations
    } catch (error) {
      console.error('Error getting personalized recommendations:', error)
      return []
    }
  }

  // Create hot lead email content
  private createHotLeadEmailContent(userName: string, lead: LeadProfile, recommendations: any[]): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `🔥 ${userName}, makina të përsosura për ju!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🔥 Rekomandime Speciale</h1>
            <p style="margin: 5px 0 0 0;">Makina të zgjedhura vetëm për ju</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Bazuar në preferencat tuaja, kemi përzgjedhur disa makina që mund t'ju interesojnë:</p>

            ${recommendations.map(car => `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626;">${car.title}</h3>
                <p style="margin: 5px 0; color: #374151;">
                  <strong>€${(car.price / 100).toLocaleString()}</strong> | ${car.city}
                </p>
                <p style="margin: 5px 0; color: #6b7280;">${car.year} • ${car.make} ${car.model}</p>
              </div>
            `).join('')}

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">💡 Këshilla nga ekspertët:</h3>
              <p style="color: #b45309; margin-bottom: 0;">Makinat më të kërkuara shiten shpejt! Kontaktoni shitësin sa më shpejt për të siguruar makinën që ju pëlqen.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings"
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Shiko Të Gjitha Makinat
              </a>
            </div>

            <p>Keni pyetje? Jemi këtu për t'ju ndihmuar!</p>

            <p>Gjuetje të suksesshme,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `Rekomandime për ${userName}: ${recommendations.map(r => `${r.title} - €${(r.price / 100).toLocaleString()}`).join(', ')}. Shiko: ${process.env.NEXTAUTH_URL}/listings`
    }
  }

  // Process warm leads
  private async processWarmLeads(warmLeads: LeadProfile[]): Promise<void> {
    try {
      for (const lead of warmLeads) {
        await this.sendWarmLeadCampaign(lead)
      }

      console.log(`🌡️ Processed ${warmLeads.length} warm leads`)
    } catch (error) {
      console.error('Error processing warm leads:', error)
    }
  }

  // Send warm lead campaign
  private async sendWarmLeadCampaign(lead: LeadProfile): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: lead.userId },
        include: { automationPreferences: true }
      })

      if (!user || !user.automationPreferences?.emailEnabled) return

      // Check if warm lead email sent recently
      const recentWarmLead = await this.prisma.notificationLog.findFirst({
        where: {
          userId: lead.userId,
          type: 'lead_nurturing',
          category: 'warm_lead_campaign',
          createdAt: { gte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentWarmLead) return

      const warmLeadContent = this.createWarmLeadEmailContent(
        user.name || 'Shfrytëzues',
        lead
      )

      const success = await emailService.sendEmail({
        to: user.email,
        subject: warmLeadContent.subject,
        html: warmLeadContent.html,
        text: warmLeadContent.text
      })

      if (success) {
        await this.logNotification(lead.userId, 'lead_nurturing', 'email', 'warm_lead_campaign')
      }
    } catch (error) {
      console.error(`Error sending warm lead campaign to ${lead.userId}:`, error)
    }
  }

  // Create warm lead email content
  private createWarmLeadEmailContent(userName: string, lead: LeadProfile): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `🚗 ${userName}, gjeni makinën e përsosur!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚗 AutoMarket Shqipëria</h1>
            <p style="margin: 5px 0 0 0;">Makina që ju kërkoni është këtu!</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>E kemi vënë re që keni treguar interes për disa makina në AutoMarket. A e dini që çdo ditë shtohen makina të reja?</p>

            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">🎯 Sugjerimet tona për ju:</h3>
              <ul style="color: #1e3a8a; line-height: 1.8;">
                <li>🔔 Krijoni një kërkim të ruajtur për t'u njoftuar për makina të reja</li>
                <li>❤️ Shtoni makinat në të preferuarat për t'i krahasuar</li>
                <li>💬 Kontaktoni shitësit për më shumë informacion</li>
                <li>📱 Përdorni filtrat për të gjetur makinën e përsosur</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings"
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Eksploroni Makinat
              </a>
            </div>

            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #059669;">
              <p style="margin: 0; color: #047857;"><strong>💡 A e dinit?</strong> Më shumë se 500 makina të reja shtohen çdo javë!</p>
            </div>

            <p>Jemi këtu për t'ju ndihmuar të gjeni makinën e duhur!</p>

            <p>Përshëndetje të ngrohta,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `${userName}, eksploroni makina të reja në AutoMarket. Krijoni kërkim të ruajtur: ${process.env.NEXTAUTH_URL}/listings`
    }
  }

  // Process cold leads
  private async processColdLeads(coldLeads: LeadProfile[]): Promise<void> {
    try {
      // Process cold leads less frequently (weekly)
      const today = new Date().getDay()
      if (today !== 1) return // Only on Mondays

      for (const lead of coldLeads) {
        await this.sendColdLeadCampaign(lead)
      }

      console.log(`❄️ Processed ${coldLeads.length} cold leads`)
    } catch (error) {
      console.error('Error processing cold leads:', error)
    }
  }

  // Send cold lead campaign
  private async sendColdLeadCampaign(lead: LeadProfile): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: lead.userId },
        include: { automationPreferences: true }
      })

      if (!user || !user.automationPreferences?.emailEnabled || !user.automationPreferences?.marketingEmails) return

      // Check if cold lead email sent recently
      const recentColdLead = await this.prisma.notificationLog.findFirst({
        where: {
          userId: lead.userId,
          type: 'lead_nurturing',
          category: 'cold_lead_campaign',
          createdAt: { gte: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentColdLead) return

      const coldLeadContent = this.createColdLeadEmailContent(user.name || 'Shfrytëzues')

      const success = await emailService.sendEmail({
        to: user.email,
        subject: coldLeadContent.subject,
        html: coldLeadContent.html,
        text: coldLeadContent.text
      })

      if (success) {
        await this.logNotification(lead.userId, 'lead_nurturing', 'email', 'cold_lead_campaign')
      }
    } catch (error) {
      console.error(`Error sending cold lead campaign to ${lead.userId}:`, error)
    }
  }

  // Create cold lead email content
  private createColdLeadEmailContent(userName: string): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `🚗 ${userName}, makina të reja të jashtëzakonshme!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7c3aed; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚗 Makina të Reja!</h1>
            <p style="margin: 5px 0 0 0;">AutoMarket Shqipëria</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>AutoMarket vazhdon të rritet me qindra makina të reja çdo javë! Ja çfarë është shtuar së fundi:</p>

            <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #5b21b6;">🆕 Të reja në AutoMarket:</h3>
              <ul style="color: #6b21a8; line-height: 1.8;">
                <li>🔥 Makina premium me çmime konkurruese</li>
                <li>✨ Modele të vitit 2020-2023</li>
                <li>🚗 Të gjitha markat e njohura</li>
                <li>📍 Në të gjitha qytetet e Shqipërisë</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings?sort=newest"
                 style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Shiko Makinat e Reja
              </a>
            </div>

            <p>Mos humbisni makina të mira - ato shiten shpejt!</p>

            <p>Gëzuar kërkimin,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `${userName}, makina të reja në AutoMarket! Shiko: ${process.env.NEXTAUTH_URL}/listings?sort=newest`
    }
  }

  // Process dormant leads
  private async processDormantLeads(dormantLeads: LeadProfile[]): Promise<void> {
    try {
      // Process dormant leads monthly
      const today = new Date()
      if (today.getDate() !== 1) return // Only on 1st of month

      for (const lead of dormantLeads) {
        await this.sendDormantLeadCampaign(lead)
      }

      console.log(`😴 Processed ${dormantLeads.length} dormant leads`)
    } catch (error) {
      console.error('Error processing dormant leads:', error)
    }
  }

  // Send dormant lead campaign
  private async sendDormantLeadCampaign(lead: LeadProfile): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: lead.userId },
        include: { automationPreferences: true }
      })

      if (!user || !user.automationPreferences?.emailEnabled || !user.automationPreferences?.marketingEmails) return

      // Check if dormant lead email sent recently
      const recentDormantLead = await this.prisma.notificationLog.findFirst({
        where: {
          userId: lead.userId,
          type: 'lead_nurturing',
          category: 'dormant_lead_campaign',
          createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
        }
      })

      if (recentDormantLead) return

      const dormantLeadContent = this.createDormantLeadEmailContent(user.name || 'Shfrytëzues')

      const success = await emailService.sendEmail({
        to: user.email,
        subject: dormantLeadContent.subject,
        html: dormantLeadContent.html,
        text: dormantLeadContent.text
      })

      if (success) {
        await this.logNotification(lead.userId, 'lead_nurturing', 'email', 'dormant_lead_campaign')
      }
    } catch (error) {
      console.error(`Error sending dormant lead campaign to ${lead.userId}:`, error)
    }
  }

  // Create dormant lead email content
  private createDormantLeadEmailContent(userName: string): {
    subject: string
    html: string
    text: string
  } {
    return {
      subject: `${userName}, na mungoni në AutoMarket! 🎁`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Na Mungoni! 💔</h1>
            <p style="margin: 5px 0 0 0;">AutoMarket Shqipëria</p>
          </div>

          <div style="padding: 30px;">
            <p>Përshëndetje ${userName},</p>

            <p>Na mungoni shumë në AutoMarket! Përderisa keni qenë larg, ne kemi shtuar mijëra makina të reja dhe përmirësuar platformën.</p>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">🎁 Mirë se u kthyet - Ofertë speciale:</h3>
              <ul style="color: #b45309; line-height: 1.8;">
                <li>✨ Qasje prioritare në makina të reja</li>
                <li>💰 Njoftime për çmime të ulura</li>
                <li>🔔 Kërkime të ruajtura pa limit</li>
                <li>📱 Aplikacion i ri mobil</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/listings"
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Kthehuni në AutoMarket
              </a>
            </div>

            <p>Jemi të emocionuar për t'ju parë përsëri!</p>

            <p>Me dashuri,<br>
            Ekipi AutoMarket Shqipëria</p>
          </div>
        </div>
      `,
      text: `${userName}, na mungoni! Kthehuni në AutoMarket për makina të reja dhe përmirësime: ${process.env.NEXTAUTH_URL}/listings`
    }
  }

  // Log notification delivery
  private async logNotification(userId: string, type: string, channel: string, subtype: string): Promise<void> {
    try {
      await this.prisma.notificationLog.create({
        data: {
          userId,
          type,
          category: subtype,
          recipientInfo: channel,
          status: 'sent'
        }
      })
    } catch (error) {
      console.error('Error logging notification:', error)
    }
  }

  // Get lead nurturing analytics
  async getLeadNurturingAnalytics(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const campaignStats = await this.prisma.notificationLog.groupBy({
        by: ['category'],
        where: {
          type: 'lead_nurturing',
          createdAt: { gte: startDate }
        },
        _count: true
      })

      // Analyze current lead distribution
      const leadProfiles = await this.analyzeAllLeads()
      const leadDistribution = leadProfiles.reduce((acc, lead) => {
        acc[lead.leadType] = (acc[lead.leadType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        campaignPerformance: campaignStats,
        leadDistribution,
        totalLeads: leadProfiles.length,
        averageConversionProbability: leadProfiles.reduce((sum, lead) => sum + lead.conversionProbability, 0) / leadProfiles.length,
        timeframe
      }
    } catch (error) {
      console.error('Error getting lead nurturing analytics:', error)
      return null
    }
  }

  // Manual lead scoring update
  async updateLeadScore(userId: string, scoreAdjustment: number, reason: string): Promise<void> {
    try {
      // This would update a lead scoring table in a real implementation
      console.log(`📊 Manual lead score update for user ${userId}: ${scoreAdjustment} (${reason})`)

      await this.logNotification(userId, 'lead_nurturing', 'system', 'manual_score_update')
    } catch (error) {
      console.error('Error updating lead score:', error)
    }
  }
}

export const leadNurturingService = new LeadNurturingService()