import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const region = searchParams.get('region') || 'all'
    const timeFrame = searchParams.get('timeFrame') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (timeFrame) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Regional filter for Albanian market
    const regionFilter = region === 'all' ? {} : { city: region }

    // Get market overview data
    const marketOverview = await getMarketOverview(startDate, regionFilter)

    // Get regional performance analysis
    const regionalPerformance = await getRegionalPerformance(startDate)

    // Get popular car models by Albanian preferences
    const popularModels = await getPopularModels(startDate, regionFilter)

    // Get seasonal demand patterns
    const seasonalDemand = await getSeasonalDemand(startDate, regionFilter)

    // Get price trend analysis
    const priceTrends = await getPriceTrends(startDate, regionFilter)

    // Get cross-border opportunities
    const crossBorderData = await getCrossBorderOpportunities(startDate)

    // Get market saturation analysis
    const marketSaturation = await getMarketSaturation(regionFilter)

    return NextResponse.json({
      marketOverview,
      regionalPerformance,
      popularModels,
      seasonalDemand,
      priceTrends,
      crossBorderData,
      marketSaturation,
      albanianMarketInsights: getAlbanianMarketInsights(),
      investmentRecommendations: getInvestmentRecommendations(marketOverview, popularModels)
    })

  } catch (error) {
    console.error('Market intelligence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getMarketOverview(startDate: Date, regionFilter: any) {
  const totalListings = await prisma.listing.count({
    where: {
      ...regionFilter,
      country: 'AL',
      createdAt: { gte: startDate }
    }
  })

  const activeListings = await prisma.listing.count({
    where: {
      ...regionFilter,
      country: 'AL',
      status: 'active',
      createdAt: { gte: startDate }
    }
  })

  const soldListings = await prisma.listing.count({
    where: {
      ...regionFilter,
      country: 'AL',
      status: 'sold',
      soldDate: { gte: startDate }
    }
  })

  const averagePrice = await prisma.listing.aggregate({
    where: {
      ...regionFilter,
      country: 'AL',
      createdAt: { gte: startDate }
    },
    _avg: {
      price: true
    }
  })

  const priceRange = await prisma.listing.aggregate({
    where: {
      ...regionFilter,
      country: 'AL',
      createdAt: { gte: startDate }
    },
    _min: {
      price: true
    },
    _max: {
      price: true
    }
  })

  return {
    totalListings,
    activeListings,
    soldListings,
    averagePrice: Math.round((averagePrice._avg.price || 0) / 100),
    priceRange: {
      min: Math.round((priceRange._min.price || 0) / 100),
      max: Math.round((priceRange._max.price || 0) / 100)
    },
    saleConversionRate: totalListings > 0 ? Math.round((soldListings / totalListings) * 100) : 0
  }
}

async function getRegionalPerformance(startDate: Date) {
  const albanianCities = [
    'Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Korçë',
    'Fier', 'Berat', 'Lushnjë', 'Kavajë', 'Gjirokastër', 'Sarandë'
  ]

  const regionalData = await Promise.all(
    albanianCities.map(async (city) => {
      const listings = await prisma.listing.count({
        where: {
          city,
          country: 'AL',
          createdAt: { gte: startDate }
        }
      })

      const sold = await prisma.listing.count({
        where: {
          city,
          country: 'AL',
          status: 'sold',
          soldDate: { gte: startDate }
        }
      })

      const avgPrice = await prisma.listing.aggregate({
        where: {
          city,
          country: 'AL',
          createdAt: { gte: startDate }
        },
        _avg: {
          price: true
        }
      })

      const messages = await prisma.message.count({
        where: {
          listing: {
            city,
            country: 'AL'
          },
          createdAt: { gte: startDate }
        }
      })

      return {
        city,
        totalListings: listings,
        soldListings: sold,
        averagePrice: Math.round((avgPrice._avg.price || 0) / 100),
        conversionRate: listings > 0 ? Math.round((sold / listings) * 100) : 0,
        marketActivity: messages // Proxy for market activity
      }
    })
  )

  return regionalData.sort((a, b) => b.totalListings - a.totalListings)
}

async function getPopularModels(startDate: Date, regionFilter: any) {
  const popularMakes = await prisma.listing.groupBy({
    by: ['make'],
    where: {
      ...regionFilter,
      country: 'AL',
      createdAt: { gte: startDate }
    },
    _count: {
      id: true
    },
    _avg: {
      price: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  })

  const popularModels = await prisma.listing.groupBy({
    by: ['make', 'model'],
    where: {
      ...regionFilter,
      country: 'AL',
      createdAt: { gte: startDate }
    },
    _count: {
      id: true
    },
    _avg: {
      price: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 15
  })

  const soldModels = await prisma.listing.groupBy({
    by: ['make', 'model'],
    where: {
      ...regionFilter,
      country: 'AL',
      status: 'sold',
      soldDate: { gte: startDate }
    },
    _count: {
      id: true
    },
    _avg: {
      soldPrice: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 15
  })

  return {
    popularMakes: popularMakes.map(make => ({
      make: make.make,
      count: make._count.id,
      averagePrice: Math.round((make._avg.price || 0) / 100),
      marketShare: 0 // Will be calculated in frontend
    })),
    popularModels: popularModels.map(model => ({
      make: model.make,
      model: model.model,
      count: model._count.id,
      averagePrice: Math.round((model._avg.price || 0) / 100)
    })),
    fastSelling: soldModels.map(model => ({
      make: model.make,
      model: model.model,
      soldCount: model._count.id,
      averageSoldPrice: Math.round((model._avg.soldPrice || 0) / 100)
    }))
  }
}

async function getSeasonalDemand(startDate: Date, regionFilter: any) {
  const monthlyData = []

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - i)
    monthStart.setDate(1)

    const monthEnd = new Date()
    monthEnd.setMonth(monthEnd.getMonth() - i + 1)
    monthEnd.setDate(0)

    const listings = await prisma.listing.count({
      where: {
        ...regionFilter,
        country: 'AL',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    const messages = await prisma.message.count({
      where: {
        listing: {
          ...regionFilter,
          country: 'AL'
        },
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    monthlyData.push({
      month: monthStart.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' }),
      listings,
      activity: messages,
      season: getSeason(monthStart.getMonth())
    })
  }

  return monthlyData
}

async function getPriceTrends(startDate: Date, regionFilter: any) {
  const priceData = await prisma.listing.findMany({
    where: {
      ...regionFilter,
      country: 'AL',
      createdAt: { gte: startDate }
    },
    select: {
      make: true,
      model: true,
      year: true,
      price: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Group by make and calculate trends
  const makesTrends: Record<string, Array<{ price: number; date: Date; year: number }>> = {}
  priceData.forEach(listing => {
    if (!makesTrends[listing.make]) {
      makesTrends[listing.make] = []
    }
    makesTrends[listing.make].push({
      price: listing.price / 100,
      date: listing.createdAt,
      year: listing.year
    })
  })

  // Calculate trend direction for each make
  const trends = Object.entries(makesTrends).map(([make, prices]: [string, Array<{ price: number; date: Date; year: number }>]) => {
    if (prices.length < 2) return null

    const recentPrices = prices.slice(-10) // Last 10 listings
    const olderPrices = prices.slice(0, 10) // First 10 listings

    const recentAvg = recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length
    const olderAvg = olderPrices.reduce((sum, p) => sum + p.price, 0) / olderPrices.length

    const trendDirection = recentAvg > olderAvg ? 'rritje' : recentAvg < olderAvg ? 'rënie' : 'stabil'
    const trendPercentage = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0

    return {
      make,
      currentAvgPrice: Math.round(recentAvg),
      previousAvgPrice: Math.round(olderAvg),
      trendDirection,
      trendPercentage,
      totalListings: prices.length
    }
  }).filter(Boolean)

  return trends.sort((a, b) => (b?.totalListings || 0) - (a?.totalListings || 0))
}

async function getCrossBorderOpportunities(startDate: Date) {
  // Simulate cross-border data (Kosovo, Macedonia, Montenegro)
  const opportunities = [
    {
      country: 'Kosovo',
      countryCode: 'XK',
      avgPriceDifference: 8, // Percentage difference
      popularModels: ['BMW X5', 'Mercedes C-Class', 'Audi A4'],
      marketSize: 'Mesatar',
      documentation: 'E lehtë - nuk ka doganë',
      transportCost: '200-300 EUR',
      timeline: '3-5 ditë',
      recommendations: [
        'Makina gjermane kanë kërkesë të lartë në Kosovo',
        'Çmimet më të larta se në Shqipëri për 8-12%',
        'Dokumentacioni i thjeshtë për tregtarët shqiptarë'
      ]
    },
    {
      country: 'Maqedonia e Veriut',
      countryCode: 'MK',
      avgPriceDifference: 5,
      popularModels: ['Volkswagen Golf', 'BMW 3 Series', 'Mercedes E-Class'],
      marketSize: 'I vogël',
      documentation: 'Mesatarisht kompleks',
      transportCost: '300-450 EUR',
      timeline: '5-7 ditë',
      recommendations: [
        'Kërkesë për makina ekonomike',
        'Çmimet pak më të larta se në Shqipëri',
        'Konkurrencë e fortë nga Bullgaria'
      ]
    },
    {
      country: 'Mali i Zi',
      countryCode: 'ME',
      avgPriceDifference: 12,
      popularModels: ['SUV të mëdhenj', 'Pick-up', 'Makina luksoze'],
      marketSize: 'I vogël por i specializuar',
      documentation: 'Kompleks',
      transportCost: '400-600 EUR',
      timeline: '7-10 ditë',
      recommendations: [
        'Fokus tek makinat e luksit dhe SUV',
        'Çmimet dukshëm më të larta',
        'Treg sezonal - më i mirë në verë'
      ]
    }
  ]

  return opportunities
}

async function getMarketSaturation(regionFilter: any) {
  const saturationData = await prisma.listing.groupBy({
    by: ['bodyType'],
    where: {
      ...regionFilter,
      country: 'AL',
      status: 'active'
    },
    _count: {
      id: true
    }
  })

  const totalActive = saturationData.reduce((sum, item) => sum + item._count.id, 0)

  return saturationData.map(item => ({
    category: item.bodyType,
    count: item._count.id,
    percentage: totalActive > 0 ? Math.round((item._count.id / totalActive) * 100) : 0,
    saturationLevel: getSaturationLevel(item._count.id, totalActive),
    recommendation: getSaturationRecommendation(item.bodyType, item._count.id, totalActive)
  })).sort((a, b) => b.count - a.count)
}

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'Pranverë'
  if (month >= 5 && month <= 7) return 'Verë'
  if (month >= 8 && month <= 10) return 'Vjeshtë'
  return 'Dimër'
}

function getSaturationLevel(count: number, total: number): string {
  const percentage = (count / total) * 100
  if (percentage > 30) return 'E lartë'
  if (percentage > 15) return 'Mesatare'
  return 'E ulët'
}

function getSaturationRecommendation(bodyType: string, count: number, total: number): string {
  const percentage = (count / total) * 100

  if (percentage > 30) {
    return `Saturim i lartë për ${bodyType} - konsideroni kategori të tjera`
  }
  if (percentage > 15) {
    return `Konkurrencë mesatare për ${bodyType} - çmimi duhet të jetë konkurrues`
  }
  return `Mundësi e mirë për ${bodyType} - konkurrencë e ulët`
}

function getAlbanianMarketInsights() {
  return {
    marketCharacteristics: [
      'Preferenca për makina gjermane (BMW, Mercedes, Audi)',
      'Rëndësia e konsumit të ulët të karburantit',
      'Dokumentacioni i plotë rrit vlerën dukshëm',
      'Kërkesa sezionale - verë për SUV, dimër për 4x4'
    ],
    buyerBehavior: [
      'Blerësit kërkojnë foto të detajuara dhe historik të mirëmbajtur',
      'Negocimi i çmimeve është standart kulturor',
      'Preferojnë blerje nga tregtarë të verifikuar',
      'Rëndësi e madhe tek kilometrat e vërteta'
    ],
    regionalDifferences: [
      'Tiranë/Durrës: Kërkesa për makina luksoze dhe moderne',
      'Veriu: Preferenca për pick-up dhe SUV për terrene vështirë',
      'Jugu: Fokus tek ekonomiciteti dhe makinat për turizëm',
      'Zonat rurale: Kërkesa për makina të forta dhe të thjeshta'
    ],
    economicFactors: [
      'Inflacioni ndikon tek çmimet e makinave të përdorura',
      'Rritja e çmimeve të karburantit rrit kërkesën për hibride',
      'Politikat e doganave ndikojnë tek importet',
      'Sezoni turistik ndikon tek kërkesa për makina me qira'
    ]
  }
}

function getInvestmentRecommendations(marketOverview: any, popularModels: any) {
  const recommendations = []

  // Based on market data
  if (marketOverview.saleConversionRate < 15) {
    recommendations.push({
      type: 'Paralajmërim Tregu',
      title: 'Konvertimi i ulët i shitjeve',
      description: 'Tregu ka konvertim të ulët. Fokusohuni tek cilësia e listimeve dhe çmimi konkurrues.',
      priority: 'high'
    })
  }

  // Investment opportunities
  recommendations.push({
    type: 'Mundësi Investimi',
    title: 'Makina Gjermane Premium',
    description: 'BMW, Mercedes dhe Audi kanë kërkesë konstante dhe marzhe më të larta fitimi.',
    priority: 'medium'
  })

  recommendations.push({
    type: 'Trend Emergjent',
    title: 'Makina Hibride dhe Elektrike',
    description: 'Kërkesa në rritje për shkak të çmimeve të larta të karburantit. Investim afatgjatë.',
    priority: 'low'
  })

  recommendations.push({
    type: 'Mundësi Rajonale',
    title: 'Ekspansion në Kosovo',
    description: 'Çmimet më të larta dhe dokumentacion i thjeshtë për tregtarët shqiptarë.',
    priority: 'medium'
  })

  return recommendations
}