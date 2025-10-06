import axios from 'axios'

export type Currency = 'EUR' | 'ALL'

export interface CurrencyRate {
  currency: Currency
  rate: number
  lastUpdated: Date
}

export interface CurrencyPreference {
  currency: Currency
  autoDetect: boolean
}

class CurrencyService {
  private static instance: CurrencyService
  private rates: Map<string, CurrencyRate> = new Map()
  private cacheExpiry = 30 * 60 * 1000 // 30 minutes

  private constructor() {}

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService()
    }
    return CurrencyService.instance
  }

  /**
   * Get real-time exchange rates from Albanian Central Bank API
   */
  async fetchExchangeRates(): Promise<void> {
    try {
      // Albanian Central Bank API for EUR to ALL
      const response = await axios.get('https://www.bankofalbania.org/rc/doc/api_kurs_sp_22266.json', {
        timeout: 10000
      })

      if (response.data && response.data.kurset) {
        const eurRate = response.data.kurset.find((rate: any) => rate.kod === 'EUR')
        if (eurRate) {
          this.rates.set('EUR_TO_ALL', {
            currency: 'ALL',
            rate: parseFloat(eurRate.tarifa_shitjes), // Selling rate
            lastUpdated: new Date()
          })
        }
      }
    } catch (error) {
      console.warn('Failed to fetch rates from Albanian Central Bank, using fallback:', error)

      // Fallback to alternative API or default rate
      try {
        const fallbackResponse = await axios.get(`https://api.exchangerate-api.com/v4/latest/EUR`, {
          timeout: 5000
        })

        if (fallbackResponse.data && fallbackResponse.data.rates && fallbackResponse.data.rates.ALL) {
          this.rates.set('EUR_TO_ALL', {
            currency: 'ALL',
            rate: fallbackResponse.data.rates.ALL,
            lastUpdated: new Date()
          })
        }
      } catch (fallbackError) {
        console.warn('Fallback API also failed, using default rate:', fallbackError)
        // Use approximate rate as last resort
        this.rates.set('EUR_TO_ALL', {
          currency: 'ALL',
          rate: 110, // Approximate EUR to ALL rate
          lastUpdated: new Date()
        })
      }
    }
  }

  /**
   * Get cached exchange rate or fetch if expired
   */
  async getExchangeRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1

    const cacheKey = `${from}_TO_${to}`
    const reverseKey = `${to}_TO_${from}`

    let rate = this.rates.get(cacheKey)

    // Check if we need to fetch new rates
    if (!rate || Date.now() - rate.lastUpdated.getTime() > this.cacheExpiry) {
      await this.fetchExchangeRates()
      rate = this.rates.get(cacheKey)
    }

    // Try reverse rate if direct rate not available
    if (!rate) {
      const reverseRate = this.rates.get(reverseKey)
      if (reverseRate) {
        return 1 / reverseRate.rate
      }
    }

    return rate?.rate || 1
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(amount: number, from: Currency, to: Currency): Promise<number> {
    const rate = await this.getExchangeRate(from, to)
    return Math.round(amount * rate)
  }

  /**
   * Format price for Albanian locale with proper separators
   */
  formatPrice(amount: number, currency: Currency): string {
    const formatter = new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })

    if (currency === 'ALL') {
      // Albanian format: 1.250.000 ALL
      return formatter.format(amount).replace('ALL', '').trim() + ' ALL'
    }

    return formatter.format(amount)
  }

  /**
   * Format price compactly for listings (e.g., 15k EUR, 1.5M ALL)
   */
  formatPriceCompact(amount: number, currency: Currency): string {
    let value = amount
    let suffix = ''

    if (currency === 'ALL') {
      if (value >= 1000000) {
        value = value / 1000000
        suffix = 'M'
      } else if (value >= 1000) {
        value = value / 1000
        suffix = 'k'
      }
    } else {
      if (value >= 1000000) {
        value = value / 1000000
        suffix = 'M'
      } else if (value >= 1000) {
        value = value / 1000
        suffix = 'k'
      }
    }

    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1)
    return `${formatted}${suffix} ${currency}`
  }

  /**
   * Get user's currency preference from localStorage
   */
  getUserCurrencyPreference(): CurrencyPreference {
    if (typeof window === 'undefined') {
      return { currency: 'EUR', autoDetect: true }
    }

    const stored = localStorage.getItem('currency_preference')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        // Invalid JSON, use default
      }
    }

    return { currency: 'EUR', autoDetect: true }
  }

  /**
   * Save user's currency preference
   */
  setUserCurrencyPreference(preference: CurrencyPreference): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currency_preference', JSON.stringify(preference))
    }
  }

  /**
   * Auto-detect currency based on user location (Albania/Kosovo = ALL, others = EUR)
   */
  async autoDetectCurrency(): Promise<Currency> {
    try {
      // Use IP geolocation API to detect country
      const response = await axios.get('https://ipapi.co/json/', { timeout: 3000 })
      const countryCode = response.data?.country_code

      // Albania and Kosovo use ALL
      if (countryCode === 'AL' || countryCode === 'XK') {
        return 'ALL'
      }

      return 'EUR'
    } catch {
      // Default to EUR if detection fails
      return 'EUR'
    }
  }

  /**
   * Get dual price display (both currencies)
   */
  async getDualPrice(amount: number, primaryCurrency: Currency): Promise<{
    primary: string
    secondary: string
    rate: number
  }> {
    const secondaryCurrency: Currency = primaryCurrency === 'EUR' ? 'ALL' : 'EUR'
    const convertedAmount = await this.convertCurrency(amount, primaryCurrency, secondaryCurrency)
    const rate = await this.getExchangeRate(primaryCurrency, secondaryCurrency)

    return {
      primary: this.formatPrice(amount, primaryCurrency),
      secondary: this.formatPrice(convertedAmount, secondaryCurrency),
      rate
    }
  }

  /**
   * Parse price string and return amount in cents
   */
  parsePrice(priceString: string, currency: Currency): number {
    // Remove currency symbols and separators
    const cleanedPrice = priceString
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')  // Remove thousand separators
      .replace(',', '.')   // Convert decimal comma to dot

    const amount = parseFloat(cleanedPrice) || 0
    return Math.round(amount * (currency === 'ALL' ? 1 : 100)) // ALL is stored as whole units, EUR as cents
  }

  /**
   * Validate price range for currency
   */
  validatePriceRange(amount: number, currency: Currency): { valid: boolean; message?: string } {
    const limits = {
      EUR: { min: 500, max: 500000 },      // €500 - €500k
      ALL: { min: 50000, max: 55000000 }   // 50k - 55M ALL
    }

    const limit = limits[currency]

    if (amount < limit.min) {
      return {
        valid: false,
        message: `Çmimi duhet të jetë të paktën ${this.formatPrice(limit.min, currency)}`
      }
    }

    if (amount > limit.max) {
      return {
        valid: false,
        message: `Çmimi nuk mund të jetë më shumë se ${this.formatPrice(limit.max, currency)}`
      }
    }

    return { valid: true }
  }
}

