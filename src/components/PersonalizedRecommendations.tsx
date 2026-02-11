'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAnalytics } from '@/contexts/AnalyticsContext'
import { Product } from '@/lib/api'
import { useProducts } from '@/contexts/ProductsContext'
import ProductCard from './ProductCard'

interface PersonalizedRecommendationsProps {
  title?: string
  maxItems?: number
  showPersonalizedMessage?: boolean
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  title = "Recommended for You",
  maxItems = 8,
  showPersonalizedMessage = true
}) => {
  const { userProfile, trackEvent } = useAnalytics()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const [personalizedMessage, setPersonalizedMessage] = useState('')

  // Client-side filtering based on user profile
  const recommendations = useMemo(() => {
    if (!allProducts.length) return []

    if (!userProfile) {
      // Show trending products for new users (products with high ratings or many reviews)
      return allProducts
        .filter(product => 
          (product.rating && product.rating >= 4.0) || 
          (product.reviews && product.reviews >= 5)
        )
        .slice(0, maxItems)
    }

    // Filter products based on user preferences
    let filtered = allProducts

    // Filter by favorite categories
    if (userProfile.preferences.favoriteCategories.length > 0) {
      const favoriteCategories = userProfile.preferences.favoriteCategories
      filtered = filtered.filter(product => {
        const productCategories = Array.isArray(product.categories) 
          ? product.categories.map(c => String(c).toLowerCase())
          : [String(product.category || '').toLowerCase()]
        return favoriteCategories.some(favCat => 
          productCategories.some(pc => 
            pc.includes(String(favCat).toLowerCase()) || 
            String(favCat).toLowerCase().includes(pc)
          )
        )
      })
    }

    // Filter by price range
    if (userProfile.preferences.priceRange.min > 0 || userProfile.preferences.priceRange.max < 10000) {
      filtered = filtered.filter(product => {
        const productPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price
        return productPrice >= userProfile.preferences.priceRange.min &&
               productPrice <= userProfile.preferences.priceRange.max
      })
    }

    // Filter by favorite colors
    if (userProfile.preferences.favoriteColors.length > 0) {
      filtered = filtered.filter(product => {
        const productColors = product.colors || []
        return userProfile.preferences.favoriteColors.some(favColor =>
          productColors.some(pc => 
            String(pc).toLowerCase().includes(String(favColor).toLowerCase()) ||
            String(favColor).toLowerCase().includes(String(pc).toLowerCase())
          )
        )
      })
    }

    // Filter by favorite brands
    if (userProfile.preferences.favoriteBrands.length > 0) {
      filtered = filtered.filter(product => {
        const productBrand = String(product.brand || '').toLowerCase()
        return userProfile.preferences.favoriteBrands.some(favBrand =>
          productBrand.includes(String(favBrand).toLowerCase()) ||
          String(favBrand).toLowerCase().includes(productBrand)
        )
      })
    }

    // Filter by size preferences
    if (userProfile.preferences.sizePreferences.length > 0) {
      filtered = filtered.filter(product => {
        const productSizes =
          product.availableSizes ||
          (product as any).sizes ||
          (product as any).attributes?.sizes ||
          []
        return userProfile.preferences.sizePreferences.some(size =>
          productSizes.includes(size)
        )
      })
    }

    // Filter by body type
    if (userProfile.preferences.bodyType.length > 0) {
      filtered = filtered.filter(product => {
        const productBodyTypes = (product as any).bodyType || []
        return userProfile.preferences.bodyType.some(bt =>
          Array.isArray(productBodyTypes) 
            ? productBodyTypes.includes(bt)
            : productBodyTypes === bt
        )
      })
    }

    // Filter by occasion
    if (userProfile.preferences.occasion.length > 0) {
      filtered = filtered.filter(product => {
        const productOccasion = (product as any).occasion || ''
        return userProfile.preferences.occasion.some(occ =>
          String(productOccasion).toLowerCase().includes(String(occ).toLowerCase())
        )
      })
    }

    // Filter by season
    if (userProfile.preferences.season.length > 0) {
      filtered = filtered.filter(product => {
        const productSeason = (product as any).season || ''
        return userProfile.preferences.season.some(season =>
          String(productSeason).toLowerCase().includes(String(season).toLowerCase())
        )
      })
    }

    // If no personalized results, fallback to trending
    if (filtered.length === 0) {
      filtered = allProducts
        .filter(product => 
          (product.rating && product.rating >= 4.0) || 
          (product.reviews && product.reviews >= 5)
        )
    }

    return filtered.slice(0, maxItems)
  }, [allProducts, userProfile, maxItems])

  useEffect(() => {
    generatePersonalizedMessage()
  }, [userProfile, recommendations])

  const loading = productsLoading

  const generatePersonalizedMessage = () => {
    if (!userProfile) {
      setPersonalizedMessage('Discover our trending collection')
      return
    }

    const messages = []

    // Based on visit frequency
    if (userProfile.behavior.totalVisits > 10) {
      messages.push('Welcome back!')
    } else if (userProfile.behavior.totalVisits > 3) {
      messages.push('We\'re getting to know your style!')
    } else {
      messages.push('Discover your perfect style!')
    }

    // Based on preferences
    if (userProfile.preferences.favoriteCategories.length > 0) {
      const category = userProfile.preferences.favoriteCategories[0]
      messages.push(`Curated ${category} pieces for you`)
    }

    // Based on purchase history
    if (userProfile.behavior.purchaseHistory.totalPurchases > 0) {
      messages.push('Based on your previous purchases')
    }

    // Based on location
    if (userProfile.location) {
      messages.push(`Perfect for ${userProfile.location.city}`)
    }

    setPersonalizedMessage(messages.join(' • ') || 'Discover our trending collection')
  }

  const handleProductClick = (product: Product) => {
    trackEvent({
      type: 'product_view',
      data: { product },
      timestamp: new Date().toISOString(),
      sessionId: ''
    })
  }

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {showPersonalizedMessage && personalizedMessage && (
            <p className="text-lg text-gray-600">
              {personalizedMessage}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((product) => (
            <div key={product._id} onClick={() => handleProductClick(product)}>
              <ProductCard 
                id={product._id}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.images[0] || '/images/1.png'}
                category={product.categories?.[0] || product.category || 'Uncategorized'}
                isNew={product.isNew}
                isOnSale={product.isSale}
                slug={product.slug}
              />
            </div>
          ))}
        </div>

        {userProfile && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Recommendations based on your preferences and browsing history
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonalizedRecommendations