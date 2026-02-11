'use client'

import { motion } from 'framer-motion'
import { Star, Heart, ShoppingBag, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext'

export default function RecentlyViewed() {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed()

  if (recentlyViewed.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Recently Viewed
            </h2>
            <p className="text-gray-600">
              Continue browsing your favorite items
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={clearRecentlyViewed}
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              Clear All
            </button>
            <Link
              href="/shop"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All Products
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {recentlyViewed.slice(0, 8).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow w-full max-w-full overflow-hidden"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                    {product.isSale && (
                      <span className="bg-secondary-500 text-white text-xs px-2 py-1 rounded-full">
                        Sale
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                      <Eye className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base line-clamp-2">
                      {product.name}
                    </h3>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <ShoppingBag className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{product.rating}</span>
                    <span className="text-sm text-gray-400">({product.reviews})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary-600">
                      PKR {typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
                    </span>
                    {product.originalPrice && typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        PKR {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {recentlyViewed.length > 8 && (
          <div className="text-center mt-8">
            <Link
              href="/shop"
              className="btn-secondary"
            >
              View All Recently Viewed
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
