'use client'

import { useState, useRef } from 'react'
import { CreditCard, Smartphone, Banknote, Shield, Copy, Check, Calculator, AlertTriangle, Info } from 'lucide-react'
import { useAlbanianPayments, type PaymentMethod, type AlbanianBank } from '../lib/albanian-payments'
import { useCurrency } from '../lib/currency'

interface AlbanianPaymentOptionsProps {
  amount: number
  currency: string
  recipientName: string
  listingTitle: string
  onPaymentMethodSelect: (method: PaymentMethod) => void
  className?: string
}

export function AlbanianPaymentOptions({
  amount,
  currency,
  recipientName,
  listingTitle,
  onPaymentMethodSelect,
  className = ""
}: AlbanianPaymentOptionsProps) {
  const {
    paymentMethods,
    banks,
    getPaymentMethodsByCriteria,
    generateBankTransferInstructions,
    generateCashPaymentInstructions,
    generateQRPaymentInstructions,
    generateInstallmentPlan,
    getPaymentSecurityTips
  } = useAlbanianPayments()

  const { formatPrice } = useCurrency()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [copiedText, setCopiedText] = useState(false)
  const [installmentMonths, setInstallmentMonths] = useState(12)
  const instructionsRef = useRef<HTMLDivElement>(null)

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method.id)
    onPaymentMethodSelect(method)

    // Show instructions for certain payment methods
    if (['bank_transfer', 'qr_payment', 'cash', 'installments'].includes(method.id)) {
      setShowInstructions(true)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getInstructions = (): string => {
    if (!selectedMethod) return ''

    switch (selectedMethod) {
      case 'bank_transfer':
        if (!selectedBank) return 'Zgjedh bankën për udhëzime të detajuara'
        const bank = banks.find(b => b.id === selectedBank)
        if (!bank) return ''
        return generateBankTransferInstructions(bank, recipientName, amount, currency, `Blerje: ${listingTitle}`)

      case 'cash':
        return generateCashPaymentInstructions(amount, currency)

      case 'qr_payment':
        const qrInstructions = generateQRPaymentInstructions(amount, currency, `Blerje: ${listingTitle}`)
        return qrInstructions.instructions

      case 'installments':
        const plan = generateInstallmentPlan(amount, currency, installmentMonths, 5) // 5% interest
        return [
          `📅 PLANI I PAGESËS NË KËSTE`,
          ``,
          `💰 Shuma totale: ${formatPrice(amount, currency as any)}`,
          `📊 Numri i kësteve: ${installmentMonths} muaj`,
          `💳 Kësti mujor: ${formatPrice(plan.monthlyPayment, currency as any)}`,
          `💵 Totali me interes: ${formatPrice(plan.totalWithInterest, currency as any)}`,
          ``,
          `📋 GRAFIKU I PAGESAVE:`,
          ...plan.schedule.slice(0, 3).map(payment =>
            `Muaji ${payment.month}: ${formatPrice(payment.amount, currency as any)}`
          ),
          plan.schedule.length > 3 ? '...' : '',
          ``,
          `📞 Kontakto shitësin për detaje të marrëveshjes`
        ].join('\n')

      default:
        return ''
    }
  }

  const getMethodIcon = (methodId: string) => {
    const icons = {
      bank_transfer: <CreditCard className="w-5 h-5" />,
      mobile_banking: <Smartphone className="w-5 h-5" />,
      qr_payment: <Smartphone className="w-5 h-5" />,
      cash: <Banknote className="w-5 h-5" />,
      installments: <Calculator className="w-5 h-5" />,
      escrow: <Shield className="w-5 h-5" />
    }
    return icons[methodId as keyof typeof icons] || <CreditCard className="w-5 h-5" />
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mundësi Pagese</h3>
          <p className="text-sm text-gray-500">Zgjedh mënyrën e pagesës për {formatPrice(amount, currency as any)}</p>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            className={`p-4 border rounded-lg text-left transition-colors hover:border-blue-500 hover:bg-blue-50 ${
              selectedMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${selectedMethod === method.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {getMethodIcon(method.id)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{method.nameAlbanian}</h4>
                <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    method.isInstant ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {method.isInstant ? '⚡ Menjëherë' : `⏰ ${method.processingTime}`}
                  </span>
                  <span className="text-xs text-gray-500">{method.fees}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bank Selection for Bank Transfer */}
      {selectedMethod === 'bank_transfer' && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Zgjedh Bankën</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {banks.map((bank) => (
              <button
                key={bank.id}
                onClick={() => setSelectedBank(bank.id)}
                className={`p-3 border rounded-lg text-center transition-colors hover:border-blue-500 ${
                  selectedBank === bank.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="text-lg mb-1">{bank.logo}</div>
                <div className="text-xs font-medium text-gray-900">{bank.nameAlbanian}</div>
                {bank.qrPayments && (
                  <div className="text-xs text-green-600 mt-1">📱 QR</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Installment Options */}
      {selectedMethod === 'installments' && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Zgjedh Numrin e Kësteve</h4>
          <div className="flex space-x-2">
            {[6, 12, 18, 24, 36].map((months) => (
              <button
                key={months}
                onClick={() => setInstallmentMonths(months)}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  installmentMonths === months ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {months} muaj
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {showInstructions && selectedMethod && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Udhëzime Pagese</h4>
            <button
              onClick={() => copyToClipboard(getInstructions())}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Kopjuar!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopjo</span>
                </>
              )}
            </button>
          </div>

          <div
            ref={instructionsRef}
            className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto"
          >
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {getInstructions()}
            </pre>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">Këshilla Sigurie</h4>
            <div className="space-y-1">
              {getPaymentSecurityTips().slice(0, 4).map((tip, index) => (
                <p key={index} className="text-sm text-yellow-800">{tip}</p>
              ))}
            </div>
            <button className="text-sm text-yellow-600 hover:text-yellow-700 mt-2 font-medium">
              Shfaq më shumë këshilla →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact payment method selector for listing pages
export function PaymentMethodSelector({
  onMethodSelect,
  selectedMethods = [],
  className = ""
}: {
  onMethodSelect: (methods: string[]) => void
  selectedMethods?: string[]
  className?: string
}) {
  const { paymentMethods } = useAlbanianPayments()

  const handleToggle = (methodId: string) => {
    const newMethods = selectedMethods.includes(methodId)
      ? selectedMethods.filter(id => id !== methodId)
      : [...selectedMethods, methodId]

    onMethodSelect(newMethods)
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Mundësi Pagese të Pranuara
      </label>
      <div className="space-y-2">
        {paymentMethods.map((method) => (
          <label key={method.id} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedMethods.includes(method.id)}
              onChange={() => handleToggle(method.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">{method.nameAlbanian}</span>
            {method.isInstant && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                ⚡ Shpejt
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

// Payment verification component
export function PaymentVerification({
  paymentMethod,
  amount,
  currency,
  onVerify,
  className = ""
}: {
  paymentMethod: PaymentMethod
  amount: number
  currency: string
  onVerify: (verified: boolean) => void
  className?: string
}) {
  const { formatPrice } = useCurrency()
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    setIsVerifying(true)

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real implementation, this would verify with the payment provider
    const verified = verificationCode.length >= 6
    onVerify(verified)
    setIsVerifying(false)
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Verifikim Pagese</h3>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p>Për të përfunduar pagesën me <strong>{paymentMethod.nameAlbanian}</strong>, na dërgo kodin e verifikimit.</p>
            <p className="mt-1">Shuma: <strong>{formatPrice(amount, currency as any)}</strong></p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kodi i Verifikimit
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Shkruaj kodin e verifikimit"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Kodi dërgohet nga banka ose shërbimi i pagesës
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={!verificationCode || isVerifying}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isVerifying ? 'Duke verifikuar...' : 'Verifiko Pagesën'}
        </button>
      </div>
    </div>
  )
}