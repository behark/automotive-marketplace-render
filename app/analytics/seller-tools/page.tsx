import AdvancedSellerTools from '../../../components/analytics/advanced-seller-tools'

export const metadata = {
  title: 'Mjetet e Avancuara të Shitësit - AutoMarket Albania',
  description: 'Optimizoni listamet tuaja me mjete të avancuara për çmimin, timing, analiza konkurrentësh dhe përmirësime të përshkrimit.',
}

export default function SellerToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdvancedSellerTools />
      </div>
    </div>
  )
}