import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { BarChart3, TrendingUp, Users, Target, Building2, Euro, Globe, Lightbulb } from 'lucide-react'

export const metadata = {
  title: 'Qendra e Analizave - AutoMarket Albania',
  description: 'Qasje e plotë në të gjitha analizat dhe mjetet e avancuara për tregun automobilistik shqiptar.',
}

export default function AnalyticsOverviewPage() {
  const analyticsModules = [
    {
      title: 'Paneli i Performancës së Shitësit',
      description: 'Analizoni performancën tuaj në tregun shqiptar me krahasime dhe optimizime',
      icon: BarChart3,
      href: '/analytics/seller-performance',
      color: 'bg-blue-50 text-blue-600',
      features: [
        'Analiza e detajuar e performancës',
        'Krahasim me mesataren e tregut',
        'Cilësia e fotove dhe optimizimi',
        'Rekomandime për tregun shqiptar'
      ]
    },
    {
      title: 'Qendra e Inteligjencës së Tregut',
      description: 'Zbuloni trendet dhe mundësitë në tregun automobilistik shqiptar',
      icon: TrendingUp,
      href: '/analytics/market-intelligence',
      color: 'bg-green-50 text-green-600',
      features: [
        'Trendet e tregut shqiptar',
        'Analiza rajonale (Tiranë, Durrës, Vlorë)',
        'Modelet më popullore',
        'Mundësi ndërkufitare (Kosovo, Maqedoni)'
      ]
    },
    {
      title: 'Mjetet e Avancuara të Shitësit',
      description: 'Optimizoni listamet tuaja me mjete të specializuara',
      icon: Target,
      href: '/analytics/seller-tools',
      color: 'bg-purple-50 text-purple-600',
      features: [
        'Sugjerime çmimi me AI',
        'Timing optimal për postim',
        'Analiza e konkurrentëve',
        'Optimizim përshkrimi dhe foto'
      ]
    },
    {
      title: 'Qendra e Suksesit të Dealerit',
      description: 'Menaxhoni performancën e dealership tuaj në shumë lokacione',
      icon: Building2,
      href: '/analytics/dealer-success',
      color: 'bg-orange-50 text-orange-600',
      features: [
        'Performance multi-lokacion',
        'Menaxhim lead-ash dhe klientësh',
        'Optimizim inventari',
        'Mundësi ekspansioni'
      ]
    },
    {
      title: 'Analiza e Të Ardhurave',
      description: 'Analizoni të ardhurat dhe taksat sipas ligjeve shqiptare',
      icon: Euro,
      href: '/analytics/revenue',
      color: 'bg-emerald-50 text-emerald-600',
      features: [
        'Ndjekje të ardhurave sipas burimeve',
        'Analiza tatimore për Shqipërinë',
        'Prognoza financiare',
        'Raportet mujore dhe vjetore'
      ]
    },
    {
      title: 'Mjetet e Mundësive të Tregut',
      description: 'Identifikoni mundësi të reja në tregun automobilistik',
      icon: Lightbulb,
      href: '/analytics/market-opportunities',
      color: 'bg-indigo-50 text-indigo-600',
      features: [
        'Identifikim nishe të papunuara',
        'Analiza e saturimit të tregut',
        'Mundësi investimi',
        'Paralajmërime dhe alerte'
      ]
    }
  ]

  const quickStats = [
    {
      title: 'Përdorues Aktivë',
      value: '2,847',
      growth: '+12%',
      period: '30 ditë'
    },
    {
      title: 'Listeme Aktive',
      value: '8,952',
      growth: '+8%',
      period: '30 ditë'
    },
    {
      title: 'Të Ardhurat Mujore',
      value: '€45,230',
      growth: '+18%',
      period: 'muaji i kaluar'
    },
    {
      title: 'Norma Konvertimi',
      value: '3.4%',
      growth: '+0.8%',
      period: '30 ditë'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Qendra e Analizave
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Sistemi më i avancuar i analizave për tregun automobilistik shqiptar.
            Zbuloni trendet, optimizoni performancën dhe identifikoni mundësitë e reja.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickStats.map((stat, index) => (
            <Card key={index} className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm font-medium text-green-600">{stat.growth}</span>
                      <span className="text-sm text-gray-500 ml-2">{stat.period}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Modules */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Modelet e Analizave
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {analyticsModules.map((module, index) => (
              <Link
                key={index}
                href={module.href}
                className="block group hover:scale-105 transition-transform duration-200"
              >
                <Card className="h-full bg-white hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mb-4`}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {module.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Albanian Market Focus */}
        <Card className="bg-gradient-to-r from-red-50 to-yellow-50 border-0">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Specializuar për Tregun Shqiptar
                </h3>
                <p className="text-gray-700 mb-6 text-lg">
                  Të gjitha analizat dhe rekomandimet janë të përshtatura specifikusht për tregun
                  automobilistik shqiptar, duke përfshirë karakteristikat kulturore, preferencat
                  e blerësve dhe dinamikat rajonale.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">Analiza Rajonale</h4>
                    <p className="text-sm text-gray-600">
                      Performanca sipas qyteteve dhe rajoneve shqiptare
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">Kontekst Kulturor</h4>
                    <p className="text-sm text-gray-600">
                      Sjellja e blerësve dhe preferencat në tregun shqiptar
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">Compliance Lokal</h4>
                    <p className="text-sm text-gray-600">
                      Analiza tatimore dhe rregullatore për Shqipërinë
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Filloni me Analizat
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Zgjidhni modulin që përshtatet më mirë me nevojat tuaja ose filloni me
            Panelin e Performancës së Shitësit për një përmbledhje të përgjithshme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/analytics/seller-performance"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Fillo me Performancën
            </Link>
            <Link
              href="/analytics/market-intelligence"
              className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Shiko Tregun
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}