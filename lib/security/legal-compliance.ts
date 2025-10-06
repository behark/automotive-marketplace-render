import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Legal Compliance Service for Albanian, Kosovo, and Macedonia Markets
 * Handles consumer protection, data privacy, and regional legal requirements
 */
export class LegalComplianceService {
  /**
   * Albanian Consumer Protection Law compliance
   */
  static getAlbanianConsumerRights(): {
    consumerRights: string[]
    sellerObligations: string[]
    disputeResolution: string[]
    warrantiesAndReturns: string[]
  } {
    return {
      consumerRights: [
        'E drejta për informacion të saktë dhe të plotë për produktin',
        'E drejta për të anuluar blerjen brenda 14 ditëve (për shitje online)',
        'E drejta për garancion sipas ligjit dhe kontratës',
        'E drejta për të kërkuar rimbursim në rast defekti',
        'E drejta për shërbim pas shitjes',
        'E drejta për të mos u mashtuar me praktika tregtare të padrejta'
      ],
      sellerObligations: [
        'Të sigurojë informacion të saktë për automjetin',
        'Të deklarojë të gjitha defektet e njohura',
        'Të sigurojë dokumentet e duhura të transferimit',
        'Të respektojë garancionet e dhëna',
        'Të mos përdorë praktika mashtruse në reklamim',
        'Të japë faturë ose dokument tatimor'
      ],
      disputeResolution: [
        'Negocim i drejtpërdrejtë mes palëve',
        'Mediacion përmes Autoritetit të Mbrojtjes së Konsumatorit',
        'Arbitrazh pranë Dhomës së Tregtisë',
        'Procedura gjyqësore në gjykatat vendore',
        'Ankesë pranë Autoritetit të Konkurrencës (për praktika të padrejta)'
      ],
      warrantiesAndReturns: [
        'Garancia ligjore minimum 2 vjet për automjete të reja',
        'Garancia ligjore 1 vit për automjete të përdorura',
        'E drejta për riparim ose zëvendësim pa pagesë',
        'E drejta për reduktim çmimi ose anulim kontrate',
        'Përjashtim garancioni për dëmtime nga neglizhenca'
      ]
    }
  }

  /**
   * Kosovo legal requirements for automotive sales
   */
  static getKosovoLegalRequirements(): {
    registrationRequirements: string[]
    taxObligations: string[]
    importRegulations: string[]
    consumerProtection: string[]
  } {
    return {
      registrationRequirements: [
        'Regjistrimi i automjetit pranë AUK (Agjencisë për Udhëtarë të Kosovës)',
        'Kontrolli teknik i vlefshëm',
        'Sigurim i detyruar civil',
        'Dokument pronësie i vlefshëm',
        'Pagesë e taksave të regjistrimit'
      ],
      taxObligations: [
        'TVSH 18% për automjete të reja',
        'Taksa e regjistrimit sipas volumit të motorit',
        'Taksa vjetore e automjetit',
        'Deklarim në TVSH për shitës të licencuar'
      ],
      importRegulations: [
        'Deklaratë doganore për automjete të importuar',
        'Çertifikatë e përputhjeje EU (nëse është e aplikueshme)',
        'Dokument i origjinës së automjetit',
        'Kontrolli i emetimeve dhe standardeve mjedisore'
      ],
      consumerProtection: [
        'Ligji për Mbrojtjen e Konsumatorit të Kosovës',
        'E drejta për informacion të saktë',
        'E drejta për garancion dhe riparim',
        'Mbrojtje nga praktikat mashtruse'
      ]
    }
  }

  /**
   * Macedonia/North Macedonia legal requirements
   */
  static getMacedoniaLegalRequirements(): {
    salesDocumentation: string[]
    consumerRights: string[]
    businessObligations: string[]
    crossBorderTrade: string[]
  } {
    return {
      salesDocumentation: [
        'Certifikatë regjistrimi e vlefshme',
        'Dokument pronësie (zelena kniska)',
        'Kontrolli teknik i vlefshëm',
        'Sigurim i detyruar',
        'Faturë shitjeje me të dhëna të plota'
      ],
      consumerRights: [
        'Mbrojtje sipas Ligjit për Mbrojtjen e Konsumatorit',
        'E drejta për informacion të qartë dhe të saktë',
        'Garancioni ligjor për automjete',
        'E drejta për ankesë dhe kompensim',
        'Mbrojtje nga kontrata të padrejta'
      ],
      businessObligations: [
        'Licencë e vlefshme tregtare',
        'Regjistrimi në Regjistrin Qendror',
        'Deklarim tatimor i rregullt',
        'Respektim i standardeve të shitjes',
        'Sigurimi profesional i përgjegjësisë'
      ],
      crossBorderTrade: [
        'Dokumentat e duhura për eksport/import',
        'Pagesë e taksave doganore',
        'Përputhjeje me standardet e BE-së',
        'Çertifikimi i emetimeve'
      ]
    }
  }