export const currencyService = CurrencyService.getInstance()

// React hook for currency operations
export function useCurrency() {
  const [rates, setRates] = useState<Map<string, CurrencyRate>>(new Map())
  const [preference, setPreference] = useState<CurrencyPreference>({ currency: 'EUR', autoDetect: true })

  useEffect(() => {
    // Load user preference
    const userPreference = currencyService.getUserCurrencyPreference()
    setPreference(userPreference)

    // Auto-detect if enabled
    if (userPreference.autoDetect) {
      currencyService.autoDetectCurrency().then(detectedCurrency => {
        if (detectedCurrency !== userPreference.currency) {
          const newPreference = { ...userPreference, currency: detectedCurrency }
          setPreference(newPreference)
          currencyService.setUserCurrencyPreference(newPreference)
        }
      })
    }

    // Fetch initial rates
    currencyService.fetchExchangeRates()
  }, [])

  return {
    preference,
    setPreference: (newPreference: CurrencyPreference) => {
      setPreference(newPreference)
      currencyService.setUserCurrencyPreference(newPreference)
    },
    formatPrice: (amount: number, currency?: Currency) =>
      currencyService.formatPrice(amount, currency || preference.currency),
    formatPriceCompact: (amount: number, currency?: Currency) =>
      currencyService.formatPriceCompact(amount, currency || preference.currency),
    convertCurrency: currencyService.convertCurrency.bind(currencyService),
    getDualPrice: currencyService.getDualPrice.bind(currencyService),
    parsePrice: currencyService.parsePrice.bind(currencyService),
    validatePriceRange: currencyService.validatePriceRange.bind(currencyService)
  }
}

// Import React hooks
import { useState, useEffect } from 'react'