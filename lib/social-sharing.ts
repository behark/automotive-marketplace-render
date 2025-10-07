// Define CarListing type locally
interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  images: string[];
  city: string;
  country?: string;
  description: string;
  sellerPhone?: string;
}

export type { CarListing }

export interface SocialShareData {
  url: string
  title: string
  description: string
  hashtags?: string[]
  image?: string
}

export interface SocialPlatform {
  id: string
  name: string
  nameAlbanian: string
  icon: string
  color: string
  supportsImage: boolean
  supportsHashtags: boolean
  characterLimit?: number
}

// Social media platforms popular in Albania, Kosovo, and Macedonia
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    nameAlbanian: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    supportsImage: true,
    supportsHashtags: true
  },
  {
    id: 'instagram',
    name: 'Instagram',
    nameAlbanian: 'Instagram',
    icon: '📷',
    color: '#E4405F',
    supportsImage: true,
    supportsHashtags: true,
    characterLimit: 2200
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    nameAlbanian: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    supportsImage: true,
    supportsHashtags: false
  },
  {
    id: 'telegram',
    name: 'Telegram',
    nameAlbanian: 'Telegram',
    icon: '✈️',
    color: '#0088CC',
    supportsImage: true,
    supportsHashtags: true
  },
  {
    id: 'viber',
    name: 'Viber',
    nameAlbanian: 'Viber',
    icon: '📞',
    color: '#665CAC',
    supportsImage: true,
    supportsHashtags: false
  },
  {
    id: 'twitter',
    name: 'Twitter',
    nameAlbanian: 'Twitter',
    icon: '🐦',
    color: '#1DA1F2',
    supportsImage: true,
    supportsHashtags: true,
    characterLimit: 280
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    nameAlbanian: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    supportsImage: true,
    supportsHashtags: true
  }
]

// Albanian car-related Facebook groups (popular ones for sharing)
export const ALBANIAN_CAR_GROUPS = [
  {
    id: 'autoshqiperia',
    name: 'Auto Shqipëria - Blerje Shitje',
    url: 'https://www.facebook.com/groups/autoshqiperia',
    description: 'Grupi më i madh shqiptar për blerje dhe shitje automjetesh',
    members: '150k+'
  },
  {
    id: 'automarket_albania',
    name: 'AutoMarket Albania',
    url: 'https://www.facebook.com/groups/automarketalbania',
    description: 'Tregu i automjeteve në Shqipëri',
    members: '80k+'
  },
  {
    id: 'auto_kosova',
    name: 'Auto Kosova - Shitje Blerje',
    url: 'https://www.facebook.com/groups/autokosova',
    description: 'Automjete në Kosovë',
    members: '65k+'
  },
  {
    id: 'auto_macedonia',
    name: 'Auto Maqedoni - Shqiptarë',
    url: 'https://www.facebook.com/groups/automaqedoni',
    description: 'Automjete për shqiptarët në Maqedoni',
    members: '35k+'
  }
]

class SocialSharingService {
  private static instance: SocialSharingService

  private constructor() {}

  static getInstance(): SocialSharingService {
    if (!SocialSharingService.instance) {
      SocialSharingService.instance = new SocialSharingService()
    }
    return SocialSharingService.instance
  }

  /**
   * Generate optimized content for Albanian car listings
   */
  generateListingContent(listing: CarListing, websiteUrl: string = 'https://automarket.al'): SocialShareData {
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

    const title = `${listing.make} ${listing.model} ${listing.year} - ${formatPrice(listing.price, listing.currency || 'EUR')}`

    const features = []
    if (listing.mileage) features.push(`${new Intl.NumberFormat('sq-AL').format(listing.mileage)} km`)
    if (listing.fuelType) features.push(this.translateFuelType(listing.fuelType))
    if (listing.transmission) features.push(this.translateTransmission(listing.transmission))

    const description = [
      `🚗 ${listing.make} ${listing.model} (${listing.year})`,
      `💰 Çmimi: ${formatPrice(listing.price, listing.currency || 'EUR')}`,
      `📍 ${listing.city}, ${this.getCountryName(listing.country || 'AL')}`,
      features.length > 0 ? `⚙️ ${features.join(' • ')}` : '',
      '',
      'Shiko detajet e plota dhe foto të tjera:',
      `${websiteUrl}/listings/${listing.id}`,
      '',
      '#AutoShqiperia #MakinaPerShitje #AutoMarket'
    ].filter(Boolean).join('\n')

    return {
      url: `${websiteUrl}/listings/${listing.id}`,
      title,
      description,
      hashtags: [
        'AutoShqiperia',
        'MakinaPerShitje',
        'AutoMarket',
        listing.make.replace(/\s+/g, ''),
        listing.city.replace(/\s+/g, ''),
        listing.country === 'AL' ? 'Shqiperi' : listing.country === 'XK' ? 'Kosove' : 'Maqedoni'
      ],
      image: listing.images?.[0]
    }
  }

