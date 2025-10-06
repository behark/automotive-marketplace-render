import DealerSuccessCenter from '../../../components/analytics/dealer-success-center'

export const metadata = {
  title: 'Qendra e Suksesit të Dealerit - AutoMarket Albania',
  description: 'Menaxhoni dhe optimizoni performancën e dealership tuaj me analiza të thella për tregun shqiptar.',
}

export default function DealerSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DealerSuccessCenter />
      </div>
    </div>
  )
}