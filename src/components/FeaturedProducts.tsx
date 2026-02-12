'use client'

import { motion } from 'framer-motion'
import { Star, Heart, ShoppingBag, Award, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Product } from '@/lib/api'
import { useProducts } from '@/contexts/ProductsContext'

// No hardcoded data - fetch from API

interface FeaturedProductsProps {
  showHeader?: boolean
}

export default function FeaturedProducts({ showHeader = true }: FeaturedProductsProps) {
  const { products: allProducts, loading } = useProducts()
  
  // Filter featured products (products with high ratings or marked as featured)
  const featuredProducts = allProducts
    .filter(product => {
      // Consider products with rating >= 4.5 or reviews >= 10 as featured
      return (product.rating && product.rating >= 4.5) || 
             (product.reviews && product.reviews >= 10) ||
             product.isNew === true
    })
    .slice(0, 6) // Show only 6 products
  
  const products = featuredProducts

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {showHeader && (
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-lg text-gray-600">Loading...</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Hide section if no featured products
  if (products.length === 0) {
    return null
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
              <Award className="h-6 w-6 text-primary-600" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
                Featured Products
              </h2>
              <TrendingUp className="h-6 w-6 text-secondary-500" />
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our most popular and trending pieces, carefully curated for the sophisticated woman.
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 w-full max-w-full">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group w-full max-w-full min-w-0 overflow-hidden"
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-[3/4]">
                    <Image
                      src={
                        (product.images && product.images.length > 0 && product.images[0]) ||
                        product.featuredImage ||
                        '/images/1.png'
                      }
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      loading={index < 3 ? "eager" : "lazy"}
                      quality={80}
                      onError={(e) => {
                        e.currentTarget.src = '/images/1.png'
                      }}
                      />
                  </div>
                </Link>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      New
                    </span>
                  )}
                  {product.isSale && (
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

              <div className="p-2 sm:p-3 lg:p-4">
                <div className="mb-1 sm:mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg line-clamp-2 mb-0.5 sm:mb-1 min-w-0">
                    {product.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{product.brand}</p>
                </div>

                <div className="flex items-center gap-1 mb-2 sm:mb-3">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">{product.rating || 0}</span>
                  <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">({product.reviews || 0} reviews)</span>
                </div>

                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-primary-600 whitespace-nowrap">
                      PKR {typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
                    </span>
                    {product.originalPrice && typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                      <span className="text-xs sm:text-sm text-gray-400 line-through whitespace-nowrap">
                        PKR {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button className="p-1.5 sm:p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors duration-200 flex-shrink-0">
                    <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {showHeader && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            href="/shop"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Award className="h-5 w-5" />
            View All Featured Products
          </Link>
        </motion.div>
        )}
      </div>
    </section>
  )
}
