import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AutoMarket - Find Your Perfect Car',
  description: 'European automotive marketplace - Buy and sell cars easily',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-blue-600">AutoMarket</h1>
                  </div>
                  <div className="hidden md:flex space-x-8">
                    <a href="/" className="text-gray-900 hover:text-blue-600">Home</a>
                    <a href="/listings" className="text-gray-900 hover:text-blue-600">Browse Cars</a>
                    <a href="/sell" className="text-gray-900 hover:text-blue-600">Sell Your Car</a>
                    <a href="/contact" className="text-gray-900 hover:text-blue-600">Contact</a>
                  </div>
                </div>
              </div>
            </nav>

            <main className="flex-1">
              {children}
            </main>

            <footer className="bg-gray-900 text-white py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">AutoMarket</h3>
                  <p className="text-gray-400 mb-4">Your trusted automotive marketplace</p>
                  <div className="flex justify-center space-x-6">
                    <a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a>
                    <a href="/terms" className="text-gray-400 hover:text-white">Terms</a>
                    <a href="/support" className="text-gray-400 hover:text-white">Support</a>
                  </div>
                  <p className="text-gray-500 text-sm mt-4">
                    © 2024 AutoMarket. All rights reserved.
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