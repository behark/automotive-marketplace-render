'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts'
import { TrendingUp, TrendingDown, MapPin, Car, Euro, Globe, AlertTriangle, Lightbulb, BarChart3, Users, Target, Calendar } from 'lucide-react'

interface MarketData {
  marketOverview: {
    totalListings: number
    activeListings: number
    soldListings: number
    averagePrice: number
    priceRange: {
      min: number
      max: number
    }
    saleConversionRate: number
  }
  regionalPerformance: Array<{
    city: string
    totalListings: number
    soldListings: number
    averagePrice: number
    conversionRate: number
    marketActivity: number
  }>
  popularModels: {
    popularMakes: Array<{
      make: string
      count: number
      averagePrice: number
      marketShare: number
    }>
    popularModels: Array<{
      make: string
      model: string
      count: number
      averagePrice: number
    }>
    fastSelling: Array<{
      make: string
      model: string
      soldCount: number
      averageSoldPrice: number
    }>
  }
  seasonalDemand: Array<{
    month: string
    listings: number
    activity: number
    season: string
  }>
  priceTrends: Array<{
    make: string
    currentAvgPrice: number
    previousAvgPrice: number
    trendDirection: string
    trendPercentage: number
    totalListings: number
  }>
  crossBorderData: Array<{
    country: string
    countryCode: string
    avgPriceDifference: number
    popularModels: string[]
    marketSize: string
    documentation: string
    transportCost: string
    timeline: string
    recommendations: string[]
  }>
  marketSaturation: Array<{
    category: string
    count: number
    percentage: number
    saturationLevel: string
    recommendation: string
  }>
  albanianMarketInsights: {
    marketCharacteristics: string[]
    buyerBehavior: string[]
    regionalDifferences: string[]
    economicFactors: string[]
  }
  investmentRecommendations: Array<{
    type: string
    title: string
    description: string
    priority: string
  }>
}

