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
    const dealerId = searchParams.get('dealerId')

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is a dealer
    if (user.role !== 'dealer' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied - dealers only' }, { status: 403 })
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

    // Multi-location performance comparison
    const multiLocationPerformance = await getMultiLocationPerformance(user.id, startDate)

    // Lead management with Albanian customer behavior
    const leadManagement = await getLeadManagement(user.id, startDate)

    // Inventory optimization
    const inventoryOptimization = await getInventoryOptimization(user.id, startDate)

    // Regional expansion opportunities
    const expansionOpportunities = await getExpansionOpportunities(user.id, startDate)

    // Staff performance tracking
    const staffPerformance = await getStaffPerformance(user.id, startDate)

    // Marketing ROI analysis
    const marketingROI = await getMarketingROI(user.id, startDate)

    // Albanian dealer insights
    const albanianDealerInsights = getAlbanianDealerInsights()

    return NextResponse.json({
      multiLocationPerformance,
      leadManagement,
      inventoryOptimization,
      expansionOpportunities,
      staffPerformance,
      marketingROI,
      albanianDealerInsights
    })

  } catch (error) {
    console.error('Dealer success analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getMultiLocationPerformance(dealerId: string, startDate: Date) {
  // Get dealer's listings grouped by city/location
  const locations = await prisma.listing.groupBy({
    by: ['city'],
    where: {
      userId: dealerId,
      createdAt: { gte: startDate }
    },
    _count: {
      id: true
    },
    _avg: {
      price: true
    }
  })

  const locationPerformance = await Promise.all(
    locations.map(async (location) => {
      const listings = await prisma.listing.findMany({
        where: {
          userId: dealerId,
          city: location.city,
          createdAt: { gte: startDate }
        },
        include: {
          messages: {
            where: {
              createdAt: { gte: startDate }
            }
          },
          favorites: {
            where: {
              createdAt: { gte: startDate }
            }
          },
          leads: {
            where: {
              createdAt: { gte: startDate }
            }
          }
        }
      })

      const soldListings = listings.filter(l => l.status === 'sold')
      const totalViews = listings.reduce((sum, l) => sum + (l.favorites.length * 3 + l.messages.length * 2), 0)
      const totalMessages = listings.reduce((sum, l) => sum + l.messages.length, 0)
      const totalLeads = listings.reduce((sum, l) => sum + l.leads.length, 0)
      const revenue = soldListings.reduce((sum, l) => sum + (l.soldPrice || l.price), 0)

      return {
        city: location.city,
        totalListings: location._count.id,
        activeListings: listings.filter(l => l.status === 'active').length,
        soldListings: soldListings.length,
        avgPrice: Math.round((location._avg.price || 0) / 100),
        totalViews,
        totalMessages,
        totalLeads,
        revenue: Math.round(revenue / 100),
        conversionRate: totalViews > 0 ? Math.round((totalMessages / totalViews) * 100) : 0,
        saleConversionRate: location._count.id > 0 ? Math.round((soldListings.length / location._count.id) * 100) : 0
      }
    })
  )

  // Calculate performance ranking
  const rankedLocations = locationPerformance
    .sort((a, b) => b.revenue - a.revenue)
    .map((location, index) => ({
      ...location,
      revenueRank: index + 1,
      performance: index === 0 ? 'Më e mira' : index < locationPerformance.length / 2 ? 'Mbi mesatare' : 'Nën mesatare'
    }))

  return {
    locations: rankedLocations,
    totalLocations: locations.length,
    bestPerformingLocation: rankedLocations[0],
    avgPerformance: {
      avgRevenue: Math.round(rankedLocations.reduce((sum, l) => sum + l.revenue, 0) / rankedLocations.length),
      avgConversion: Math.round(rankedLocations.reduce((sum, l) => sum + l.conversionRate, 0) / rankedLocations.length),
      avgSaleConversion: Math.round(rankedLocations.reduce((sum, l) => sum + l.saleConversionRate, 0) / rankedLocations.length)
    }
  }
}

async function getLeadManagement(dealerId: string, startDate: Date) {
  // Get leads for the dealer
  const leads = await prisma.lead.findMany({
    where: {
      sellerId: dealerId,
      createdAt: { gte: startDate }
    },
    include: {
      listing: true
    }
  })

  // Analyze lead quality and conversion
  const leadAnalysis = {
    totalLeads: leads.length,
    purchasedLeads: leads.filter(l => l.status === 'purchased').length,
    contactedLeads: leads.filter(l => l.contactedAt).length,
    convertedLeads: leads.filter(l => l.status === 'converted').length,
    avgLeadPrice: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.price, 0) / leads.length / 100) : 0,
    leadConversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0
  }

  // Lead quality by car type
  const leadsByCarType = {}
  leads.forEach(lead => {
    const carType = `${lead.listing.make} ${lead.listing.model}`
    if (!leadsByCarType[carType]) {
      leadsByCarType[carType] = { count: 0, converted: 0, avgQuality: 0 }
    }
    leadsByCarType[carType].count++
    if (lead.status === 'converted') leadsByCarType[carType].converted++
    leadsByCarType[carType].avgQuality += lead.qualityScore
  })

  Object.keys(leadsByCarType).forEach(carType => {
    const data = leadsByCarType[carType]
    data.avgQuality = Math.round(data.avgQuality / data.count)
    data.conversionRate = Math.round((data.converted / data.count) * 100)
  })

  // Albanian customer behavior insights
  const customerBehavior = {
    avgResponseTime: '2-4 orë', // Simulated based on Albanian market
    peakInquiryTime: '10:00-12:00 dhe 16:00-19:00',
    preferredContactMethod: 'Telefon (78%), WhatsApp (15%), Email (7%)',
    avgNegotiationCycles: 2.3,
    priceNegotiationRate: 85, // Percentage of leads that negotiate price
    documentsImportance: 95, // How important proper documentation is
    financingInterest: 45 // Percentage interested in financing
  }

  return {
    leadAnalysis,
    leadsByCarType: Object.entries(leadsByCarType).map(([carType, data]) => ({
      carType,
      ...data
    })).sort((a, b) => b.count - a.count).slice(0, 10),
    customerBehavior,
    leadQualityTrends: getLeadQualityTrends(leads),
    albanianCustomerInsights: getAlbanianCustomerInsights()
  }
}

