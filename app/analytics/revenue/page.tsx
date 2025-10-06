import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import RevenueAnalyticsDashboard from '../../../components/analytics/revenue-analytics-dashboard'

export const metadata = {
  title: 'Analiza e Të Ardhurave - AutoMarket Albania',
  description: 'Analizoni të ardhurat, taksat dhe prognozat financiare sipas ligjeve shqiptare.',
}

export default async function RevenueAnalyticsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RevenueAnalyticsDashboard />
      </div>
    </div>
  )
}