  /**
   * Generate platform-specific share URLs
   */
  generateShareUrl(platform: string, shareData: SocialShareData): string {
    const encodedUrl = encodeURIComponent(shareData.url)
    const encodedTitle = encodeURIComponent(shareData.title)
    const encodedDescription = encodeURIComponent(shareData.description)

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedDescription}`

      case 'instagram':
        // Instagram doesn't support direct URL sharing, return app URL
        return `instagram://library?AssetPath=${encodeURIComponent(shareData.image || '')}`

      case 'whatsapp':
        return `https://wa.me/?text=${encodedDescription}`

      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedDescription}`

      case 'viber':
        return `viber://forward?text=${encodedDescription}`

      case 'twitter':
        const hashtags = shareData.hashtags?.join(',') || ''
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${hashtags}`

      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`

      default:
        return shareData.url
    }
  }

  /**
   * Generate Facebook Marketplace post content
   */
  generateFacebookMarketplacePost(listing: CarListing): {
    title: string
    description: string
    price: number
    currency: string
    category: string
    condition: string
    location: string
  } {
    const formatFeatures = () => {
      const features = []
      if (listing.mileage) features.push(`Kilometrazhi: ${new Intl.NumberFormat('sq-AL').format(listing.mileage)} km`)
      if (listing.fuelType) features.push(`Karburanti: ${this.translateFuelType(listing.fuelType)}`)
      if (listing.transmission) features.push(`Transmisioni: ${this.translateTransmission(listing.transmission)}`)
      if (listing.color) features.push(`Ngjyra: ${listing.color}`)
      return features.join('\n')
    }

    return {
      title: `${listing.make} ${listing.model} ${listing.year}`,
      description: [
        listing.description,
        '',
        '📋 Specifikime:',
        formatFeatures(),
        '',
        '📞 Për më shumë informacione, kontaktoni.',
        '',
        '✅ E verifikuar nga AutoMarket Albania'
      ].join('\n'),
      price: listing.price,
      currency: listing.currency || 'EUR',
      category: 'Vehicles',
      condition: 'Used', // This would be configurable
      location: `${listing.city}, ${this.getCountryName(listing.country || 'AL')}`
    }
  }

  /**
   * Generate Instagram story content with proper formatting
   */
  generateInstagramStoryContent(listing: CarListing): {
    text: string
    hashtags: string[]
    mentions?: string[]
    stickers?: any[]
  } {
    const price = this.formatPrice(listing.price, listing.currency || 'EUR')

    return {
      text: [
        `${listing.make} ${listing.model} ${listing.year}`,
        `💰 ${price}`,
        `📍 ${listing.city}`,
        '',
        'Swipe up për detaje 👆'
      ].join('\n'),
      hashtags: [
        '#AutoShqiperia',
        '#MakinaPerShitje',
        `#${listing.make}`,
        `#${listing.city}`,
        '#AutoMarket',
        '#Automobila',
        '#Tirane',
        '#Kosove',
        '#Shqiperi'
      ],
      mentions: ['@automarket.albania'], // Your Instagram handle
      stickers: [
        {
          type: 'location',
          location: `${listing.city}, ${this.getCountryName(listing.country || 'AL')}`
        },
        {
          type: 'hashtag',
          hashtag: 'AutoShqiperia'
        }
      ]
    }
  }

  /**
   * Generate optimized content for Albanian social media groups
   */
  generateGroupPostContent(listing: CarListing, groupId: string): string {
    const group = ALBANIAN_CAR_GROUPS.find(g => g.id === groupId)
    const baseContent = this.generateListingContent(listing)

    // Customize content based on group
    const groupSpecificIntro = {
      'autoshqiperia': '🔥 OKAZION I MIRË! 🔥',
      'automarket_albania': '🚗 E RE NË TREG! 🚗',
      'auto_kosova': '🇽🇰 PËR KOSOVË 🇽🇰',
      'auto_macedonia': '🇲🇰 MAQEDONI 🇲🇰'
    }

    const intro = groupSpecificIntro[groupId as keyof typeof groupSpecificIntro] || ''

    return [
      intro,
      '',
      baseContent.description,
      '',
      `📱 Kontakt: ${listing.sellerPhone || 'Shiko në AutoMarket'}`,
      '',
      `Grupi: ${group?.name || 'Auto Shqipëria'}`
    ].filter(Boolean).join('\n')
  }

  /**
   * Check if content meets platform requirements
   */
  validateContentForPlatform(content: string, platform: string): {
    valid: boolean
    issues: string[]
    truncatedContent?: string
  } {
    const platformConfig = SOCIAL_PLATFORMS.find(p => p.id === platform)
    const issues: string[] = []
    let truncatedContent: string | undefined

    if (!platformConfig) {
      return { valid: false, issues: ['Platform not supported'] }
    }

    // Check character limit
    if (platformConfig.characterLimit && content.length > platformConfig.characterLimit) {
      issues.push(`Content exceeds ${platformConfig.characterLimit} character limit`)
      truncatedContent = content.substring(0, platformConfig.characterLimit - 3) + '...'
    }

    // Platform-specific validations
    switch (platform) {
      case 'instagram':
        if (content.split('#').length > 30) {
          issues.push('Too many hashtags (max 30 for Instagram)')
        }
        break

      case 'twitter':
        const hashtagCount = (content.match(/#\w+/g) || []).length
        if (hashtagCount > 2) {
          issues.push('Twitter performs better with 1-2 hashtags maximum')
        }
        break

      case 'facebook':
        if (content.includes('bit.ly') || content.includes('tinyurl')) {
          issues.push('Facebook may reduce reach for posts with shortened URLs')
        }
        break
    }

    return {
      valid: issues.length === 0,
      issues,
      truncatedContent
    }
  }

  /**
   * Generate share analytics tracking
   */
  generateShareAnalytics(listingId: string, platform: string, userId?: string) {
    return {
      listingId,
      platform,
      userId,
      timestamp: new Date().toISOString(),
      type: 'social_share',
      metadata: {
        platform,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined
      }
    }
  }

  /**
   * Get popular sharing times for Albanian audience
   */
  getOptimalSharingTimes(): {
    platform: string
    bestTimes: { day: string; hours: number[] }[]
  }[] {
    return [
      {
        platform: 'facebook',
        bestTimes: [
          { day: 'monday', hours: [9, 14, 20] },
          { day: 'wednesday', hours: [11, 15, 19] },
          { day: 'friday', hours: [10, 15, 21] },
          { day: 'sunday', hours: [12, 16, 20] }
        ]
      },
      {
        platform: 'instagram',
        bestTimes: [
          { day: 'tuesday', hours: [11, 14, 17] },
          { day: 'wednesday', hours: [10, 13, 19] },
          { day: 'thursday', hours: [12, 15, 18] },
          { day: 'saturday', hours: [10, 14, 16] }
        ]
      },
      {
        platform: 'whatsapp',
        bestTimes: [
          { day: 'everyday', hours: [8, 12, 18, 21] }
        ]
      }
    ]
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
      'MK': 'Maqedoni e Veriut'
    }
    return countries[countryCode as keyof typeof countries] || countryCode
  }

  private translateFuelType(fuelType: string): string {
    const translations = {
      'gasoline': 'Benzinë',
      'diesel': 'Nafte',
      'electric': 'Elektrik',
      'hybrid': 'Hibrid',
      'lpg': 'LPG',
      'natural_gas': 'Gaz Natyror'
    }
    return translations[fuelType.toLowerCase() as keyof typeof translations] || fuelType
  }

  private translateTransmission(transmission: string): string {
    const translations = {
      'manual': 'Manual',
      'automatic': 'Automatik',
      'semi_automatic': 'Gjysmë-automatik'
    }
    return translations[transmission.toLowerCase() as keyof typeof translations] || transmission
  }
}

export const socialSharingService = SocialSharingService.getInstance()

// React hook for social sharing
export function useSocialSharing() {
  return {
    platforms: SOCIAL_PLATFORMS,
    groups: ALBANIAN_CAR_GROUPS,
    generateContent: socialSharingService.generateListingContent.bind(socialSharingService),
    generateShareUrl: socialSharingService.generateShareUrl.bind(socialSharingService),
    generateFacebookMarketplacePost: socialSharingService.generateFacebookMarketplacePost.bind(socialSharingService),
    generateInstagramStoryContent: socialSharingService.generateInstagramStoryContent.bind(socialSharingService),
    generateGroupPostContent: socialSharingService.generateGroupPostContent.bind(socialSharingService),
    validateContent: socialSharingService.validateContentForPlatform.bind(socialSharingService),
    generateAnalytics: socialSharingService.generateShareAnalytics.bind(socialSharingService),
    getOptimalTimes: socialSharingService.getOptimalSharingTimes.bind(socialSharingService)
  }
}