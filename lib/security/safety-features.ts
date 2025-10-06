import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Safety Features and Meeting Recommendations for Albanian Market
 * Provides safe meeting locations and transaction safety guidelines
 */
export class SafetyFeaturesService {
  /**
   * Get recommended safe meeting locations by city
   */
  static async getSafeLocations(city: string): Promise<{
    locations: Array<{
      id: string
      name: string
      address: string
      locationType: string
      description?: string
      operatingHours?: string
      hasParking: boolean
      hasSecurity: boolean
      hasCCTV: boolean
      averageRating?: number
      isVerified: boolean
    }>
  }> {
    const locations = await prisma.safetyLocation.findMany({
      where: {
        city: { equals: city, mode: 'insensitive' },
        isActive: true
      },
      orderBy: [
        { isVerified: 'desc' },
        { averageRating: 'desc' },
        { recommendationCount: 'desc' }
      ]
    })

    return { locations }
  }

  /**
   * Add default safe locations for Albanian cities
   */
  static async seedSafeLocations(): Promise<void> {
    const safeLocations = [
      // Tirana
      {
        name: 'Pallati i Kulturës',
        address: 'Sheshi Skënderbej, Tiranë',
        city: 'Tiranë',
        locationType: 'public_square',
        description: 'Vend publik i sigurt në qendër të Tiranës',
        operatingHours: '24/7',
        hasParking: true,
        hasSecurity: true,
        hasCCTV: true,
        isVerified: true,
        latitude: 41.3275,
        longitude: 19.8187
      },
      {
        name: 'TEG - Tirana East Gate',
        address: 'Autostrada Tiranë-Durrës, Km 8, Tiranë',
        city: 'Tiranë',
        locationType: 'shopping_center',
        description: 'Qendër tregtare me siguri dhe parking',
        operatingHours: '10:00-22:00',
        hasParking: true,
        hasSecurity: true,
        hasCCTV: true,
        isVerified: true,
        latitude: 41.3638,
        longitude: 19.8766
      },
      {
        name: 'Banka e Shqipërisë',
        address: 'Sheshi Skënderbej, Tiranë',
        city: 'Tiranë',
        locationType: 'bank',
        description: 'Banka Qendrore e Shqipërisë - vend shumë i sigurt',
        operatingHours: '08:00-16:00',
        hasParking: false,
        hasSecurity: true,
        hasCCTV: true,
        isVerified: true,
        latitude: 41.3273,
        longitude: 19.8188
      },

      // Durrës
      {
        name: 'Durrës Shopping Center',
        address: 'Rruga Egnatia, Durrës',
        city: 'Durrës',
        locationType: 'shopping_center',
        description: 'Qendër tregtare në Durrës me siguri',
        operatingHours: '09:00-21:00',
        hasParking: true,
        hasSecurity: true,
        hasCCTV: true,
        isVerified: true,
        latitude: 41.3114,
        longitude: 19.4533
      },
      {
        name: 'Porto Romano',
        address: 'Rruga e Portit, Durrës',
        city: 'Durrës',
        locationType: 'public_square',
        description: 'Zonë publike pranë portit',
        operatingHours: '06:00-22:00',
        hasParking: true,
        hasSecurity: false,
        hasCCTV: false,
        isVerified: false,
        latitude: 41.3043,
        longitude: 19.4500
      },

      // Vlorë
      {
        name: 'Sheshi i Flamurit',
        address: 'Qendra e Vlorës',
        city: 'Vlorë',
        locationType: 'public_square',
        description: 'Sheshi kryesor i Vlorës',
        operatingHours: '24/7',
        hasParking: true,
        hasSecurity: false,
        hasCCTV: true,
        isVerified: false,
        latitude: 40.4686,
        longitude: 19.4829
      },

      // Shkodër
      {
        name: 'Qendra Tregtare Rozafa',
        address: 'Rruga Kolë Idromeno, Shkodër',
        city: 'Shkodër',
        locationType: 'shopping_center',
        description: 'Qendër tregtare në Shkodër',
        operatingHours: '09:00-21:00',
        hasParking: true,
        hasSecurity: true,
        hasCCTV: true,
        isVerified: false,
        latitude: 42.0687,
        longitude: 19.5126
      }
    ]

    for (const location of safeLocations) {
      await prisma.safetyLocation.upsert({
        where: {
          // Use a combination of name and city as unique identifier
          name_city: {
            name: location.name,
            city: location.city
          }
        },
        create: location,
        update: location
      })
    }
  }

