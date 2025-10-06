import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'

// Regional configuration for Albania, Kosovo, and Macedonia
export interface Country {
  code: string
  name: string
  nameAlbanian: string
  dialCode: string
  flag: string
  currency: string
  timeZone: string
  language: string
}

export interface Region {
  id: string
  name: string
  nameAlbanian: string
  country: string
  type: 'capital' | 'city' | 'municipality' | 'county'
  population?: number
  coordinates?: { lat: number; lng: number }
}

export const COUNTRIES: Country[] = [
  {
    code: 'AL',
    name: 'Albania',
    nameAlbanian: 'Shqipëri',
    dialCode: '+355',
    flag: '🇦🇱',
    currency: 'ALL',
    timeZone: 'Europe/Tirane',
    language: 'sq'
  },
  {
    code: 'XK',
    name: 'Kosovo',
    nameAlbanian: 'Kosovë',
    dialCode: '+383',
    flag: '🇽🇰',
    currency: 'EUR',
    timeZone: 'Europe/Belgrade',
    language: 'sq'
  },
  {
    code: 'MK',
    name: 'North Macedonia',
    nameAlbanian: 'Maqedoni e Veriut',
    dialCode: '+389',
    flag: '🇲🇰',
    currency: 'MKD',
    timeZone: 'Europe/Skopje',
    language: 'mk'
  }
]

// Albanian cities and regions
export const ALBANIA_REGIONS: Region[] = [
  // Major Cities
  { id: 'tirana', name: 'Tirana', nameAlbanian: 'Tiranë', country: 'AL', type: 'capital', population: 418495 },
  { id: 'durres', name: 'Durrës', nameAlbanian: 'Durrës', country: 'AL', type: 'city', population: 175110 },
  { id: 'vlore', name: 'Vlorë', nameAlbanian: 'Vlorë', country: 'AL', type: 'city', population: 130827 },
  { id: 'elbasan', name: 'Elbasan', nameAlbanian: 'Elbasan', country: 'AL', type: 'city', population: 126703 },
  { id: 'shkoder', name: 'Shkodër', nameAlbanian: 'Shkodër', country: 'AL', type: 'city', population: 77075 },
  { id: 'korce', name: 'Korçë', nameAlbanian: 'Korçë', country: 'AL', type: 'city', population: 58259 },
  { id: 'fier', name: 'Fier', nameAlbanian: 'Fier', country: 'AL', type: 'city', population: 55845 },
  { id: 'berat', name: 'Berat', nameAlbanian: 'Berat', country: 'AL', type: 'city', population: 36467 },
  { id: 'lushnje', name: 'Lushnjë', nameAlbanian: 'Lushnjë', country: 'AL', type: 'city', population: 31105 },
  { id: 'pogradec', name: 'Pogradec', nameAlbanian: 'Pogradec', country: 'AL', type: 'city', population: 20848 },
  { id: 'kavaje', name: 'Kavajë', nameAlbanian: 'Kavajë', country: 'AL', type: 'city', population: 20192 },
  { id: 'gjirokaster', name: 'Gjirokastër', nameAlbanian: 'Gjirokastër', country: 'AL', type: 'city', population: 19836 },
  { id: 'sarande', name: 'Sarandë', nameAlbanian: 'Sarandë', country: 'AL', type: 'city', population: 17233 },
  { id: 'lac', name: 'Laç', nameAlbanian: 'Laç', country: 'AL', type: 'city', population: 17086 },
  { id: 'kukes', name: 'Kukës', nameAlbanian: 'Kukës', country: 'AL', type: 'city', population: 16719 },

  // Other important municipalities
  { id: 'peshkopi', name: 'Peshkopi', nameAlbanian: 'Peshkopi', country: 'AL', type: 'municipality' },
  { id: 'kruje', name: 'Krujë', nameAlbanian: 'Krujë', country: 'AL', type: 'municipality' },
  { id: 'lezhe', name: 'Lezhë', nameAlbanian: 'Lezhë', country: 'AL', type: 'municipality' },
  { id: 'tepelene', name: 'Tepelenë', nameAlbanian: 'Tepelenë', country: 'AL', type: 'municipality' },
  { id: 'permet', name: 'Përmet', nameAlbanian: 'Përmet', country: 'AL', type: 'municipality' },
  { id: 'delvine', name: 'Delvinë', nameAlbanian: 'Delvinë', country: 'AL', type: 'municipality' },
  { id: 'malesi_e_madhe', name: 'Malësi e Madhe', nameAlbanian: 'Malësi e Madhe', country: 'AL', type: 'municipality' },
  { id: 'has', name: 'Has', nameAlbanian: 'Has', country: 'AL', type: 'municipality' },
  { id: 'tropoje', name: 'Tropojë', nameAlbanian: 'Tropojë', country: 'AL', type: 'municipality' }
]

