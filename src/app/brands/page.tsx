'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Grid, List, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { apiClient, Brand } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const fetchBrands = async () => {
    try {
      setLoading(true)
      setError(null)
      const brandsData = await apiClient.getBrands()
      // Handle both array and paginated response
      const brands = Array.isArray(brandsData) ? brandsData : (brandsData as any).data
      setBrands(brands)
    } catch (err) {
      setError('Failed to fetch brands')
      console.error('Error fetching brands:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-20 sm:pt-24 lg:pt-24">
            <LoadingSpinner />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-20 sm:pt-24 lg:pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchBrands}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      <div className="flex">
        <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-20 sm:pt-24 lg:pt-24">
          {/* Page Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Our Brands
                </h1>
                <p className="text-lg text-gray-600">
                  Discover the fashion houses and designers behind our collections
                </p>
              </motion.div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {brands.length} brands available
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-rose-100 text-rose-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-rose-100 text-rose-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Brands */}
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
            <p className="text-gray-600">Brands will appear here once they are added</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {brands.map((brand, index) => (
              <motion.div
                key={brand._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <a
                  href={`/brands/${brand.slug}`}
                  className={`block bg-white rounded-2xl shadow-sm overflow-hidden card-hover ${
                    viewMode === 'list' ? 'flex items-center' : ''
                  }`}
                >
                  {/* Brand Logo */}
                  <div className={`relative overflow-hidden bg-white ${
                    viewMode === 'list' 
                      ? 'w-40 h-40 flex-shrink-0' 
                      : 'aspect-square'
                  }`}>
                    {brand.logo ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          sizes={viewMode === 'list' ? '160px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                          className="object-contain p-4 sm:p-6 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl font-bold text-amber-400">
                          {brand.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300" />
                  </div>

                  {/* Brand Info */}
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {brand.name}
                        </h3>
                        {brand.description && (
                          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                            {brand.description}
                          </p>
                        )}
                        
                        {viewMode === 'list' && (
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              brand.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {brand.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {brand.website && (
                              <a
                                href={brand.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
                    </div>
                    
                    {viewMode === 'grid' && brand.website && (
                      <div className="mt-4">
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        )}
          </div>
          <Footer />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}