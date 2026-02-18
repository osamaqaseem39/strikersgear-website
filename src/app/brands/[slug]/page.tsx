'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Grid, List, SortAsc, SortDesc } from 'lucide-react'
import { apiClient, Brand } from '@/lib/api'
import { Product, ProductFilters } from '@/lib/api'
import ProductCard from '@/components/ProductCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'

export default function BrandDetailPage() {
  const params = useParams()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const fetchBrandAndProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch brand details
      const brandData = await apiClient.getBrandBySlug(params.slug as string)
      setBrand(brandData)
      
      // Fetch products by this brand
      const productsResponse = await apiClient.getProductsByBrand(brandData._id, filters)
      setProducts((productsResponse as any).data)
      setTotalPages((productsResponse as any).totalPages)
    } catch (err) {
      setError('Brand not found')
      console.error('Error fetching brand:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.slug) {
      fetchBrandAndProducts()
    }
  }, [params.slug, filters])

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

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-20 sm:pt-24 lg:pt-24">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Brand not found</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => window.history.back()}
                  className="btn-primary"
                >
                  Go Back
                </button>
              </div>
            </div>
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
          {/* Brand Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Brands
                </button>

                <div className="flex items-center gap-8">
              {brand.logo && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {brand.name}
                </h1>
                {brand.description && (
                  <p className="text-lg text-gray-600 max-w-3xl mb-4">
                    {brand.description}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    brand.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {brand.isActive ? 'Active Brand' : 'Inactive Brand'}
                  </span>
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
              </motion.div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Filters</h2>
              
              <div className="space-y-6">
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

                {/* Attributes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {['XS','S','M','L','XL','XXL'].map(size => (
                      <button
                        key={size}
                        onClick={() => handleFilterChange('sizes', (filters as any).sizes?.includes(size) ? (filters as any).sizes?.filter((s: string) => s !== size) : [...((filters as any).sizes || []), size])}
                        className={`px-3 py-1.5 rounded-md border text-sm ${
                          (filters as any).sizes?.includes(size) ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fabric</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Lawn','Cotton','Silk','Chiffon','Linen','Khaddar','Organza'].map(fabric => (
                      <button
                        key={fabric}
                        onClick={() => handleFilterChange('fabrics', (filters as any).fabrics?.includes(fabric) ? (filters as any).fabrics?.filter((f: string) => f !== fabric) : [...((filters as any).fabrics || []), fabric])}
                        className={`px-3 py-2 rounded-md border text-sm text-left ${
                          (filters as any).fabrics?.includes(fabric) ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {fabric}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Unstitched','Pret','Formal','Bridal','Casual'].map(style => (
                      <button
                        key={style}
                        onClick={() => handleFilterChange('occasions', (filters as any).occasions?.includes(style) ? (filters as any).occasions?.filter((o: string) => o !== style) : [...((filters as any).occasions || []), style])}
                        className={`px-3 py-2 rounded-md border text-sm text-left ${
                          (filters as any).occasions?.includes(style) ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Family</label>
                  <div className="flex flex-wrap gap-2">
                    {['Black','White','Red','Blue','Green','Pink','Yellow','Beige'].map(color => (
                      <button
                        key={color}
                        onClick={() => handleFilterChange('colorFamilies', (filters as any).colorFamilies?.includes(color) ? (filters as any).colorFamilies?.filter((c: string) => c !== color) : [...((filters as any).colorFamilies || []), color])}
                        className={`px-3 py-1.5 rounded-md border text-sm ${
                          (filters as any).colorFamilies?.includes(color) ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
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
                  {products.length} products by {brand.name}
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
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">This brand doesn't have any products yet</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {products.map((product, index) => (
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
                      category={brand.name}
                      brand={brand.name}
                      color={(product as any)?.attributes?.color || (product.colors && product.colors[0])}
                      isNew={new Date(product.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000}
                      isOnSale={!!product.originalPrice && product.originalPrice > product.price}
                      slug={product.slug}
                      availableSizes={product.availableSizes}
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
                    onClick={() => handlePageChange(filters.page! - 1)}
                    disabled={filters.page === 1}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        page === filters.page
                          ? 'bg-rose-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(filters.page! + 1)}
                    disabled={filters.page === totalPages}
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