  /**
   * Process legal compliance check for listing
   */
  static async processComplianceCheck(
    listingId: string,
    country: 'AL' | 'XK' | 'MK',
    isBusinessSeller: boolean = false
  ): Promise<{
    compliant: boolean
    issues: string[]
    recommendations: string[]
    requiredActions: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []
    const requiredActions: string[] = []

    try {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: {
          user: {
            include: { verification: true }
          },
          transactionSafety: true,
          vehicleVerification: true
        }
      })

      if (!listing) {
        return {
          compliant: false,
          issues: ['Shpallja nuk u gjet'],
          recommendations: [],
          requiredActions: ['Verifikoni ekzistencën e shpalljes']
        }
      }

      // Check country-specific requirements
      switch (country) {
        case 'AL':
          await this.checkAlbanianCompliance(listing, issues, recommendations, requiredActions, isBusinessSeller)
          break
        case 'XK':
          await this.checkKosovoCompliance(listing, issues, recommendations, requiredActions, isBusinessSeller)
          break
        case 'MK':
          await this.checkMacedoniaCompliance(listing, issues, recommendations, requiredActions, isBusinessSeller)
          break
      }

      // Common compliance checks
      await this.checkCommonCompliance(listing, issues, recommendations, requiredActions)

      // Create compliance record
      await prisma.legalCompliance.create({
        data: {
          complianceType: `${country.toLowerCase()}_consumer_law`,
          dataType: 'listing_data',
          requestDetails: `Compliance check for listing ${listingId}`,
          requestStatus: issues.length === 0 ? 'completed' : 'requires_action'
        }
      })

