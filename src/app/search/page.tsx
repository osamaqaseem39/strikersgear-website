'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useIsMobile } from '@/utils/useMobile'
import { motion } from 'framer-motion'
import { Search, Filter, Grid, List, X } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Product, ProductFilters } from '@/lib/api'
import { useProducts } from '@/contexts/ProductsContext'
import ProductCard from '@/components/ProductCard'
import MobileSearchPage from '@/components/mobile/MobileSearchPage'
import LoadingSpinner from '@/components/LoadingSpinner'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'

export default function SearchPage() {
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const { products: allProducts, loading: productsLoading, error: productsError } = useProducts()
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    search: searchParams.get('q') || '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  // Client-side search and filtering
  const filteredProducts = allProducts.filter(product => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        (Array.isArray(product.categories) && product.categories.some(cat => 
          String(cat).toLowerCase().includes(searchLower)
        ))
      if (!matchesSearch) return false
    }

    // Price range filter
    const productPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price
    if (filters.minPrice !== undefined && productPrice < filters.minPrice) return false
    if (filters.maxPrice !== undefined && productPrice > filters.maxPrice) return false

    // Status filter
    if (filters.status && product.status !== filters.status) return false

    return true
  })

  // Client-side sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price':
        return filters.sortOrder === 'asc' 
          ? (a.price - b.price)
          : (b.price - a.price)
      case 'name':
        return filters.sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      case 'createdAt':
      default:
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()
        return filters.sortOrder === 'asc'
          ? (aTime - bTime)
          : (bTime - aTime)
    }
  })

  // Client-side pagination
  const page = filters.page || 1
  const limit = filters.limit || 12
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)
  const totalPages = Math.ceil(sortedProducts.length / limit)

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1
    }))
  }

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }))
  }

  const clearSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: undefined,
      page: 1
    }))
  }

  if (productsLoading) {
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

  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-20 sm:pt-24 lg:pt-24">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Search failed</h2>
                <p className="text-gray-600 mb-4">{productsError}</p>
                <button
                  onClick={() => window.location.reload()}
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

  // Render mobile version if on mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 pb-20 pt-20">
            <MobileSearchPage />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (true && <div className="min-h-screen bg-gray-50">
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
              Search Results
            </h1>
            {filters.search && (
              <div className="flex items-center gap-4">
                <p className="text-lg text-gray-600">
                  Results for "{filters.search}"
                </p>
                <button
                  onClick={clearSearch}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear search
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={filters.search || ''}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-')
                      handleFilterChange('sortBy', sortBy)
                      handleFilterChange('sortOrder', sortOrder)
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {sortedProducts.length} products found
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

            {/* Products */}
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filters.search ? 'No products found' : 'Start searching'}
                </h3>
                <p className="text-gray-600">
                  {filters.search 
                    ? 'Try adjusting your search terms or filters' 
                    : 'Enter a search term to find products'
                  }
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <ProductCard
                      id={product._id}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      image={product.images[0] || '/images/1.png'}
                      category={product.categories?.[0] || product.category || 'Uncategorized'}
                      brand={product.brand}
                      color={(product as any)?.attributes?.color || (product.colors && product.colors[0])}
                      isNew={new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000}
                      isOnSale={!!product.originalPrice && product.originalPrice > product.price}
                      slug={product.slug}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        pageNum === page
                          ? 'bg-rose-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
        </main>
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}