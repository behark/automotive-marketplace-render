import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const listingId = searchParams.get('listingId')
    const action = searchParams.get('action') || 'pricing'

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    switch (action) {
      case 'pricing':
        return await getPricingSuggestions(listingId, user.id)
      case 'timing':
        return await getOptimalTiming(listingId, user.id)
      case 'competitors':
        return await getCompetitorAnalysis(listingId, user.id)
      case 'demand':
        return await getDemandIndicators(listingId, user.id)
      case 'photos':
        return await getPhotoAnalysis(listingId, user.id)
      case 'description':
        return await getDescriptionOptimization(listingId, user.id)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Seller tools error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getPricingSuggestions(listingId: string | null, userId: string) {
  if (!listingId) {
    return NextResponse.json({ error: 'Listing ID required for pricing analysis' }, { status: 400 })
  }

  // Get the listing
  const listing = await prisma.listing.findUnique({
    where: { id: listingId, userId }
  })

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Get similar listings for price comparison
  const similarListings = await prisma.listing.findMany({
    where: {
      make: listing.make,
      model: listing.model,
      year: {
        gte: listing.year - 2,
        lte: listing.year + 2
      },
      country: 'AL',
      status: 'active',
      id: { not: listing.id }
    },
    take: 20,
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Get sold listings for price validation
  const soldListings = await prisma.listing.findMany({
    where: {
      make: listing.make,
      model: listing.model,
      year: {
        gte: listing.year - 3,
        lte: listing.year + 1
      },
      country: 'AL',
      status: 'sold',
      soldDate: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
      }
    },
    take: 10
  })

  // Calculate price statistics
  const currentPrice = listing.price / 100
  const similarPrices = similarListings.map(l => l.price / 100)
  const soldPrices = soldListings.map(l => (l.soldPrice || l.price) / 100)

  const avgSimilarPrice = similarPrices.length > 0 ?
    Math.round(similarPrices.reduce((sum, price) => sum + price, 0) / similarPrices.length) : 0

  const avgSoldPrice = soldPrices.length > 0 ?
    Math.round(soldPrices.reduce((sum, price) => sum + price, 0) / soldPrices.length) : 0

  const minPrice = Math.min(...similarPrices)
  const maxPrice = Math.max(...similarPrices)

  // Price recommendation logic
  let recommendedPrice = avgSimilarPrice
  let priceReason = 'Bazuar në çmimet e ngjashme në treg'

  if (soldPrices.length > 0) {
    const soldAvg = avgSoldPrice
    const marketAvg = avgSimilarPrice

    if (soldAvg < marketAvg * 0.9) {
      recommendedPrice = Math.round(soldAvg * 1.05) // 5% above average sold price
      priceReason = 'Çmimi i përafruar me të shitura së fundmi, plus 5% marzh'
    } else if (currentPrice > marketAvg * 1.15) {
      recommendedPrice = Math.round(marketAvg * 1.1)
      priceReason = 'Çmimi aktual shumë i lartë, reduktim për konkurrueshmëri'
    }
  }

  // Seasonal adjustments for Albanian market
  const currentMonth = new Date().getMonth()
  let seasonalAdjustment = 1.0
  let seasonalReason = ''

  if (currentMonth >= 2 && currentMonth <= 4) { // Spring
    if (listing.bodyType === 'Convertible' || listing.bodyType === 'Coupe') {
      seasonalAdjustment = 1.08
      seasonalReason = 'Pranvera - kërkesa e lartë për makina sportive'
    }
  } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
    if (listing.bodyType === 'SUV' || listing.bodyType === 'MPV') {
      seasonalAdjustment = 1.05
      seasonalReason = 'Vera - kërkesa për makina familjare dhe SUV'
    }
  } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
    seasonalAdjustment = 1.02
    seasonalReason = 'Vjeshtë - treg stabil'
  } else { // Winter
    if (listing.transmission === 'Automatic' || listing.fuelType === 'Diesel') {
      seasonalAdjustment = 1.06
      seasonalReason = 'Dimër - kërkesa për transmision automatik dhe diesel'
    } else {
      seasonalAdjustment = 0.96
      seasonalReason = 'Dimër - reduktim i përgjithshëm i kërkesës'
    }
  }

  const seasonalRecommendedPrice = Math.round(recommendedPrice * seasonalAdjustment)

  // Albanian market specific factors
  const marketFactors = []

  if (listing.city === 'Tiranë' || listing.city === 'Durrës') {
    marketFactors.push({
      factor: 'Lokacion Premium',
      impact: '+3-5%',
      description: 'Qytete kryesore - çmim më i lartë'
    })
  }

  if (['BMW', 'Mercedes', 'Audi'].includes(listing.make)) {
    marketFactors.push({
      factor: 'Marka Premium',
      impact: '+5-8%',
      description: 'Markat gjermane kanë kërkesë të lartë në Shqipëri'
    })
  }

  if (listing.fuelType === 'Hybrid' || listing.fuelType === 'Electric') {
    marketFactors.push({
      factor: 'Teknologji e Re',
      impact: '+10-15%',
      description: 'Kërkesa në rritje për makina ekonomike'
    })
  }

  // Photo and description quality impact
  const images = listing.images as any[] || []
  const hasGoodPhotos = images.length >= 8
  const hasDetailedDescription = listing.description.length >= 300

  if (!hasGoodPhotos || !hasDetailedDescription) {
    marketFactors.push({
      factor: 'Cilësia e Listimit',
      impact: '-5-10%',
      description: 'Foto dhe përshkrim i pamjaftueshëm ndikon negativisht'
    })
  }

  return NextResponse.json({
    currentPrice,
    recommendedPrice: seasonalRecommendedPrice,
    priceReason,
    seasonalAdjustment: {
      factor: seasonalAdjustment,
      reason: seasonalReason,
      adjustedPrice: seasonalRecommendedPrice
    },
    marketAnalysis: {
      avgSimilarPrice,
      avgSoldPrice,
      minPrice,
      maxPrice,
      totalSimilar: similarPrices.length,
      totalSold: soldPrices.length
    },
    priceRange: {
      min: Math.round(recommendedPrice * 0.9),
      max: Math.round(recommendedPrice * 1.1),
      optimal: seasonalRecommendedPrice
    },
    marketFactors,
    albanianMarketInsights: [
      'Blerësit shqiptarë preferojnë negocim - vendosni çmim 5-10% më të lartë',
      'Dokumentacioni i plotë lejon çmim premium',
      'Makinat me konsum të ulët kanë kërkesë më të lartë',
      'Çmimet që përfundojnë me 500 ose 900 EUR performojnë më mirë'
    ],
    competitorListings: similarListings.slice(0, 5).map(l => ({
      id: l.id,
      title: l.title,
      price: Math.round(l.price / 100),
      year: l.year,
      mileage: l.mileage,
      city: l.city,
      createdAt: l.createdAt
    }))
  })
}

