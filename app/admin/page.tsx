'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface AdminStats {
  totalUsers: number
  totalListings: number
  totalRevenue: number
  activeListings: number
  pendingListings: number
  rejectedListings: number
  totalMessages: number
  recentSignups: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentListings, setRecentListings] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAdminData()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchAdminData = async () => {
    try {
      // Fetch admin statistics
      const [statsResponse, listingsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/listings?limit=10'),
        fetch('/api/admin/users?limit=10')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (listingsResponse.ok) {
        const listingsData = await listingsResponse.json()
        setRecentListings(listingsData.listings || [])
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setRecentUsers(usersData.users || [])
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const moderateListing = async (listingId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/listings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          action
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to moderate listing')
      }

      alert(`Listing ${action}ed successfully!`)
      fetchAdminData() // Refresh data

    } catch (error) {
      console.error('Error moderating listing:', error)
      alert('Failed to moderate listing')
    }
  }

  const moderateUser = async (userId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to moderate user')
      }

      alert(`User ${action}ed successfully!`)
      fetchAdminData() // Refresh data

    } catch (error) {
      console.error('Error moderating user:', error)
      alert('Failed to moderate user')
    }
  }

  // Check admin permissions
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">Please sign in with an admin account.</p>
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
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage users, listings, and platform settings
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'listings', name: 'Listings', icon: '🚗' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'payments', name: 'Payments', icon: '💳' },
              { id: 'settings', name: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">🚗</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Active Listings</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.activeListings}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                          <dd className="text-lg font-medium text-gray-900">€{stats.totalRevenue}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">📩</span>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Messages</dt>
                          <dd className="text-lg font-medium text-gray-900">{stats.totalMessages}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Listings */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Listings</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentListings.slice(0, 5).map((listing) => (
                    <div key={listing.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                        <p className="text-sm text-gray-500">
                          €{listing.price} • {listing.user.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          listing.status === 'active' ? 'bg-green-100 text-green-800' :
                          listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {listing.status}
                        </span>
                        {listing.status === 'pending' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => moderateListing(listing.id, 'approve')}
                              className="text-green-600 hover:text-green-800 text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => moderateListing(listing.id, 'reject')}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentUsers.slice(0, 5).map((user) => (
                    <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name || 'No name'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          {user.analytics.activeListings} listings • €{user.analytics.totalRevenue} revenue
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'dealer' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                        {user.role !== 'admin' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => moderateUser(user.id, 'suspend')}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Suspend
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Listings Management Tab */}
        {activeTab === 'listings' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Listing Moderation</h3>
              <p className="text-sm text-gray-500">Review and manage car listings</p>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500">
                <p>Full listing moderation interface...</p>
                <p className="text-sm mt-2">Shows all listings with approve/reject actions</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500">
                <p>Full user management interface...</p>
                <p className="text-sm mt-2">Shows all users with role management actions</p>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment Analytics</h3>
              <p className="text-sm text-gray-500">Track revenue and subscription metrics</p>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500">
                <p>Payment analytics and subscription management...</p>
                <p className="text-sm mt-2">Revenue charts, subscription metrics, refund management</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Platform Settings</h3>
              <p className="text-sm text-gray-500">Configure platform-wide settings</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Listing Price (EUR)
                </label>
                <input
                  type="number"
                  defaultValue="39.99"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Expiry Days
                </label>
                <input
                  type="number"
                  defaultValue="90"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                  <span className="ml-2 text-sm text-gray-700">Auto-approve listings from verified dealers</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  <span className="ml-2 text-sm text-gray-700">Enable maintenance mode</span>
                </label>
              </div>

              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}