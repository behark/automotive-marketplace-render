'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export const dynamic = 'force-dynamic'

interface SubscriptionInfo {
  currentPlan: string
  subscriptionStatus: string
  subscription: any
  availablePlans: any
}

export default function PricingPage() {
  const { data: session, status } = useSession()
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscriptionInfo()
    }
  }, [status])

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/payments/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionInfo(data)
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error)
    }
  }

  const handleSubscribe = async (plan: string) => {
    if (status !== 'authenticated') {
      window.location.href = '/auth/signin'
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/payments/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create subscription')
      }

      const { checkoutUrl } = await response.json()
      window.location.href = checkoutUrl

    } catch (error) {
      console.error('Error creating subscription:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to start subscription'}`)
    } finally {
      setLoading(false)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for casual sellers',
      features: [
        '5 active listings',
        'Basic listing features',
        'Standard support',
        'Basic search visibility'
      ],
      limitations: [
        'No featured placement',
        'Limited photos per listing',
        'No advanced analytics'
      ],
      buttonText: 'Current Plan',
      buttonClass: 'bg-gray-100 text-gray-700 cursor-default'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 29,
      period: 'month',
      description: 'For serious car sellers',
      features: [
        '50 active listings',
        'Featured listing options',
        'Advanced analytics',
        'Priority support',
        'Enhanced search visibility',
        'Multiple photo uploads',
        'Price suggestions'
      ],
      popular: true,
      buttonText: 'Upgrade to Premium',
      buttonClass: 'bg-blue-600 text-white hover:bg-blue-700'
    },
    {
      id: 'dealer',
      name: 'Dealer',
      price: 99,
      period: 'month',
      description: 'For professional dealers',
      features: [
        'Unlimited listings',
        'Dealer badge & verification',
        'Bulk upload tools',
        'Advanced dealer dashboard',
        'Lead management system',
        'Custom branding options',
        'API access',
        'Dedicated account manager'
      ],
      buttonText: 'Become a Dealer',
      buttonClass: 'bg-green-600 text-white hover:bg-green-700'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get the tools you need to sell cars successfully. Upgrade anytime and scale as your business grows.
          </p>

          {subscriptionInfo && (
            <div className="mt-6 inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-blue-700">
                Current plan: <strong>{subscriptionInfo.currentPlan}</strong>
                {subscriptionInfo.subscription?.cancelAtPeriodEnd && (
                  <span className="text-red-600 ml-2">(Canceling at period end)</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = subscriptionInfo?.currentPlan === plan.id

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-blue-500 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 text-sm font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 mt-2">{plan.description}</p>

                    <div className="mt-6">
                      <span className="text-4xl font-bold text-gray-900">
                        €{plan.price}
                      </span>
                      {plan.period !== 'forever' && (
                        <span className="text-gray-600">/{plan.period}</span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-500 mb-2">Limitations:</p>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-4 h-4 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-sm text-gray-600">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8">
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrentPlan || loading || plan.id === 'free'}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isCurrentPlan || plan.id === 'free'
                          ? plan.buttonClass
                          : loading
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : plan.buttonClass
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        plan.buttonText
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>

            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">What happens if I cancel?</h4>
              <p className="text-gray-600">
                Your plan remains active until the end of your billing period. After that, you'll be downgraded to the free plan.
              </p>
            </div>

            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
              <p className="text-gray-600">
                We offer a 14-day money-back guarantee for all paid plans if you're not satisfied with our service.
              </p>
            </div>

            <div className="text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Is there a setup fee?</h4>
              <p className="text-gray-600">
                No setup fees! You only pay the monthly subscription price. Start selling immediately after upgrading.
              </p>
            </div>
          </div>
        </div>

        {/* Contact for Enterprise */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Need a Custom Solution?</h3>
          <p className="text-blue-100 mb-6">
            Large dealerships and enterprise customers can get custom pricing and features.
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  )
}