async function getOptimalTiming(listingId: string | null, userId: string) {
  // Get user's listing data
  const userListings = await prisma.listing.findMany({
    where: { userId },
    include: {
      messages: true,
      favorites: true
    }
  })

  // Analyze posting patterns
  const postingPatterns = {}
  const viewPatterns = {}

  userListings.forEach(listing => {
    const dayOfWeek = new Date(listing.createdAt).getDay()
    const hour = new Date(listing.createdAt).getHours()

    const dayName = ['Diel', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'][dayOfWeek]

    if (!postingPatterns[dayName]) {
      postingPatterns[dayName] = { count: 0, avgMessages: 0, avgFavorites: 0 }
    }

    postingPatterns[dayName].count++
    postingPatterns[dayName].avgMessages += listing.messages.length
    postingPatterns[dayName].avgFavorites += listing.favorites.length
  })

  // Calculate averages
  Object.keys(postingPatterns).forEach(day => {
    const pattern = postingPatterns[day]
    pattern.avgMessages = Math.round(pattern.avgMessages / pattern.count)
    pattern.avgFavorites = Math.round(pattern.avgFavorites / pattern.count)
  })

  // Best times based on Albanian market data
  const bestTimes = [
    {
      day: 'Mërkur',
      timeRange: '10:00-12:00',
      reason: 'Aktiviteti më i lartë i blerësve gjatë javës',
      effectiveness: 'E lartë'
    },
    {
      day: 'Martë',
      timeRange: '14:00-17:00',
      reason: 'Koha kur njerëzit kërkojnë për blerje fundjavë',
      effectiveness: 'E lartë'
    },
    {
      day: 'Shtunë',
      timeRange: '09:00-11:00',
      reason: 'Fillim fundjavë - njerëzit planifikojnë vizita',
      effectiveness: 'Mesatare'
    },
    {
      day: 'Diel',
      timeRange: '16:00-19:00',
      reason: 'Kohë relaksi - shfletim të qetë',
      effectiveness: 'Mesatare'
    }
  ]

  const timingRecommendations = [
    'Shmangni postimin e hënën në mëngjes - aktivitet i ulët',
    'Fundjavat janë të mira për makina familjare dhe SUV',
    'Orët 20:00-23:00 kanë aktivitet të mirë për makina luksoze',
    'Evitoni posting gjatë pushimeve kombëtare'
  ]

  const seasonalTiming = getSeasonalTimingAdvice()

  return NextResponse.json({
    currentPattern: postingPatterns,
    bestTimes,
    timingRecommendations,
    seasonalTiming,
    nextOptimalTime: getNextOptimalTime(),
    albanianHolidays: getUpcomingAlbanianHolidays()
  })
}

async function getCompetitorAnalysis(listingId: string | null, userId: string) {
  if (!listingId) {
    return NextResponse.json({ error: 'Listing ID required for competitor analysis' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId, userId }
  })

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  // Find direct competitors
  const directCompetitors = await prisma.listing.findMany({
    where: {
      make: listing.make,
      model: listing.model,
      year: {
        gte: listing.year - 1,
        lte: listing.year + 1
      },
      mileage: {
        gte: listing.mileage - 20000,
        lte: listing.mileage + 20000
      },
      country: 'AL',
      status: 'active',
      id: { not: listing.id }
    },
    include: {
      messages: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      },
      favorites: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }
    },
    take: 10
  })

  // Broader competition (same make, different models)
  const broaderCompetitors = await prisma.listing.findMany({
    where: {
      make: listing.make,
      model: { not: listing.model },
      price: {
        gte: listing.price * 0.8,
        lte: listing.price * 1.2
      },
      country: 'AL',
      status: 'active'
    },
    take: 5
  })

  // Analyze competitive advantages/disadvantages
  const competitiveAnalysis = directCompetitors.map(comp => {
    const advantages = []
    const disadvantages = []

    // Price comparison
    if (listing.price < comp.price) {
      advantages.push(`Çmim më i ulët (€${Math.round(listing.price / 100)} vs €${Math.round(comp.price / 100)})`)
    } else if (listing.price > comp.price) {
      disadvantages.push(`Çmim më i lartë (€${Math.round(listing.price / 100)} vs €${Math.round(comp.price / 100)})`)
    }

    // Mileage comparison
    if (listing.mileage < comp.mileage) {
      advantages.push(`Kilometra më pak (${listing.mileage.toLocaleString()} vs ${comp.mileage.toLocaleString()})`)
    } else if (listing.mileage > comp.mileage) {
      disadvantages.push(`Kilometra më shumë (${listing.mileage.toLocaleString()} vs ${comp.mileage.toLocaleString()})`)
    }

    // Year comparison
    if (listing.year > comp.year) {
      advantages.push(`Më i ri (${listing.year} vs ${comp.year})`)
    } else if (listing.year < comp.year) {
      disadvantages.push(`Më i vjetër (${listing.year} vs ${comp.year})`)
    }

    // Activity comparison
    const myActivity = 0 // Would need to calculate actual views/messages
    const compActivity = comp.messages.length + comp.favorites.length

    return {
      id: comp.id,
      title: comp.title,
      price: Math.round(comp.price / 100),
      year: comp.year,
      mileage: comp.mileage,
      city: comp.city,
      advantages,
      disadvantages,
      activityLevel: compActivity > 5 ? 'E lartë' : compActivity > 2 ? 'Mesatare' : 'E ulët',
      messages: comp.messages.length,
      favorites: comp.favorites.length
    }
  })

  const marketPosition = {
    priceRanking: calculatePriceRanking(listing, directCompetitors),
    mileageRanking: calculateMileageRanking(listing, directCompetitors),
    ageRanking: calculateAgeRanking(listing, directCompetitors),
    overallCompetitiveness: 'Mesatare' // Would calculate based on multiple factors
  }

  const recommendations = generateCompetitorRecommendations(listing, competitiveAnalysis)

  return NextResponse.json({
    directCompetitors: competitiveAnalysis,
    broaderCompetitors: broaderCompetitors.map(c => ({
      id: c.id,
      title: c.title,
      make: c.make,
      model: c.model,
      price: Math.round(c.price / 100),
      year: c.year,
      city: c.city
    })),
    marketPosition,
    recommendations,
    competitiveAdvantages: getCompetitiveAdvantages(listing),
    improvementAreas: getImprovementAreas(listing, directCompetitors)
  })
}

