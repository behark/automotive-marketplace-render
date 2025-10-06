'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Advanced Search
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Find your perfect car with detailed filters
          </p>

          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <p className="text-gray-600">
              Advanced search functionality coming soon!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              For now, use the search on the <a href="/listings" className="text-blue-600 hover:underline">listings page</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}