async function getInventoryOptimization(dealerId: string, startDate: Date) {
  const listings = await prisma.listing.findMany({
    where: {
      userId: dealerId,
      createdAt: { gte: startDate }
    }
  })

  // Inventory analysis by car characteristics
  const inventoryByMake = {}
  const inventoryByYear = {}
  const inventoryByPriceRange = {}
  const slowMovingInventory = []

  listings.forEach(listing => {
    // By make
    if (!inventoryByMake[listing.make]) {
      inventoryByMake[listing.make] = { count: 0, sold: 0, avgDaysToSell: 0, avgPrice: 0 }
    }
    inventoryByMake[listing.make].count++
    inventoryByMake[listing.make].avgPrice += listing.price
    if (listing.status === 'sold') {
      inventoryByMake[listing.make].sold++
    }

    // By year
    const yearGroup = listing.year >= 2020 ? '2020+' : listing.year >= 2015 ? '2015-2019' : listing.year >= 2010 ? '2010-2014' : '<2010'
    if (!inventoryByYear[yearGroup]) {
      inventoryByYear[yearGroup] = { count: 0, sold: 0, avgPrice: 0 }
    }
    inventoryByYear[yearGroup].count++
    inventoryByYear[yearGroup].avgPrice += listing.price
    if (listing.status === 'sold') inventoryByYear[yearGroup].sold++

    // By price range
    const priceRange = listing.price < 1000000 ? '<€10K' : listing.price < 2000000 ? '€10K-20K' : listing.price < 3000000 ? '€20K-30K' : '€30K+'
    if (!inventoryByPriceRange[priceRange]) {
      inventoryByPriceRange[priceRange] = { count: 0, sold: 0 }
    }
    inventoryByPriceRange[priceRange].count++
    if (listing.status === 'sold') inventoryByPriceRange[priceRange].sold++

    // Slow moving inventory (active for more than 60 days)
    const daysSinceCreated = Math.floor((Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    if (listing.status === 'active' && daysSinceCreated > 60) {
      slowMovingInventory.push({
        id: listing.id,
        title: listing.title,
        price: Math.round(listing.price / 100),
        daysSinceCreated,
        make: listing.make,
        model: listing.model,
        year: listing.year
      })
    }
  })

  // Calculate averages and conversion rates
  Object.keys(inventoryByMake).forEach(make => {
    const data = inventoryByMake[make]
    data.avgPrice = Math.round(data.avgPrice / data.count / 100)
    data.conversionRate = Math.round((data.sold / data.count) * 100)
  })

  Object.keys(inventoryByYear).forEach(year => {
    const data = inventoryByYear[year]
    data.avgPrice = Math.round(data.avgPrice / data.count / 100)
    data.conversionRate = Math.round((data.sold / data.count) * 100)
  })

  Object.keys(inventoryByPriceRange).forEach(range => {
    const data = inventoryByPriceRange[range]
    data.conversionRate = Math.round((data.sold / data.count) * 100)
  })

  // Albanian market preferences
  const albanianPreferences = getAlbanianMarketPreferences()

  return {
    inventoryByMake: Object.entries(inventoryByMake).map(([make, data]) => ({ make, ...data })).sort((a, b) => b.count - a.count),
    inventoryByYear: Object.entries(inventoryByYear).map(([year, data]) => ({ year, ...data })),
    inventoryByPriceRange: Object.entries(inventoryByPriceRange).map(([range, data]) => ({ range, ...data })),
    slowMovingInventory: slowMovingInventory.sort((a, b) => b.daysSinceCreated - a.daysSinceCreated),
    albanianPreferences,
    restockingRecommendations: getRestockingRecommendations(inventoryByMake, inventoryByYear),
    seasonalOptimization: getSeasonalOptimization()
  }
}

async function getExpansionOpportunities(dealerId: string, startDate: Date) {
  // Get current dealer locations
  const currentLocations = await prisma.listing.groupBy({
    by: ['city'],
    where: {
      userId: dealerId,
      createdAt: { gte: startDate }
    },
    _count: { id: true }
  })

  const currentCities = currentLocations.map(l => l.city)

  // Albanian cities with market potential
  const albanianCities = [
    { city: 'Tiranë', population: 800000, carOwnershipRate: 45, avgIncome: 'I lartë', marketPotential: 95 },
    { city: 'Durrës', population: 200000, carOwnershipRate: 38, avgIncome: 'Mesatar-Lartë', marketPotential: 78 },
    { city: 'Vlorë', population: 150000, carOwnershipRate: 35, avgIncome: 'Mesatar', marketPotential: 72 },
    { city: 'Shkodër', population: 135000, carOwnershipRate: 32, avgIncome: 'Mesatar', marketPotential: 68 },
    { city: 'Elbasan', population: 125000, carOwnershipRate: 30, avgIncome: 'Mesatar', marketPotential: 65 },
    { city: 'Korçë', population: 85000, carOwnershipRate: 28, avgIncome: 'Mesatar', marketPotential: 60 },
    { city: 'Fier', population: 95000, carOwnershipRate: 25, avgIncome: 'Mesatar-Ulët', marketPotential: 55 },
    { city: 'Berat', population: 70000, carOwnershipRate: 25, avgIncome: 'Mesatar', marketPotential: 52 },
    { city: 'Lushnjë', population: 80000, carOwnershipRate: 22, avgIncome: 'Mesatar-Ulët', marketPotential: 48 },
    { city: 'Kavajë', population: 60000, carOwnershipRate: 20, avgIncome: 'Mesatar-Ulët', marketPotential: 45 }
  ]

  // Filter out current locations and rank by potential
  const expansionOpportunities = albanianCities
    .filter(city => !currentCities.includes(city.city))
    .sort((a, b) => b.marketPotential - a.marketPotential)
    .map(city => ({
      ...city,
      investmentLevel: city.marketPotential > 80 ? 'I lartë' : city.marketPotential > 60 ? 'Mesatar' : 'I ulët',
      timeToROI: city.marketPotential > 80 ? '6-12 muaj' : city.marketPotential > 60 ? '12-18 muaj' : '18-24 muaj',
      competitionLevel: city.city === 'Tiranë' ? 'Shumë e lartë' : city.marketPotential > 70 ? 'E lartë' : 'Mesatare',
      startupCost: city.marketPotential > 80 ? '€50K-100K' : city.marketPotential > 60 ? '€30K-60K' : '€20K-40K'
    }))

  // Cross-border opportunities (Kosovo, Macedonia, Montenegro)
  const crossBorderOpportunities = [
    {
      country: 'Kosovo',
      marketSize: 'Mesatar',
      marketPotential: 85,
      documentation: 'E thjeshtë',
      advantages: ['Gjuhë e njëjtë', 'Kultura e ngjashëme', 'Dokumentacion i thjeshtë'],
      challenges: ['Konkurrencë e brendshme', 'Varësia nga euro'],
      investmentRequired: '€40K-80K',
      timeToROI: '8-15 muaj'
    },
    {
      country: 'Maqedonia e Veriut',
      marketSize: 'I vogël',
      marketPotential: 65,
      documentation: 'Mesatarisht kompleks',
      advantages: ['Afërsi gjeografike', 'Marrëdhënie tregtare'],
      challenges: ['Barriera gjuhësore', 'Konkurrencë nga Bullgaria'],
      investmentRequired: '€35K-70K',
      timeToROI: '12-20 muaj'
    },
    {
      country: 'Mali i Zi',
      marketSize: 'Shumë i vogël',
      marketPotential: 55,
      documentation: 'Kompleks',
      advantages: ['Turizëm sezonal', 'Kërkesa për makina luksoze'],
      challenges: ['Treg shumë i vogël', 'Sezonal'],
      investmentRequired: '€25K-50K',
      timeToROI: '15-24 muaj'
    }
  ]

  return {
    domesticOpportunities: expansionOpportunities.slice(0, 5),
    crossBorderOpportunities,
    currentMarketShare: calculateMarketShare(currentLocations),
    expansionStrategy: getExpansionStrategy(currentLocations, expansionOpportunities),
    riskAssessment: getExpansionRiskAssessment()
  }
}

async function getStaffPerformance(dealerId: string, startDate: Date) {
  // Simulated staff performance data (in a real implementation, this would come from actual staff tracking)
  const staffMembers = [
    {
      id: '1',
      name: 'Arben Hoxha',
      role: 'Menaxher Shitjesh',
      location: 'Tiranë',
      listingsManaged: 25,
      leadsGenerated: 45,
      salesClosed: 12,
      avgResponseTime: '2.5 orë',
      customerSatisfaction: 4.6,
      revenueGenerated: 285000, // in cents
      commissionEarned: 12500
    },
    {
      id: '2',
      name: 'Elena Kola',
      role: 'Konsulente Shitjesh',
      location: 'Durrës',
      listingsManaged: 18,
      leadsGenerated: 32,
      salesClosed: 8,
      avgResponseTime: '1.8 orë',
      customerSatisfaction: 4.8,
      revenueGenerated: 195000,
      commissionEarned: 8750
    },
    {
      id: '3',
      name: 'Klodian Mema',
      role: 'Specialist Marketingu',
      location: 'Vlorë',
      listingsManaged: 22,
      leadsGenerated: 38,
      salesClosed: 10,
      avgResponseTime: '3.2 orë',
      customerSatisfaction: 4.4,
      revenueGenerated: 240000,
      commissionEarned: 10200
    }
  ]

  // Calculate performance metrics
  const performanceMetrics = staffMembers.map(staff => ({
    ...staff,
    revenueGenerated: Math.round(staff.revenueGenerated / 100), // Convert to EUR
    conversionRate: Math.round((staff.salesClosed / staff.leadsGenerated) * 100),
    avgRevenuePerSale: Math.round(staff.revenueGenerated / staff.salesClosed / 100),
    performanceScore: calculateStaffPerformanceScore(staff),
    areas: getStaffImprovementAreas(staff)
  }))

  // Team overview
  const teamOverview = {
    totalStaff: staffMembers.length,
    totalRevenue: Math.round(staffMembers.reduce((sum, s) => sum + s.revenueGenerated, 0) / 100),
    totalSales: staffMembers.reduce((sum, s) => sum + s.salesClosed, 0),
    avgSatisfaction: Math.round((staffMembers.reduce((sum, s) => sum + s.customerSatisfaction, 0) / staffMembers.length) * 10) / 10,
    avgConversionRate: Math.round(staffMembers.reduce((sum, s) => sum + (s.salesClosed / s.leadsGenerated), 0) / staffMembers.length * 100),
    topPerformer: staffMembers.reduce((top, current) =>
      current.revenueGenerated > top.revenueGenerated ? current : top
    )
  }

  return {
    performanceMetrics,
    teamOverview,
    trainingRecommendations: getTrainingRecommendations(performanceMetrics),
    incentivePrograms: getIncentivePrograms(),
    albanianStaffInsights: getAlbanianStaffInsights()
  }
}

async function getMarketingROI(dealerId: string, startDate: Date) {
  // Simulated marketing data
  const marketingChannels = [
    {
      channel: 'Facebook Ads',
      investment: 1200, // EUR
      leads: 45,
      sales: 8,
      revenue: 95000, // EUR
      cpl: 26.67, // Cost per lead
      cpa: 150, // Cost per acquisition
      roi: 7817, // ROI percentage
      effectiveness: 'E lartë'
    },
    {
      channel: 'Google Ads',
      investment: 800,
      leads: 28,
      sales: 6,
      revenue: 72000,
      cpl: 28.57,
      cpa: 133.33,
      roi: 8900,
      effectiveness: 'E lartë'
    },
    {
      channel: 'Instagram Ads',
      investment: 600,
      leads: 22,
      sales: 3,
      revenue: 35000,
      cpl: 27.27,
      cpa: 200,
      roi: 5733,
      effectiveness: 'Mesatare'
    },
    {
      channel: 'Traditional Media',
      investment: 1500,
      leads: 18,
      sales: 4,
      revenue: 48000,
      cpl: 83.33,
      cpa: 375,
      roi: 3100,
      effectiveness: 'E ulët'
    },
    {
      channel: 'Referrals',
      investment: 200, // Referral bonuses
      leads: 15,
      sales: 7,
      revenue: 85000,
      cpl: 13.33,
      cpa: 28.57,
      roi: 42400,
      effectiveness: 'Shumë e lartë'
    }
  ]

  // Albanian-specific marketing insights
  const albanianMarketingInsights = [
    {
      channel: 'Facebook',
      insight: 'Platforma më e përdorur në Shqipëri - 78% e popullsisë e përdor',
      recommendation: 'Investoni më shumë në Facebook Ads me targeting lokal'
    },
    {
      channel: 'WhatsApp Business',
      insight: 'Komunikimi i preferuar për marrëdhënie me klientë',
      recommendation: 'Integroni WhatsApp për komunikim të shpejtë'
    },
    {
      channel: 'Local Events',
      insight: 'Panairet e makinave janë shumë popullore në Shqipëri',
      recommendation: 'Merrni pjesë në panaire lokale në Tiranë dhe Durrës'
    },
    {
      channel: 'Word of Mouth',
      insight: 'Rekomandimi nga të afërmit është faktori kryesor',
      recommendation: 'Krijoni program referralësh me incentiva'
    }
  ]

  const totalInvestment = marketingChannels.reduce((sum, c) => sum + c.investment, 0)
  const totalRevenue = marketingChannels.reduce((sum, c) => sum + c.revenue, 0)
  const overallROI = Math.round(((totalRevenue - totalInvestment) / totalInvestment) * 100)

  return {
    marketingChannels,
    overallMetrics: {
      totalInvestment,
      totalRevenue,
      overallROI,
      totalLeads: marketingChannels.reduce((sum, c) => sum + c.leads, 0),
      totalSales: marketingChannels.reduce((sum, c) => sum + c.sales, 0)
    },
    bestPerformingChannel: marketingChannels.reduce((best, current) =>
      current.roi > best.roi ? current : best
    ),
    albanianMarketingInsights,
    budgetRecommendations: getBudgetRecommendations(marketingChannels),
    seasonalMarketingCalendar: getSeasonalMarketingCalendar()
  }
}

// Helper functions
function getLeadQualityTrends(leads: any[]) {
  // Simulate monthly lead quality trends
  return [
    { month: 'Jan', avgQuality: 72, count: 15 },
    { month: 'Feb', avgQuality: 75, count: 18 },
    { month: 'Mar', avgQuality: 78, count: 22 },
    { month: 'Apr', avgQuality: 80, count: 25 },
    { month: 'May', avgQuality: 77, count: 20 },
    { month: 'Jun', avgQuality: 82, count: 28 }
  ]
}

function getAlbanianCustomerInsights() {
  return [
    'Klientët shqiptarë preferojnë komunikim direkt dhe personal',
    'Dokumentacioni i plotë është kritik për vendimin e blerjes',
    'Negocimi i çmimit është pjesë e kulturës - pritni 10-15% diskutim',
    'Familja ka ndikim të madh në vendimin e blerjes',
    'Makinat gjermane kanë perceptim më të lartë cilësie',
    'Financimi është duke u bërë më i popullarizuar, veçanërisht tek të rinjtë'
  ]
}

function getAlbanianMarketPreferences() {
  return {
    topMakes: ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Ford'],
    preferredFuelTypes: ['Benzinë', 'Diesel', 'Hibrid'],
    popularColors: ['Bardhë', 'Zi', 'Gri', 'Blu', 'Argjend'],
    transmissionPreference: 'Automatik në rritje (65% manual, 35% automatik)',
    agePreference: '5-10 vjet (50%), 2-5 vjet (30%), 10+ vjet (20%)',
    priceRange: '€10K-25K (60%), €25K-50K (25%), €50K+ (15%)'
  }
}

function getRestockingRecommendations(inventoryByMake: any, inventoryByYear: any) {
  return [
    {
      category: 'Rritur Stokun',
      items: ['BMW Seria 3', 'Mercedes C-Class', 'Audi A4'],
      reason: 'Kërkesa e lartë dhe stok i ulët'
    },
    {
      category: 'Reduktim Gradual',
      items: ['Makina të vjetra (para 2010)', 'Marca të rralla'],
      reason: 'Lëvizje e ngadaltë dhe kërkesa në rënie'
    },
    {
      category: 'Optimizim Sezonal',
      items: ['SUV (dimër)', 'Convertible (pranverë/verë)'],
      reason: 'Përshtatje me trendet sezonale'
    }
  ]
}

function getSeasonalOptimization() {
  return {
    spring: ['Convertible', 'Coupe', 'Motocikleta'],
    summer: ['SUV', 'MPV', 'Crossover'],
    fall: ['Sedan', 'Station Wagon', 'Hatchback'],
    winter: ['4x4', 'AWD', 'Makina me traction control']
  }
}

function calculateMarketShare(currentLocations: any[]) {
  // Simplified market share calculation
  const totalMarketSize = 100 // Simplified
  const dealerPresence = currentLocations.length
  return {
    nationalMarketShare: Math.round((dealerPresence / 10) * 100) / 10 + '%', // Simplified calculation
    regionalDominance: currentLocations.map(loc => ({
      city: loc.city,
      estimatedShare: Math.round(Math.random() * 15 + 5) + '%' // Simulated
    }))
  }
}

function getExpansionStrategy(currentLocations: any[], opportunities: any[]) {
  return {
    immediate: opportunities.slice(0, 2).map(opp => ({
      city: opp.city,
      priority: 'E lartë',
      timeline: '3-6 muaj',
      strategy: 'Hapje fizike me staf lokal'
    })),
    mediumTerm: opportunities.slice(2, 4).map(opp => ({
      city: opp.city,
      priority: 'Mesatare',
      timeline: '6-12 muaj',
      strategy: 'Partnership me dealer lokal'
    })),
    longTerm: opportunities.slice(4, 6).map(opp => ({
      city: opp.city,
      priority: 'E ulët',
      timeline: '12+ muaj',
      strategy: 'Prezencë online me delivery'
    }))
  }
}

function getExpansionRiskAssessment() {
  return [
    {
      risk: 'Konkurrencë lokale',
      level: 'Mesatar',
      mitigation: 'Analizë e thellë e konkurrentëve para hapjes'
    },
    {
      risk: 'Ndryshime rregullatore',
      level: 'I ulët',
      mitigation: 'Konsultim me avokatë lokal'
    },
    {
      risk: 'Mungesë stafi të kualifikuar',
      level: 'I lartë',
      mitigation: 'Program trajnimi dhe transferimi nga lokacionet ekzistuese'
    }
  ]
}

function calculateStaffPerformanceScore(staff: any) {
  // Weighted performance score
  const conversionWeight = 0.3
  const satisfactionWeight = 0.25
  const responseTimeWeight = 0.2
  const revenueWeight = 0.25

  const conversionScore = (staff.salesClosed / staff.leadsGenerated) * 100
  const satisfactionScore = (staff.customerSatisfaction / 5) * 100
  const responseTimeScore = Math.max(0, 100 - (parseFloat(staff.avgResponseTime) * 10)) // Lower is better
  const revenueScore = Math.min(100, (staff.revenueGenerated / 300000) * 100) // Normalized to 300k max

  return Math.round(
    conversionScore * conversionWeight +
    satisfactionScore * satisfactionWeight +
    responseTimeScore * responseTimeWeight +
    revenueScore * revenueWeight
  )
}

function getStaffImprovementAreas(staff: any) {
  const areas = []

  if (staff.customerSatisfaction < 4.5) {
    areas.push('Përmirësim i shërbimit ndaj klientit')
  }
  if (parseFloat(staff.avgResponseTime) > 3) {
    areas.push('Reduktim i kohës së përgjigjes')
  }
  if ((staff.salesClosed / staff.leadsGenerated) < 0.25) {
    areas.push('Rritje e normës së konvertimit')
  }

  return areas
}

function getTrainingRecommendations(performanceMetrics: any[]) {
  return [
    {
      topic: 'Teknikat e Shitjes për Tregun Shqiptar',
      duration: '2 ditë',
      participants: 'Të gjithë stafi',
      priority: 'E lartë'
    },
    {
      topic: 'Menaxhimi i Marrëdhënieve me Klientë (CRM)',
      duration: '1 ditë',
      participants: 'Stafi me performancë nën mesatare',
      priority: 'Mesatare'
    },
    {
      topic: 'Marketing Digital dhe Social Media',
      duration: '1 ditë',
      participants: 'Specialist marketingu',
      priority: 'Mesatare'
    }
  ]
}

function getIncentivePrograms() {
  return [
    {
      program: 'Bonus Mujor',
      description: '5% bonus për çdo shitje mbi target',
      eligibility: 'Të gjithë staff-i i shitjeve'
    },
    {
      program: 'Klientë të Kënaqur',
      description: '€50 bonus për çdo review 5-yje',
      eligibility: 'Konsulentë shitjesh'
    },
    {
      program: 'Konkurs Vjetor',
      description: 'Makina kompanie për top performer',
      eligibility: 'Të gjithë staff-i'
    }
  ]
}

function getAlbanianStaffInsights() {
  return [
    'Staff-i shqiptar punon më mirë në një mjedis familjar dhe mbështetës',
    'Trajnimi në gjuhën shqipe është më efektiv',
    'Incentivat financiarë janë motivues të fortë',
    'Përfshirja në vendimmarrje rrit angazhimin',
    'Fleksibiliteti në orare është i vlerësuar',
    'Zhvillimi profesional është prioritet për të rinjtë'
  ]
}

function getBudgetRecommendations(channels: any[]) {
  const bestROI = channels.reduce((best, current) => current.roi > best.roi ? current : best)

  return [
    {
      recommendation: `Rrit investimin në ${bestROI.channel}`,
      reasoning: `ROI më i lartë: ${bestROI.roi}%`,
      suggestedIncrease: '25-30%'
    },
    {
      recommendation: 'Zvogëlo investimin në Traditional Media',
      reasoning: 'ROI i ulët dhe target grup i kufizuar',
      suggestedDecrease: '40-50%'
    },
    {
      recommendation: 'Pilot program për TikTok Ads',
      reasoning: 'Target grup i ri (18-25 vjeç) në rritje',
      suggestedBudget: '€300-500 për test'
    }
  ]
}

function getSeasonalMarketingCalendar() {
  return {
    spring: ['Panaire pranvere', 'Promovim convertible', 'Kampanja "Makina e re për sezonin e ri"'],
    summer: ['Festival verore', 'Sponsorship evenimente', 'Promovim SUV për pushime'],
    fall: ['Kampanja "Përgatituni për dimër"', 'Trade-in promovim', 'Financim special'],
    winter: ['Promovim makina 4x4', 'Oferta të fundit vitit', 'Kampanja "Makina për Vitin e Ri"']
  }
}

function getAlbanianDealerInsights() {
  return {
    marketDynamics: [
      'Tregu shqiptar është në rritje të vazhdueshme',
      'Rritje e kërkesës për makina moderne dhe hibride',
      'Konkurrencë e rreptë ndërmjet dealerëve në Tiranë',
      'Mundësi të mëdha në qytetet e vogla'
    ],
    customerExpectations: [
      'Shërbim profesional dhe transparent',
      'Çmime konkurruese me mundësi negocimi',
      'Dokumentacion i plotë dhe i qartë',
      'Mundësi financimi dhe këmbimi'
    ],
    operationalTips: [
      'Investoni në trajnimin e stafit për shërbim cilësor',
      'Krijoni marrëdhënie afatgjata me klientët',
      'Përdorni teknologjinë për efiçencë më të lartë',
      'Ndërtoni reputacion të fortë në komunitet'
    ],
    growthOpportunities: [
      'Ekspansion në qytete të tjera shqiptare',
      'Shërbime shtesë (financim, siguracion, mirëmbajtje)',
      'Marketing online dhe social media',
      'Partnership me institucione financiare'
    ]
  }
}