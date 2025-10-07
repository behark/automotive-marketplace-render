import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const timeFrame = searchParams.get('timeFrame') || '30d'

    // Get user and check admin permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

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

    // Get revenue analytics data
    const revenueOverview = await getRevenueOverview(startDate)
    const albanianTaxAnalysis = getAlbanianTaxAnalysis(revenueOverview.totalRevenue)
    const regionalRevenue = await getRegionalRevenue(startDate)
    const partnershipRevenue = getPartnershipRevenue()
    const revenueForecasting = getRevenueForecasting(revenueOverview.monthlyData)

    return NextResponse.json({
      revenueOverview,
      albanianTaxAnalysis,
      regionalRevenue,
      partnershipRevenue,
      revenueForecasting
    })

  } catch (error) {
    console.error('Revenue analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getRevenueOverview(startDate: Date) {
  // Get payments (main revenue source)
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startDate },
      status: 'succeeded'
    }
  })

  // Simulate commission data based on sold listings
  const soldListings = await prisma.listing.count({
    where: {
      status: 'sold',
      soldDate: { gte: startDate }
    }
  })

  const avgCommissionPerSale = 750 // €7.50 average commission
  const totalCommissionRevenue = soldListings * avgCommissionPerSale * 100 // Convert to cents

  const totalSubscriptionRevenue = payments
    .filter(p => p.type === 'subscription')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalEnhancementRevenue = payments
    .filter(p => p.type === 'featured_listing')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalLeadRevenue = Math.round(soldListings * 15 * 100) // €15 per lead on average

  const totalRevenue = totalCommissionRevenue + totalSubscriptionRevenue + totalEnhancementRevenue + totalLeadRevenue

  // Calculate costs
  const stripeFees = Math.round(totalRevenue * 0.029)
  const operationalCosts = Math.round(totalRevenue * 0.15)
  const totalCosts = stripeFees + operationalCosts
  const netRevenue = totalRevenue - totalCosts

  // Generate monthly data
  const monthlyData = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date()
    monthStart.setMonth(monthStart.getMonth() - i)

    const baseRevenue = 5000 + Math.random() * 15000
    const seasonalMultiplier = getSeasonalMultiplier(monthStart.getMonth())

    monthlyData.push({
      month: monthStart.toLocaleDateString('sq-AL', { month: 'short', year: 'numeric' }),
      commissions: Math.round(baseRevenue * 0.4 * seasonalMultiplier),
      subscriptions: Math.round(baseRevenue * 0.3 * seasonalMultiplier),
      partnerships: Math.round(baseRevenue * 0.2 * seasonalMultiplier),
      leads: Math.round(baseRevenue * 0.1 * seasonalMultiplier),
      total: Math.round(baseRevenue * seasonalMultiplier)
    })
  }

  return {
    totalRevenue: Math.round(totalRevenue / 100),
    netRevenue: Math.round(netRevenue / 100),
    revenueBreakdown: {
      commissions: Math.round(totalCommissionRevenue / 100),
      subscriptions: Math.round(totalSubscriptionRevenue / 100),
      enhancements: Math.round(totalEnhancementRevenue / 100),
      leads: Math.round(totalLeadRevenue / 100)
    },
    costs: {
      stripeFees: Math.round(stripeFees / 100),
      operational: Math.round(operationalCosts / 100),
      total: Math.round(totalCosts / 100)
    },
    monthlyData,
    profitMargin: totalRevenue > 0 ? Math.round((netRevenue / totalRevenue) * 100) : 0,
    transactionCount: payments.length + soldListings
  }
}

