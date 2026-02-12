'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { BookOpen } from 'lucide-react'
import { useState } from 'react'

export default function BlogPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20 sm:pt-24 lg:pt-24">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="h-16 w-16 text-primary-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-lg text-gray-600 mb-8">
            Stay updated with the latest fashion trends, styling tips, and news from our blog.
          </p>
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
            <p className="text-gray-500">
              Our blog is coming soon! Check back later for exciting content about fashion, trends, and style inspiration.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

