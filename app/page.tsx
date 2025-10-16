'use client'

import { SearchHero } from '../components/search-hero'
import { FeaturedListings } from '../components/featured-listings'
import { useTranslation } from '../lib/hooks/useTranslation'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div>
      {/* Hero Section with Search */}
      <SearchHero />

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('homepage.features.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('homepage.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.verifiedListings.title')}</h3>
              <p className="text-gray-600">{t('homepage.features.verifiedListings.description')}</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.fastEasy.title')}</h3>
              <p className="text-gray-600">{t('homepage.features.fastEasy.description')}</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.features.directContact.title')}</h3>
              <p className="text-gray-600">{t('homepage.features.directContact.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <FeaturedListings />

      {/* Trust & Security Section */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Besimi dhe Siguria Jonë</h3>
            <p className="text-gray-600">Tregu më i besuar i automjeteve në Shqipëri</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* SSL Security */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-green-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-900">SSL të Sigurt</div>
              <div className="text-xs text-gray-500">256-bit Enkriptim</div>
            </div>

            {/* Verified Dealers */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-blue-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-900">Tregtarë të Verifikuar</div>
              <div className="text-xs text-gray-500">100% të Kontrolluar</div>
            </div>

            {/* Money Protection */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-yellow-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-900">Mbrojtje Pagese</div>
              <div className="text-xs text-gray-500">100% e Sigurt</div>
            </div>

            {/* 24/7 Support */}
            <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-purple-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm font-semibold text-gray-900">Mbështetje 24/7</div>
              <div className="text-xs text-gray-500">Gjithmonë të Disponueshëm</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('homepage.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('homepage.cta.subtitle')}
          </p>
          <a
            href="/sell"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {t('homepage.cta.button')}
          </a>
        </div>
      </section>
    </div>
  )
}