function getAlbanianTaxAnalysis(totalRevenue: number) {
  const vatRate = 0.20 // 20% VAT in Albania
  const profitTaxRate = 0.15 // 15% profit tax for small business

  const vatOwed = Math.round(totalRevenue * vatRate)
  const profitTax = Math.round((totalRevenue * 0.7) * profitTaxRate) // Assuming 70% is taxable profit

  // Quarterly obligations
  const quarterlyVAT = Math.round(vatOwed / 4)
  const quarterlyProfitTax = Math.round(profitTax / 4)

  const taxOptimizationTips = [
    {
      tip: 'Dokumentacion i saktë',
      description: 'Mbani dokumentacion të plotë për të gjitha transaksionet për të shmangur penalitetet',
      savings: 'Deri në 5% reduktim penalitetesh'
    },
    {
      tip: 'Investime në teknologji',
      description: 'Shpenzimet për software dhe teknologji mund të zbriten nga tatimi',
      savings: '€2,000-5,000 në vit'
    },
    {
      tip: 'Trajnim i stafit',
      description: 'Kostoja e trajnimit është e zbritshme dhe përmirëson performancën',
      savings: '€1,500-3,000 në vit'
    },
    {
      tip: 'Marketing dhe reklamim',
      description: 'Shpenzimet e marketingut janë plotësisht të zbritshme',
      savings: 'Deri në 20% të buxhetit të marketingut'
    }
  ]

  const complianceCalendar = [
    {
      month: 'Janar',
      tasks: ['Deklarim TVSH Dhjetor', 'Bilanci Vjetor'],
      deadlines: ['20 Janar', '31 Mars']
    },
    {
      month: 'Prill',
      tasks: ['Deklarim Tremujori I', 'Deklarim Vjetor'],
      deadlines: ['20 Prill', '31 Mars']
    },
    {
      month: 'Korrik',
      tasks: ['Deklarim Tremujori II'],
      deadlines: ['20 Korrik']
    },
    {
      month: 'Tetor',
      tasks: ['Deklarim Tremujori III'],
      deadlines: ['20 Tetor']
    }
  ]

  return {
    taxCalculations: {
      totalRevenue,
      vatOwed,
      profitTax,
      totalTaxBurden: vatOwed + profitTax
    },
    quarterlyObligations: {
      vat: quarterlyVAT,
      profitTax: quarterlyProfitTax,
      total: quarterlyVAT + quarterlyProfitTax
    },
    taxOptimizationTips,
    complianceCalendar,
    effectiveTaxRate: totalRevenue > 0 ? Math.round(((vatOwed + profitTax) / totalRevenue) * 100) : 0,
    estimatedAnnualTax: (vatOwed + profitTax) * 4 // Quarterly to annual
  }
}

async function getRegionalRevenue(startDate: Date) {
  // Get listings by Albanian regions
  const listings = await prisma.listing.findMany({
    where: {
      createdAt: { gte: startDate },
      country: 'AL'
    }
  })

  const revenueByRegion: Record<string, {
    totalListings: number;
    soldListings: number;
    totalRevenue: number;
    avgPrice: number;
    commissionRevenue?: number;
    conversionRate?: number;
  }> = {}
  listings.forEach(listing => {
    const region = getAlbanianRegion(listing.city)
    if (!revenueByRegion[region]) {
      revenueByRegion[region] = {
        totalListings: 0,
        soldListings: 0,
        totalRevenue: 0,
        avgPrice: 0
      }
    }

    revenueByRegion[region].totalListings++
    if (listing.status === 'sold') {
      revenueByRegion[region].soldListings++
      const salePrice = listing.soldPrice || listing.price
      revenueByRegion[region].totalRevenue += salePrice
    }
  })

  // Calculate averages and commission revenue
  Object.keys(revenueByRegion).forEach(region => {
    const data = revenueByRegion[region]
    data.avgPrice = data.soldListings > 0 ? Math.round(data.totalRevenue / data.soldListings / 100) : 0
    data.commissionRevenue = Math.round(data.totalRevenue * 0.035 / 100) // 3.5% commission
    data.totalRevenue = Math.round(data.totalRevenue / 100)
  })

  const regionalBreakdown = Object.entries(revenueByRegion).map(([region, data]) => ({
    region,
    ...data
  })).sort((a, b) => b.commissionRevenue - a.commissionRevenue)

  // Cross-border opportunities
  const crossBorderOpportunities = [
    {
      country: 'Kosovo',
      marketSize: '€2.5M',
      ourShare: '5%',
      potentialRevenue: '€125,000',
      currentRevenue: '€45,000',
      growth: '180%'
    },
    {
      country: 'Maqedonia e Veriut',
      marketSize: '€1.8M',
      ourShare: '3%',
      potentialRevenue: '€54,000',
      currentRevenue: '€25,000',
      growth: '116%'
    },
    {
      country: 'Mali i Zi',
      marketSize: '€800K',
      ourShare: '8%',
      potentialRevenue: '€64,000',
      currentRevenue: '€18,000',
      growth: '256%'
    }
  ]

  return {
    albanianRegions: regionalBreakdown,
    crossBorderOpportunities,
    totalRegionalRevenue: regionalBreakdown.reduce((sum, r) => sum + r.commissionRevenue, 0),
    topPerformingRegion: regionalBreakdown[0],
    expansionPotential: {
      domestic: '€85,000 annual potential in underserved regions',
      crossBorder: '€243,000 annual potential across neighboring countries'
    }
  }
}

