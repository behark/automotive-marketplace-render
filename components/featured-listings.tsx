'use client'

import { useTranslation, formatCurrency } from '../lib/hooks/useTranslation'

// Albanian featured cars for AutoMarket homepage
const featuredCars = [
  {
    id: 'bmw-x5-featured',
    title: 'BMW X5 2020 - Gjendje e shkëlqyer',
    price: 45900,
    year: 2020,
    mileage: 25000,
    fuelType: 'Petrol',
    location: 'Tiranë, Shqipëri',
    image: '/api/placeholder/400/300?text=BMW+X5+2020',
  },
  {
    id: 'audi-a4-featured',
    title: 'Audi A4 2019 - Kilometerazh i ulët',
    price: 32500,
    year: 2019,
    mileage: 18000,
    fuelType: 'Diesel',
    location: 'Durrës, Shqipëri',
    image: '/api/placeholder/400/300?text=Audi+A4+2019',
  },
  {
    id: 'mercedes-c-featured',
    title: 'Mercedes C-Class 2021 - Si e re',
    price: 55900,
    year: 2021,
    mileage: 12000,
    fuelType: 'Petrol',
    location: 'Vlorë, Shqipëri',
    image: '/api/placeholder/400/300?text=Mercedes+C-Class',
  },
]

export function FeaturedListings() {
  const { t } = useTranslation()

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('homepage.featuredCars.title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('homepage.featuredCars.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredCars.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {listing.title}
                </h3>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(listing.price)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {listing.location}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('car.year')}:</span>
                    <span>{listing.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('car.mileage')}:</span>
                    <span>{listing.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Karburant:</span>
                    <span>{listing.fuelType === 'Petrol' ? t('car.petrol') : listing.fuelType === 'Diesel' ? t('car.diesel') : listing.fuelType === 'Electric' ? t('car.electric') : listing.fuelType === 'Hybrid' ? t('car.hybrid') : listing.fuelType}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    {t('listings.viewDetails')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/listings"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Shiko të Gjitha Makinat
          </a>
        </div>
      </div>
    </section>
  )
}