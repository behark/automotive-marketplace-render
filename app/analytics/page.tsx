'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data for now
      const mockAnalytics = {
        totalViews: 15420,
        uniqueVisitors: 8934,
        listingViews: 12650,
        searchQueries: 3420,
        contactRequests: 892,
        conversionRate: 12.4,
        averageTimeOnSite: '4:23',
        bounceRate: 23.8,
        topSearchTerms: [
          { term: 'BMW', count: 456 },
          { term: 'Audi', count: 398 },
          { term: 'Mercedes', count: 342 },
          { term: 'Tesla', count: 298 },
          { term: 'Volkswagen', count: 267 }
        ],
        popularCities: [
          { city: 'Berlin', listings: 234 },
          { city: 'Munich', listings: 189 },
          { city: 'Hamburg', listings: 156 },
          { city: 'Cologne', listings: 134 },
          { city: 'Frankfurt', listings: 123 }
        ]
      }

      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view analytics</h1>
          <a href="/auth/signin" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Platform performance and user engagement metrics
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading analytics...</p>
          </div>
        )}

        {analytics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">👀</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                        <dd className="text-lg font-medium text-gray-900">{analytics.totalViews.toLocaleString()}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Unique Visitors</dt>
                        <dd className="text-lg font-medium text-gray-900">{analytics.uniqueVisitors.toLocaleString()}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                        <dd className="text-lg font-medium text-gray-900">{analytics.conversionRate}%</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">⏱️</span>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Avg. Time on Site</dt>
                        <dd className="text-lg font-medium text-gray-900">{analytics.averageTimeOnSite}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Tables */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Top Search Terms */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Top Search Terms</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {analytics.topSearchTerms.map((term: any, index: number) => (
                      <div key={term.term} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          #{index + 1} {term.term}
                        </span>
                        <span className="text-sm text-gray-500">{term.count} searches</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Popular Cities */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Popular Cities</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {analytics.popularCities.map((city: any, index: number) => (
                      <div key={city.city} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          #{index + 1} {city.city}
                        </span>
                        <span className="text-sm text-gray-500">{city.listings} listings</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analytics.listingViews.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Listing Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.searchQueries.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Search Queries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.contactRequests}</div>
                    <div className="text-sm text-gray-600">Contact Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.bounceRate}%</div>
                    <div className="text-sm text-gray-600">Bounce Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}