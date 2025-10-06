import { useMemo } from 'react'
import sq from '../translations/sq'

type TranslationKey = string
type TranslationValue = string | { [key: string]: any }

export function useTranslation() {
  const t = useMemo(() => {
    function translate(key: TranslationKey): string {
      const keys = key.split('.')
      let value: TranslationValue = sq

      for (const k of keys) {
        if (typeof value === 'object' && value !== null && k in value) {
          value = value[k]
        } else {
          // Fallback to key if translation not found
          console.warn(`Translation not found for key: ${key}`)
          return key
        }
      }

      return typeof value === 'string' ? value : key
    }

    return translate
  }, [])

  return { t }
}

// Helper function for formatting with variables
export function formatMessage(template: string, variables: { [key: string]: string | number } = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key]?.toString() || match
  })
}

// Currency formatter for Albanian locale
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Number formatter for Albanian locale
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('sq-AL').format(number)
}

// Date formatter for Albanian locale
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('sq-AL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj)
}

// Relative time formatter for Albanian
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'disa sekonda më parë'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} ${minutes === 1 ? 'minutë' : 'minuta'} më parë`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} ${hours === 1 ? 'orë' : 'orë'} më parë`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ${days === 1 ? 'ditë' : 'ditë'} më parë`
  } else {
    return formatDate(dateObj)
  }
}