'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, Eye, Camera, FileText, Target, Star, AlertCircle, CheckCircle, Lightbulb, Calendar, MapPin } from 'lucide-react'

interface SellerToolsData {
  pricing?: {
    currentPrice: number
    recommendedPrice: number
    priceReason: string
    seasonalAdjustment: {
      factor: number
      reason: string
      adjustedPrice: number
    }
    marketAnalysis: {
      avgSimilarPrice: number
      avgSoldPrice: number
      minPrice: number
      maxPrice: number
      totalSimilar: number
      totalSold: number
    }
    priceRange: {
      min: number
      max: number
      optimal: number
    }
    marketFactors: Array<{
      factor: string
      impact: string
      description: string
    }>
    albanianMarketInsights: string[]
    competitorListings: Array<{
      id: string
      title: string
      price: number
      year: number
      mileage: number
      city: string
      createdAt: string
    }>
  }
  timing?: {
    currentPattern: any
    bestTimes: Array<{
      day: string
      timeRange: string
      reason: string
      effectiveness: string
    }>
    timingRecommendations: string[]
    seasonalTiming: {
      season: string
      advice: string
      bestCategories: string[]
    }
    nextOptimalTime: {
      date: string
      reason: string
    }
    albanianHolidays: Array<{
      date: string
      name: string
      impact: string
    }>
  }
  competitors?: {
    directCompetitors: Array<{
      id: string
      title: string
      price: number
      year: number
      mileage: number
      city: string
      advantages: string[]
      disadvantages: string[]
      activityLevel: string
      messages: number
      favorites: number
    }>
    broaderCompetitors: Array<{
      id: string
      title: string
      make: string
      model: string
      price: number
      year: number
      city: string
    }>
    marketPosition: {
      priceRanking: string
      mileageRanking: string
      ageRanking: string
      overallCompetitiveness: string
    }
    recommendations: string[]
    competitiveAdvantages: string[]
    improvementAreas: string[]
  }
  demand?: {
    demandIndicators: Array<{
      category: string
      level: string
      trend: string
      description: string
    }>
    popularModels: Array<{
      make: string
      model: string
      _count: { id: number }
    }>
    regionalDemand: Array<{
      city: string
      _count: { id: number }
    }>
    seasonalFactors: Array<{
      season: string
      factors: string[]
    }>
    marketSentiment: string
    buyerBehavior: string[]
  }
  photos?: {
    totalPhotos: number
    qualityScore: number
    missingAngles: string[]
    recommendations: string[]
    albanianPreferences: string[]
  }
  description?: {
    currentLength: number
    readabilityScore: number
    keywordDensity: any
    missingInformation: string[]
    seoScore: number
    albanianLanguageQuality: {
      hasAlbanianContent: boolean
      qualityScore: number
      suggestions: string[]
    }
    improvementSuggestions: string[]
  }
}