// Kosovo cities and regions
export const KOSOVO_REGIONS: Region[] = [
  // Major Cities
  { id: 'pristina', name: 'Pristina', nameAlbanian: 'Prishtinë', country: 'XK', type: 'capital', population: 198897 },
  { id: 'prizren', name: 'Prizren', nameAlbanian: 'Prizren', country: 'XK', type: 'city', population: 177781 },
  { id: 'peja', name: 'Peja', nameAlbanian: 'Pejë', country: 'XK', type: 'city', population: 96450 },
  { id: 'gjakova', name: 'Gjakova', nameAlbanian: 'Gjakovë', country: 'XK', type: 'city', population: 94556 },
  { id: 'gjilan', name: 'Gjilan', nameAlbanian: 'Gjilan', country: 'XK', type: 'city', population: 90015 },
  { id: 'mitrovica', name: 'Mitrovica', nameAlbanian: 'Mitrovicë', country: 'XK', type: 'city', population: 84235 },
  { id: 'ferizaj', name: 'Ferizaj', nameAlbanian: 'Ferizaj', country: 'XK', type: 'city', population: 76723 },

  // Other municipalities
  { id: 'vushtrri', name: 'Vushtrri', nameAlbanian: 'Vushtrri', country: 'XK', type: 'municipality' },
  { id: 'suhareka', name: 'Suharekë', nameAlbanian: 'Suharekë', country: 'XK', type: 'municipality' },
  { id: 'rahovec', name: 'Rahovec', nameAlbanian: 'Rahovec', country: 'XK', type: 'municipality' },
  { id: 'malisheva', name: 'Malishevë', nameAlbanian: 'Malishevë', country: 'XK', type: 'municipality' },
  { id: 'kamenica', name: 'Kamenicë', nameAlbanian: 'Kamenicë', country: 'XK', type: 'municipality' },
  { id: 'viti', name: 'Viti', nameAlbanian: 'Viti', country: 'XK', type: 'municipality' },
  { id: 'istog', name: 'Istog', nameAlbanian: 'Istog', country: 'XK', type: 'municipality' },
  { id: 'kline', name: 'Klinë', nameAlbanian: 'Klinë', country: 'XK', type: 'municipality' },
  { id: 'decan', name: 'Deçan', nameAlbanian: 'Deçan', country: 'XK', type: 'municipality' }
]

