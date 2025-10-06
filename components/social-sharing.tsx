'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Check, ExternalLink, Clock, Users } from 'lucide-react'
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  TelegramIcon,
  WhatsappIcon
} from 'react-share'
import { useSocialSharing, type CarListing, SOCIAL_PLATFORMS, ALBANIAN_CAR_GROUPS } from '../lib/social-sharing'

interface SocialSharingProps {
  listing: CarListing
  websiteUrl?: string
  showGroups?: boolean
  showAnalytics?: boolean
  className?: string
}

export function SocialSharing({
  listing,
  websiteUrl = 'https://automarket.al',
  showGroups = true,
  showAnalytics = false,
  className = ""
}: SocialSharingProps) {
  const { generateContent, generateShareUrl, generateGroupPostContent, validateContent, generateAnalytics } = useSocialSharing()
  const [shareData, setShareData] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null)
  const [shareCount, setShareCount] = useState(0)

  useEffect(() => {
    const data = generateContent(listing, websiteUrl)
    setShareData(data)
  }, [listing, websiteUrl, generateContent])

  const handleShare = async (platformId: string) => {
    if (!shareData) return

    try {
      const shareUrl = generateShareUrl(platformId, shareData)

      // Track analytics
      if (showAnalytics) {
        const analytics = generateAnalytics(listing.id, platformId)
        // Send to analytics endpoint
        console.log('Share analytics:', analytics)
      }

      // Open share URL
      if (platformId === 'instagram') {
        // Instagram requires special handling
        await copyToClipboard(shareData.description)
        alert('Teksti u kopjua! Hape Instagram dhe ngjit në postim.')
      } else {
        window.open(shareUrl, '_blank', 'width=600,height=400')
      }

      setShareCount(prev => prev + 1)
    } catch (error) {
      console.error('Error sharing:', error)
      alert('Gabim në ndarjen e postimit. Provo përsëri.')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      return false
    }
  }

  const handleCopyContent = async (platformId: string) => {
    if (!shareData) return

    let content = shareData.description

    // Generate platform-specific content
    if (platformId === 'instagram') {
      content = [
        shareData.title,
        '',
        shareData.description,
        '',
        shareData.hashtags?.map((tag: string) => `#${tag}`).join(' ')
      ].join('\n')
    }

    const success = await copyToClipboard(content)
    if (success) {
      setCopiedPlatform(platformId)
      setTimeout(() => setCopiedPlatform(null), 2000)
    }
  }

  const handleGroupShare = async (groupId: string) => {
    const groupContent = generateGroupPostContent(listing, groupId)
    const group = ALBANIAN_CAR_GROUPS.find(g => g.id === groupId)

    const success = await copyToClipboard(groupContent)
    if (success) {
      setCopiedPlatform(groupId)
      setTimeout(() => setCopiedPlatform(null), 2000)

      // Open Facebook group if URL available
      if (group?.url) {
        window.open(group.url, '_blank')
      }
    }
  }

  if (!shareData) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Share2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Ndaj në Rrjetet Sociale</h3>
        </div>
        {shareCount > 0 && (
          <div className="flex items-center space-x-1 text-sm text-green-600">
            <Users className="w-4 h-4" />
            <span>{shareCount} ndarje</span>
          </div>
        )}
      </div>

      {/* Quick Share Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* Facebook */}
        <FacebookShareButton
          url={shareData.url}
          quote={shareData.description}
          className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          onClick={() => handleShare('facebook')}
        >
          <FacebookIcon size={32} round />
          <span className="text-xs mt-1 text-gray-600 group-hover:text-blue-600">Facebook</span>
        </FacebookShareButton>

        {/* WhatsApp */}
        <WhatsappShareButton
          url={shareData.url}
          title={shareData.description}
          className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
          onClick={() => handleShare('whatsapp')}
        >
          <WhatsappIcon size={32} round />
          <span className="text-xs mt-1 text-gray-600 group-hover:text-green-600">WhatsApp</span>
        </WhatsappShareButton>

        {/* Instagram (Copy Content) */}
        <button
          onClick={() => handleCopyContent('instagram')}
          className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors group"
        >
          {copiedPlatform === 'instagram' ? (
            <Check className="w-8 h-8 text-green-600" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📷</span>
            </div>
          )}
          <span className="text-xs mt-1 text-gray-600 group-hover:text-pink-600">
            {copiedPlatform === 'instagram' ? 'Kopjuar!' : 'Instagram'}
          </span>
        </button>

        {/* Telegram */}
        <TelegramShareButton
          url={shareData.url}
          title={shareData.description}
          className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          onClick={() => handleShare('telegram')}
        >
          <TelegramIcon size={32} round />
          <span className="text-xs mt-1 text-gray-600 group-hover:text-blue-600">Telegram</span>
        </TelegramShareButton>
      </div>

      {/* Expand/Collapse Options */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
      >
        {isExpanded ? 'Fshih Opsionet' : 'Shfaq Më Shumë Opsione'}
      </button>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Additional Platforms */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Platforma të tjera</h4>
            <div className="grid grid-cols-2 gap-2">
              <TwitterShareButton
                url={shareData.url}
                title={shareData.title}
                hashtags={shareData.hashtags}
                className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => handleShare('twitter')}
              >
                <TwitterIcon size={20} round />
                <span className="text-sm">Twitter</span>
              </TwitterShareButton>

              <LinkedinShareButton
                url={shareData.url}
                title={shareData.title}
                summary={shareData.description}
                className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors"
                onClick={() => handleShare('linkedin')}
              >
                <LinkedinIcon size={20} round />
                <span className="text-sm">LinkedIn</span>
              </LinkedinShareButton>
            </div>
          </div>

          {/* Albanian Facebook Groups */}
          {showGroups && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Grupe shqiptare në Facebook</h4>
              <div className="space-y-2">
                {ALBANIAN_CAR_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupShare(group.id)}
                    className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="text-left">
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {group.members} • {group.description}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {copiedPlatform === group.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      )}
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Preview */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Parapamja e përmbajtjes</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Tekst për ndarje:</span>
                <button
                  onClick={() => copyToClipboard(shareData.description)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>Kopjo</span>
                </button>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border max-h-40 overflow-y-auto">
                {shareData.description}
              </div>
            </div>
          </div>

          {/* Optimal Timing Tips */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Këshilla për ndarje</span>
            </div>
            <div className="text-sm text-blue-700">
              <p>• Koha më e mirë për Facebook: 9:00-11:00, 14:00-16:00, 19:00-21:00</p>
              <p>• Instagram funksionon më mirë pasdite dhe mbrëmje</p>
              <p>• WhatsApp mund të përdoret gjatë gjithë ditës</p>
              <p>• Grupet në Facebook janë më aktive në mbrëmje</p>
            </div>
          </div>

          {/* Direct Link */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Link i drejtpërdrejtë</h4>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareData.url}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => copyToClipboard(shareData.url)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact social sharing for listing cards
export function SocialShareButton({
  listing,
  size = 'sm',
  className = ""
}: {
  listing: CarListing
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { generateContent, generateShareUrl } = useSocialSharing()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const handleQuickShare = async (platform: string, event: React.MouseEvent) => {
    event.stopPropagation()

    const shareData = generateContent(listing)
    const shareUrl = generateShareUrl(platform, shareData)

    if (platform === 'whatsapp') {
      window.open(shareUrl, '_blank')
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }

    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`${sizeClasses[size]} bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm`}
        title="Ndaj në rrjetet sociale"
      >
        <Share2 className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-2 px-2">Ndaj në:</div>
              <div className="space-y-1">
                <button
                  onClick={(e) => handleQuickShare('facebook', e)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <span>📘</span>
                  <span>Facebook</span>
                </button>
                <button
                  onClick={(e) => handleQuickShare('whatsapp', e)}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    const shareData = generateContent(listing)
                    try {
                      await navigator.clipboard.writeText(shareData.description)
                      alert('Teksti u kopjua!')
                    } catch (error) {
                      console.error('Failed to copy:', error)
                    }
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Copy className="w-4 h-4" />
                  <span>Kopjo Tekstin</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}