      return {
        compliant: issues.length === 0,
        issues,
        recommendations,
        requiredActions
      }
    } catch (error) {
      console.error('Compliance check failed:', error)
      return {
        compliant: false,
        issues: ['Kontrollimi i përputhshmërisë dështoi'],
        recommendations: [],
        requiredActions: ['Kontaktoni administratorët për ndihmë']
      }
    }
  }

  /**
   * Check Albanian legal compliance
   */
  private static async checkAlbanianCompliance(
    listing: any,
    issues: string[],
    recommendations: string[],
    requiredActions: string[],
    isBusinessSeller: boolean
  ): Promise<void> {
    // Business seller requirements
    if (isBusinessSeller) {
      if (!listing.user.verification?.businessVerified) {
        issues.push('Biznesi nuk është i verifikuar')
        requiredActions.push('Verifikoni regjistrimin e biznesit')
      }

      // Must provide business warranty
      if (!listing.transactionSafety?.hasWarranty) {
        issues.push('Garancion biznesi është i detyrueshëm')
        requiredActions.push('Shtoni informacion për garancionin')
      }
    }

    // Vehicle documentation requirements
    if (!listing.vehicleVerification?.registrationVerified) {
      issues.push('Dokumentet e regjistrimit nuk janë të verifikuara')
      requiredActions.push('Ngarkoni dokumente të vlefshme regjistrimi')
    }

    // Price transparency (Albanian Consumer Protection Law)
    if (listing.price > 1000000) { // €10,000+ in cents
      if (!listing.description.includes('çmim') && !listing.description.includes('€')) {
        recommendations.push('Specifikoni qartë çmimin dhe kushtet e pagesës')
      }
    }

    // Technical inspection requirement
    if (!listing.vehicleVerification?.technicalInspectionValid) {
      issues.push('Kontrolli teknik nuk është i vlefshëm')
      requiredActions.push('Siguroni kontroll teknik të vlefshëm')
    }
  }

  /**
   * Check Kosovo legal compliance
   */
  private static async checkKosovoCompliance(
    listing: any,
    issues: string[],
    recommendations: string[],
    requiredActions: string[],
    isBusinessSeller: boolean
  ): Promise<void> {
    // Kosovo-specific checks
    if (isBusinessSeller && listing.user.plan === 'free') {
      issues.push('Shitësit e biznesit duhet të kenë plan të paguar')
      requiredActions.push('Përditësoni në plan biznesi')
    }

    // Insurance verification for Kosovo
    if (!listing.vehicleVerification?.insuranceVerified) {
      issues.push('Sigurimi i automjetit duhet të jetë i verifikuar')
      requiredActions.push('Ngarkoni policën e sigurimit')
    }

    // VAT requirements for business sellers
    if (isBusinessSeller && listing.price > 50000) { // €500+
      recommendations.push('Sigurohuni që TVSH-ja është e përfshirë në çmim')
    }
  }

  /**
   * Check Macedonia legal compliance
   */
  private static async checkMacedoniaCompliance(
    listing: any,
    issues: string[],
    recommendations: string[],
    requiredActions: string[],
    isBusinessSeller: boolean
  ): Promise<void> {
    // Macedonia-specific documentation
    if (!listing.description.includes('kilometer') && !listing.description.includes('km')) {
      issues.push('Kilometrat duhet të jenë të specifikuara qartë')
      requiredActions.push('Shtoni informacion të saktë për kilometrazhin')
    }

    // Business registration requirements
    if (isBusinessSeller) {
      if (!listing.user.verification?.businessNumber) {
        issues.push('Numri i regjistrimit të biznesit mungon')
        requiredActions.push('Shtoni numrin e regjistrimit të biznesit')
      }
    }

    // Cross-border trade considerations
    if (listing.make && !['Volkswagen', 'BMW', 'Mercedes-Benz', 'Audi', 'Toyota'].includes(listing.make)) {
      recommendations.push('Verifikoni standardet e BE-së për automjete jo-evropiane')
    }
  }

  /**
   * Common compliance checks for all countries
   */
  private static async checkCommonCompliance(
    listing: any,
    issues: string[],
    recommendations: string[],
    requiredActions: string[]
  ): Promise<void> {
    // Required information completeness
    const requiredFields = ['make', 'model', 'year', 'mileage', 'fuelType', 'transmission']
    for (const field of requiredFields) {
      if (!listing[field]) {
        issues.push(`Informacioni për ${field} mungon`)
        requiredActions.push(`Shtoni informacion për ${field}`)
      }
    }

    // Photo requirements
    const images = listing.images as string[] || []
    if (images.length < 3) {
      issues.push('Minimumi 3 foto janë të kërkuara')
      requiredActions.push('Ngarkoni të paktën 3 foto të automjetit')
    }

    // Description length and quality
    if (listing.description.length < 50) {
      issues.push('Përshkrimi është shumë i shkurtër')
      requiredActions.push('Shtoni përshkrim më të detajuar')
    }

    // Fraud prevention
    if (listing.fraudRiskScore && listing.fraudRiskScore > 0.7) {
      issues.push('Shpallja ka tregues të rrezikut për mashtrim')
      requiredActions.push('Verifikoni të gjitha informacionet e automjetit')
    }

    // Contact information requirements
    if (!listing.user.phone && !listing.user.email) {
      issues.push('Informacion kontakti mungon')
      requiredActions.push('Shtoni të paktën një mënyrë kontakti')
    }
  }

  /**
   * Generate legal disclaimer text for listings
   */
  static generateLegalDisclaimer(
    country: 'AL' | 'XK' | 'MK',
    isBusinessSeller: boolean = false
  ): string {
    const baseDisclaimer = `
Kjo shpallje është bërë në përputhje me ligjet lokale të mbrojtjes së konsumatorit.
Të gjitha informacionet e dhëna janë përgjegjësi e shitësit.
Blerësi ka të drejtë për verifikim paraprak të automjetit.
    `.trim()

    let countrySpecific = ''

    switch (country) {
      case 'AL':
        countrySpecific = `
Në përputhje me Ligjin e Mbrojtjes së Konsumatorit të Shqipërisë:
- Garancia minimumi sipas ligjit zbatohet
- E drejta për kthim brenda 14 ditëve (për shitje online)
- Kontakto APC-në për ankesa: www.apc.gov.al
        `.trim()
        break

      case 'XK':
        countrySpecific = `
Sipas Ligjit për Mbrojtjen e Konsumatorit të Kosovës:
- Mbrojtje nga praktikat mashtruse
- Garancia dhe shërbimi pas shitjes i garantuar
- Ankesa mund të parashtrohen pranë institucioneve relevante
        `.trim()
        break

      case 'MK':
        countrySpecific = `
Në përputhje me legjislacionin e Maqedonisë së Veriut:
- Respektim i standardeve të BE-së
- Dokumentacion i plotë për transferim pronësie
- Sigurimi i vlefshëm i përgjegjësisë civile
        `.trim()
        break
    }

    if (isBusinessSeller) {
      countrySpecific += `

Si shitës i licencuar:
- Ofrojmë garancion profesional
- Jemi të regjistruar si subjekt tregtar
- Ofrojmë shërbim pas shitjes
      `.trim()
    }

    return `${baseDisclaimer}\n\n${countrySpecific}`
  }

  /**
   * Get dispute resolution options by country
   */
  static getDisputeResolutionOptions(country: 'AL' | 'XK' | 'MK'): {
    mediationServices: Array<{ name: string; contact: string; description: string }>
    governmentAgencies: Array<{ name: string; contact: string; description: string }>
    legalOptions: string[]
  } {
    const options = {
      AL: {
        mediationServices: [
          {
            name: 'Autoriteti i Mbrojtjes së Konsumatorit',
            contact: 'apc.gov.al | Tel: +355 4 2233835',
            description: 'Mediacion falas për mosmarrëveshje tregtare'
          },
          {
            name: 'Dhoma e Tregtisë dhe Industrisë',
            contact: 'cci.al | Tel: +355 4 2230338',
            description: 'Arbitrazh tregtar për biznese'
          }
        ],
        governmentAgencies: [
          {
            name: 'Ministria e Financave dhe Ekonomisë',
            contact: 'financa.gov.al',
            description: 'Mbikëqyrje e praktikave tregtare'
          },
          {
            name: 'Autoriteti i Konkurrencës',
            contact: 'caa.gov.al',
            description: 'Praktika të padrejta tregtare'
          }
        ],
        legalOptions: [
          'Gjykata e Shkallës së Parë',
          'Arbitrazh privat',
          'Procedura e shpejtuar civile'
        ]
      },
      XK: {
        mediationServices: [
          {
            name: 'Ombudspersoni i Kosovës',
            contact: 'ombudspersonkosovo.org',
            description: 'Mediacion për mosmarrëveshje me administratën'
          }
        ],
        governmentAgencies: [
          {
            name: 'Ministria e Tregtisë dhe Industrisë',
            contact: 'mti-ks.org',
            description: 'Mbikëqyrje e tregjeve'
          }
        ],
        legalOptions: [
          'Gjykatat themelore',
          'Gjykata e Apelit',
          'Arbitrazh tregtar'
        ]
      },
      MK: {
        mediationServices: [
          {
            name: 'Qendra për Mediacion',
            contact: 'mediation.mk',
            description: 'Shërbime mediacioni për mosmarrëveshje civile'
          }
        ],
        governmentAgencies: [
          {
            name: 'Komisioni për Mbrojtjen e Konsumatorit',
            contact: 'economy.gov.mk',
            description: 'Mbrojtje e të drejtave të konsumatorit'
          }
        ],
        legalOptions: [
          'Gjykata themelore',
          'Gjykata e apelit',
          'Procedura e shkurtuar'
        ]
      }
    }

    return options[country]
  }

  /**
   * Generate compliance report for business users
   */
  static async generateComplianceReport(
    userId: string,
    country: 'AL' | 'XK' | 'MK'
  ): Promise<{
    businessCompliance: any
    listingCompliance: any
    recommendations: string[]
    nextReviewDate: Date
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        verification: true,
        listings: {
          where: { status: 'active' },
          include: { vehicleVerification: true, transactionSafety: true }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const businessCompliance = {
      businessVerified: user.verification?.businessVerified || false,
      bankVerified: user.verification?.bankVerified || false,
      hasValidLicense: user.role === 'dealer',
      taxCompliant: true // Would check with tax authorities
    }

    const listingCompliance = {
      totalListings: user.listings.length,
      compliantListings: user.listings.filter(l =>
        l.vehicleVerification?.registrationVerified
      ).length,
      pendingVerifications: user.listings.filter(l =>
        !l.vehicleVerification?.registrationVerified
      ).length
    }

    const recommendations = []
    if (!businessCompliance.businessVerified) {
      recommendations.push('Verifikoni regjistrimin e biznesit')
    }
    if (listingCompliance.pendingVerifications > 0) {
      recommendations.push('Kompletoni verifikimin e automjeteve')
    }

    return {
      businessCompliance,
      listingCompliance,
      recommendations,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  }
}