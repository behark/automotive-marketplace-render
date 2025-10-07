'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Listing {
  id: string
  title: string
  price: number
  make: string
  model: string
  year: number
  mileage: number
  fuelType: string
  transmission: string
  city: string
  status: string
  images: string[]
  createdAt: string
  expiresAt: string
  views?: number
  favorites?: number
  messages?: number
}

export default function MyListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchListings()
    }
  }, [status, router])

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings/my-listings')
      if (!response.ok) {
        throw new Error('Dështoi ngarkimi i shpalljeve')
      }
      const data = await response.json()
      setListings(data || [])
    } catch (error) {
      console.error('Gabim gjatë ngarkimit të shpalljeve:', error)
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (listingId: string) => {
    if (!confirm('Jeni të sigurt që dëshironi të fshini këtë shpallje?')) {
      return
    }

    setDeletingId(listingId)
    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Dështoi fshirja e shpalljes')
      }

      setListings(prev => prev.filter(listing => listing.id !== listingId))
      alert('Shpallja u fshi me sukses!')
    } catch (error) {
      console.error('Gabim gjatë fshirjes:', error)
      alert('Ndodhi një gabim gjatë fshirjes së shpalljes')
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkAsSold = async (listingId: string) => {
    if (!confirm('Shënoni këtë shpallje si e shitur?')) {
      return
    }

    try {
      const response = await fetch(`/api/listings/${listingId}/mark-sold`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('Dështoi përditësimi i statusit')
      }

      // Refresh listings
      fetchListings()
      alert('Shpallja u shënua si e shitur!')
    } catch (error) {
      console.error('Gabim gjatë përditësimit:', error)
      alert('Ndodhi një gabim gjatë përditësimit të statusit')
    }
  }

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true
    return listing.status === filter
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      sold: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800',
    }
    const labels = {
      active: 'Aktive',
      sold: 'E Shitur',
      expired: 'E Skaduar',
    }
    return {
      className: badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800',
      label: labels[status as keyof typeof labels] || status
    }
  }

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Duke ngarkuar shpalljet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Shpalljet e Mia</h1>
              <p className="mt-2 text-lg text-gray-600">
                Menaxhoni të gjitha shpalljet tuaja të automjeteve
              </p>
            </div>
            <a
              href="/sell"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Shto Shpallje të Re
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Të Gjitha ({listings.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`${
                filter === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Aktive ({listings.filter(l => l.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('sold')}
              className={`${
                filter === 'sold'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Të Shitura ({listings.filter(l => l.status === 'sold').length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`${
                filter === 'expired'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Të Skaduar ({listings.filter(l => l.status === 'expired').length})
            </button>
          </nav>
        </div>

        {/* Empty State */}
        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuk ka shpallje</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'Ju nuk keni asnjë shpallje. Krijoni një tani për të filluar shitjen!'
                : `Nuk ka shpallje me statusin "${getStatusBadge(filter).label.toLowerCase()}".`
              }
            </p>
            {filter === 'all' && (
              <a
                href="/sell"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Krijo Shpalljen e Parë
              </a>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {filteredListings.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              const statusBadge = getStatusBadge(listing.status)
              const daysRemaining = getDaysRemaining(listing.expiresAt)

              return (
                <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-8 0h8m-8 0l-2 8h12l-2-8"/>
                      </svg>
                    )}

                    {/* Status Badge */}
                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                      {statusBadge.label}
                    </div>

                    {/* Expiry Warning */}
                    {listing.status === 'active' && daysRemaining <= 7 && daysRemaining > 0 && (
                      <div className="absolute top-2 left-2 px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold">
                        {daysRemaining} ditë të mbetura
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {listing.title}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-blue-600">
                        €{listing.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">{listing.city}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div>{listing.year}</div>
                      <div>{listing.mileage.toLocaleString()} km</div>
                      <div>{listing.fuelType}</div>
                      <div>{listing.transmission}</div>
                    </div>

                    {/* Statistics */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{listing.views || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{listing.favorites || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span>{listing.messages || 0}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/listings/${listing.id}`)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Shiko
                        </button>
                        <button
                          onClick={() => router.push(`/listings/${listing.id}/edit`)}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          Ndrysho
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {listing.status === 'active' && (
                          <button
                            onClick={() => handleMarkAsSold(listing.id)}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Shëno si të Shitur
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deletingId === listing.id}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === listing.id ? 'Duke fshirë...' : 'Fshi'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Krijuar: {new Date(listing.createdAt).toLocaleDateString('sq-AL')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