// North Macedonia cities (Albanian-majority areas)
export const MACEDONIA_REGIONS: Region[] = [
  // Major Cities
  { id: 'skopje', name: 'Skopje', nameAlbanian: 'Shkup', country: 'MK', type: 'capital', population: 544086 },
  { id: 'tetovo', name: 'Tetovo', nameAlbanian: 'Tetovë', country: 'MK', type: 'city', population: 86580 },
  { id: 'gostivar', name: 'Gostivar', nameAlbanian: 'Gostivar', country: 'MK', type: 'city', population: 81042 },
  { id: 'strumica', name: 'Strumica', nameAlbanian: 'Strumicë', country: 'MK', type: 'city', population: 54676 },
  { id: 'kumanovo', name: 'Kumanovo', nameAlbanian: 'Kumanovë', country: 'MK', type: 'city', population: 105484 },

  // Albanian-majority municipalities
  { id: 'debar', name: 'Debar', nameAlbanian: 'Dibër', country: 'MK', type: 'municipality' },
  { id: 'struga', name: 'Struga', nameAlbanian: 'Strugë', country: 'MK', type: 'municipality' },
  { id: 'kicevo', name: 'Kičevo', nameAlbanian: 'Kërçovë', country: 'MK', type: 'municipality' },
  { id: 'plasnica', name: 'Plasnica', nameAlbanian: 'Plasnicë', country: 'MK', type: 'municipality' },
  { id: 'vrapciste', name: 'Vrapčište', nameAlbanian: 'Vrapçisht', country: 'MK', type: 'municipality' },
  { id: 'bogovinje', name: 'Bogovinje', nameAlbanian: 'Bogovinë', country: 'MK', type: 'municipality' },
  { id: 'brvenica', name: 'Brvenica', nameAlbanian: 'Bërvenicë', country: 'MK', type: 'municipality' },
  { id: 'tearce', name: 'Tearce', nameAlbanian: 'Tearcë', country: 'MK', type: 'municipality' },
  { id: 'jegunovce', name: 'Jegunovce', nameAlbanian: 'Jegunovcë', country: 'MK', type: 'municipality' },
  { id: 'zelino', name: 'Želino', nameAlbanian: 'Zhelinë', country: 'MK', type: 'municipality' }
]

// Combined regions for easy access
export const ALL_REGIONS = [...ALBANIA_REGIONS, ...KOSOVO_REGIONS, ...MACEDONIA_REGIONS]

class RegionalService {
  private static instance: RegionalService

  private constructor() {}

  static getInstance(): RegionalService {
    if (!RegionalService.instance) {
      RegionalService.instance = new RegionalService()
    }
    return RegionalService.instance
  }

  /**
   * Get all countries
   */
  getCountries(): Country[] {
    return COUNTRIES
  }

  /**
   * Get country by code
   */
  getCountry(code: string): Country | undefined {
    return COUNTRIES.find(country => country.code === code)
  }

  /**
   * Get regions by country
   */
  getRegionsByCountry(countryCode: string): Region[] {
    return ALL_REGIONS.filter(region => region.country === countryCode)
  }

  /**
   * Get all regions
   */
  getAllRegions(): Region[] {
    return ALL_REGIONS
  }

  /**
   * Get region by ID
   */
  getRegion(id: string): Region | undefined {
    return ALL_REGIONS.find(region => region.id === id)
  }

  /**
   * Format phone number for specific country
   */
  formatPhoneNumber(phone: string, countryCode: string): string | null {
    try {
      const country = this.getCountry(countryCode)
      if (!country) return null

      const phoneNumber = parsePhoneNumber(phone, countryCode as CountryCode)
      return phoneNumber?.formatInternational() || null
    } catch {
      return null
    }
  }

  /**
   * Validate phone number for specific country
   */
  validatePhoneNumber(phone: string, countryCode: string): boolean {
    try {
      const phoneNumber = parsePhoneNumber(phone, countryCode as CountryCode)
      return phoneNumber?.isValid() || false
    } catch {
      return false
    }
  }

  /**
   * Get local currency for country
   */
  getLocalCurrency(countryCode: string): string {
    const country = this.getCountry(countryCode)
    return country?.currency || 'EUR'
  }

