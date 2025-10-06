'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useTranslation } from '../lib/hooks/useTranslation'

export function Navigation() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useTranslation()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold text-blue-600">AutoMarket</a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-900 hover:text-blue-600 transition-colors">{t('nav.home')}</a>
            <a href="/listings" className="text-gray-900 hover:text-blue-600 transition-colors">{t('nav.browseCars')}</a>
            <a href="/sell" className="text-gray-900 hover:text-blue-600 transition-colors">{t('nav.sellCar')}</a>
            <a href="/contact" className="text-gray-900 hover:text-blue-600 transition-colors">{t('nav.contact')}</a>
          </div>

          {/* Authentication Section */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'loading' && (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            )}

            {status === 'unauthenticated' && (
              <>
                <a href="/auth/signin" className="text-gray-900 hover:text-blue-600 transition-colors">
                  {t('nav.signIn')}
                </a>
                <a
                  href="/auth/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('nav.signUp')}
                </a>
              </>
            )}

            {status === 'authenticated' && session && (
              <>
                <a href="/dashboard" className="text-gray-900 hover:text-blue-600 transition-colors">
                  {t('nav.dashboard')}
                </a>
                <a href="/favorites" className="text-gray-900 hover:text-blue-600 transition-colors">
                  {t('nav.favorites')}
                </a>

                {/* User Menu Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-900 hover:text-blue-600">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm">{session.user?.name || 'User'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {t('nav.dashboard')}
                      </a>
                      <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {t('nav.profile')}
                      </a>
                      <a href="/my-listings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Shpalljet e Mia
                      </a>
                      <a href="/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {t('nav.messages')}
                        <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">3</span>
                      </a>
                      <div className="border-t border-gray-200"></div>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              <a href="/" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.home')}</a>
              <a href="/listings" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.browseCars')}</a>
              <a href="/sell" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.sellCar')}</a>
              <a href="/contact" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.contact')}</a>

              {status === 'unauthenticated' && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <a href="/auth/signin" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.signIn')}</a>
                  <a href="/auth/signup" className="block px-3 py-2 bg-blue-600 text-white rounded-lg mx-3">{t('nav.signUp')}</a>
                </>
              )}

              {status === 'authenticated' && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <a href="/dashboard" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.dashboard')}</a>
                  <a href="/favorites" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.favorites')}</a>
                  <a href="/messages" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.messages')}</a>
                  <a href="/profile" className="block px-3 py-2 text-gray-900 hover:text-blue-600">{t('nav.profile')}</a>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-gray-900 hover:text-blue-600"
                  >
                    {t('nav.signOut')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}