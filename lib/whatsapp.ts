import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js'

export interface WhatsAppMessage {
  phone: string
  message: string
  url?: string
}

export interface CarListing {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  currency: string
  city: string
  country: string
  mileage?: number
  fuelType?: string
  transmission?: string
  images?: string[]
  sellerPhone?: string
  sellerName?: string
}

class WhatsAppService {
  private static instance: WhatsAppService

  private constructor() {}

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService()
    }
    return WhatsAppService.instance
  }

  /**
   * Format phone number for WhatsApp (international format without +)
   */
  formatPhoneForWhatsApp(phone: string, country: CountryCode = 'AL'): string | null {
    try {
      if (!phone) return null

      // Clean the phone number
      let cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

      // If phone doesn't start with +, add country prefix
      if (!cleanPhone.startsWith('+')) {
        const countryPrefixes = {
          'AL': '355', // Albania
          'XK': '383', // Kosovo
          'MK': '389', // North Macedonia
          'ME': '382', // Montenegro
          'RS': '381', // Serbia
          'IT': '39',  // Italy (for Albanian diaspora)
          'GR': '30',  // Greece (for Albanian diaspora)
          'DE': '49',  // Germany (for Albanian diaspora)
          'CH': '41',  // Switzerland (for Albanian diaspora)
          'US': '1',   // USA (for Albanian diaspora)
        }

        const prefix = countryPrefixes[country] || countryPrefixes['AL']
        cleanPhone = `+${prefix}${cleanPhone}`
      }

      const phoneNumber = parsePhoneNumber(cleanPhone)

      if (phoneNumber && isValidPhoneNumber(cleanPhone)) {
        // Return without the + for WhatsApp URL
        return phoneNumber.number.replace('+', '')
      }

      return null
    } catch (error) {
      console.error('Error formatting phone number:', error)
      return null
    }
  }

  /**
   * Generate Albanian message template for car inquiry
   */
  generateCarInquiryMessage(listing: CarListing, buyerName?: string): string {
    const formatPrice = (price: number, currency: string) => {
      if (currency === 'ALL') {
        return new Intl.NumberFormat('sq-AL').format(price) + ' ALL'
      }
      return new Intl.NumberFormat('sq-AL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price)
    }

    const greeting = buyerName ? `Përshëndetje, unë jam ${buyerName}.` : 'Përshëndetje,'

    const baseMessage = [
      greeting,
      '',
      `Jam i interesuar për makinën tuaj:`,
      `🚗 ${listing.make} ${listing.model} (${listing.year})`,
      `💰 Çmimi: ${formatPrice(listing.price, listing.currency)}`,
      `📍 Vendndodhja: ${listing.city}, ${this.getCountryName(listing.country)}`,
    ]

    // Add optional details if available
    if (listing.mileage) {
      baseMessage.push(`🛣️ Kilometrazhi: ${new Intl.NumberFormat('sq-AL').format(listing.mileage)} km`)
    }

    if (listing.fuelType) {
      baseMessage.push(`⛽ Karburanti: ${this.translateFuelType(listing.fuelType)}`)
    }

    if (listing.transmission) {
      baseMessage.push(`⚙️ Transmisioni: ${this.translateTransmission(listing.transmission)}`)
    }

    baseMessage.push(
      '',
      'A mund të më jepni më shumë informacione? Jam seriozisht i interesuar për blerje.',
      '',
      'Faleminderit!'
    )

    return baseMessage.join('\n')
  }

  /**
   * Generate WhatsApp Business API message for automated responses
   */
  generateBusinessMessage(listing: CarListing, inquiryType: 'price' | 'details' | 'viewing' | 'financing'): string {
    const baseInfo = `${listing.make} ${listing.model} ${listing.year}`

    switch (inquiryType) {
      case 'price':
        return [
          'Faleminderit për interesimin tuaj!',
          '',
          `Çmimi për ${baseInfo}:`,
          `💰 ${this.formatPrice(listing.price, listing.currency)}`,
          '',
          'Çmimi është i negociueshëm për blerës seriozë.',
          'A dëshironi të organizojmë një takim për ta parë makinën?'
        ].join('\n')

      case 'details':
        return [
          `Detaje të plota për ${baseInfo}:`,
          '',
          `📅 Viti: ${listing.year}`,
          `🛣️ Kilometrazhi: ${listing.mileage ? new Intl.NumberFormat('sq-AL').format(listing.mileage) + ' km' : 'Nuk specifikohet'}`,
          `⛽ Karburanti: ${listing.fuelType ? this.translateFuelType(listing.fuelType) : 'Nuk specifikohet'}`,
          `⚙️ Transmisioni: ${listing.transmission ? this.translateTransmission(listing.transmission) : 'Nuk specifikohet'}`,
          `📍 Vendndodhja: ${listing.city}`,
          '',
          'A keni pyetje të tjera specifike?'
        ].join('\n')

      case 'viewing':
        return [
          'Jam i gatshëm t\'ju tregoj makinën!',
          '',
          `📍 Vendndodhja: ${listing.city}, ${this.getCountryName(listing.country)}`,
          '',
          'Orari i mundshëm:',
          '🕘 E Hënë - E Premte: 09:00 - 18:00',
          '🕘 E Shtunë: 09:00 - 15:00',
          '🕘 E Diel: Vetëm me takim të paraprak',
          '',
          'Kur do të ishit të lirë për ta parë?'
        ].join('\n')

      case 'financing':
        return [
          'Për financimin e makinës:',
          '',
          `💰 Çmimi total: ${this.formatPrice(listing.price, listing.currency)}`,
          '',
          '💳 Mundësi pagese:',
          '• Pagesa të plotë në dorë',
          '• Financim përmes bankës (deri në 7 vjet)',
          '• Leasing operational',
          '• Pagesa në këste (me marrëveshje)',
          '',
          'Cila mundësi ju intereson më shumë?'
        ].join('\n')

      default:
        return this.generateCarInquiryMessage(listing)
    }
  }

  /**
   * Create WhatsApp URL for opening chat
   */
  createWhatsAppUrl(phone: string, message: string): string {
    const formattedPhone = this.formatPhoneForWhatsApp(phone)
    if (!formattedPhone) {
      throw new Error('Invalid phone number')
    }

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  }

  /**
   * Create WhatsApp Business API message (for automated business accounts)
   */
  createBusinessApiMessage(phone: string, message: string, businessPhoneId: string): WhatsAppMessage {
    const formattedPhone = this.formatPhoneForWhatsApp(phone)
    if (!formattedPhone) {
      throw new Error('Invalid phone number')
    }

    return {
      phone: formattedPhone,
      message,
      url: `https://graph.facebook.com/v17.0/${businessPhoneId}/messages`
    }
  }

  /**
   * Generate sharing message for social media
   */
  generateSharingMessage(listing: CarListing, websiteUrl: string): string {
    return [
      `🚗 ${listing.make} ${listing.model} ${listing.year}`,
      `💰 ${this.formatPrice(listing.price, listing.currency)}`,
      `📍 ${listing.city}, ${this.getCountryName(listing.country)}`,
      '',
      `Shiko shpalljen e plotë: ${websiteUrl}/listings/${listing.id}`,
      '',
      '#AutoMarketAlbania #MakinaPerShitje #AutoShqiperia'
    ].join('\n')
  }

  /**
   * Check if phone number is Albanian mobile
   */
  isAlbanianMobile(phone: string): boolean {
    try {
      const phoneNumber = parsePhoneNumber(phone, 'AL')
      return phoneNumber?.getType() === 'MOBILE' && phoneNumber.country === 'AL'
    } catch {
      return false
    }
  }

  /**
   * Get Albanian mobile operators
   */
  getAlbanianOperator(phone: string): string | null {
    const formattedPhone = this.formatPhoneForWhatsApp(phone, 'AL')
    if (!formattedPhone) return null

    // Albanian mobile prefixes
    if (formattedPhone.startsWith('35567') || formattedPhone.startsWith('35568') || formattedPhone.startsWith('35569')) {
      return 'Vodafone Albania'
    }
    if (formattedPhone.startsWith('35566') || formattedPhone.startsWith('35565')) {
      return 'One Albania'
    }
    if (formattedPhone.startsWith('35564')) {
      return 'Plus Communication'
    }

    return 'Unknown'
  }

  private formatPrice(price: number, currency: string): string {
    if (currency === 'ALL') {
      return new Intl.NumberFormat('sq-AL').format(price) + ' ALL'
    }
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  private getCountryName(countryCode: string): string {
    const countries = {
      'AL': 'Shqipëri',
      'XK': 'Kosovë',
      'MK': 'Maqedoni e Veriut',
      'ME': 'Mali i Zi',
      'RS': 'Serbi',
      'GR': 'Greqi',
      'IT': 'Itali',
      'DE': 'Gjermani',
      'CH': 'Zvicër',
      'US': 'SHBA'
    }
    return countries[countryCode as keyof typeof countries] || countryCode
  }

  private translateFuelType(fuelType: string): string {
    const translations = {
      'gasoline': 'Benzinë',
      'diesel': 'Nafte',
      'electric': 'Elektrik',
      'hybrid': 'Hibrid',
      'lpg': 'LPG (Gaz)',
      'natural_gas': 'Gaz Natyror',
      'ethanol': 'Etanol'
    }
    return translations[fuelType.toLowerCase() as keyof typeof translations] || fuelType
  }

  private translateTransmission(transmission: string): string {
    const translations = {
      'manual': 'Manual',
      'automatic': 'Automatik',
      'semi_automatic': 'Gjysmë-automatik',
      'cvt': 'CVT'
    }
    return translations[transmission.toLowerCase() as keyof typeof translations] || transmission
  }
}

export const whatsappService = WhatsAppService.getInstance()

// React hook for WhatsApp integration
export function useWhatsApp() {
  return {
    formatPhone: whatsappService.formatPhoneForWhatsApp.bind(whatsappService),
    generateMessage: whatsappService.generateCarInquiryMessage.bind(whatsappService),
    generateBusinessMessage: whatsappService.generateBusinessMessage.bind(whatsappService),
    createUrl: whatsappService.createWhatsAppUrl.bind(whatsappService),
    generateSharingMessage: whatsappService.generateSharingMessage.bind(whatsappService),
    isAlbanianMobile: whatsappService.isAlbanianMobile.bind(whatsappService),
    getOperator: whatsappService.getAlbanianOperator.bind(whatsappService)
  }
}