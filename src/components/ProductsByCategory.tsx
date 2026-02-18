'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Grid3X3, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { apiClient, Product, Category } from '@/lib/api'
import ProductCard from './ProductCard'

interface ProductsByCategoryProps {
  showHeader?: boolean
  productsPerCategory?: number
}

interface CategoryWithProducts {
  category: Category
  products: Product[]
}

export default function ProductsByCategory({ 
  showHeader = true, 
  productsPerCategory = 8 
}: ProductsByCategoryProps) {
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProductsByCategory()
  }, [])

  const loadProductsByCategory = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all active categories
      const categories = await apiClient.getCategories()
      const activeCategories = categories.filter(cat => cat.isActive !== false)

      // Sort categories by sortOrder if available
      const sortedCategories = activeCategories.sort((a, b) => {
        const orderA = a.sortOrder ?? 0
        const orderB = b.sortOrder ?? 0
        return orderA - orderB
      })

      // Fetch products for each category
      const categoryProductsPromises = sortedCategories.map(async (category) => {
        try {
          const response = await apiClient.getProductsByCategory(category._id, {
            page: 1,
            limit: productsPerCategory
          })
          return {
            category,
            products: response.data || []
          }
        } catch (err) {
          console.error(`Error fetching products for category ${category.name}:`, err)
          return {
            category,
            products: []
          }
        }
      })

      const results = await Promise.all(categoryProductsPromises)
      
      // Filter out categories with no products
      const categoriesWithProducts = results.filter(item => item.products.length > 0)
      
      setCategoriesWithProducts(categoriesWithProducts)
    } catch (err) {
      console.error('Error loading products by category:', err)
      setError('Failed to load products. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showHeader && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-lg text-gray-600">Loading...</p>
            </div>
          )}
          <div className="space-y-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="bg-gray-200 rounded-lg h-80"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadProductsByCategory}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (categoriesWithProducts.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showHeader && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
            </div>
          )}
          <div className="text-center py-12">
            <p className="text-gray-600">No products available at the moment.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Grid3X3 className="h-7 w-7 text-primary-600" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
                Shop by Category
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our curated collections organized by category. Find exactly what you're looking for.
            </p>
          </motion.div>
        )}

        <div className="space-y-16">
          {categoriesWithProducts.map((item, categoryIndex) => (
            <motion.div
              key={item.category._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              className="category-section"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-serif font-bold text-gray-900">
                    Our {item.category.name} Collection
                  </h3>
                  {item.category.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.category.description}
                    </p>
                  )}
                </div>
                <Link
                  href={`/shop?category=${item.category.slug || item.category._id}`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 w-full max-w-full">
                {item.products.map((product, productIndex) => {
                  // Get the first image
                  const productImage = 
                    (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
                    product.featuredImage ||
                    (Array.isArray(product.gallery) && product.gallery.length > 0 && product.gallery[0]) ||
                    '/images/logo.png'
                  
                  // Get category name (could be string or array)
                  const categoryName = Array.isArray(product.categories) && product.categories.length > 0
                    ? product.categories[0]
                    : product.category || item.category.name

                  return (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: productIndex * 0.05 }}
                      className="w-full max-w-full min-w-0"
                    >
                      <ProductCard
                        id={product._id}
                        name={product.name}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        image={productImage}
                        category={categoryName}
                        brand={product.brand}
                        isNew={product.isNew}
                        isOnSale={product.isSale}
                        slug={product.slug}
                        availableSizes={product.availableSizes}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
