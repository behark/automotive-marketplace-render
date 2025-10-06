export interface AlbanianBank {
  id: string
  name: string
  nameAlbanian: string
  swiftCode: string
  logo: string
  color: string
  supportedCurrencies: string[]
  onlineBanking: boolean
  mobileBanking: boolean
  qrPayments: boolean
  instantTransfers: boolean
  website: string
}

export interface PaymentMethod {
  id: string
  name: string
  nameAlbanian: string
  description: string
  icon: string
  processingTime: string
  fees: string
  isInstant: boolean
  requiresVerification: boolean
  supportedCurrencies: string[]
  popularity: number // 1-10 scale
}

// Major Albanian banks
export const ALBANIAN_BANKS: AlbanianBank[] = [
  {
    id: 'bkt',
    name: 'Banka Kombëtare Tregtare',
    nameAlbanian: 'BKT',
    swiftCode: 'NCBAALTX',
    logo: '🏦',
    color: '#0066CC',
    supportedCurrencies: ['ALL', 'EUR', 'USD'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: true,
    instantTransfers: true,
    website: 'https://www.bkt.com.al'
  },
  {
    id: 'raiffeisen',
    name: 'Raiffeisen Bank Albania',
    nameAlbanian: 'Raiffeisen Bank',
    swiftCode: 'SGSBALTX',
    logo: '🏛️',
    color: '#FFD500',
    supportedCurrencies: ['ALL', 'EUR', 'USD'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: true,
    instantTransfers: true,
    website: 'https://www.raiffeisen.al'
  },
  {
    id: 'intesa',
    name: 'Intesa Sanpaolo Bank Albania',
    nameAlbanian: 'Intesa Sanpaolo',
    swiftCode: 'IISQALTX',
    logo: '🏦',
    color: '#0033A0',
    supportedCurrencies: ['ALL', 'EUR'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: true,
    instantTransfers: true,
    website: 'https://www.intesasanpaolobank.al'
  },
  {
    id: 'alpha_bank',
    name: 'Alpha Bank Albania',
    nameAlbanian: 'Alpha Bank',
    swiftCode: 'ALBAAL22',
    logo: '🏛️',
    color: '#E31E24',
    supportedCurrencies: ['ALL', 'EUR'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: false,
    instantTransfers: true,
    website: 'https://www.alphabank.al'
  },
  {
    id: 'credins',
    name: 'Credins Bank',
    nameAlbanian: 'Credins Bank',
    swiftCode: 'CREDALTX',
    logo: '🏦',
    color: '#FF6B00',
    supportedCurrencies: ['ALL', 'EUR'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: false,
    instantTransfers: false,
    website: 'https://www.credins.al'
  },
  {
    id: 'otp_bank',
    name: 'OTP Bank Albania',
    nameAlbanian: 'OTP Bank',
    swiftCode: 'OTPVALTX',
    logo: '🏛️',
    color: '#00A651',
    supportedCurrencies: ['ALL', 'EUR'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: false,
    instantTransfers: false,
    website: 'https://www.otpbank.al'
  },
  {
    id: 'procredit',
    name: 'ProCredit Bank Albania',
    nameAlbanian: 'ProCredit Bank',
    swiftCode: 'PBNKALTX',
    logo: '🏦',
    color: '#009639',
    supportedCurrencies: ['ALL', 'EUR'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: false,
    instantTransfers: false,
    website: 'https://www.procreditbank.al'
  },
  {
    id: 'first_investment',
    name: 'First Investment Bank Albania',
    nameAlbanian: 'FIBank Albania',
    swiftCode: 'FINVALTX',
    logo: '🏛️',
    color: '#1F4E79',
    supportedCurrencies: ['ALL', 'EUR'],
    onlineBanking: true,
    mobileBanking: true,
    qrPayments: false,
    instantTransfers: false,
    website: 'https://www.fibank.al'
  }
]

// Albanian payment methods
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    nameAlbanian: 'Transfer Bankar',
    description: 'Transfer i drejtpërdrejtë nga llogaria juaj bankare',
    icon: '🏦',
    processingTime: '1-3 ditë pune',
    fees: 'Pa pagesë ose tarifa të ulëta',
    isInstant: false,
    requiresVerification: true,
    supportedCurrencies: ['ALL', 'EUR'],
    popularity: 9
  },
  {
    id: 'cash',
    name: 'Cash Payment',
    nameAlbanian: 'Pagesë në Dorë',
    description: 'Pagesë me para fizike gjatë takimit',
    icon: '💵',
    processingTime: 'Menjëherë',
    fees: 'Pa pagesë',
    isInstant: true,
    requiresVerification: false,
    supportedCurrencies: ['ALL', 'EUR'],
    popularity: 10
  },
  {
    id: 'mobile_banking',
    name: 'Mobile Banking',
    nameAlbanian: 'Mobile Banking',
    description: 'Pagesë përmes aplikacionit të bankës në telefon',
    icon: '📱',
    processingTime: 'Menjëherë deri 30 minuta',
    fees: 'Tarinat e bankës',
    isInstant: true,
    requiresVerification: true,
    supportedCurrencies: ['ALL', 'EUR'],
    popularity: 8
  },
  {
    id: 'qr_payment',
    name: 'QR Code Payment',
    nameAlbanian: 'Pagesë me QR Kod',
    description: 'Skanimi i QR kodit për pagesë të shpejtë',
    icon: '📲',
    processingTime: 'Menjëherë',
    fees: 'Tarinat e bankës',
    isInstant: true,
    requiresVerification: true,
    supportedCurrencies: ['ALL', 'EUR'],
    popularity: 7
  },
  {
    id: 'western_union',
    name: 'Western Union',
    nameAlbanian: 'Western Union',
    description: 'Transfer ndërkombëtar përmes Western Union',
    icon: '🌍',
    processingTime: '15 minuta - 1 orë',
    fees: 'Tarifa sipas shumës',
    isInstant: false,
    requiresVerification: true,
    supportedCurrencies: ['ALL', 'EUR', 'USD'],
    popularity: 6
  },
  {
    id: 'moneygram',
    name: 'MoneyGram',
    nameAlbanian: 'MoneyGram',
    description: 'Transfer ndërkombëtar përmes MoneyGram',
    icon: '💸',
    processingTime: '10 minuta - 1 orë',
    fees: 'Tarifa sipas shumës',
    isInstant: false,
    requiresVerification: true,
    supportedCurrencies: ['ALL', 'EUR', 'USD'],
    popularity: 5
  },
  {
    id: 'installments',
    name: 'Installment Payment',
    nameAlbanian: 'Pagesë në Këste',
    description: 'Ndarje e pagesës në këste mujore',
    icon: '📅',
    processingTime: 'Sipas marrëveshjes',
    fees: 'Interes i ulët ose pa interes',
    isInstant: false,
    requiresVerification: true,
    supportedCurrencies: ['ALL', 'EUR'],
    popularity: 8
  },
  {
    id: 'escrow',
    name: 'Escrow Service',
    nameAlbanian: 'Shërbim Garancie',
    description: 'Paratë mbahen nga një palë e tretë deri në përfundim të transaksionit',
    icon: '🛡️',
    processingTime: '1-7 ditë',
    fees: '2-5% e shumës',
    isInstant: false,
    requiresVerification: true,
    supportedCurrencies: ['ALL', 'EUR'],
    popularity: 6
  }
]

// Mobile payment providers in Albania
export const MOBILE_PAYMENT_PROVIDERS = [
  {
    id: 'bkt_smart',
    name: 'BKT Smart',
    bank: 'bkt',
    description: 'Aplikacioni mobil i BKT për pagesa',
    downloadUrl: 'https://play.google.com/store/apps/details?id=al.bkt.smart'
  },
  {
    id: 'raiffeisen_smart',
    name: 'Raiffeisen SMART Mobile',
    bank: 'raiffeisen',
    description: 'Mobile banking i Raiffeisen Bank',
    downloadUrl: 'https://play.google.com/store/apps/details?id=at.rbmm.android'
  },
  {
    id: 'intesa_mobile',
    name: 'Intesa Mobile Banking',
    bank: 'intesa',
    description: 'Aplikacioni mobil i Intesa Sanpaolo',
    downloadUrl: 'https://play.google.com/store/apps/details?id=al.intesa.mobile'
  }
]

class AlbanianPaymentService {
  private static instance: AlbanianPaymentService

  private constructor() {}

  static getInstance(): AlbanianPaymentService {
    if (!AlbanianPaymentService.instance) {
      AlbanianPaymentService.instance = new AlbanianPaymentService()
    }
    return AlbanianPaymentService.instance
  }

  /**
   * Get all available payment methods
   */
  getPaymentMethods(): PaymentMethod[] {
    return PAYMENT_METHODS.sort((a, b) => b.popularity - a.popularity)
  }

  /**
   * Get payment methods by criteria
   */
  getPaymentMethodsByCriteria(criteria: {
    isInstant?: boolean
    currency?: string
    maxFees?: number
    requiresVerification?: boolean
  }): PaymentMethod[] {
    return PAYMENT_METHODS.filter(method => {
      if (criteria.isInstant !== undefined && method.isInstant !== criteria.isInstant) {
        return false
      }
      if (criteria.currency && !method.supportedCurrencies.includes(criteria.currency)) {
        return false
      }
      if (criteria.requiresVerification !== undefined && method.requiresVerification !== criteria.requiresVerification) {
        return false
      }
      return true
    }).sort((a, b) => b.popularity - a.popularity)
  }

  /**
   * Get all Albanian banks
   */
  getBanks(): AlbanianBank[] {
    return ALBANIAN_BANKS
  }

  /**
   * Get bank by ID
   */
  getBank(bankId: string): AlbanianBank | undefined {
    return ALBANIAN_BANKS.find(bank => bank.id === bankId)
  }

  /**
   * Generate bank transfer instructions
   */
  generateBankTransferInstructions(
    bank: AlbanianBank,
    recipientName: string,
    amount: number,
    currency: string,
    reference?: string
  ): string {
    const formatAmount = (amount: number, currency: string) => {
      if (currency === 'ALL') {
        return new Intl.NumberFormat('sq-AL').format(amount) + ' ALL'
      }
      return new Intl.NumberFormat('sq-AL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }

    return [
      `💰 UDHËZIME PËR TRANSFER BANKAR`,
      ``,
      `🏦 Banka: ${bank.nameAlbanian}`,
      `👤 Përfituesi: ${recipientName}`,
      `💵 Shuma: ${formatAmount(amount, currency)}`,
      `💱 Monedha: ${currency}`,
      `📝 Referenca: ${reference || 'Blerje automjeti'}`,
      ``,
      `📋 HAPAT:`,
      `1. Hyni në online banking ose aplikacionin mobil`,
      `2. Zgjidhni "Transfer i ri" ose "Pagesë"`,
      `3. Shtoni të dhënat e përfituesit`,
      `4. Vendosni shumën dhe referencën`,
      `5. Konfirmoni transferin`,
      ``,
      `⏰ Koha e procesimit: ${this.getProcessingTime(bank)}`,
      `💸 Tarifa: Kontrollo me bankën tënde`,
      ``,
      `📞 Për ndihmë: ${bank.website}`,
      ``,
      `⚠️ KUJDES: Sigurohu që të dhënat janë të sakta para konfirmimit!`
    ].join('\n')
  }

  /**
   * Generate QR code payment instructions
   */
  generateQRPaymentInstructions(amount: number, currency: string, reference: string): {
    qrData: string
    instructions: string
  } {
    // In a real implementation, this would generate actual QR code data
    const qrData = `PAY:${amount}:${currency}:${reference}:${Date.now()}`

    const instructions = [
      `📲 PAGESË ME QR KOD`,
      ``,
      `1. Hap aplikacionin e bankës në telefon`,
      `2. Zgjedh "Pago me QR" ose "Skano QR"`,
      `3. Skano kodin e mëposhtëm`,
      `4. Kontrollo shumën dhe detajet`,
      `5. Konfirmo pagesën`,
      ``,
      `💰 Shuma: ${this.formatAmount(amount, currency)}`,
      `📝 Referenca: ${reference}`,
      ``,
      `⚡ Pagesa do të processohet menjëherë`,
      `✅ Do të marrësh konfirmim në SMS/email`
    ].join('\n')

    return { qrData, instructions }
  }

  /**
   * Generate cash payment safety instructions
   */
  generateCashPaymentInstructions(amount: number, currency: string, location?: string): string {
    return [
      `💵 UDHËZIME PËR PAGESË NË DORË`,
      ``,
      `💰 Shuma: ${this.formatAmount(amount, currency)}`,
      `📍 Vendi: ${location || 'Do të caktohet'}`,
      ``,
      `🛡️ MASA SIGURIE:`,
      `✅ Takohuni në vende publike dhe të sigurta`,
      `✅ Merrni dikë me vete si dëshmitar`,
      `✅ Takohuni gjatë ditës`,
      `✅ Njoftoni dikë për vendodhjen`,
      `✅ Numëroni paratë përpara marrjes së makinës`,
      `✅ Kërkoni faturë ose dëshmi pagese`,
      ``,
      `📋 DOKUMENTET E NEVOJSHME:`,
      `• ID/Pasaportë`,
      `• Kontratë shitjeje (nëse ka)`,
      `• Dokumente të makinës`,
      `• Dëshmi e pronësisë`,
      ``,
      `🚨 VENDE TË REKOMANDUARA:`,
      `• Banka (para hyrjes)`,
      `• Qendra tregtare të mëdha`,
      `• Komisariatet e policisë`,
      `• Sheshe publike me kamera`,
      ``,
      `📞 Numri i emergjencës: 112`
    ].join('\n')
  }

  /**
   * Generate installment payment plan
   */
  generateInstallmentPlan(
    totalAmount: number,
    currency: string,
    numberOfInstallments: number,
    interestRate: number = 0
  ): {
    monthlyPayment: number
    totalWithInterest: number
    schedule: Array<{
      month: number
      amount: number
      principal: number
      interest: number
      balance: number
    }>
  } {
    const monthlyInterestRate = interestRate / 12 / 100
    const monthlyPayment = monthlyInterestRate > 0
      ? totalAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfInstallments)) / (Math.pow(1 + monthlyInterestRate, numberOfInstallments) - 1)
      : totalAmount / numberOfInstallments

    let remainingBalance = totalAmount
    const schedule = []

    for (let month = 1; month <= numberOfInstallments; month++) {
      const interestPayment = remainingBalance * monthlyInterestRate
      const principalPayment = monthlyPayment - interestPayment
      remainingBalance -= principalPayment

      schedule.push({
        month,
        amount: Math.round(monthlyPayment),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.max(0, Math.round(remainingBalance))
      })
    }

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalWithInterest: Math.round(monthlyPayment * numberOfInstallments),
      schedule
    }
  }

  /**
   * Validate Albanian IBAN
   */
  validateAlbanianIBAN(iban: string): { valid: boolean; bank?: AlbanianBank; error?: string } {
    // Remove spaces and convert to uppercase
    const cleanIban = iban.replace(/\s/g, '').toUpperCase()

    // Check if it's Albanian IBAN (starts with AL)
    if (!cleanIban.startsWith('AL')) {
      return { valid: false, error: 'IBAN duhet të fillojë me AL' }
    }

    // Check length (Albanian IBAN is 28 characters)
    if (cleanIban.length !== 28) {
      return { valid: false, error: 'IBAN shqiptar duhet të ketë 28 karaktere' }
    }

    // Extract bank code
    const bankCode = cleanIban.substring(4, 7)

    // Find bank by code patterns
    const bankMapping: Record<string, string> = {
      '212': 'bkt',
      '207': 'raiffeisen',
      '209': 'intesa',
      '201': 'alpha_bank',
      '203': 'credins',
      '208': 'otp_bank',
      '205': 'procredit',
      '210': 'first_investment'
    }

    const bankId = bankMapping[bankCode]
    const bank = bankId ? this.getBank(bankId) : undefined

    // Basic IBAN checksum validation would go here
    // For now, we'll consider it valid if bank is found
    return {
      valid: !!bank,
      bank,
      error: !bank ? 'Kodi i bankës nuk është i njohur' : undefined
    }
  }

  /**
   * Get payment security tips
   */
  getPaymentSecurityTips(): string[] {
    return [
      '🛡️ Mos ndani asnjëherë të dhënat e kartës ose llogarisë bankare',
      '🔍 Verifikoni identitetin e blerësit/shitësit para pagesës',
      '💰 Për shuma të mëdha, përdorni shërbim garancie (escrow)',
      '📱 Përdorni aplikacione të sigurta të bankave për pagesa',
      '🏦 Kryeni transferet në degët e bankave për siguri maksimale',
      '📝 Mbani gjurmë të gjitha transaksioneve',
      '🚨 Raportoni veprimtari të dyshimta në polici',
      '💡 Mos u nxitoni - mashtrimet shpesh përdorin presionin kohor',
      '👥 Kërkoni rekomandime për shitësit/blerësit e panjohur',
      '📞 Verifikoni me bankat për transfere të mëdha'
    ]
  }

  private getProcessingTime(bank: AlbanianBank): string {
    if (bank.instantTransfers) {
      return 'Menjëherë deri 30 minuta'
    }
    return '1-3 ditë pune'
  }

  private formatAmount(amount: number, currency: string): string {
    if (currency === 'ALL') {
      return new Intl.NumberFormat('sq-AL').format(amount) + ' ALL'
    }
    return new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
}

export const albanianPaymentService = AlbanianPaymentService.getInstance()

// React hook for Albanian payments
export function useAlbanianPayments() {
  return {
    paymentMethods: albanianPaymentService.getPaymentMethods(),
    banks: albanianPaymentService.getBanks(),
    getBank: albanianPaymentService.getBank.bind(albanianPaymentService),
    getPaymentMethodsByCriteria: albanianPaymentService.getPaymentMethodsByCriteria.bind(albanianPaymentService),
    generateBankTransferInstructions: albanianPaymentService.generateBankTransferInstructions.bind(albanianPaymentService),
    generateQRPaymentInstructions: albanianPaymentService.generateQRPaymentInstructions.bind(albanianPaymentService),
    generateCashPaymentInstructions: albanianPaymentService.generateCashPaymentInstructions.bind(albanianPaymentService),
    generateInstallmentPlan: albanianPaymentService.generateInstallmentPlan.bind(albanianPaymentService),
    validateAlbanianIBAN: albanianPaymentService.validateAlbanianIBAN.bind(albanianPaymentService),
    getPaymentSecurityTips: albanianPaymentService.getPaymentSecurityTips.bind(albanianPaymentService)
  }
}