export default function MarketIntelligenceDashboard() {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState('30d')
  const [region, setRegion] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/market-intelligence?timeFrame=${timeFrame}&region=${region}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeFrame, region])

  useEffect(() => {
    fetchMarketData()
  }, [fetchMarketData, timeFrame, region])

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
        <p className="text-gray-500">Nuk mund të ngarkohen të dhënat e tregut.</p>
      </div>
    )
  }

  const albanianCities = [
    'Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Korçë',
    'Fier', 'Berat', 'Lushnjë', 'Kavajë', 'Gjirokastër', 'Sarandë'
  ]

  const overviewCards = [
    {
      title: 'Listeme Totale',
      value: data.marketOverview.totalListings.toLocaleString(),
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Çmimi Mesatar',
      value: `€${data.marketOverview.averagePrice.toLocaleString()}`,
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Norma e Shitjes',
      value: `${data.marketOverview.saleConversionRate}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Aktiviteti i Tregut',
      value: data.marketOverview.activeListings.toLocaleString(),
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  const getTrendIcon = (direction: string) => {
    if (direction === 'rritje') return <TrendingUp className="h-4 w-4 text-green-600" />
    if (direction === 'rënie') return <TrendingDown className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4 border rounded-full bg-gray-300"></div>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'E lartë': return 'text-red-600 bg-red-100'
      case 'Mesatare': return 'text-yellow-600 bg-yellow-100'
      case 'E ulët': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Qendra e Inteligjencës së Tregut</h1>
          <p className="text-gray-600 mt-2">Analizoni trendet dhe mundësitë në tregun automobilistik shqiptar</p>
        </div>
        <div className="flex gap-4">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha rajonet</SelectItem>
              {albanianCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button onClick={fetchMarketData} variant="outline">
            Rifresko
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Përmbledhje</TabsTrigger>
          <TabsTrigger value="regional">Rajonet</TabsTrigger>
          <TabsTrigger value="trends">Trendet</TabsTrigger>
          <TabsTrigger value="models">Modelet</TabsTrigger>
          <TabsTrigger value="crossborder">Ndërkombëtare</TabsTrigger>
          <TabsTrigger value="insights">Këshilla</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seasonal Demand */}
            <Card>
              <CardHeader>
                <CardTitle>Kërkesa Sezionale</CardTitle>
                <CardDescription>Trendet e kërkesës gjatë vitit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.seasonalDemand}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="listings" fill="#3B82F6" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Market Saturation */}
            <Card>
              <CardHeader>
                <CardTitle>Saturimi i Tregut</CardTitle>
                <CardDescription>Shpërndarja e listimeve sipas kategorive</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.marketSaturation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {data.marketSaturation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Market Saturation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detajet e Saturimit të Tregut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.marketSaturation.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{item.category}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSaturationColor(item.saturationLevel)}`}>
                        {item.saturationLevel}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{item.count}</p>
                    <p className="text-sm text-gray-600 mb-3">{item.percentage}% e tregut</p>
                    <p className="text-sm text-gray-700">{item.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performanca Rajonale</CardTitle>
              <CardDescription>Analiza e tregut sipas qyteteve shqiptare</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data.regionalPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="totalListings" fill="#3B82F6" name="Listeme Totale" />
                  <Line yAxisId="right" type="monotone" dataKey="averagePrice" stroke="#EF4444" name="Çmimi Mesatar (€)" />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Regional Details */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Qyteti</th>
                      <th className="text-right p-2">Listeme</th>
                      <th className="text-right p-2">Të Shitura</th>
                      <th className="text-right p-2">Çmimi Mesatar</th>
                      <th className="text-right p-2">Konvertimi</th>
                      <th className="text-right p-2">Aktiviteti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regionalPerformance.map((city, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{city.city}</td>
                        <td className="p-2 text-right">{city.totalListings}</td>
                        <td className="p-2 text-right">{city.soldListings}</td>
                        <td className="p-2 text-right">€{city.averagePrice.toLocaleString()}</td>
                        <td className="p-2 text-right">{city.conversionRate}%</td>
                        <td className="p-2 text-right">{city.marketActivity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trendet e Çmimeve</CardTitle>
              <CardDescription>Ndryshimet e çmimeve sipas markave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.priceTrends.slice(0, 8).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Car className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{trend.make}</h4>
                        <p className="text-sm text-gray-600">{trend.totalListings} listeme</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(trend.trendDirection)}
                        <span className="font-medium">€{trend.currentAvgPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">nga €{trend.previousAvgPrice.toLocaleString()}</span>
                        <span className={`font-medium ${
                          trend.trendDirection === 'rritje' ? 'text-green-600' :
                          trend.trendDirection === 'rënie' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trend.trendPercentage !== 0 && `${trend.trendPercentage > 0 ? '+' : ''}${trend.trendPercentage}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Makes */}
            <Card>
              <CardHeader>
                <CardTitle>Markat Më Popullore</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.popularModels.popularMakes.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="make" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fast Selling Models */}
            <Card>
              <CardHeader>
                <CardTitle>Modelet që Shiten Shpejt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.popularModels.fastSelling.slice(0, 8).map((model, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{model.make} {model.model}</h4>
                        <p className="text-sm text-gray-600">{model.soldCount} të shitura</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">€{model.averageSoldPrice.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">çmim mesatar</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Models Table */}
          <Card>
            <CardHeader>
              <CardTitle>Modelet Më të Kërkuara</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Marka</th>
                      <th className="text-left p-2">Modeli</th>
                      <th className="text-right p-2">Listeme</th>
                      <th className="text-right p-2">Çmimi Mesatar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.popularModels.popularModels.slice(0, 15).map((model, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{model.make}</td>
                        <td className="p-2">{model.model}</td>
                        <td className="p-2 text-right">{model.count}</td>
                        <td className="p-2 text-right">€{model.averagePrice.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crossborder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.crossBorderData.map((country, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>{country.country}</span>
                  </CardTitle>
                  <CardDescription>Mundësi tregtare ndërkufitare</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dallimi i çmimeve:</span>
                      <span className={`font-medium ${country.avgPriceDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        +{country.avgPriceDifference}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Madhësia e tregut:</span>
                      <span className="font-medium">{country.marketSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dokumentacioni:</span>
                      <span className="font-medium">{country.documentation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Kosto transporti:</span>
                      <span className="font-medium">{country.transportCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Koha:</span>
                      <span className="font-medium">{country.timeline}</span>
                    </div>

                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Modelet e Kërkuara:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {country.popularModels.map((model, i) => (
                          <li key={i}>{model}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Rekomandime:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {country.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Investment Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Rekomandime Investimi</CardTitle>
              <CardDescription>Mundësi dhe paralajmërime për tregun shqiptar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.investmentRecommendations.map((rec, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start space-x-3">
                      {rec.type === 'Paralajmërim Tregu' && <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />}
                      {rec.type === 'Mundësi Investimi' && <Target className="h-5 w-5 text-green-600 mt-0.5" />}
                      {rec.type === 'Trend Emergjent' && <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />}
                      {rec.type === 'Mundësi Rajonale' && <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-white rounded-full">
                          {rec.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Albanian Market Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Karakteristikat e Tregut</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.albanianMarketInsights.marketCharacteristics.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sjellja e Blerësve</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.albanianMarketInsights.buyerBehavior.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dallimet Rajonale</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.albanianMarketInsights.regionalDifferences.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Faktorët Ekonomikë</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.albanianMarketInsights.economicFactors.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Euro className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}