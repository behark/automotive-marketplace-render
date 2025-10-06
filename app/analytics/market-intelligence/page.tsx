import MarketIntelligenceDashboard from '../../../components/analytics/market-intelligence-dashboard'

export const metadata = {
  title: 'Qendra e Inteligjencës së Tregut - AutoMarket Albania',
  description: 'Zbuloni trendet dhe mundësitë në tregun automobilistik shqiptar me analiza të thella të tregut dhe rekomandime strategjike.',
}

export default function MarketIntelligencePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MarketIntelligenceDashboard />
      </div>
    </div>
  )
}