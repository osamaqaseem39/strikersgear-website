'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useIsMobile } from '@/utils/useMobile'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import FiltersSidebar from '@/components/FiltersSidebar'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileFilters from '@/components/MobileFilters'
import MobileShopPage from '@/components/mobile/MobileShopPage'
import Footer from '@/components/Footer'
import { Search, Filter, Star, Heart, ShoppingBag, Grid3X3, Grid2X2, Grid, Layout } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { apiClient, Product, ProductFilters } from '@/lib/api'
import { useProducts } from '@/contexts/ProductsContext'

const sortOptions = [
  'Featured',
  'Price: Low to High',
  'Price: High to Low',
  'Newest',
  'Best Rated'
]

export default function ShopPage() {
  const isMobile = useIsMobile()
  const searchParams = useSearchParams()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)
  const [showDesktopFilters, setShowDesktopFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Featured')
  const [productsPerRow, setProductsPerRow] = useState(3)
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState([0, 100000]) // Large initial range to show all products
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  
  // Use products from context
  const { products, loading: productsLoading, error: productsError } = useProducts()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter options from backend
  const [categories, setCategories] = useState<string[]>(['All'])
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map()) // Map of category ID to name
  const [categorySlugMap, setCategorySlugMap] = useState<Map<string, string>>(new Map()) // Map of category slug to name
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])

  // Fetch filter options once on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch filter options from backend
        const filterOptions = await apiClient.getFilterOptions()
        const categoryNames = ['All', ...filterOptions.categories.map(cat => cat.name)]
        setCategories(categoryNames)
        
        // Create a map of category ID to name for filtering
        const catMap = new Map<string, string>()
        const slugMap = new Map<string, string>()
        filterOptions.categories.forEach(cat => {
          catMap.set(cat._id, cat.name)
          if (cat.slug) {
            slugMap.set(cat.slug, cat.name)
          }
        })
        setCategoryMap(catMap)
        setCategorySlugMap(slugMap)
        
        setColors(filterOptions.colors)
        setSizes(filterOptions.sizes)
        
        // Set price range from backend
        setPriceRange([filterOptions.priceRange.min, filterOptions.priceRange.max])
      } catch (err) {
        setError('Failed to fetch filter options')
        console.error('Error fetching filter options:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFilterOptions()
  }, []) // Run only once on mount

  // Handle URL query parameters - run after categorySlugMap is set
  useEffect(() => {
    if (categorySlugMap.size === 0) return // Wait for categories to load
    
    const filterParam = searchParams?.get('filter')
    const categoryParam = searchParams?.get('category')
    
    if (filterParam) {
      setSelectedFilters([filterParam])
    }
    
    if (categoryParam) {
      // Check if it's a slug and convert to name if needed
      const categoryName = categorySlugMap.get(categoryParam) || categoryParam
      setSelectedCategory(categoryName)
    }
  }, [searchParams, categorySlugMap])
  
  // Combine loading states
  const isLoading = productsLoading || loading
  const hasError = productsError || error

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleMobileFilterToggle = () => {
    setIsMobileFiltersOpen(!isMobileFiltersOpen)
  }

  const handleFilterClose = () => {
    setIsMobileFiltersOpen(false)
  }

  // Helper function to check if product is on sale
  const isProductOnSale = (product: Product): boolean => {
    // If explicitly marked as sale, return true
    if (product.isSale === true) return true
    
    // If salePrice exists (regardless of value), product is on sale
    if (product.salePrice !== undefined && 
        typeof product.salePrice === 'number' && 
        product.salePrice > 0) {
      return true
    }
    
    // Check if originalPrice is higher than current price (fallback check)
    if (product.originalPrice !== undefined && 
        typeof product.originalPrice === 'number' && 
        product.originalPrice > product.price) {
      return true
    }
    
    return false
  }

  // Helper function to check if product is new
  const isProductNew = (product: Product): boolean => {
    if (product.isNew === true) return true
    // Consider products created in the last 30 days as new
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const createdAt = new Date(product.createdAt)
    return createdAt >= thirtyDaysAgo
  }

  // Helper function to check if product is featured
  const isProductFeatured = (product: Product): boolean => {
    // Featured products typically have high ratings or are marked as featured
    return !!(product.rating && product.rating >= 4.5) || 
           !!(product.reviews && product.reviews >= 10)
  }

  // Filter products based on selected criteria
  const filteredProducts = products.filter(product => {
    // Category matching: check if product.category matches selectedCategory (by name, ID, or slug)
    // or if any product.categories array item matches
    let matchesCategory = true
    if (selectedCategory !== 'All') {
      // Check if product.category (string) matches the selected category name
      const categoryMatches = product.category === selectedCategory
      
      // Check if product.category is an ID that maps to the selected category name
      const categoryIdMatches = product.category && categoryMap.has(product.category) && 
                                categoryMap.get(product.category) === selectedCategory
      
      // Check if product.category is a slug that maps to the selected category name
      const categorySlugMatches = product.category && categorySlugMap.has(product.category) && 
                                 categorySlugMap.get(product.category) === selectedCategory
      
      // Check if product.categories array contains the selected category name or ID
      const categoriesArrayMatches = Array.isArray(product.categories) && 
        product.categories.some(cat => {
          if (typeof cat === 'string') {
            // Check if it's the category name
            if (cat === selectedCategory) return true
            // Check if it's a category ID that maps to the selected name
            if (categoryMap.has(cat) && categoryMap.get(cat) === selectedCategory) return true
            // Check if it's a category slug that maps to the selected name
            if (categorySlugMap.has(cat) && categorySlugMap.get(cat) === selectedCategory) return true
          }
          return false
        })
      
      matchesCategory = categoryMatches || categoryIdMatches || categorySlugMatches || categoriesArrayMatches
    }
    
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase())
    // Use salePrice if available for price filtering, otherwise use price
    const productPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price
    const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1]
    
    // Handle special filters
    let matchesSpecialFilters = true
    if (selectedFilters.length > 0) {
      matchesSpecialFilters = selectedFilters.some(filter => {
        switch (filter) {
          case 'sale':
            return isProductOnSale(product)
          case 'new':
            return isProductNew(product)
          case 'featured':
            return isProductFeatured(product)
          default:
            return true
        }
      })
    }
    
    // Handle color filter
    let matchesColors = true
    if (selectedColors.length > 0 && product.colors && product.colors.length > 0) {
      matchesColors = selectedColors.some(color => 
        product.colors?.some(pc => 
          pc.toLowerCase().includes(color.toLowerCase()) || 
          color.toLowerCase().includes(pc.toLowerCase())
        )
      )
    }
    
    // Handle size filter
    let matchesSizes = true
    if (selectedSizes.length > 0 && product.availableSizes && product.availableSizes.length > 0) {
      matchesSizes = selectedSizes.some(size => 
        product.availableSizes?.includes(size)
      )
    }
    
    return matchesCategory && matchesSearch && matchesPrice && matchesSpecialFilters && matchesColors && matchesSizes
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'Price: Low to High':
        return a.price - b.price
      case 'Price: High to Low':
        return b.price - a.price
      case 'Newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'Best Rated':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by the filter function
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
  }

  const handlePriceRangeChange = (range: number[]) => {
    setPriceRange(range)
  }

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const clearFilters = () => {
    setSelectedCategory('All')
    setSearchQuery('')
    // Reset price range to backend values if available
    if (priceRange[1] > priceRange[0]) {
      // Keep current range, but reset to initial if needed
      const resetRange = async () => {
        try {
          const filterOptions = await apiClient.getFilterOptions()
          setPriceRange([filterOptions.priceRange.min, filterOptions.priceRange.max])
        } catch (err) {
          console.error('Error fetching price range:', err)
        }
      }
      resetRange()
    }
    setSelectedColors([])
    setSelectedSizes([])
    setSelectedFilters([])
    setSortBy('Featured')
  }

  const getGridCols = () => {
    switch (productsPerRow) {
      case 1: return 'grid-cols-1'
      case 2: return 'grid-cols-1 sm:grid-cols-2'
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      default: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} onFilterClick={handleMobileFilterToggle} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-32 lg:pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(9)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg p-6">
                      <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Footer />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} onFilterClick={handleMobileFilterToggle} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-32 lg:pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h2>
                <p className="text-gray-600 mb-4">{hasError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
            <Footer />
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
        <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} onFilterClick={handleMobileFilterToggle} />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 pb-20">
            <MobileShopPage />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} onFilterClick={handleMobileFilterToggle} />
      <div className="flex">
        <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-32 lg:pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Shop All Products</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover our complete collection of fashion</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Hidden by default, only show on desktop when toggled */}
          {showDesktopFilters && (
            <div className="hidden lg:block lg:w-1/4">
              <FiltersSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                priceRange={priceRange}
                onPriceRangeChange={handlePriceRangeChange}
                colors={colors}
                selectedColors={selectedColors}
                onColorToggle={handleColorToggle}
                sizes={sizes}
                selectedSizes={selectedSizes}
                onSizeToggle={handleSizeToggle}
                selectedFilters={selectedFilters}
                onFilterToggle={handleFilterToggle}
                onClearFilters={clearFilters}
              />
            </div>
          )}

          {/* Main Content */}
          <div className={showDesktopFilters ? "lg:w-3/4" : "w-full"}>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
                <span className="text-sm text-gray-600">
                  {sortedProducts.length} products found
                </span>
                {/* Mobile Filter Button */}
                <button
                  onClick={handleMobileFilterToggle}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  <Filter className="h-4 w-4" />
                  Filters & Sort
                </button>
                {/* Desktop Filter Toggle Button */}
                <button
                  onClick={() => setShowDesktopFilters(!showDesktopFilters)}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                >
                  <Filter className="h-4 w-4" />
                  {showDesktopFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 sm:gap-4 flex-wrap w-full sm:w-auto">
                {/* Search - Hidden on mobile */}
                <form onSubmit={handleSearch} className="relative flex-1 sm:flex-initial min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </form>

                {/* Sort - Hidden on mobile */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  {sortOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>

                {/* View Options - Hide on mobile */}
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={() => setProductsPerRow(1)}
                    className={`p-2 rounded ${productsPerRow === 1 ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Layout className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setProductsPerRow(2)}
                    className={`p-2 rounded ${productsPerRow === 2 ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setProductsPerRow(3)}
                    className={`p-2 rounded ${productsPerRow === 3 ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setProductsPerRow(4)}
                    className={`p-2 rounded ${productsPerRow === 4 ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <ShoppingBag className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`grid ${getGridCols()} gap-3 sm:gap-4 lg:gap-6`}>
                {sortedProducts.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group w-full max-w-full overflow-hidden">
                    <div className="relative overflow-hidden rounded-t-lg aspect-[3/4]">
                      <Link href={`/products/${product.slug}`}>
                        <Image
                          src={
                            (product.images && product.images.length > 0 && product.images[0]) ||
                            product.featuredImage ||
                            '/images/1.png'
                          }
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          quality={80}
                          onError={(e) => {
                            e.currentTarget.src = '/images/1.png'
                          }}
                        />
                      </Link>
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {isProductNew(product) && (
                          <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            New
                          </span>
                        )}
                        {isProductOnSale(product) && (
                          <span className="bg-secondary-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Sale
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200">
                        <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>

                    <div className="p-2 sm:p-2.5 lg:p-3">
                      <div className="mb-1">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base line-clamp-2 mb-0.5 min-w-0">
                          {product.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">{product.brand}</p>
                      </div>

                      <div className="flex items-center gap-1 mb-1 sm:mb-2">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600 font-medium">{product.rating || 0}</span>
                        <span className="text-[10px] sm:text-xs lg:text-sm text-gray-400 hidden sm:inline">({product.reviews || 0} reviews)</span>
                      </div>

                      <div className="flex items-center justify-between gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                          <span className="text-sm sm:text-base lg:text-lg font-bold text-primary-600 whitespace-nowrap">
                            PKR {typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
                          </span>
                          {product.originalPrice && typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                            <span className="text-[10px] sm:text-xs lg:text-sm text-gray-400 line-through whitespace-nowrap">
                              PKR {product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <button className="p-1 sm:p-1.5 lg:p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors duration-200 flex-shrink-0">
                          <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </div>
          <Footer />
        </main>
      </div>

      {/* Mobile Filters */}
      <MobileFilters
        isOpen={isMobileFiltersOpen}
        onClose={handleFilterClose}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        priceRange={priceRange}
        onPriceRangeChange={handlePriceRangeChange}
        colors={colors}
        selectedColors={selectedColors}
        onColorToggle={handleColorToggle}
        sizes={sizes}
        selectedSizes={selectedSizes}
        onSizeToggle={handleSizeToggle}
        selectedFilters={selectedFilters}
        onFilterToggle={handleFilterToggle}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
      />

      <MobileBottomNav />
    </div>
  )
}