  /**
   * Get transaction safety guidelines based on listing price
   */
  static getTransactionSafetyGuidelines(price: number, currency: string = 'EUR'): {
    riskLevel: 'low' | 'medium' | 'high'
    guidelines: string[]
    recommendedSafety: string[]
    escrowRequired: boolean
  } {
    const priceInEur = currency === 'EUR' ? price / 100 : price / 100 // Assuming cents

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let escrowRequired = false

    if (priceInEur > 50000) {
      riskLevel = 'high'
      escrowRequired = true
    } else if (priceInEur > 15000) {
      riskLevel = 'medium'
      escrowRequired = true
    }

    const guidelines = [
      'Takohuni gjithmonë në vende publike të sigurta',
      'Sillni një person të besuar si dëshmitar',
      'Verifikoni dokumentet e automjetit para pagesës',
      'Kontrolloni historikun e automjetit',
      'Mos transportoni shuma të mëdha parash'
    ]

    const recommendedSafety = [
      'Përdorni bankat ose qendrat tregtare për takime',
      'Takohuni gjatë ditës, jo natën',
      'Informoni familjen për vendndodhjen dhe kohën',
      'Kontrolloni automjetin me mekanik të besuar'
    ]

    if (riskLevel === 'high') {
      guidelines.push('Përdorni shërbimin e escrow për pagesa')
      guidelines.push('Kërkoni verifikim profesional të automjetit')
      recommendedSafety.push('Konsideroni prezencën e një noteri')
      recommendedSafety.push('Fotokopjoni të gjitha dokumentet')
    }

    if (riskLevel === 'medium') {
      guidelines.push('Konsideroni përdorimin e escrow')
      recommendedSafety.push('Verifikoni identitetin e shitësit')
    }

    return {
      riskLevel,
      guidelines,
      recommendedSafety,
      escrowRequired
    }
  }

  /**
   * Create transaction safety record
   */
  static async createTransactionSafety(
    listingId: string,
    safetyOptions: {
      recommendSafeLocation?: boolean
      requiresEscrow?: boolean
      escrowThreshold?: number
      emergencyContactEnabled?: boolean
      emergencyContactInfo?: any
      returnPolicy?: string
      disputeResolution?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.transactionSafety.upsert({
        where: { listingId },
        create: {
          listingId,
          ...safetyOptions
        },
        update: safetyOptions
      })

      return { success: true }
    } catch (error) {
      console.error('Transaction safety creation failed:', error)
      return { success: false, error: 'Krijimi i sigurisë së transaksionit dështoi' }
    }
  }

  /**
   * Generate safety checklist for transaction
   */
  static generateSafetyChecklist(
    listingPrice: number,
    meetingCity: string,
    isFirstTime: boolean = false
  ): {
    beforeMeeting: string[]
    duringMeeting: string[]
    afterMeeting: string[]
    emergencyInfo: {
      policeNumber: string
      helplineNumber: string
      tips: string[]
    }
  } {
    const beforeMeeting = [
      'Verifikoni identitetin e personit me të cilin do të takoheni',
      'Zgjidhni një vend të sigurt dhe publik për takimin',
      'Informoni një person të besuar për takimin',
      'Kontrolloni dokumentet e automjetit online (nëse është e mundur)',
      'Përgatitin të gjitha dokumentet tuaja të nevojshme'
    ]

    const duringMeeting = [
      'Takohuni vetëm në vendin e caktuar paraprakisht',
      'Mos shkoni vetëm - sillni një shoqërues',
      'Kontrolloni me kujdes automjetin dhe dokumentet',
      'Mos nënshkruani asgjë nën presion',
      'Bëni foto të dokumenteve të rëndësishme'
    ]

    const afterMeeting = [
      'Ruani të gjitha dokumentet e transaksionit',
      'Regjistroni automjetin në emrin tuaj menjëherë',
      'Kontaktoni kompaninë e sigurimeve për transferim',
      'Lajmëroni familjen që transaksioni është përfunduar'
    ]

    if (listingPrice > 15000 * 100) { // €15,000 in cents
      beforeMeeting.push('Konsideroni përdorimin e shërbimit të escrow')
      duringMeeting.push('Mos transportoni shuma të mëdha parash')
      afterMeeting.push('Konfirmoni që pagesa është procesuar në mënyrë të sigurt')
    }

    if (isFirstTime) {
      beforeMeeting.push('Lexoni udhëzimet për blerës të rinj')
      duringMeeting.push('Merrni kohën e duhur për të kontrolluar gjithçka')
      afterMeeting.push('Vlerësoni përvojën tuaj për përdoruesit e tjerë')
    }

    return {
      beforeMeeting,
      duringMeeting,
      afterMeeting,
      emergencyInfo: {
        policeNumber: '129', // Albanian police emergency number
        helplineNumber: '127', // Albanian emergency helpline
        tips: [
          'Nëse ndiheni të pasigurt, largohuni menjëherë',
          'Besoni instinkteve tuaja',
          'Mos kini frikë të telefononi policinë nëse ka problem',
          'Ruajeni gjithmonë sigurinë tuaj personale mbi gjithçka'
        ]
      }
    }
  }

