'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Grid, List } from 'lucide-react'
import { apiClient, Category } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      // Get all categories from default /categories endpoint
      const categoriesData = await apiClient.getCategories()
      setCategories(categoriesData)
    } catch (err) {
      setError('Failed to fetch categories')
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

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
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchCategories}
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
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h1>
            <p className="text-lg text-gray-600">
              Explore our curated collections organized by category
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {categories.length} categories available
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

        {/* Categories */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Categories will appear here once they are added</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {categories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <a
                  href={`/shop?category=${category.slug || category.name || category._id}`}
                  className={`block bg-white rounded-2xl shadow-sm overflow-hidden card-hover ${
                    viewMode === 'list' ? 'flex items-center' : ''
                  }`}
                >
                  {/* Category Image */}
                  <div className={`relative overflow-hidden ${
                    viewMode === 'list' 
                      ? 'w-32 h-32 flex-shrink-0' 
                      : 'aspect-square'
                  }`}>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                        <span className="text-4xl font-bold text-rose-300">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
                  </div>

                  {/* Category Info */}
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 capitalize-first">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                        <span>Active: {category.isActive ? 'Yes' : 'No'}</span>
                        <span>Sort Order: {category.sortOrder}</span>
                      </div>
                    )}
                  </div>
                </a>
              </motion.div>
            ))}
          </div>
        )}
        </main>
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}