'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, MapPin, Search, Globe, Check } from 'lucide-react'
import { useRegional, type Country, type Region } from '../lib/regional'

interface RegionalSelectorProps {
  selectedCountry?: string
  selectedRegion?: string
  onCountryChange: (country: string) => void
  onRegionChange: (region: string) => void
  placeholder?: string
  showFlags?: boolean
  className?: string
}

export function RegionalSelector({
  selectedCountry,
  selectedRegion,
  onCountryChange,
  onRegionChange,
  placeholder = "Zgjedh vendin dhe qytetin",
  showFlags = true,
  className = ""
}: RegionalSelectorProps) {
  const { countries, getRegionsByCountry, getCountry, getRegion, getPopularRegions, searchRegions } = useRegional()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedCountry) {
      const regions = getPopularRegions(selectedCountry)
      setFilteredRegions(regions)
    } else {
      setFilteredRegions(getPopularRegions())
    }
  }, [selectedCountry, getPopularRegions])

  useEffect(() => {
    if (searchQuery) {
      const results = searchRegions(searchQuery, selectedCountry)
      setFilteredRegions(results)
    } else if (selectedCountry) {
      setFilteredRegions(getPopularRegions(selectedCountry))
    } else {
      setFilteredRegions(getPopularRegions())
    }
  }, [searchQuery, selectedCountry, searchRegions, getPopularRegions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCountryObj = selectedCountry ? getCountry(selectedCountry) : null
  const selectedRegionObj = selectedRegion ? getRegion(selectedRegion) : null

  const handleCountrySelect = (countryCode: string) => {
    onCountryChange(countryCode)
    onRegionChange('') // Reset region when country changes
    setSearchQuery('')
  }

  const handleRegionSelect = (regionId: string) => {
    const region = getRegion(regionId)
    if (region) {
      onCountryChange(region.country)
      onRegionChange(regionId)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const getDisplayValue = () => {
    if (selectedRegionObj && selectedCountryObj) {
      return `${selectedRegionObj.nameAlbanian}, ${selectedCountryObj.nameAlbanian}`
    }
    if (selectedCountryObj) {
      return selectedCountryObj.nameAlbanian
    }
    return placeholder
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
      >
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-2">
            {showFlags && selectedCountryObj && (
              <span className="text-lg">{selectedCountryObj.flag}</span>
            )}
            <span className={`text-left ${selectedRegionObj || selectedCountryObj ? 'text-gray-900' : 'text-gray-500'}`}>
              {getDisplayValue()}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kërko qytet ose vend..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Countries Section */}
            {!searchQuery && (
              <div className="p-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Vendet
                </h4>
                <div className="space-y-1">
                  {countries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country.code)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-gray-50 ${
                        selectedCountry === country.code ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {showFlags && <span className="text-lg">{country.flag}</span>}
                        <span className="text-gray-900">{country.nameAlbanian}</span>
                      </div>
                      {selectedCountry === country.code && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Regions Section */}
            <div className="p-3 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {searchQuery ? 'Rezultatet e kërkimit' : 'Qytetet kryesore'}
              </h4>
              {filteredRegions.length > 0 ? (
                <div className="space-y-1">
                  {filteredRegions.map((region) => {
                    const country = getCountry(region.country)
                    return (
                      <button
                        key={region.id}
                        onClick={() => handleRegionSelect(region.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-gray-50 ${
                          selectedRegion === region.id ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {showFlags && country && <span className="text-sm">{country.flag}</span>}
                          <div className="text-left">
                            <div className="text-gray-900 font-medium">{region.nameAlbanian}</div>
                            <div className="text-xs text-gray-500">
                              {country?.nameAlbanian}
                              {region.population && (
                                <span> • {new Intl.NumberFormat('sq-AL').format(region.population)} banorë</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedRegion === region.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Nuk u gjetën qytete</p>
                </div>
              )}
            </div>

            {/* Auto-detect Option */}
            {!searchQuery && (
              <div className="p-3 border-t border-gray-200">
                <button
                  onClick={async () => {
                    try {
                      const { autoDetectRegion } = useRegional()
                      const detected = await autoDetectRegion()
                      if (detected) {
                        onCountryChange(detected.country.code)
                        if (detected.region) {
                          onRegionChange(detected.region.id)
                        }
                        setIsOpen(false)
                      }
                    } catch (error) {
                      console.error('Auto-detection failed:', error)
                    }
                  }}
                  className="w-full flex items-center space-x-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Zbulo automatikisht vendndodhjen</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact regional display component
export function RegionalDisplay({
  country,
  region,
  showFlag = true,
  className = ""
}: {
  country: string
  region?: string
  showFlag?: boolean
  className?: string
}) {
  const { getCountry, getRegion } = useRegional()

  const countryObj = getCountry(country)
  const regionObj = region ? getRegion(region) : null

  if (!countryObj) return null

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showFlag && <span className="text-sm">{countryObj.flag}</span>}
      <span className="text-gray-600">
        {regionObj ? `${regionObj.nameAlbanian}, ` : ''}{countryObj.nameAlbanian}
      </span>
    </div>
  )
}

// Phone input with country validation
export function RegionalPhoneInput({
  value,
  onChange,
  country,
  error,
  className = ""
}: {
  value: string
  onChange: (value: string) => void
  country: string
  error?: string
  className?: string
}) {
  const { getCountry, formatPhoneNumber, validatePhoneNumber } = useRegional()
  const [isValid, setIsValid] = useState(true)

  const countryObj = getCountry(country)

  useEffect(() => {
    if (value && country) {
      setIsValid(validatePhoneNumber(value, country))
    }
  }, [value, country, validatePhoneNumber])

  const handleChange = (inputValue: string) => {
    onChange(inputValue)
  }

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {countryObj && (
            <>
              <span className="text-sm">{countryObj.flag}</span>
              <span className="text-gray-500 text-sm">{countryObj.dialCode}</span>
            </>
          )}
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="6X XXX XXXX"
          className={`w-full pl-20 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error || !isValid ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {value && isValid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Check className="w-4 h-4 text-green-600" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {!isValid && value && !error && (
        <p className="mt-1 text-sm text-red-600">
          Numri i telefonit nuk është i saktë për {countryObj?.nameAlbanian}
        </p>
      )}
    </div>
  )
}