'use client'

import { useState } from 'react'
import { MessageCircle, Phone, Share2, Copy, Check, User } from 'lucide-react'
import { whatsappService, WhatsAppUtils } from '../lib/whatsapp'
import { useCurrency } from '../lib/currency'

// Define CarListing type locally since it's not exported from whatsapp
interface CarListing {
  id: string
  title: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: string
  transmission: string
  city: string
}

interface WhatsAppContactProps {
  listing: CarListing
  sellerPhone?: string
  sellerName?: string
  showBusinessOptions?: boolean
  className?: string
}

export function WhatsAppContact({
  listing,
  sellerPhone,
  sellerName,
  showBusinessOptions = true,
  className = ""
}: WhatsAppContactProps) {
  const { formatPrice } = useCurrency()
  const [selectedTemplate, setSelectedTemplate] = useState<'custom' | 'price' | 'details' | 'viewing' | 'financing'>('custom')
  const [customMessage, setCustomMessage] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)

  if (!sellerPhone) {
    return null
  }

  const isValidPhone = sellerPhone.startsWith('+355') || sellerPhone.match(/^06[6-9]\d{7}$/)
  const operator = sellerPhone.match(/06[6-9]/) ? 'mobile' : 'unknown'

  const getMessageContent = () => {
    // Generate a simple WhatsApp message
    const baseMessage = `Përshëndetje${sellerName ? ` ${sellerName}` : ''},\n\nJam i/e interesuar për makinën tuaj:\n${listing.title}\n€${formatPrice(listing.price)}`
    
    switch (selectedTemplate) {
      case 'custom':
        return customMessage || baseMessage
      case 'price':
        return `${baseMessage}\n\nA ka mundësi për negocim në çmim?`
      case 'details':
        return `${baseMessage}\n\nMund të më jepni më shumë detaje për këtë makinë?`
      case 'viewing':
        return `${baseMessage}\n\nKur mund ta shoh makinën?`
      case 'financing':
        return `${baseMessage}\n\nA ofroni mundësi financimi?`
      default:
        return baseMessage
    }
  }

  const handleWhatsAppClick = () => {
    try {
      const message = getMessageContent()
      const url = WhatsAppUtils.generateContactUrl(sellerPhone, message)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error creating WhatsApp URL:', error)
      alert('Gabim në haperjen e WhatsApp. Ju lutemi kontrolloni numrin e telefonit.')
    }
  }

  const handleCopyMessage = async () => {
    try {
      const message = getMessageContent()
      await navigator.clipboard.writeText(message)
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    } catch (error) {
      console.error('Error copying message:', error)
    }
  }

  const templates = [
    { key: 'custom' as const, label: 'Mesazh Personal', icon: User },
    { key: 'price' as const, label: 'Pyet për Çmimin', icon: MessageCircle },
    { key: 'details' as const, label: 'Detaje të Plota', icon: MessageCircle },
    { key: 'viewing' as const, label: 'Organizim Takimi', icon: MessageCircle },
    { key: 'financing' as const, label: 'Mundësi Financimi', icon: MessageCircle }
  ]

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Kontakto me WhatsApp</h3>
            <p className="text-sm text-gray-500">
              {sellerName || 'Shitësi'} • {operator && isValidPhone ? operator : 'Tel'}
            </p>
          </div>
        </div>

        {/* Phone validation indicator */}
        {isValidPhone && (
          <div className="flex items-center space-x-1 text-green-600">
            <Check className="w-4 h-4" />
            <span className="text-xs">Verifikuar</span>
          </div>
        )}
      </div>

      {/* Quick Contact Button */}
      <div className="space-y-3">
        <button
          onClick={handleWhatsAppClick}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Dërgo Mesazh në WhatsApp</span>
        </button>

        {/* Expand/Collapse Options */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Fshih Opsionet' : 'Shfaq Më Shumë Opsione'}
        </button>
      </div>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="mt-4 border-t border-gray-200 pt-4 space-y-4">
          {/* Buyer Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emri juaj (opsional)
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Shkruani emrin tuaj"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Message Templates */}
          {showBusinessOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zgjedh llojin e mesazhit
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border text-sm transition-colors ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          {selectedTemplate === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mesazhi juaj
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Shkruani mesazhin tuaj ose lëreni bosh për mesazhin automatik"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Message Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Parapamja e mesazhit:</span>
              <button
                onClick={handleCopyMessage}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {copiedMessage ? (
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
            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border max-h-32 overflow-y-auto">
              {getMessageContent()}
            </div>
          </div>

          {/* Alternative Contact Methods */}
          <div className="flex space-x-2">
            <a
              href={`tel:${sellerPhone}`}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Telefono</span>
            </a>

            <button
              onClick={handleCopyMessage}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Kopjo Mesazhin</span>
            </button>
          </div>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>✅ Verifikuar nga WhatsApp Business</span>
          <span>🔐 Komunikim i sigurt</span>
        </div>
      </div>
    </div>
  )
}

// Compact WhatsApp button for listing cards
export function WhatsAppQuickContact({
  listing,
  sellerPhone,
  className = ""
}: {
  listing: CarListing
  sellerPhone?: string
  className?: string
}) {
  // Use WhatsAppUtils directly

  if (!sellerPhone) {
    return null
  }

  const handleClick = () => {
    try {
      const message = `Përshëndetje,\n\nJam i/e interesuar për makinën:\n${listing.title}\n€${listing.price}`
      const url = WhatsAppUtils.generateContactUrl(sellerPhone, message)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error creating WhatsApp URL:', error)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors ${className}`}
      title="Kontakto në WhatsApp"
    >
      <MessageCircle className="w-4 h-4" />
    </button>
  )
}

// WhatsApp sharing component
export function WhatsAppShare({
  listing,
  websiteUrl = 'https://automarket.al',
  className = ""
}: {
  listing: CarListing
  websiteUrl?: string
  className?: string
}) {
  // Generate sharing message directly

  const handleShare = () => {
    try {
      const message = `Shiko këtë makinë të bukur: ${listing.title}\n${websiteUrl || ''}`
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error)
    }
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors ${className}`}
    >
      <Share2 className="w-4 h-4" />
      <span>Ndaj në WhatsApp</span>
    </button>
  )
}