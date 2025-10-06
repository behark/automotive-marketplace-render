'use client'

import { useState } from 'react'
import { useTranslation, formatNumber } from '../lib/hooks/useTranslation'

export function SearchHero() {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const { t } = useTranslation()

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
            {t('homepage.title')}
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            {t('homepage.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Çfarë po kërkoni?
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('homepage.searchPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.location')}
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('homepage.locationPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('homepage.searchButton')}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-8 text-blue-100">
            <div>
              <div className="text-2xl font-bold">{formatNumber(10000)}+</div>
              <div className="text-sm">{t('homepage.stats.carsAvailable')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatNumber(500)}+</div>
              <div className="text-sm">{t('homepage.stats.trustedDealers')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm">{t('homepage.stats.citiesCovered')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}