  /**
   * Report unsafe location or incident
   */
  static async reportSafetyIncident(
    userId: string,
    incidentType: 'unsafe_location' | 'fraud_attempt' | 'harassment' | 'other',
    description: string,
    locationId?: string,
    listingId?: string,
    evidence?: any
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      const report = await prisma.userReport.create({
        data: {
          reporterId: userId,
          reportedUserId: userId, // Self-report for safety incidents
          reportType: incidentType,
          reason: incidentType,
          description,
          evidence,
          relatedListingId: listingId,
          severity: incidentType === 'fraud_attempt' ? 'high' : 'medium'
        }
      })

      // If location-related, update location safety rating
      if (locationId && incidentType === 'unsafe_location') {
        await this.updateLocationSafetyRating(locationId, false)
      }

      // Alert admin for high-severity incidents
      if (incidentType === 'fraud_attempt' || incidentType === 'harassment') {
        await this.alertAdminSafetyIncident(report.id, incidentType)
      }

      return { success: true, reportId: report.id }
    } catch (error) {
      console.error('Safety incident report failed:', error)
      return { success: false, error: 'Raportimi i incidentit dështoi' }
    }
  }

  /**
   * Update location safety rating based on user feedback
   */
  private static async updateLocationSafetyRating(
    locationId: string,
    isPositive: boolean
  ): Promise<void> {
    const location = await prisma.safetyLocation.findUnique({
      where: { id: locationId }
    })

    if (!location) return

    const currentRating = location.averageRating || 3.0
    const totalReviews = location.totalReviews || 0

    // Simple rating calculation
    const newRatingValue = isPositive ? 5 : 1
    const newAverageRating = ((currentRating * totalReviews) + newRatingValue) / (totalReviews + 1)

    await prisma.safetyLocation.update({
      where: { id: locationId },
      data: {
        averageRating: newAverageRating,
        totalReviews: totalReviews + 1,
        lastUsed: new Date()
      }
    })
  }

  /**
   * Alert admin about safety incident
   */
  private static async alertAdminSafetyIncident(
    reportId: string,
    incidentType: string
  ): Promise<void> {
    // In production, send immediate notification to admin team
    console.log(`URGENT: Safety incident reported - Type: ${incidentType}, Report ID: ${reportId}`)

    // Create fraud alert if fraud attempt
    if (incidentType === 'fraud_attempt') {
      const report = await prisma.userReport.findUnique({
        where: { id: reportId },
        include: { listing: true }
      })

      if (report?.relatedListingId) {
        await prisma.fraudAlert.create({
          data: {
            listingId: report.relatedListingId,
            userId: report.reportedUserId,
            alertType: 'fraud_attempt',
            severity: 'critical',
            description: `User reported fraud attempt: ${report.description}`,
            evidence: { reportId, userReport: report.evidence }
          }
        })
      }
    }
  }

  /**
   * Get safety statistics for admin dashboard
   */
  static async getSafetyStatistics(): Promise<{
    totalSafeLocations: number
    verifiedLocations: number
    safetyIncidents: number
    averageLocationRating: number
    topSafeCities: Array<{ city: string; locationCount: number }>
    recentIncidents: any[]
  }> {
    const [
      totalLocations,
      verifiedLocations,
      safetyIncidents,
      locationRatingAvg,
      cityCounts,
      recentIncidents
    ] = await Promise.all([
      prisma.safetyLocation.count({ where: { isActive: true } }),
      prisma.safetyLocation.count({ where: { isVerified: true, isActive: true } }),
      prisma.userReport.count({
        where: {
          reportType: { in: ['unsafe_location', 'fraud_attempt', 'harassment'] },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.safetyLocation.aggregate({
        _avg: { averageRating: true },
        where: { isActive: true }
      }),
      prisma.safetyLocation.groupBy({
        by: ['city'],
        _count: { id: true },
        where: { isActive: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),
      prisma.userReport.findMany({
        where: {
          reportType: { in: ['unsafe_location', 'fraud_attempt', 'harassment'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          reporter: { select: { name: true } },
          listing: { select: { title: true } }
        }
      })
    ])

    return {
      totalSafeLocations: totalLocations,
      verifiedLocations,
      safetyIncidents,
      averageLocationRating: locationRatingAvg._avg.averageRating || 0,
      topSafeCities: cityCounts.map(c => ({
        city: c.city,
        locationCount: c._count.id
      })),
      recentIncidents
    }
  }

  /**
   * Get insurance verification guidelines
   */
  static getInsuranceGuidelines(): {
    requiredDocuments: string[]
    verificationSteps: string[]
    albanianInsurers: string[]
    tips: string[]
  } {
    return {
      requiredDocuments: [
        'Polica e sigurimit e vlefshme',
        'Çertifikata e regjistrimit',
        'Kontrollimi teknik i vlefshëm',
        'Dokumenti i identitetit të pronarit'
      ],
      verificationSteps: [
        'Verifikoni datën e skadencës së sigurimit',
        'Kontrolloni që emri në policë përputhet me pronarin',
        'Konfirmoni me kompaninë e sigurimit (nëse është e mundur)',
        'Kontrolloni që automjeti nuk është i bllokuar'
      ],
      albanianInsurers: [
        'Sigal UNIQA Group Austria',
        'INTERSIG Vienna Insurance Group',
        'Sigma Interalbanian Vienna Insurance Group',
        'Atlantik Gjanica',
        'Albsig',
        'Insig'
      ],
      tips: [
        'Mos pranoni automjet pa sigurim të vlefshëm',
        'Transferoni sigurimin menjëherë pas blerjes',
        'Ruani kopje të të gjitha dokumenteve',
        'Kontrolloni përjashtimi dhe kufizimet e policës'
      ]
    }
  }
}