function getPartnershipRevenue() {
  const partnerships = [
    {
      partnerType: 'Siguracion',
      partnerName: 'SIGMA & UNIQA',
      monthlyRevenue: 8500,
      transactionCount: 85,
      avgCommission: 100,
      growth: 25
    },
    {
      partnerType: 'Financim',
      partnerName: 'Raiffeisen Bank & BKT',
      monthlyRevenue: 12000,
      transactionCount: 60,
      avgCommission: 200,
      growth: 40
    },
    {
      partnerType: 'Inspektim',
      partnerName: 'AutoCheck Albania',
      monthlyRevenue: 3500,
      transactionCount: 140,
      avgCommission: 25,
      growth: 15
    },
    {
      partnerType: 'Fotografim',
      partnerName: 'ProPhoto Network',
      monthlyRevenue: 2200,
      transactionCount: 110,
      avgCommission: 20,
      growth: 30
    }
  ]

  const totalPartnershipRevenue = partnerships.reduce((sum, p) => sum + p.monthlyRevenue, 0)
  const totalTransactions = partnerships.reduce((sum, p) => sum + p.transactionCount, 0)
  const avgGrowth = partnerships.reduce((sum, p) => sum + p.growth, 0) / partnerships.length

  const potentialGrowth = [
    {
      opportunity: 'Shtim partnerësh siguracioni',
      currentRevenue: 8500,
      potentialRevenue: 15000,
      timeframe: '6 muaj',
      requirements: 'Marrëveshje me Albsig dhe Intersig'
    },
    {
      opportunity: 'Ekspansion financimi',
      currentRevenue: 12000,
      potentialRevenue: 25000,
      timeframe: '9 muaj',
      requirements: 'Partnership me IFK dhe FINAK'
    },
    {
      opportunity: 'Shërbime mirëmbajtjeje',
      currentRevenue: 0,
      potentialRevenue: 8000,
      timeframe: '12 muaj',
      requirements: 'Rrjet servisesh të partnerizuara'
    }
  ]

  return {
    partnerships,
    summary: {
      totalMonthlyRevenue: totalPartnershipRevenue,
      totalTransactions,
      avgGrowthRate: Math.round(avgGrowth),
      annualProjection: totalPartnershipRevenue * 12
    },
    potentialGrowth,
    topPerformer: partnerships.reduce((top, current) =>
      current.monthlyRevenue > top.monthlyRevenue ? current : top
    )
  }
}

