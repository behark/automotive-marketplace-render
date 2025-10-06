'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Euro, DollarSign } from 'lucide-react'
import { currencyService, useCurrency, type Currency } from '../lib/currency'

export function CurrencySwitcher() {
  const { preference, setPreference, formatPrice } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [currentRate, setCurrentRate] = useState<number | null>(null)

  const currencies = [
    {
      code: 'EUR' as Currency,
      name: 'Euro',
      symbol: '€',
      icon: Euro,
      flag: '🇪🇺'
    },
    {
      code: 'ALL' as Currency,
      name: 'Lek Shqiptar',
      symbol: 'ALL',
      icon: DollarSign,
      flag: '🇦🇱'
    }
  ]

  useEffect(() => {
    // Fetch current exchange rate
    const fetchRate = async () => {
      try {
        const rate = await currencyService.getExchangeRate('EUR', 'ALL')
        setCurrentRate(rate)
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
      }
    }

    fetchRate()

    // Update rate every 30 minutes
    const interval = setInterval(fetchRate, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCurrencyChange = (currency: Currency) => {
    setPreference({ ...preference, currency })
    setIsOpen(false)
  }

  const toggleAutoDetect = () => {
    setPreference({ ...preference, autoDetect: !preference.autoDetect })
  }

  const currentCurrency = currencies.find(c => c.code === preference.currency)
  const otherCurrency = currencies.find(c => c.code !== preference.currency)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
        aria-label="Zgjedh monedhën"
      >
        <span className="text-lg">{currentCurrency?.flag}</span>
        <span className="font-medium text-sm text-gray-700">
          {currentCurrency?.code}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Zgjedh Monedhën</h3>

              {/* Currency Options */}
              <div className="space-y-2 mb-4">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      preference.currency === currency.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{currency.flag}</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{currency.code}</div>
                        <div className="text-sm text-gray-500">{currency.name}</div>
                      </div>
                    </div>
                    {preference.currency === currency.code && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Exchange Rate Info */}
              {currentRate && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-gray-600 mb-1">Kursi i këmbimit:</div>
                  <div className="font-medium text-gray-900">
                    1 EUR = {currentRate.toFixed(2)} ALL
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Përditësuar çdo 30 minuta
                  </div>
                </div>
              )}

              {/* Quick Convert Preview */}
              {currentRate && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-blue-600 mb-2">Shembull konvertimi:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>10.000 EUR</span>
                      <span>{formatPrice(Math.round(10000 * currentRate), 'ALL')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1.000.000 ALL</span>
                      <span>{formatPrice(Math.round(1000000 / currentRate * 100), 'EUR')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-detect Option */}
              <div className="border-t border-gray-200 pt-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Auto-zbulim</div>
                    <div className="text-xs text-gray-500">
                      Përdor vendin për të zgjedhur monedhën
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preference.autoDetect}
                    onChange={toggleAutoDetect}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              {/* Help Text */}
              <div className="text-xs text-gray-400 mt-3">
                Çmimet do të shfaqen në monedhën e zgjedhur. Kursi i këmbimit përditësohet automatikisht.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Dual price display component for listings
export function DualPriceDisplay({
  amount,
  currency,
  className = ""
}: {
  amount: number
  currency: Currency
  className?: string
}) {
  const [dualPrice, setDualPrice] = useState<{
    primary: string
    secondary: string
    rate: number
  } | null>(null)

  useEffect(() => {
    const fetchDualPrice = async () => {
      try {
        const dual = await currencyService.getDualPrice(amount, currency)
        setDualPrice(dual)
      } catch (error) {
        console.error('Failed to get dual price:', error)
      }
    }

    fetchDualPrice()
  }, [amount, currency])

  if (!dualPrice) {
    return (
      <div className={`${className}`}>
        <div className="font-bold text-lg">
          {currencyService.formatPrice(amount, currency)}
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="font-bold text-lg">
        {dualPrice.primary}
      </div>
      <div className="text-sm text-gray-500">
        ≈ {dualPrice.secondary}
      </div>
    </div>
  )
}

// Price input component with currency selection
export function PriceInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  placeholder = "Shkruaj çmimin",
  error,
  className = ""
}: {
  value: string
  onChange: (value: string) => void
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
  placeholder?: string
  error?: string
  className?: string
}) {
  const { validatePriceRange, parsePrice } = useCurrency()
  const [showValidation, setShowValidation] = useState(false)

  const handleValueChange = (inputValue: string) => {
    // Allow only numbers, dots, and commas
    const cleanedValue = inputValue.replace(/[^\d.,]/g, '')
    onChange(cleanedValue)

    // Validate on blur or when complete number is entered
    if (cleanedValue && cleanedValue.length > 3) {
      const parsedAmount = parsePrice(cleanedValue, currency)
      const validation = validatePriceRange(parsedAmount, currency)
      setShowValidation(!validation.valid)
    }
  }

  const currencies = [
    { code: 'EUR' as Currency, symbol: '€', flag: '🇪🇺' },
    { code: 'ALL' as Currency, symbol: 'ALL', flag: '🇦🇱' }
  ]

  return (
    <div className={`${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-4 pr-24 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error || showValidation ? 'border-red-500' : 'border-gray-300'
          }`}
        />

        {/* Currency Selector */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="bg-transparent border-none focus:ring-0 text-sm font-medium"
          >
            {currencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.flag} {curr.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(error || showValidation) && (
        <div className="mt-1 text-sm text-red-600">
          {error || validatePriceRange(parsePrice(value, currency), currency).message}
        </div>
      )}

      {/* Price limits info */}
      <div className="mt-1 text-xs text-gray-500">
        {currency === 'EUR' ? 'Çmimi: €500 - €500,000' : 'Çmimi: 50,000 - 55,000,000 ALL'}
      </div>
    </div>
  )
}