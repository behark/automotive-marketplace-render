'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FavoriteButton } from '../../components/favorite-button'

interface Listing {
  id: string
  title: string
  price: number
  year: number
  mileage: number
  fuelType: string
  transmission: string
  city: string
  make: string
  model: string
  color: string
  images: string
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    make: '',
    fuelType: '',
    location: ''
  })

  const searchParams = useSearchParams()

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Add search params
      const search = searchParams?.get('search') || filters.search
      const location = searchParams?.get('location') || filters.location

      if (search) params.append('search', search)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      if (filters.make) params.append('make', filters.make)
      if (filters.fuelType) params.append('fuelType', filters.fuelType)
      if (location) params.append('location', location)

      const response = await fetch(`/api/listings?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch listings')
      }

      const data = await response.json()
      setListings(data.listings || [])

    } catch (error) {
      console.error('Error fetching listings:', error)
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Set initial search from URL params
    const search = searchParams?.get('search') || ''
    const location = searchParams?.get('location') || ''

    setFilters(prev => ({
      ...prev,
      search,
      location
    }))

    fetchListings()
  }, [searchParams])

  useEffect(() => {
    // Refetch when filters change
    fetchListings()
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const filteredListings = listings.filter(listing => {
    return (
      (!filters.search || listing.title.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.minPrice || listing.price >= parseInt(filters.minPrice)) &&
      (!filters.maxPrice || listing.price <= parseInt(filters.maxPrice)) &&
      (!filters.make || listing.make === filters.make) &&
      (!filters.fuelType || listing.fuelType === filters.fuelType) &&
      (!filters.location || listing.city.toLowerCase().includes(filters.location.toLowerCase()))
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Browse Cars
          </h1>
          <p className="text-lg text-gray-600">
            Find your perfect car from our extensive collection
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>

              <div className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="BMW, Audi, Mercedes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      placeholder="Min €"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      placeholder="Max €"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Make */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <select
                    value={filters.make}
                    onChange={(e) => handleFilterChange('make', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Makes</option>
                    <option value="BMW">BMW</option>
                    <option value="Audi">Audi</option>
                    <option value="Mercedes">Mercedes</option>
                    <option value="Volkswagen">Volkswagen</option>
                    <option value="Tesla">Tesla</option>
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    value={filters.fuelType}
                    onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Fuel Types</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="City name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({
                    search: '',
                    minPrice: '',
                    maxPrice: '',
                    make: '',
                    fuelType: '',
                    location: ''
                  })}
                  className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {filteredListings.length} cars found
              </p>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Sort by: Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Mileage: Low to High</option>
                <option>Year: Newest First</option>
              </select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading cars...</p>
              </div>
            )}

            {/* No Results */}
            {!loading && filteredListings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No cars found matching your criteria.</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
              </div>
            )}

            {/* Listings Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={Array.isArray(listing.images) ? listing.images[0] : listing.images}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.innerHTML = `
                            <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0l-2 8h12l-2-8"/>
                            </svg>
                          `
                        }}
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0l-2 8h12l-2-8"/>
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {listing.title}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-blue-600">
                        €{listing.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {listing.city}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div>Year: {listing.year}</div>
                      <div>Mileage: {listing.mileage.toLocaleString()} km</div>
                      <div>Fuel: {listing.fuelType}</div>
                      <div>Transmission: {listing.transmission}</div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.href = `/listings/${listing.id}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <FavoriteButton
                        listingId={listing.id}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredListings.length > 0 && (
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                    1
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    3
                  </button>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}