function getRevenueForecasting(monthlyData: any[]) {
  // Calculate growth trends
  const recentMonths = monthlyData.slice(-6)
  const avgMonthlyRevenue = recentMonths.reduce((sum, month) => sum + month.total, 0) / recentMonths.length

  // Simple growth rate calculation
  const firstHalf = recentMonths.slice(0, 3).reduce((sum, month) => sum + month.total, 0) / 3
  const secondHalf = recentMonths.slice(3).reduce((sum, month) => sum + month.total, 0) / 3
  const monthlyGrowthRate = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0.05

  // Forecast next 12 months
  const forecasts = []
  let baseRevenue = avgMonthlyRevenue

  for (let i = 1; i <= 12; i++) {
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + i)

    const seasonalMultiplier = getSeasonalMultiplier(futureDate.getMonth())
    const growthMultiplier = Math.pow(1 + monthlyGrowthRate, i)

    const projectedRevenue = Math.round(baseRevenue * growthMultiplier * seasonalMultiplier)

    forecasts.push({
      month: futureDate.toLocaleDateString('sq-AL', { month: 'short', year: 'numeric' }),
      projected: projectedRevenue,
      conservative: Math.round(projectedRevenue * 0.8),
      optimistic: Math.round(projectedRevenue * 1.3),
      confidence: Math.max(95 - (i * 6), 40)
    })
  }

  const scenarios = {
    conservative: {
      name: 'Konservativ',
      description: 'Rritje e ngadaltë, pa iniciativa të reja',
      annualGrowth: 10,
      projectedAnnual: forecasts.reduce((sum, f) => sum + f.conservative, 0)
    },
    realistic: {
      name: 'Realist',
      description: 'Rritje normale me optimizime aktuale',
      annualGrowth: 25,
      projectedAnnual: forecasts.reduce((sum, f) => sum + f.projected, 0)
    },
    optimistic: {
      name: 'Optimist',
      description: 'Rritje e shpejtë me ekspansion agresiv',
      annualGrowth: 45,
      projectedAnnual: forecasts.reduce((sum, f) => sum + f.optimistic, 0)
    }
  }

  return {
    forecasts,
    scenarios,
    keyMetrics: {
      currentMonthlyAvg: Math.round(avgMonthlyRevenue),
      projectedYearlyRevenue: forecasts.reduce((sum, f) => sum + f.projected, 0),
      monthlyGrowthRate: Math.round(monthlyGrowthRate * 100),
      confidenceLevel: 'Mesatare-Lartë'
    },
    assumptions: [
      'Vazhdimi i trendeve aktuale të tregut',
      'Stabilitet ekonomik në Shqipëri',
      'Rritje e adoptimit të teknologjisë',
      'Mos ndryshim i rëndësishëm në konkurencë'
    ],
    riskFactors: [
      'Krizë ekonomike globale ose lokale',
      'Hyrja e konkurrentëve të mëdhenj',
      'Ndryshime rregullatore në sektorin financiar',
      'Ndryshime në sjelljen e konsumatorëve post-COVID'
    ]
  }
}

function getSeasonalMultiplier(month: number) {
  // Albanian automotive market seasonal patterns
  const multipliers = [
    0.8,  // January - slow start
    0.9,  // February - building up
    1.1,  // March - spring begins
    1.2,  // April - spring peak
    1.3,  // May - high activity
    1.4,  // June - summer peak
    1.2,  // July - summer continuation
    1.1,  // August - slight slowdown
    1.0,  // September - back to normal
    0.9,  // October - autumn slowdown
    0.8,  // November - pre-winter low
    0.7   // December - winter low
  ]
  return multipliers[month] || 1.0
}

function getAlbanianRegion(city: string) {
  const regionMap: Record<string, string> = {
    'Tiranë': 'Qendrore',
    'Durrës': 'Qendrore',
    'Kavajë': 'Qendrore',
    'Vlorë': 'Jugore',
    'Sarandë': 'Jugore',
    'Gjirokastër': 'Jugore',
    'Shkodër': 'Veriore',
    'Kukës': 'Veriore',
    'Lezhë': 'Veriore',
    'Elbasan': 'Lindore',
    'Korçë': 'Lindore',
    'Pogradec': 'Lindore',
    'Fier': 'Jugperëndimore',
    'Berat': 'Jugperëndimore',
    'Lushnjë': 'Jugperëndimore'
  }

  return regionMap[city] || 'Të tjera'
}