  /**
   * Get country from phone number
   */
  getCountryFromPhone(phone: string): Country | null {
    try {
      const phoneNumber = parsePhoneNumber(phone)
      if (phoneNumber?.country) {
        // Handle Kosovo special case (uses +383 but not standard ISO)
        if (phone.startsWith('+383') || phone.startsWith('383')) {
          return this.getCountry('XK') || null
        }
        return this.getCountry(phoneNumber.country) || null
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Auto-detect user's region based on various factors
   */
  async autoDetectRegion(): Promise<{ country: Country; region?: Region } | null> {
    try {
      // Try IP geolocation first
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()

      if (data.country_code) {
        const country = this.getCountry(data.country_code.toUpperCase())
        if (country) {
          // Try to match city if available
          const region = this.getRegionsByCountry(country.code).find(r =>
            r.name.toLowerCase() === data.city?.toLowerCase() ||
            r.nameAlbanian.toLowerCase() === data.city?.toLowerCase()
          )
          return { country, region }
        }
      }

      // Fallback: Try timezone-based detection
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const country = COUNTRIES.find(c => c.timeZone === timeZone)
      if (country) {
        return { country }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Get popular regions (major cities) for autocomplete
   */
  getPopularRegions(countryCode?: string): Region[] {
    let regions = countryCode ? this.getRegionsByCountry(countryCode) : ALL_REGIONS

    return regions
      .filter(region => region.type === 'capital' || region.type === 'city')
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 10)
  }

  /**
   * Search regions by name (Albanian or English)
   */
  searchRegions(query: string, countryCode?: string): Region[] {
    let regions = countryCode ? this.getRegionsByCountry(countryCode) : ALL_REGIONS

    const lowerQuery = query.toLowerCase()
    return regions.filter(region =>
      region.name.toLowerCase().includes(lowerQuery) ||
      region.nameAlbanian.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get market insights for region
   */
  getRegionMarketData(regionId: string) {
    const region = this.getRegion(regionId)
    if (!region) return null

    // This would typically come from a database
    const marketData = {
      averageListingPrice: this.getAveragePrice(regionId),
      popularMakes: this.getPopularMakes(regionId),
      marketActivity: this.getMarketActivity(regionId),
      demographicInfo: this.getDemographicInfo(regionId)
    }

    return { region, marketData }
  }

  private getAveragePrice(regionId: string): number {
    // Mock data - would come from actual database
    const mockPrices: Record<string, number> = {
      'tirana': 12000,
      'durres': 10500,
      'vlore': 9800,
      'pristina': 11000,
      'prizren': 9500,
      'skopje': 8500,
      'tetovo': 7800
    }
    return mockPrices[regionId] || 9000
  }

  private getPopularMakes(regionId: string): string[] {
    // Mock data - would come from actual database
    return ['Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen', 'Toyota', 'Honda']
  }

  private getMarketActivity(regionId: string): string {
    // Mock data - would come from actual database
    const activities = ['High', 'Medium', 'Low']
    return activities[Math.floor(Math.random() * activities.length)]
  }

  private getDemographicInfo(regionId: string) {
    const region = this.getRegion(regionId)
    return {
      population: region?.population,
      type: region?.type,
      economicLevel: 'medium' // This would be calculated from real data
    }
  }
}

export const regionalService = RegionalService.getInstance()

// React hook for regional functionality
export function useRegional() {
  return {
    countries: regionalService.getCountries(),
    getCountry: regionalService.getCountry.bind(regionalService),
    getRegionsByCountry: regionalService.getRegionsByCountry.bind(regionalService),
    getAllRegions: regionalService.getAllRegions.bind(regionalService),
    getRegion: regionalService.getRegion.bind(regionalService),
    formatPhoneNumber: regionalService.formatPhoneNumber.bind(regionalService),
    validatePhoneNumber: regionalService.validatePhoneNumber.bind(regionalService),
    getLocalCurrency: regionalService.getLocalCurrency.bind(regionalService),
    getCountryFromPhone: regionalService.getCountryFromPhone.bind(regionalService),
    autoDetectRegion: regionalService.autoDetectRegion.bind(regionalService),
    getPopularRegions: regionalService.getPopularRegions.bind(regionalService),
    searchRegions: regionalService.searchRegions.bind(regionalService),
    getRegionMarketData: regionalService.getRegionMarketData.bind(regionalService)
  }
}