async function getDemandIndicators(listingId: string | null, userId: string) {
  // Get market demand data
  const demandData = await prisma.listing.groupBy({
    by: ['make', 'model'],
    where: {
      country: 'AL',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 20
  })

  // Get regional demand
  const regionalDemand = await prisma.listing.groupBy({
    by: ['city'],
    where: {
      country: 'AL',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  })

  const demandIndicators = [
    {
      category: 'Kërkesa Gjenerale',
      level: 'E lartë',
      trend: 'Në rritje',
      description: 'Kërkesa për makina të përdorura është në nivele të larta'
    },
    {
      category: 'Makina Gjermane',
      level: 'Shumë e lartë',
      trend: 'Stabile',
      description: 'BMW, Mercedes, Audi vazhdojnë të jenë të kërkuara'
    },
    {
      category: 'Ekonomike (Benzinë)',
      level: 'E lartë',
      trend: 'Në rritje',
      description: 'Çmimet e larta të karburantit rrisin kërkesën'
    },
    {
      category: 'SUV/Crossover',
      level: 'E lartë',
      trend: 'Në rritje',
      description: 'Preferenca në rritje për SUV në tregun shqiptar'
    }
  ]

  return NextResponse.json({
    demandIndicators,
    popularModels: demandData,
    regionalDemand,
    seasonalFactors: getSeasonalDemandFactors(),
    marketSentiment: 'Pozitiv',
    buyerBehavior: getAlbanianBuyerBehavior()
  })
}

async function getPhotoAnalysis(listingId: string | null, userId: string) {
  if (!listingId) {
    return NextResponse.json({ error: 'Listing ID required for photo analysis' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId, userId }
  })

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const images = listing.images as any[] || []

  // Analyze photo performance
  const photoAnalysis = {
    totalPhotos: images.length,
    qualityScore: calculatePhotoQualityScore(images),
    missingAngles: getMissingPhotoAngles(images),
    recommendations: getPhotoRecommendations(images),
    albanianPreferences: getAlbanianPhotoPreferences()
  }

  return NextResponse.json(photoAnalysis)
}

async function getDescriptionOptimization(listingId: string | null, userId: string) {
  if (!listingId) {
    return NextResponse.json({ error: 'Listing ID required for description analysis' }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId, userId }
  })

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const descriptionAnalysis = {
    currentLength: listing.description.length,
    readabilityScore: calculateReadabilityScore(listing.description),
    keywordDensity: analyzeKeywords(listing.description, listing),
    missingInformation: getMissingInformation(listing),
    seoScore: calculateSEOScore(listing),
    albanianLanguageQuality: analyzeAlbanianLanguage(listing.description),
    improvementSuggestions: getDescriptionImprovements(listing)
  }

  return NextResponse.json(descriptionAnalysis)
}

// Helper functions
function getSeasonalTimingAdvice() {
  const currentMonth = new Date().getMonth()

  if (currentMonth >= 2 && currentMonth <= 4) {
    return {
      season: 'Pranverë',
      advice: 'Koha e përkryer për makina sportive dhe cabrio',
      bestCategories: ['Convertible', 'Coupe', 'Sport']
    }
  } else if (currentMonth >= 5 && currentMonth <= 7) {
    return {
      season: 'Verë',
      advice: 'Kërkesa e lartë për SUV dhe makina familjare',
      bestCategories: ['SUV', 'MPV', 'Station Wagon']
    }
  } else if (currentMonth >= 8 && currentMonth <= 10) {
    return {
      season: 'Vjeshtë',
      advice: 'Kohë e mirë për të gjitha kategoritë',
      bestCategories: ['Sedan', 'Hatchback', 'SUV']
    }
  } else {
    return {
      season: 'Dimër',
      advice: 'Fokus tek makinat 4x4 dhe me traction control',
      bestCategories: ['SUV', '4x4', 'AWD']
    }
  }
}

function getNextOptimalTime() {
  const now = new Date()
  const nextWednesday = new Date()
  nextWednesday.setDate(now.getDate() + ((3 - now.getDay() + 7) % 7))
  nextWednesday.setHours(10, 0, 0, 0)

  return {
    date: nextWednesday,
    reason: 'Mërkur në orën 10:00 - aktiviteti më i lartë i fundjavës'
  }
}

function getUpcomingAlbanianHolidays() {
  // Return upcoming Albanian holidays that might affect posting
  return [
    { date: '2024-11-28', name: 'Dita e Pavarësisë', impact: 'Aktivitet i ulët' },
    { date: '2024-11-29', name: 'Dita e Çlirimit', impact: 'Aktivitet i ulët' },
    { date: '2024-12-25', name: 'Krishtlindjet', impact: 'Aktivitet shumë i ulët' }
  ]
}

function calculatePriceRanking(listing: any, competitors: any[]) {
  const prices = [listing.price, ...competitors.map(c => c.price)].sort((a, b) => a - b)
  const rank = prices.indexOf(listing.price) + 1
  return `${rank}/${prices.length} (${rank <= prices.length / 3 ? 'I lirë' : rank <= 2 * prices.length / 3 ? 'Mesatar' : 'I shtrenjtë'})`
}

function calculateMileageRanking(listing: any, competitors: any[]) {
  const mileages = [listing.mileage, ...competitors.map(c => c.mileage)].sort((a, b) => a - b)
  const rank = mileages.indexOf(listing.mileage) + 1
  return `${rank}/${mileages.length} (${rank <= mileages.length / 3 ? 'Pak km' : rank <= 2 * mileages.length / 3 ? 'Mesatar' : 'Shumë km'})`
}

function calculateAgeRanking(listing: any, competitors: any[]) {
  const years = [listing.year, ...competitors.map(c => c.year)].sort((a, b) => b - a)
  const rank = years.indexOf(listing.year) + 1
  return `${rank}/${years.length} (${rank <= years.length / 3 ? 'I ri' : rank <= 2 * years.length / 3 ? 'Mesatar' : 'I vjetër'})`
}

function generateCompetitorRecommendations(listing: any, competitors: any[]) {
  const recommendations = []

  // Price recommendations
  const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length
  if (listing.price > avgCompetitorPrice * 1.1) {
    recommendations.push('Konsideroni uljen e çmimit për të qenë më konkurrues')
  }

  // Activity recommendations
  const lowActivityCompetitors = competitors.filter(c => c.activityLevel === 'E ulët').length
  if (lowActivityCompetitors > competitors.length / 2) {
    recommendations.push('Konkurrencë e ulët - mundësi për çmim premium')
  }

  return recommendations
}

function getCompetitiveAdvantages(listing: any) {
  const advantages = []

  if (listing.fuelType === 'Hybrid' || listing.fuelType === 'Electric') {
    advantages.push('Teknologji të avancuara të motorit')
  }

  if (listing.transmission === 'Automatic') {
    advantages.push('Transmision automatik - i preferuar në Shqipëri')
  }

  if (['Tiranë', 'Durrës'].includes(listing.city)) {
    advantages.push('Lokacion premium')
  }

  return advantages
}

function getImprovementAreas(listing: any, competitors: any[]) {
  const improvements = []

  const images = listing.images as any[] || []
  if (images.length < 8) {
    improvements.push('Shtoni më shumë foto për konkurrencë më të mirë')
  }

  if (listing.description.length < 300) {
    improvements.push('Zgjeroni përshkrimin me më shumë detaje')
  }

  return improvements
}

function getSeasonalDemandFactors() {
  return [
    {
      season: 'Pranverë',
      factors: ['Rritje e kërkesës për cabrio', 'Fillim i sezonit të shitjeve', 'Aktivitet i lartë i tregut']
    },
    {
      season: 'Verë',
      factors: ['Peak sezoni për SUV', 'Turizëm - kërkesa për makina me qira', 'Aktivitet maksimal']
    },
    {
      season: 'Vjeshtë',
      factors: ['Periudhë stabile', 'Përgatitje për dimër', 'Kërkesa për AWD/4x4']
    },
    {
      season: 'Dimër',
      factors: ['Ulje e aktivitetit', 'Fokus tek ekonomiciteti', 'Kërkesa për diesel']
    }
  ]
}

function getAlbanianBuyerBehavior() {
  return [
    'Blerësit shqiptarë kërkojnë historik të detajuar të mirëmbajtjes',
    'Negocimi i çmimit është pjesë e kulturës',
    'Preferojnë blerje nga shitës të verifikuar',
    'Rëndësi e madhe tek kilometrat e vërteta',
    'Dokumentacioni i plotë është shumë i rëndësishëm',
    'Preferojnë makinat me konsum të ulët karburanti'
  ]
}

function calculatePhotoQualityScore(images: any[]) {
  let score = 0

  // Quantity score (up to 40 points)
  score += Math.min(images.length * 5, 40)

  // Quality indicators (simulated - would use AI in production)
  if (images.length >= 8) score += 20
  if (images.length >= 12) score += 10

  return Math.min(score, 100)
}

function getMissingPhotoAngles(images: any[]) {
  const required = [
    'Foto e përparme',
    'Foto e pasme',
    'Foto nga të dyja anët',
    'Foto e brendshme përparme',
    'Foto e brendshme pasme',
    'Foto e timonit',
    'Foto e motorit',
    'Foto e paneleve të kontrollit'
  ]

  // Simulate missing angles based on count
  const missing = []
  if (images.length < 8) {
    missing.push(...required.slice(images.length))
  }

  return missing
}

function getPhotoRecommendations(images: any[]) {
  const recommendations = []

  if (images.length < 6) {
    recommendations.push('Shtoni më shumë foto - minimumi 6-8 foto')
  }

  if (images.length < 10) {
    recommendations.push('Shtoni foto të brendshme dhe detaje teknike')
  }

  recommendations.push('Fotografoni në dritë natyrore për rezultate më të mira')
  recommendations.push('Sigurohuni që makina është e pastër dhe e organizuar')

  return recommendations
}

function getAlbanianPhotoPreferences() {
  return [
    'Blerësit shqiptarë preferojnë 8-12 foto për listim',
    'Foto të detajuara të kilometrave janë të rëndësishme',
    'Foto e motorit dhe pjesëve teknike rrisin besueshmërinë',
    'Foto në dritë natyrore performojnë më mirë',
    'Foto të brendshme të detajuara janë thelbësore'
  ]
}

function calculateReadabilityScore(text: string) {
  // Simple readability calculation
  const sentences = text.split(/[.!?]+/).length
  const words = text.split(/\s+/).length
  const avgWordsPerSentence = words / sentences

  // Albanian readability - optimal 10-15 words per sentence
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 15) {
    return 85
  } else if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 18) {
    return 70
  } else {
    return 55
  }
}

