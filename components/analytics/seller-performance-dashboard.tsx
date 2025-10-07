'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { TrendingUp, TrendingDown, Eye, MessageCircle, Heart, Star, Camera, FileText, MapPin, Calendar, Euro, Target } from 'lucide-react'

interface PerformanceData {
  overview: {
    totalListings: number
    activeListings: number
    soldListings: number
    totalViews: number
    totalMessages: number
    totalFavorites: number
    totalLeads: number
    totalRevenue: number
    avgSalePrice: number
  }
  performance: {
    avgViewsPerListing: number
    avgMessagesPerListing: number
    conversionRate: number
    saleConversionRate: number
    avgPhotoScore: number
    avgOptimizationScore: number
  }
  marketComparison: {
    viewsVsMarket: number
    messagesVsMarket: number
    conversionVsMarket: number
    marketAvgViews: number
    marketAvgMessages: number
    marketConversionRate: number
  }
  photoAnalysis: Array<{
    listingId: string
    title: string
    score: number
    imageCount: number
    suggestions: string[]
  }>
  optimizationAnalysis: Array<{
    listingId: string
    title: string
    score: number
    suggestions: string[]
  }>
  albanianMarketInsights: string[]
}

export default function SellerPerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/seller-performance?timeFrame=${timeFrame}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeFrame])

  useEffect(() => {
    fetchPerformanceData()
  }, [fetchPerformanceData, timeFrame])

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
        <p className="text-gray-500">Nuk mund të ngarkohen të dhënat e performancës.</p>
      </div>
    )
  }

  const performanceCards = [
    {
      title: 'Shikimet Totale',
      value: data.overview.totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: data.marketComparison.viewsVsMarket,
      comparison: 'vs tregu'
    },
    {
      title: 'Mesazhet Totale',
      value: data.overview.totalMessages.toLocaleString(),
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: data.marketComparison.messagesVsMarket,
      comparison: 'vs tregu'
    },
    {
      title: 'Norma e Konvertimit',
      value: `${data.performance.conversionRate}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: data.marketComparison.conversionVsMarket,
      comparison: 'vs tregu'
    },
    {
      title: 'Të Ardhurat Totale',
      value: `€${data.overview.totalRevenue.toLocaleString()}`,
      icon: Euro,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: null,
      comparison: null
    }
  ]

  const chartData = [
    {
      name: 'Shikimet Mesatare',
      your: data.performance.avgViewsPerListing,
      market: data.marketComparison.marketAvgViews
    },
    {
      name: 'Mesazhet Mesatare',
      your: data.performance.avgMessagesPerListing,
      market: data.marketComparison.marketAvgMessages
    },
    {
      name: 'Konvertimi (%)',
      your: data.performance.conversionRate,
      market: data.marketComparison.marketConversionRate
    }
  ]

  const photoScoreData = data.photoAnalysis.map(item => ({
    name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
    score: item.score,
    images: item.imageCount
  }))

  const optimizationScoreData = data.optimizationAnalysis.map(item => ({
    name: item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title,
    score: item.score
  }))

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paneli i Performancës së Shitësit</h1>
          <p className="text-gray-600 mt-2">Analizoni performancën tuaj në tregun shqiptar</p>
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
          <Button onClick={fetchPerformanceData} variant="outline">
            Rifresko
          </Button>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  {card.change && (
                    <div className="flex items-center mt-2">
                      {card.change >= 100 ? (
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span className={`text-sm ${card.change >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {card.change}% {card.comparison}
                      </span>
                    </div>
                  )}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Përmbledhje</TabsTrigger>
          <TabsTrigger value="photos">Analiza e Fotove</TabsTrigger>
          <TabsTrigger value="optimization">Optimizimi</TabsTrigger>
          <TabsTrigger value="market">Krahasimi me Tregun</TabsTrigger>
          <TabsTrigger value="insights">Këshilla</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance vs Market */}
            <Card>
              <CardHeader>
                <CardTitle>Performanca Juaj vs Tregu Shqiptar</CardTitle>
                <CardDescription>Krahasim me mesataren e tregut</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="your" fill="#3B82F6" name="Ju" />
                    <Bar dataKey="market" fill="#E5E7EB" name="Tregu" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Metrkat Kryesore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cilësia e Fotove</span>
                  <div className="flex items-center">
                    <div className={`w-16 text-right ${getScoreColor(data.performance.avgPhotoScore)}`}>
                      {data.performance.avgPhotoScore}/100
                    </div>
                    <Camera className="h-4 w-4 ml-2 text-gray-400" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Optimizimi i Listimit</span>
                  <div className="flex items-center">
                    <div className={`w-16 text-right ${getScoreColor(data.performance.avgOptimizationScore)}`}>
                      {data.performance.avgOptimizationScore}/100
                    </div>
                    <FileText className="h-4 w-4 ml-2 text-gray-400" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Norma e Shitjes</span>
                  <div className="flex items-center">
                    <div className={`w-16 text-right ${getScoreColor(data.performance.saleConversionRate * 5)}`}>
                      {data.performance.saleConversionRate}%
                    </div>
                    <Target className="h-4 w-4 ml-2 text-gray-400" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Çmimi Mesatar i Shitjes</span>
                  <div className="flex items-center">
                    <div className="w-16 text-right text-gray-900">
                      €{data.overview.avgSalePrice.toLocaleString()}
                    </div>
                    <Euro className="h-4 w-4 ml-2 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analiza e Cilësisë së Fotove</CardTitle>
              <CardDescription>Shiko cilësinë e fotove për çdo listim</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={photoScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>

              {/* Photo Suggestions */}
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Listamet që Kanë Nevojë për Përmirësim</h4>
                {data.photoAnalysis
                  .filter(item => item.score < 80)
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg ${getScoreBgColor(item.score)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{item.title}</h5>
                        <span className={`font-bold ${getScoreColor(item.score)}`}>
                          {item.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.imageCount} foto të ngarkuara
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {item.suggestions.slice(0, 2).map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analiza e Optimizimit të Listimit</CardTitle>
              <CardDescription>Përmirëso listamet tuaja për performancë më të mirë</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={optimizationScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>

              {/* Optimization Suggestions */}
              <div className="mt-6 space-y-4">
                <h4 className="font-semibold text-gray-900">Sugjerime për Optimizim</h4>
                {data.optimizationAnalysis
                  .filter(item => item.score < 80)
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg ${getScoreBgColor(item.score)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{item.title}</h5>
                        <span className={`font-bold ${getScoreColor(item.score)}`}>
                          {item.score}/100
                        </span>
                      </div>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {item.suggestions.slice(0, 3).map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performanca Juaj</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Shikimet mesatare për listim</span>
                    <span className="font-bold">{data.performance.avgViewsPerListing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesazhet mesatare për listim</span>
                    <span className="font-bold">{data.performance.avgMessagesPerListing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Norma e konvertimit</span>
                    <span className="font-bold">{data.performance.conversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mesatarja e Tregut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Shikimet mesatare për listim</span>
                    <span className="font-bold">{data.marketComparison.marketAvgViews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesazhet mesatare për listim</span>
                    <span className="font-bold">{data.marketComparison.marketAvgMessages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Norma e konvertimit</span>
                    <span className="font-bold">{data.marketComparison.marketConversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Krahasimi Juaj</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Shikimet vs tregu</span>
                    <span className={`font-bold ${data.marketComparison.viewsVsMarket >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.marketComparison.viewsVsMarket}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mesazhet vs tregu</span>
                    <span className={`font-bold ${data.marketComparison.messagesVsMarket >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.marketComparison.messagesVsMarket}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Konvertimi vs tregu</span>
                    <span className={`font-bold ${data.marketComparison.conversionVsMarket >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.marketComparison.conversionVsMarket}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Këshilla për Tregun Shqiptar</CardTitle>
              <CardDescription>Rekomandime të bazuara në trendet e tregut shqiptar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.albanianMarketInsights.map((insight, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <Star className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Best Practices */}
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Praktikat Më të Mira për Tregun Shqiptar</h4>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm">Postoni listamet e reja të martën ose mërkurën për ekspozim maksimal</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm">Përmendni lokacionin dhe distancën nga qytetet kryesore</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Euro className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm">Çmimet që përfundojnë me 500 ose 900 EUR performojnë më mirë</span>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Camera className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm">8-12 foto është numri optimal për tregun shqiptar</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}