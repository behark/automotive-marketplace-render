'use client'

import { useState } from 'react'

export function SearchHero() {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to listings page with search params
    window.location.href = `/listings?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Find Your Perfect Car
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Browse thousands of quality used cars from trusted dealers and private sellers
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  What are you looking for?
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., BMW X5, Audi A4, Mercedes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Berlin, Munich..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Search Cars
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-8 text-blue-100">
            <div>
              <div className="text-2xl font-bold">10,000+</div>
              <div className="text-sm">Cars Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold">500+</div>
              <div className="text-sm">Trusted Dealers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm">Cities Covered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}