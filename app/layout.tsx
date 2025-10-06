import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Navigation } from '../components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AutoMarket - Gjeni Makinën Tuaj të Përkryer',
  description: 'Tregu shqiptar i automjeteve - Blini dhe shisni makina lehtë dhe në mënyrë të sigurt',
  keywords: 'makina, automobil, blerje, shitje, Shqipëri, Kosovë, Maqedoni, tregtar, BMW, Audi, Mercedes, Volkswagen',
  openGraph: {
    title: 'AutoMarket - Gjeni Makinën Tuaj të Përkryer',
    description: 'Tregu shqiptar i automjeteve - Blini dhe shisni makina lehtë dhe në mënyrë të sigurt',
    type: 'website',
    locale: 'sq_AL',
    siteName: 'AutoMarket'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoMarket - Gjeni Makinën Tuaj të Përkryer',
    description: 'Tregu shqiptar i automjeteve - Blini dhe shisni makina lehtë dhe në mënyrë të sigurt'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sq">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <Navigation />

            <main className="flex-1">
              {children}
            </main>

            <footer className="bg-gray-900 text-white py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">AutoMarket</h3>
                  <p className="text-gray-400 mb-4">Tregu juaj i besuar i automjeteve</p>
                  <div className="flex justify-center space-x-6">
                    <a href="/privacy" className="text-gray-400 hover:text-white">Privatësia</a>
                    <a href="/terms" className="text-gray-400 hover:text-white">Kushtet</a>
                    <a href="/support" className="text-gray-400 hover:text-white">Mbështetja</a>
                  </div>
                  <p className="text-gray-500 text-sm mt-4">
                    © 2024 AutoMarket. Të gjitha të drejtat të rezervuara.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}