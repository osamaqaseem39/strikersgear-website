'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, Star, Heart, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { apiClient, Product } from '@/lib/api'
import { useProducts } from '@/contexts/ProductsContext'
import MobileProductCard from './MobileProductCard'

const sortOptions = [
  'Featured',
  'Price: Low to High',
  'Price: High to Low',
  'Newest',
  'Best Rated'
]

export default function MobileShopPage() {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Featured')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  const { products, loading: productsLoading } = useProducts()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(['All'])
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map())
  const [categorySlugMap, setCategorySlugMap] = useState<Map<string, string>>(new Map())
  const [colors, setColors] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true)
        const filterOptions = await apiClient.getFilterOptions()
        const categoryNames = ['All', ...filterOptions.categories.map(cat => cat.name)]
        setCategories(categoryNames)
        
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
        setPriceRange([filterOptions.priceRange.min, filterOptions.priceRange.max])
      } catch (err) {
        console.error('Error fetching filter options:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFilterOptions()
  }, [])

  useEffect(() => {
    if (categorySlugMap.size === 0) return
    
    const categoryParam = searchParams?.get('category')
    if (categoryParam) {
      const categoryName = categorySlugMap.get(categoryParam) || categoryParam
      setSelectedCategory(categoryName)
    }
  }, [searchParams, categorySlugMap])

  const isProductOnSale = (product: Product): boolean => {
    if (product.isSale === true) return true
    if (product.salePrice !== undefined && typeof product.salePrice === 'number' && product.salePrice > 0) return true
    if (product.originalPrice !== undefined && typeof product.originalPrice === 'number' && product.originalPrice > product.price) return true
    return false
  }

  const isProductNew = (product: Product): boolean => {
    if (product.isNew === true) return true
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(product.createdAt) >= thirtyDaysAgo
  }

  const isProductFeatured = (product: Product): boolean => {
    return !!(product.rating && product.rating >= 4.5) || !!(product.reviews && product.reviews >= 10)
  }

  const filteredProducts = products.filter(product => {
    let matchesCategory = true
    if (selectedCategory !== 'All') {
      const categoryMatches = product.category === selectedCategory
      const categoryIdMatches = product.category && categoryMap.has(product.category) && categoryMap.get(product.category) === selectedCategory
      const categorySlugMatches = product.category && categorySlugMap.has(product.category) && categorySlugMap.get(product.category) === selectedCategory
      const categoriesArrayMatches = Array.isArray(product.categories) && 
        product.categories.some(cat => {
          if (typeof cat === 'string') {
            if (cat === selectedCategory) return true
            if (categoryMap.has(cat) && categoryMap.get(cat) === selectedCategory) return true
            if (categorySlugMap.has(cat) && categorySlugMap.get(cat) === selectedCategory) return true
          }
          return false
        })
      matchesCategory = categoryMatches || categoryIdMatches || categorySlugMatches || categoriesArrayMatches
    }
    
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const productPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price
    const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1]
    
    let matchesSpecialFilters = true
    if (selectedFilters.length > 0) {
      matchesSpecialFilters = selectedFilters.some(filter => {
        switch (filter) {
          case 'sale': return isProductOnSale(product)
          case 'new': return isProductNew(product)
          case 'featured': return isProductFeatured(product)
          default: return true
        }
      })
    }
    
    let matchesColors = true
    if (selectedColors.length > 0 && product.colors && product.colors.length > 0) {
      const colorStrs = product.colors.map((c) => typeof c === 'string' ? c : (c as { name?: string })?.name ?? '')
      matchesColors = selectedColors.some(color => 
        colorStrs.some(pc => 
          pc && (pc.toLowerCase().includes(color.toLowerCase()) || color.toLowerCase().includes(pc.toLowerCase()))
        )
      )
    }
    
    let matchesSizes = true
    if (selectedSizes.length > 0 && product.availableSizes && product.availableSizes.length > 0) {
      matchesSizes = selectedSizes.some(size => product.availableSizes?.includes(size))
    }
    
    return matchesCategory && matchesSearch && matchesPrice && matchesSpecialFilters && matchesColors && matchesSizes
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'Price: Low to High': return a.price - b.price
      case 'Price: High to Low': return b.price - a.price
      case 'Newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'Best Rated': return (b.rating || 0) - (a.rating || 0)
      default: return 0
    }
  })

  const clearFilters = () => {
    setSelectedCategory('All')
    setSearchQuery('')
    setSelectedColors([])
    setSelectedSizes([])
    setSelectedFilters([])
    setSortBy('Featured')
  }

  if (productsLoading || loading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Shop All Products</h1>
          
          {/* Search and Filter Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100000])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Products Count */}
      <div className="px-4 py-3 bg-gray-50">
        <p className="text-sm text-gray-600">{sortedProducts.length} products found</p>
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-12 px-4">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-sm text-gray-600 mb-4">Try adjusting your filters</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {sortedProducts.map((product) => (
            <MobileProductCard
              key={product._id}
              id={product._id}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.images[0] || '/images/1.png'}
              category={product.categories?.[0] || product.category || 'General'}
              brand={product.brand}
              isNew={isProductNew(product)}
              isOnSale={isProductOnSale(product)}
              slug={product.slug}
              rating={product.rating}
              reviews={product.reviews}
            />
          ))}
        </div>
      )}
    </div>
  )
}

