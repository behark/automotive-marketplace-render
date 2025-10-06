import SellerPerformanceDashboard from '../../../components/analytics/seller-performance-dashboard'

export const metadata = {
  title: 'Paneli i Performancës së Shitësit - AutoMarket Albania',
  description: 'Analizoni performancën tuaj në tregun automobilistik shqiptar me analiza të detajuara dhe krahasime me tregun.',
}

export default function SellerPerformancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SellerPerformanceDashboard />
      </div>
    </div>
  )
}