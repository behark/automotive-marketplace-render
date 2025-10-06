'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Building2, MapPin, Users, TrendingUp, TrendingDown, Target, Euro, Star, Award, Briefcase, Globe, Lightbulb, AlertTriangle, CheckCircle, ArrowUpRight, Calendar, Phone, MessageCircle } from 'lucide-react'

interface DealerSuccessData {
  multiLocationPerformance: {
    locations: Array<{
      city: string
      totalListings: number
      activeListings: number
      soldListings: number
      avgPrice: number
      totalViews: number
      totalMessages: number
      totalLeads: number
      revenue: number
      conversionRate: number
      saleConversionRate: number
      revenueRank: number
      performance: string
    }>
    totalLocations: number
    bestPerformingLocation: any
    avgPerformance: {
      avgRevenue: number
      avgConversion: number
      avgSaleConversion: number
    }
  }
  leadManagement: {
    leadAnalysis: {
      totalLeads: number
      purchasedLeads: number
      contactedLeads: number
      convertedLeads: number
      avgLeadPrice: number
      leadConversionRate: number
    }
    leadsByCarType: Array<{
      carType: string
      count: number
      converted: number
      avgQuality: number
      conversionRate: number
    }>
    customerBehavior: {
      avgResponseTime: string
      peakInquiryTime: string
      preferredContactMethod: string
      avgNegotiationCycles: number
      priceNegotiationRate: number
      documentsImportance: number
      financingInterest: number
    }
    leadQualityTrends: Array<{
      month: string
      avgQuality: number
      count: number
    }>
    albanianCustomerInsights: string[]
  }
  inventoryOptimization: {
    inventoryByMake: Array<{
      make: string
      count: number
      sold: number
      avgPrice: number
      conversionRate: number
    }>
    inventoryByYear: Array<{
      year: string
      count: number
      sold: number
      avgPrice: number
      conversionRate: number
    }>
    inventoryByPriceRange: Array<{
      range: string
      count: number
      sold: number
      conversionRate: number
    }>
    slowMovingInventory: Array<{
      id: string
      title: string
      price: number
      daysSinceCreated: number
      make: string
      model: string
      year: number
    }>
    albanianPreferences: {
      topMakes: string[]
      preferredFuelTypes: string[]
      popularColors: string[]
      transmissionPreference: string
      agePreference: string
      priceRange: string
    }
    restockingRecommendations: Array<{
      category: string
      items: string[]
      reason: string
    }>
    seasonalOptimization: any
  }
  expansionOpportunities: {
    domesticOpportunities: Array<{
      city: string
      population: number
      carOwnershipRate: number
      avgIncome: string
      marketPotential: number
      investmentLevel: string
      timeToROI: string
      competitionLevel: string
      startupCost: string
    }>
    crossBorderOpportunities: Array<{
      country: string
      marketSize: string
      marketPotential: number
      documentation: string
      advantages: string[]
      challenges: string[]
      investmentRequired: string
      timeToROI: string
    }>
    currentMarketShare: {
      nationalMarketShare: string
      regionalDominance: Array<{
        city: string
        estimatedShare: string
      }>
    }
    expansionStrategy: {
      immediate: Array<{
        city: string
        priority: string
        timeline: string
        strategy: string
      }>
      mediumTerm: Array<{
        city: string
        priority: string
        timeline: string
        strategy: string
      }>
      longTerm: Array<{
        city: string
        priority: string
        timeline: string
        strategy: string
      }>
    }
    riskAssessment: Array<{
      risk: string
      level: string
      mitigation: string
    }>
  }
  staffPerformance: {
    performanceMetrics: Array<{
      id: string
      name: string
      role: string
      location: string
      listingsManaged: number
      leadsGenerated: number
      salesClosed: number
      avgResponseTime: string
      customerSatisfaction: number
      revenueGenerated: number
      commissionEarned: number
      conversionRate: number
      avgRevenuePerSale: number
      performanceScore: number
      areas: string[]
    }>
    teamOverview: {
      totalStaff: number
      totalRevenue: number
      totalSales: number
      avgSatisfaction: number
      avgConversionRate: number
      topPerformer: any
    }
    trainingRecommendations: Array<{
      topic: string
      duration: string
      participants: string
      priority: string
    }>
    incentivePrograms: Array<{
      program: string
      description: string
      eligibility: string
    }>
    albanianStaffInsights: string[]
  }
  marketingROI: {
    marketingChannels: Array<{
      channel: string
      investment: number
      leads: number
      sales: number
      revenue: number
      cpl: number
      cpa: number
      roi: number
      effectiveness: string
    }>
    overallMetrics: {
      totalInvestment: number
      totalRevenue: number
      overallROI: number
      totalLeads: number
      totalSales: number
    }
    bestPerformingChannel: any
    albanianMarketingInsights: Array<{
      channel: string
      insight: string
      recommendation: string
    }>
    budgetRecommendations: Array<{
      recommendation: string
      reasoning: string
      suggestedIncrease?: string
      suggestedDecrease?: string
      suggestedBudget?: string
    }>
    seasonalMarketingCalendar: any
  }
  albanianDealerInsights: {
    marketDynamics: string[]
    customerExpectations: string[]
    operationalTips: string[]
    growthOpportunities: string[]
  }
}

