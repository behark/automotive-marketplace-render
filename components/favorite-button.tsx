'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface FavoriteButtonProps {
  listingId: string
  className?: string
  showLabel?: boolean
}

export function FavoriteButton({ listingId, className = '', showLabel = false }: FavoriteButtonProps) {
  const { data: session, status } = useSession()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      checkFavoriteStatus()
    }
  }, [listingId, status])

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch('/api/favorites')

      if (response.ok) {
        const favorites = await response.json()
        const isInFavorites = favorites.some((fav: any) => fav.listing.id === listingId)
        setIsFavorited(isInFavorites)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const toggleFavorite = async () => {
    if (status !== 'authenticated') {
      // Redirect to login
      window.location.href = '/auth/signin'
      return
    }

    setIsLoading(true)

    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?listingId=${listingId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setIsFavorited(false)
        } else {
          throw new Error('Failed to remove from favorites')
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingId }),
        })

        if (response.ok) {
          setIsFavorited(true)
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to add to favorites')
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert(`Failed to ${isFavorited ? 'remove from' : 'add to'} favorites`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`flex items-center justify-center transition-all duration-200 ${
        isLoading
          ? 'cursor-not-allowed opacity-50'
          : 'hover:scale-105'
      } ${className}`}
      title={
        status === 'unauthenticated'
          ? 'Sign in to save favorites'
          : isFavorited
            ? 'Remove from favorites'
            : 'Add to favorites'
      }
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          className={`h-5 w-5 transition-colors ${
            isFavorited ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-500'
          }`}
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}

      {showLabel && (
        <span className="ml-1 text-sm">
          {isFavorited ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}