'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Euro, TrendingUp, TrendingDown, DollarSign, FileText, Calendar, AlertTriangle, CheckCircle, Calculator, Globe, Target } from 'lucide-react'

export default function RevenueAnalyticsDashboard() {
  const [timeFrame, setTimeFrame] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>({})

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/revenue?timeFrame=${timeFrame}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeFrame])

  useEffect(() => {
    fetchRevenueData()
  }, [fetchRevenueData, timeFrame])

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analiza e Të Ardhurave</h1>
          <p className="text-gray-600 mt-2">Ndjekje dhe analiza e të ardhurave me kontekst tatimor shqiptar</p>
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
          <Button onClick={fetchRevenueData} variant="outline">
            Rifresko
          </Button>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Të Ardhurat Totale</p>
                <p className="text-2xl font-bold text-gray-900">€{data.revenueOverview?.totalRevenue?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500 mt-1">Bruto</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Euro className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Të Ardhurat Neto</p>
                <p className="text-2xl font-bold text-green-600">€{data.revenueOverview?.netRevenue?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-500 mt-1">Pas kostove</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Marzhi i Fitimit</p>
                <p className="text-2xl font-bold text-purple-600">{data.revenueOverview?.profitMargin || '0'}%</p>
                <p className="text-sm text-gray-500 mt-1">Efiçencë</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transaksione</p>
                <p className="text-2xl font-bold text-orange-600">{data.revenueOverview?.transactionCount || '0'}</p>
                <p className="text-sm text-gray-500 mt-1">Totale</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Calculator className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Përmbledhje</TabsTrigger>
          <TabsTrigger value="breakdown">Ndarja</TabsTrigger>
          <TabsTrigger value="taxes">Taksat</TabsTrigger>
          <TabsTrigger value="forecasting">Prognoza</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Trendi Mujor i Të Ardhurave</CardTitle>
                <CardDescription>Të ardhurat për 12 muajt e fundit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenueOverview?.monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" fill="#3B82F6" stroke="#3B82F6" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Burimet e Të Ardhurave</CardTitle>
                <CardDescription>Shpërndarja e të ardhurave sipas burimeve</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Komisione', value: data.revenueOverview?.revenueBreakdown?.commissions || 0 },
                        { name: 'Abonime', value: data.revenueOverview?.revenueBreakdown?.subscriptions || 0 },
                        { name: 'Përmirësime', value: data.revenueOverview?.revenueBreakdown?.enhancements || 0 },
                        { name: 'Lead-at', value: data.revenueOverview?.revenueBreakdown?.leads || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Analiza e Kostove</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Tarifa Stripe</h4>
                  <p className="text-2xl font-bold text-red-600">€{data.revenueOverview?.costs?.stripeFees?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">2.9% e transaksioneve</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Kosto Operacionale</h4>
                  <p className="text-2xl font-bold text-yellow-600">€{data.revenueOverview?.costs?.operational?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">15% e të ardhurave</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Kosto Totale</h4>
                  <p className="text-2xl font-bold text-gray-600">€{data.revenueOverview?.costs?.total?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Të gjitha kostot</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          {/* Revenue by Source Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Të Ardhurat sipas Burimeve</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.revenueOverview?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="commissions" stackId="a" fill="#3B82F6" name="Komisione" />
                  <Bar dataKey="subscriptions" stackId="a" fill="#10B981" name="Abonime" />
                  <Bar dataKey="partnerships" stackId="a" fill="#F59E0B" name="Partneritete" />
                  <Bar dataKey="leads" stackId="a" fill="#EF4444" name="Lead-at" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Partnership Revenue */}
          {data.partnershipRevenue?.partnerships && (
            <Card>
              <CardHeader>
                <CardTitle>Të Ardhurat nga Partneritetet</CardTitle>
                <CardDescription>Performanca e partneriteteve aktuale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.partnershipRevenue.partnerships.map((partner: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h5 className="font-medium text-gray-900">{partner.partnerType}</h5>
                        <p className="text-sm text-gray-600">{partner.partnerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">€{partner.monthlyRevenue.toLocaleString()}/muaj</p>
                        <p className="text-sm text-green-600">+{partner.growth}% rritje</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="taxes" className="space-y-6">
          {/* Albanian Tax Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analiza Tatimore për Shqipërinë</CardTitle>
              <CardDescription>Llogaritje dhe detyrime tatimore</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">TVSH (20%)</h4>
                  <p className="text-2xl font-bold text-blue-600">€{data.albanianTaxAnalysis?.taxCalculations?.vatOwed?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Tatim mbi vlerën e shtuar</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Tatim Fitimi (15%)</h4>
                  <p className="text-2xl font-bold text-green-600">€{data.albanianTaxAnalysis?.taxCalculations?.profitTax?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Tatim mbi fitimin</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Totali</h4>
                  <p className="text-2xl font-bold text-red-600">€{data.albanianTaxAnalysis?.taxCalculations?.totalTaxBurden?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-gray-600">Barrë totale tatimore</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <h5 className="font-medium text-yellow-900">Norma Efektive Tatimore</h5>
                </div>
                <p className="text-lg font-bold text-yellow-800">{data.albanianTaxAnalysis?.effectiveTaxRate || '0'}%</p>
                <p className="text-sm text-yellow-700">E llogarilur mbi të ardhurat totale</p>
              </div>
            </CardContent>
          </Card>

          {/* Tax Optimization Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Këshilla për Optimizimin Tatimor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data.albanianTaxAnalysis?.taxOptimizationTips || []).map((tip: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{tip.tip}</h5>
                        <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Kursim: {tip.savings}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quarterly Obligations */}
          <Card>
            <CardHeader>
              <CardTitle>Detyrime Tremujore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900">TVSH Tremujore</h5>
                  <p className="text-xl font-bold text-blue-700">€{data.albanianTaxAnalysis?.quarterlyObligations?.vat?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-blue-600">Pagesa çdo tremujor</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900">Tatim Fitimi Tremujor</h5>
                  <p className="text-xl font-bold text-green-700">€{data.albanianTaxAnalysis?.quarterlyObligations?.profitTax?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-green-600">Pagesa çdo tremujor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          {/* Revenue Forecasting */}
          {data.revenueForecasting && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Prognoza e Të Ardhurave</CardTitle>
                  <CardDescription>Parashikime për 12 muajt e ardhshëm</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data.revenueForecasting?.forecasts || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="conservative" stroke="#EF4444" strokeDasharray="5 5" name="Konservativ" />
                      <Line type="monotone" dataKey="projected" stroke="#3B82F6" strokeWidth={3} name="Realist" />
                      <Line type="monotone" dataKey="optimistic" stroke="#10B981" strokeDasharray="5 5" name="Optimist" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Scenarios */}
              <Card>
                <CardHeader>
                  <CardTitle>Skenarë të Ndryshëm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(data.revenueForecasting?.scenarios || {}).map(([key, scenario]: [string, any]) => (
                      <div key={key} className="p-4 border rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">{scenario.name}</h5>
                        <p className="text-2xl font-bold text-blue-600 mb-2">
                          €{scenario.projectedAnnual.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {scenario.annualGrowth}% rritje vjetore
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Assumptions & Risk Factors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Supozimet Kryesore</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(data.revenueForecasting?.assumptions || []).map((assumption: string, index: number) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{assumption}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Faktorët e Rrezikut</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(data.revenueForecasting?.riskFactors || []).map((risk: string, index: number) => (
                        <li key={index} className="flex items-start space-x-3">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}