export default function DealerSuccessCenter() {
  const [data, setData] = useState<DealerSuccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDealerData()
  }, [timeFrame])

  const fetchDealerData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dealer-success?timeFrame=${timeFrame}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nuk mund të ngarkohen të dhënat e dealership.</p>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Më e mira': return 'text-green-700 bg-green-100'
      case 'Mbi mesatare': return 'text-blue-700 bg-blue-100'
      case 'Nën mesatare': return 'text-yellow-700 bg-yellow-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'Shumë e lartë': return 'text-green-700 bg-green-100'
      case 'E lartë': return 'text-green-600 bg-green-100'
      case 'Mesatare': return 'text-yellow-600 bg-yellow-100'
      case 'E ulët': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'E lartë': return 'text-red-700 bg-red-100'
      case 'Mesatare': return 'text-yellow-700 bg-yellow-100'
      case 'E ulët': return 'text-blue-700 bg-blue-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Qendra e Suksesit të Dealerit</h1>
          <p className="text-gray-600 mt-2">Menaxhoni dhe optimizoni performancën e dealership tuaj në tregun shqiptar</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Ditë</SelectItem>
              <SelectItem value="30d">30 Ditë</SelectItem>
              <SelectItem value="90d">90 Ditë</SelectItem>
              <SelectItem value="1y">1 Vit</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDealerData} variant="outline">
            Rifresko
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lokacione Totale</p>
                <p className="text-2xl font-bold text-gray-900">{data.multiLocationPerformance.totalLocations}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Të Ardhurat Totale</p>
                <p className="text-2xl font-bold text-gray-900">€{data.staffPerformance.teamOverview.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Staf Totale</p>
                <p className="text-2xl font-bold text-gray-900">{data.staffPerformance.teamOverview.totalStaff}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ROI Marketing</p>
                <p className="text-2xl font-bold text-gray-900">{data.marketingROI.overallMetrics.overallROI}%</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Përmbledhje</TabsTrigger>
          <TabsTrigger value="locations">Lokacionet</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="inventory">Inventari</TabsTrigger>
          <TabsTrigger value="staff">Stafi</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multi-Location Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performanca e Lokacioneve</CardTitle>
                <CardDescription>Krahasim i të ardhurave sipas lokacioneve</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.multiLocationPerformance.locations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Quality Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Trendet e Cilësisë së Lead-ave</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.leadManagement.leadQualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgQuality" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Albanian Dealer Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights për Dealer Shqiptarë</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Dinamikat e Tregut</h4>
                  <ul className="space-y-2">
                    {data.albanianDealerInsights.marketDynamics.map((dynamic, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{dynamic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Pritjet e Klientëve</h4>
                  <ul className="space-y-2">
                    {data.albanianDealerInsights.customerExpectations.map((expectation, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{expectation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Këshilla Operacionale</h4>
                  <ul className="space-y-2">
                    {data.albanianDealerInsights.operationalTips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Mundësi Rritjeje</h4>
                  <ul className="space-y-2">
                    {data.albanianDealerInsights.growthOpportunities.map((opportunity, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <ArrowUpRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          {/* Location Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performanca e Detajuar e Lokacioneve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Qyteti</th>
                      <th className="text-right p-2">Listeme</th>
                      <th className="text-right p-2">Të Shitura</th>
                      <th className="text-right p-2">Të Ardhurat</th>
                      <th className="text-right p-2">Konvertimi</th>
                      <th className="text-center p-2">Performanca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.multiLocationPerformance.locations.map((location, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{location.city}</td>
                        <td className="p-2 text-right">{location.totalListings}</td>
                        <td className="p-2 text-right">{location.soldListings}</td>
                        <td className="p-2 text-right">€{location.revenue.toLocaleString()}</td>
                        <td className="p-2 text-right">{location.conversionRate}%</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(location.performance)}`}>
                            {location.performance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expansion Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mundësi Ekspansioni Vendore</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.expansionOpportunities.domesticOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{opportunity.city}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(opportunity.investmentLevel)}`}>
                          {opportunity.investmentLevel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                        <span>Popullsia: {opportunity.population.toLocaleString()}</span>
                        <span>Potencial: {opportunity.marketPotential}%</span>
                        <span>ROI: {opportunity.timeToROI}</span>
                        <span>Kosto: {opportunity.startupCost}</span>
                      </div>
                      <p className="text-sm text-gray-700">Konkurrencë: {opportunity.competitionLevel}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mundësi Ndërkombëtare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.expansionOpportunities.crossBorderOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{opportunity.country}</h5>
                        <span className="text-sm font-medium text-blue-600">{opportunity.marketPotential}% potencial</span>
                      </div>

                      <div className="mb-3">
                        <h6 className="text-sm font-medium text-green-700 mb-1">Përparësi:</h6>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {opportunity.advantages.map((adv, i) => (
                            <li key={i} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                              {adv}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-3">
                        <h6 className="text-sm font-medium text-red-700 mb-1">Sfida:</h6>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {opportunity.challenges.map((challenge, i) => (
                            <li key={i} className="flex items-center">
                              <AlertTriangle className="h-3 w-3 text-red-500 mr-2" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-xs text-gray-600">
                        <span>Investim: {opportunity.investmentRequired}</span>
                        <span className="ml-4">ROI: {opportunity.timeToROI}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {/* Lead Analysis Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lead Totale</p>
                    <p className="text-2xl font-bold text-gray-900">{data.leadManagement.leadAnalysis.totalLeads}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Norma Konvertimi</p>
                    <p className="text-2xl font-bold text-green-600">{data.leadManagement.leadAnalysis.leadConversionRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Çmimi Mesatar Lead</p>
                    <p className="text-2xl font-bold text-purple-600">€{data.leadManagement.leadAnalysis.avgLeadPrice}</p>
                  </div>
                  <Euro className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Behavior Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Sjellja e Klientëve Shqiptarë</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Koha e Përgjigjes</h4>
                  <p className="text-lg font-bold text-blue-600">{data.leadManagement.customerBehavior.avgResponseTime}</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Orët Peak</h4>
                  <p className="text-sm font-medium text-green-600">{data.leadManagement.customerBehavior.peakInquiryTime}</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Metoda Kontakti</h4>
                  <p className="text-sm font-medium text-purple-600">{data.leadManagement.customerBehavior.preferredContactMethod}</p>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Negocim Çmimi</h4>
                  <p className="text-lg font-bold text-yellow-600">{data.leadManagement.customerBehavior.priceNegotiationRate}%</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Briefcase className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Rëndësia Dokumenteve</h4>
                  <p className="text-lg font-bold text-red-600">{data.leadManagement.customerBehavior.documentsImportance}%</p>
                </div>

                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <Euro className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">Interesi Financimi</h4>
                  <p className="text-lg font-bold text-indigo-600">{data.leadManagement.customerBehavior.financingInterest}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Car Type */}
          <Card>
            <CardHeader>
              <CardTitle>Lead-at sipas Tipit të Makinës</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Tipi i Makinës</th>
                      <th className="text-right p-2">Lead Totale</th>
                      <th className="text-right p-2">Të Konvertuara</th>
                      <th className="text-right p-2">Cilësia Mesatare</th>
                      <th className="text-right p-2">Norma Konvertimi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leadManagement.leadsByCarType.map((carType, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{carType.carType}</td>
                        <td className="p-2 text-right">{carType.count}</td>
                        <td className="p-2 text-right">{carType.converted}</td>
                        <td className="p-2 text-right">{carType.avgQuality}/100</td>
                        <td className="p-2 text-right">
                          <span className={`font-medium ${carType.conversionRate >= 25 ? 'text-green-600' : carType.conversionRate >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {carType.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Albanian Customer Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights për Klientët Shqiptarë</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.leadManagement.albanianCustomerInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory by Make */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventari sipas Markës</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.inventoryOptimization.inventoryByMake.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="make" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventari sipas Vitit</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.inventoryOptimization.inventoryByYear}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ year, count }) => `${year}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.inventoryOptimization.inventoryByYear.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Slow Moving Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventari me Lëvizje të Ngadaltë</CardTitle>
              <CardDescription>Makina aktive për më shumë se 60 ditë</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Titulli</th>
                      <th className="text-right p-2">Çmimi</th>
                      <th className="text-right p-2">Ditë Aktive</th>
                      <th className="text-center p-2">Veprim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.inventoryOptimization.slowMovingInventory.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-600">{item.make} {item.model} {item.year}</p>
                          </div>
                        </td>
                        <td className="p-2 text-right">€{item.price.toLocaleString()}</td>
                        <td className="p-2 text-right">
                          <span className={`font-medium ${item.daysSinceCreated > 90 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {item.daysSinceCreated} ditë
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <Button variant="outline" size="sm">
                            Optimizo
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Albanian Market Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferencat e Tregut Shqiptar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Markat më të Preferuara</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.inventoryOptimization.albanianPreferences.topMakes.map((make, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {make}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Karburantet e Preferuar</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.inventoryOptimization.albanianPreferences.preferredFuelTypes.map((fuel, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {fuel}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Ngjyrat Popullore</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.inventoryOptimization.albanianPreferences.popularColors.map((color, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Transmisioni:</span>
                      <p className="text-gray-600">{data.inventoryOptimization.albanianPreferences.transmissionPreference}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Mosha:</span>
                      <p className="text-gray-600">{data.inventoryOptimization.albanianPreferences.agePreference}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Çmimi:</span>
                      <p className="text-gray-600">{data.inventoryOptimization.albanianPreferences.priceRange}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restocking Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Rekomandime për Restocking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.inventoryOptimization.restockingRecommendations.map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">{rec.category}</h5>
                    <p className="text-sm text-gray-600 mb-3">{rec.reason}</p>
                    <div className="flex flex-wrap gap-2">
                      {rec.items.map((item, i) => (
                        <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {/* Staff Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Përmbledhje e Performancës së Stafit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Staf Totale</h4>
                  <p className="text-2xl font-bold text-blue-600">{data.staffPerformance.teamOverview.totalStaff}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Të Ardhurat Totale</h4>
                  <p className="text-2xl font-bold text-green-600">€{data.staffPerformance.teamOverview.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Kënaqësia Mesatare</h4>
                  <p className="text-2xl font-bold text-purple-600">{data.staffPerformance.teamOverview.avgSatisfaction}/5</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Konvertimi Mesatar</h4>
                  <p className="text-2xl font-bold text-orange-600">{data.staffPerformance.teamOverview.avgConversionRate}%</p>
                </div>
              </div>

              {/* Staff Performance Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Emri</th>
                      <th className="text-left p-2">Roli</th>
                      <th className="text-right p-2">Shitje</th>
                      <th className="text-right p-2">Konvertimi</th>
                      <th className="text-right p-2">Kënaqësia</th>
                      <th className="text-right p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffPerformance.performanceMetrics.map((staff, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">
                          <div>
                            <p className="font-medium text-gray-900">{staff.name}</p>
                            <p className="text-xs text-gray-600">{staff.location}</p>
                          </div>
                        </td>
                        <td className="p-2 text-gray-700">{staff.role}</td>
                        <td className="p-2 text-right">{staff.salesClosed}</td>
                        <td className="p-2 text-right">{staff.conversionRate}%</td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            {staff.customerSatisfaction}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <span className={`font-medium ${staff.performanceScore >= 80 ? 'text-green-600' : staff.performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {staff.performanceScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Training & Incentives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rekomandime Trajnimi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.staffPerformance.trainingRecommendations.map((training, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{training.topic}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(training.priority)}`}>
                          {training.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{training.duration}</p>
                      <p className="text-sm text-gray-700">{training.participants}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Programet e Incentivave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.staffPerformance.incentivePrograms.map((program, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">{program.program}</h5>
                      <p className="text-sm text-gray-700 mb-2">{program.description}</p>
                      <p className="text-xs text-gray-600">{program.eligibility}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Albanian Staff Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights për Stafin Shqiptar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.staffPerformance.albanianStaffInsights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          {/* Marketing ROI Overview */}
          <Card>
            <CardHeader>
              <CardTitle>ROI Marketing sipas Kanaleve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kanali</th>
                      <th className="text-right p-2">Investimi</th>
                      <th className="text-right p-2">Lead</th>
                      <th className="text-right p-2">Shitje</th>
                      <th className="text-right p-2">ROI</th>
                      <th className="text-center p-2">Efektiviteti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.marketingROI.marketingChannels.map((channel, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{channel.channel}</td>
                        <td className="p-2 text-right">€{channel.investment.toLocaleString()}</td>
                        <td className="p-2 text-right">{channel.leads}</td>
                        <td className="p-2 text-right">{channel.sales}</td>
                        <td className="p-2 text-right">
                          <span className={`font-medium ${channel.roi > 5000 ? 'text-green-600' : channel.roi > 2000 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {channel.roi}%
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffectivenessColor(channel.effectiveness)}`}>
                            {channel.effectiveness}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Insights & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Insights Marketing për Shqipërinë</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.marketingROI.albanianMarketingInsights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">{insight.channel}</h5>
                      <p className="text-sm text-gray-700 mb-2">{insight.insight}</p>
                      <p className="text-sm text-blue-700 font-medium">{insight.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rekomandime Buxheti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.marketingROI.budgetRecommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">{rec.recommendation}</h5>
                      <p className="text-sm text-gray-700 mb-2">{rec.reasoning}</p>
                      {rec.suggestedIncrease && (
                        <p className="text-sm text-green-700">Rrit: {rec.suggestedIncrease}</p>
                      )}
                      {rec.suggestedDecrease && (
                        <p className="text-sm text-red-700">Zvogëlo: {rec.suggestedDecrease}</p>
                      )}
                      {rec.suggestedBudget && (
                        <p className="text-sm text-blue-700">Buxhet i sugjeruar: {rec.suggestedBudget}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}