export default function AdvancedSellerTools() {
  const [data, setData] = useState<SellerToolsData>({})
  const [loading, setLoading] = useState(false)
  const [selectedListing, setSelectedListing] = useState('')
  const [activeTab, setActiveTab] = useState('pricing')
  const [userListings, setUserListings] = useState([])

  useEffect(() => {
    fetchUserListings()
  }, [])

  useEffect(() => {
    if (selectedListing && activeTab) {
      fetchToolData(activeTab)
    }
  }, [selectedListing, activeTab])

  const fetchUserListings = async () => {
    try {
      const response = await fetch('/api/listings')
      if (response.ok) {
        const listings = await response.json()
        setUserListings(listings)
        if (listings.length > 0) {
          setSelectedListing(listings[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const fetchToolData = async (tool: string) => {
    if (!selectedListing) return

    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/seller-tools?action=${tool}&listingId=${selectedListing}`)
      if (response.ok) {
        const result = await response.json()
        setData(prev => ({ ...prev, [tool]: result }))
      }
    } catch (error) {
      console.error(`Error fetching ${tool} data:`, error)
    } finally {
      setLoading(false)
    }
  }

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

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'E lartë': return 'text-green-600 bg-green-100'
      case 'Mesatare': return 'text-yellow-600 bg-yellow-100'
      case 'E ulët': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDemandLevelColor = (level: string) => {
    switch (level) {
      case 'Shumë e lartë': return 'text-green-700 bg-green-100'
      case 'E lartë': return 'text-green-600 bg-green-100'
      case 'Mesatare': return 'text-yellow-600 bg-yellow-100'
      case 'E ulët': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mjetet e Avancuara të Shitësit</h1>
          <p className="text-gray-600 mt-2">Optimizoni listamet tuaja për performancë maksimale</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedListing} onValueChange={setSelectedListing}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Zgjidhni listimin" />
            </SelectTrigger>
            <SelectContent>
              {userListings.map((listing: any) => (
                <SelectItem key={listing.id} value={listing.id}>
                  {listing.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedListing ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Zgjidhni një listim për të parë mjetet e optimizimit.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pricing">Çmimi</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="competitors">Konkurrentët</TabsTrigger>
            <TabsTrigger value="demand">Kërkesa</TabsTrigger>
            <TabsTrigger value="photos">Fotot</TabsTrigger>
            <TabsTrigger value="description">Përshkrimi</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : data.pricing ? (
              <>
                {/* Price Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <span>Çmimi Aktual</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">€{data.pricing.currentPrice.toLocaleString()}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-green-600" />
                        <span>Çmimi i Rekomanduar</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">€{data.pricing.recommendedPrice.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-2">{data.pricing.priceReason}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <span>Ndryshimi Sezonal</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600">
                        {data.pricing.seasonalAdjustment.factor > 1 ? '+' : ''}
                        {Math.round((data.pricing.seasonalAdjustment.factor - 1) * 100)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{data.pricing.seasonalAdjustment.reason}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Market Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analiza e Tregut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Çmimi mesatar i ngjashëm:</span>
                          <span className="font-medium">€{data.pricing.marketAnalysis.avgSimilarPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Çmimi mesatar i shitur:</span>
                          <span className="font-medium">€{data.pricing.marketAnalysis.avgSoldPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Çmimi minimal në treg:</span>
                          <span className="font-medium">€{data.pricing.marketAnalysis.minPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Çmimi maksimal në treg:</span>
                          <span className="font-medium">€{data.pricing.marketAnalysis.maxPrice.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Rekomandim Çmimi</h4>
                        <p className="text-sm text-blue-800">
                          Çmimi optimal: €{data.pricing.priceRange.min.toLocaleString()} - €{data.pricing.priceRange.max.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-800 font-medium mt-1">
                          Më i mirë: €{data.pricing.priceRange.optimal.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Faktorët e Tregut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.pricing.marketFactors.map((factor, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-gray-900">{factor.factor}</h5>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                factor.impact.includes('+') ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                              }`}>
                                {factor.impact}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{factor.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Competitor Listings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Listeme Konkurruese</CardTitle>
                    <CardDescription>Listamet më të ngjashëm në treg</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Titulli</th>
                            <th className="text-right p-2">Çmimi</th>
                            <th className="text-right p-2">Viti</th>
                            <th className="text-right p-2">Kilometra</th>
                            <th className="text-left p-2">Qyteti</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.pricing.competitorListings.map((listing, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{listing.title}</td>
                              <td className="p-2 text-right">€{listing.price.toLocaleString()}</td>
                              <td className="p-2 text-right">{listing.year}</td>
                              <td className="p-2 text-right">{listing.mileage.toLocaleString()}</td>
                              <td className="p-2">{listing.city}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Albanian Market Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Këshilla për Tregun Shqiptar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.pricing.albanianMarketInsights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Button onClick={() => fetchToolData('pricing')}>Ngarko Analizën e Çmimit</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timing" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : data.timing ? (
              <>
                {/* Best Times */}
                <Card>
                  <CardHeader>
                    <CardTitle>Kohët Më të Mira për Postim</CardTitle>
                    <CardDescription>Bazuar në aktivitetin e tregut shqiptar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.timing.bestTimes.map((time, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{time.day}</h4>
                              <p className="text-sm text-gray-600">{time.timeRange}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffectivenessColor(time.effectiveness)}`}>
                              {time.effectiveness}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{time.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Seasonal Timing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Timing Sezonal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">{data.timing.seasonalTiming.season}</h4>
                        <p className="text-sm text-blue-800 mb-3">{data.timing.seasonalTiming.advice}</p>
                        <div>
                          <span className="text-sm font-medium text-blue-900">Kategoritë më të mira:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {data.timing.seasonalTiming.bestCategories.map((category, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Koha e Ardhshme Optimale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-5 w-5 text-green-600" />
                          <h4 className="font-medium text-green-900">
                            {new Date(data.timing.nextOptimalTime.date).toLocaleDateString('sq-AL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h4>
                        </div>
                        <p className="text-sm text-green-800">{data.timing.nextOptimalTime.reason}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Timing Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rekomandime Timing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.timing.timingRecommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Albanian Holidays */}
                <Card>
                  <CardHeader>
                    <CardTitle>Festat e Ardhshme Shqiptare</CardTitle>
                    <CardDescription>Datet që mund të ndikojnë në aktivitetin e tregut</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.timing.albanianHolidays.map((holiday, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h5 className="font-medium text-gray-900">{holiday.name}</h5>
                            <p className="text-sm text-gray-600">{holiday.date}</p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {holiday.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Button onClick={() => fetchToolData('timing')}>Ngarko Analizën e Timing</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : data.competitors ? (
              <>
                {/* Market Position */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pozicioni Juaj në Treg</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Çmimi</h4>
                        <p className="text-lg font-bold text-blue-700">{data.competitors.marketPosition.priceRanking}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900">Kilometrat</h4>
                        <p className="text-lg font-bold text-green-700">{data.competitors.marketPosition.mileageRanking}</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900">Mosha</h4>
                        <p className="text-lg font-bold text-purple-700">{data.competitors.marketPosition.ageRanking}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Direct Competitors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Konkurrentët Direkt</CardTitle>
                    <CardDescription>Makina të ngjashëm në treg</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.competitors.directCompetitors.slice(0, 5).map((comp, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{comp.title}</h5>
                              <p className="text-sm text-gray-600">
                                €{comp.price.toLocaleString()} • {comp.year} • {comp.mileage.toLocaleString()} km • {comp.city}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              comp.activityLevel === 'E lartë' ? 'text-red-700 bg-red-100' :
                              comp.activityLevel === 'Mesatare' ? 'text-yellow-700 bg-yellow-100' :
                              'text-green-700 bg-green-100'
                            }`}>
                              {comp.activityLevel}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {comp.advantages.length > 0 && (
                              <div>
                                <h6 className="font-medium text-green-700 mb-2">Përparësitë tuaja:</h6>
                                <ul className="space-y-1">
                                  {comp.advantages.map((adv, i) => (
                                    <li key={i} className="text-sm text-green-600 flex items-start">
                                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                      {adv}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {comp.disadvantages.length > 0 && (
                              <div>
                                <h6 className="font-medium text-red-700 mb-2">Disavantazhet tuaja:</h6>
                                <ul className="space-y-1">
                                  {comp.disadvantages.map((dis, i) => (
                                    <li key={i} className="text-sm text-red-600 flex items-start">
                                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                                      {dis}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                            <span>{comp.messages} mesazhe</span>
                            <span>{comp.favorites} favorite</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Competitive Advantages & Improvements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Përparësitë Tuaja Konkurruese</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.competitors.competitiveAdvantages.map((advantage, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                            <Star className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{advantage}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Fushat për Përmirësim</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.competitors.improvementAreas.map((area, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                            <Target className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{area}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rekomandime Konkurruese</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.competitors.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Button onClick={() => fetchToolData('competitors')}>Ngarko Analizën e Konkurrentëve</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="demand" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : data.demand ? (
              <>
                {/* Demand Indicators */}
                <Card>
                  <CardHeader>
                    <CardTitle>Treguesit e Kërkesës</CardTitle>
                    <CardDescription>Nivelet aktuale të kërkesës në tregun shqiptar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.demand.demandIndicators.map((indicator, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900">{indicator.category}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandLevelColor(indicator.level)}`}>
                              {indicator.level}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            {indicator.trend === 'Në rritje' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : indicator.trend === 'Në rënie' ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : (
                              <div className="h-4 w-4 border rounded-full bg-gray-300"></div>
                            )}
                            <span className="text-sm font-medium text-gray-700">{indicator.trend}</span>
                          </div>
                          <p className="text-sm text-gray-600">{indicator.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Popular Models & Regional Demand */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Modelet Më Popullore</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.demand.popularModels.slice(0, 8)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="make" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="_count.id" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Kërkesa Rajonale</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={data.demand.regionalDemand.slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ city, _count }: any) => `${city} (${_count.id})`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="_count.id"
                          >
                            {data.demand.regionalDemand.slice(0, 6).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Seasonal Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Faktorët Sezonalë</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {data.demand.seasonalFactors.map((season, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-3">{season.season}</h5>
                          <ul className="space-y-2">
                            {season.factors.map((factor, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Buyer Behavior */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sjellja e Blerësve Shqiptarë</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.demand.buyerBehavior.map((behavior, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <Users className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{behavior}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Button onClick={() => fetchToolData('demand')}>Ngarko Analizën e Kërkesës</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : data.photos ? (
              <>
                {/* Photo Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        <span>Foto Totale</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">{data.photos.totalPhotos}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.photos.totalPhotos >= 8 ? 'Numër i mirë' : 'Shtoni më shumë foto'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-green-600" />
                        <span>Cilësia</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-3xl font-bold ${getScoreColor(data.photos.qualityScore)}`}>
                        {data.photos.qualityScore}/100
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.photos.qualityScore >= 80 ? 'Cilësi e lartë' : data.photos.qualityScore >= 60 ? 'Cilësi mesatare' : 'Nevojitet përmirësim'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5 text-purple-600" />
                        <span>Këndvështrime</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">{8 - data.photos.missingAngles.length}/8</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.photos.missingAngles.length === 0 ? 'Të gjitha këndvështrimet' : `Mungojnë ${data.photos.missingAngles.length}`}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Missing Angles */}
                {data.photos.missingAngles.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Këndvështrime që Mungojnë</CardTitle>
                      <CardDescription>Foto që duhet të shtoni për përmirësim</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.photos.missingAngles.map((angle, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <span className="text-sm text-red-800">{angle}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rekomandime për Fotot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.photos.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Albanian Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle>Preferencat e Blerësve Shqiptarë</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.photos.albanianPreferences.map((pref, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{pref}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Button onClick={() => fetchToolData('photos')}>Ngarko Analizën e Fotove</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="description" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : data.description ? (
              <>
                {/* Description Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span>Gjatësia</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">{data.description.currentLength}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.description.currentLength >= 200 ? 'Gjatësi e mirë' : 'Shumë e shkurtër'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5 text-green-600" />
                        <span>Lexueshmëria</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-3xl font-bold ${getScoreColor(data.description.readabilityScore)}`}>
                        {data.description.readabilityScore}/100
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.description.readabilityScore >= 80 ? 'Lehtë për t\'u lexuar' : 'Mund të përmirësohet'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <span>SEO Score</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-3xl font-bold ${getScoreColor(data.description.seoScore)}`}>
                        {data.description.seoScore}/100
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {data.description.seoScore >= 80 ? 'SEO i mirë' : 'Nevojitet optimizim'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Keyword Density */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dendësia e Fjalëve Kyçe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {Object.entries(data.description.keywordDensity).map(([keyword, count]) => (
                        <div key={keyword} className="text-center p-3 border rounded-lg">
                          <p className="font-medium text-gray-900">{keyword}</p>
                          <p className="text-2xl font-bold text-blue-600">{count as number}</p>
                          <p className="text-xs text-gray-600">herë</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Missing Information */}
                {data.description.missingInformation.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Informacion që Mungon</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.description.missingInformation.map((info, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">{info}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Albanian Language Quality */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cilësia e Gjuhës Shqipe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-blue-50 rounded-lg mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-blue-900">Përmbajte shqip:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          data.description.albanianLanguageQuality.hasAlbanianContent ?
                          'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                        }`}>
                          {data.description.albanianLanguageQuality.hasAlbanianContent ? 'Po' : 'Jo'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">Cilësia:</span>
                        <span className={`font-bold ${getScoreColor(data.description.albanianLanguageQuality.qualityScore)}`}>
                          {data.description.albanianLanguageQuality.qualityScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {data.description.albanianLanguageQuality.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Improvement Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sugjerime për Përmirësim</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.description.improvementSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12">
                <Button onClick={() => fetchToolData('description')}>Ngarko Analizën e Përshkrimit</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}