function analyzeKeywords(description: string, listing: any) {
  const keywords = [listing.make, listing.model, listing.year.toString(), listing.fuelType, listing.transmission]
  const density = {}

  keywords.forEach(keyword => {
    const count = (description.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
    density[keyword] = count
  })

  return density
}

function getMissingInformation(listing: any) {
  const missing = []

  if (!listing.description.includes('km')) {
    missing.push('Përmendni kilometrat në përshkrim')
  }

  if (!listing.description.includes('document') && !listing.description.includes('letra')) {
    missing.push('Specifikoni statusin e dokumentave')
  }

  if (!listing.description.includes('shërbim') && !listing.description.includes('mirëmbajtje')) {
    missing.push('Shtoni informacion për mirëmbajtjen')
  }

  if (listing.description.length < 200) {
    missing.push('Përshkrim shumë i shkurtër - shtoni më shumë detaje')
  }

  return missing
}

function calculateSEOScore(listing: any) {
  let score = 0

  // Title optimization
  if (listing.title.includes(listing.make) && listing.title.includes(listing.model)) score += 20
  if (listing.title.includes(listing.year.toString())) score += 10
  if (listing.title.length >= 30) score += 10

  // Description optimization
  if (listing.description.length >= 200) score += 20
  if (listing.description.includes('Shqipëri') || listing.description.includes('Tiranë')) score += 10
  if (listing.description.includes(listing.make) && listing.description.includes(listing.model)) score += 15

  // Location optimization
  if (['Tiranë', 'Durrës', 'Vlorë', 'Shkodër'].includes(listing.city)) score += 15

  return Math.min(score, 100)
}

function analyzeAlbanianLanguage(description: string) {
  // Simple Albanian language quality check
  const albanianWords = ['makina', 'motor', 'shitje', 'blerje', 'çmim', 'dokumente', 'kilometra']
  const hasAlbanianWords = albanianWords.some(word => description.toLowerCase().includes(word))

  return {
    hasAlbanianContent: hasAlbanianWords,
    qualityScore: hasAlbanianWords ? 85 : 60,
    suggestions: hasAlbanianWords ?
      ['Përdorni më shumë fjalë kyçe shqipe'] :
      ['Shtoni fjalë kyçe në shqip për SEO më të mirë']
  }
}

function getDescriptionImprovements(listing: any) {
  return [
    'Shtoni historikun e mirëmbajtjes së makinës',
    'Përshkruani karakteristikat kryesore që dallojnë makinën',
    'Përmendni nëse pranoni këmbim ose financim',
    'Shtoni informacion për dokumentacionin',
    'Specifikoni arsyen e shitjes',
    'Përdorni fjalë kyçe që kërkojnë blerësit shqiptarë'
  ]
}