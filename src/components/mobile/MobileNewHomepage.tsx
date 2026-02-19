'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Star,
  ArrowRight,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiClient, Product, Category } from '@/lib/api'
import { useProducts } from '@/contexts/ProductsContext'
import MobileProductCard from './MobileProductCard'
import MobileHero from './MobileHero'

export default function MobileNewHomepage() {
  const { products: allProducts, loading: productsLoading } = useProducts()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const categoriesData = await apiClient.getCategories()
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error fetching homepage data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived product lists (order matters - used below)
  const featuredProducts = allProducts
    .filter(product =>
      (product.rating && product.rating >= 4.5) ||
      product.isNew === true ||
      product.isSale === true ||
      (product.rating && product.rating >= 4.0)
    )
    .slice(0, 4)

  const newArrivals = allProducts
    .filter(product => product.isNew === true)
    .slice(0, 4)

  const trendingProducts = allProducts
    .filter(product =>
      (product.reviews && product.reviews >= 10) ||
      (product.rating && product.rating >= 4.0) ||
      (product.reviews && product.reviews >= 5)
    )
    .slice(0, 4)

  const allProductsToShow = allProducts.slice(0, 8)

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200"></div>
          <div className="px-4 py-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Contained width on mobile */}
      <section className="w-full px-4">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl">
          <MobileHero />
        </div>
      </section>



      {/* Our Products - Always show when we have products */}
      {allProductsToShow.length > 0 && (
        <section className="py-8 bg-gray-50">
          <div className="px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center mb-6"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingBag className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-serif font-bold text-gray-900">
                  Our Products
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Explore our collection
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {allProductsToShow.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MobileProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={(Array.isArray(product.images) && product.images.length > 0 && product.images[0]) || product.featuredImage || '/images/1.png'}
                    category={product.categories?.[0] || product.category || 'General'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    rating={product.rating}
                    reviews={product.reviews}
                  />
                </motion.div>
              ))}
            </div>

            {allProducts.length > 8 && (
              <div className="text-center mt-6">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold text-sm active:bg-primary-700 transition-colors"
                >
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-8 bg-white">
          <div className="px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                Shop by Category
              </h2>
              <p className="text-sm text-gray-600">
                Explore our curated collections
              </p>
            </motion.div>

            <div className="grid grid-cols-3 gap-3">
              {categories.slice(0, 6).map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/shop?category=${category.slug || category.name}`}>
                    <div className="group bg-white rounded-lg overflow-hidden shadow-sm active:shadow-md transition-all border border-gray-100">
                      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover group-active:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-300">
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-center">
                        <h3 className="text-xs font-semibold text-gray-900 group-active:text-primary-600 transition-colors line-clamp-2">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-8 bg-gray-50">
          <div className="px-4">
            <div className="flex items-center justify-between mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-serif font-bold text-gray-900">
                    New Arrivals
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  Latest additions
                </p>
              </motion.div>
              <Link
                href="/shop?filter=new"
                className="text-primary-600 text-sm font-semibold"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {newArrivals.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MobileProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={(Array.isArray(product.images) && product.images.length > 0 && product.images[0]) || product.featuredImage || '/images/1.png'}
                    category={product.categories?.[0] || product.category || 'General'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    rating={product.rating}
                    reviews={product.reviews}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-8 bg-white">
          <div className="px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-center mb-6"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-xl font-serif font-bold text-gray-900">
                  Featured Products
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Handpicked bestsellers
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MobileProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={(Array.isArray(product.images) && product.images.length > 0 && product.images[0]) || product.featuredImage || '/images/1.png'}
                    category={product.categories?.[0] || product.category || 'General'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    rating={product.rating}
                    reviews={product.reviews}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Special Offer Banner */}
      <section className="py-8 bg-gradient-to-r from-primary-600 to-secondary-600 mx-4 my-8 rounded-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center text-white px-4"
        >
          <h2 className="text-2xl font-serif font-bold mb-2">
            Limited Time Offer
          </h2>
          <p className="text-sm mb-4 text-gray-100">
            Get 20% off on your first order
          </p>
          <p className="text-xs mb-4 font-semibold text-secondary-300">
            Use code: WELCOME20
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold text-sm active:bg-gray-100 transition-all"
          >
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="py-8 bg-gray-50">
          <div className="px-4">
            <div className="flex items-center justify-between mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-serif font-bold text-gray-900">
                    Trending Now
                  </h2>
                </div>
                <p className="text-sm text-gray-600">
                  What everyone loves
                </p>
              </motion.div>
              <Link
                href="/shop?filter=featured"
                className="text-primary-600 text-sm font-semibold"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {trendingProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MobileProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={(Array.isArray(product.images) && product.images.length > 0 && product.images[0]) || product.featuredImage || '/images/1.png'}
                    category={product.categories?.[0] || product.category || 'General'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    rating={product.rating}
                    reviews={product.reviews}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-8 bg-white border-t border-gray-200">
        <div className="px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <Zap className="h-8 w-8 text-primary-600 mx-auto mb-3" />
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">
              Stay in Style
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Subscribe for new arrivals and exclusive offers
            </p>
            <form className="flex flex-col gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold text-sm active:bg-primary-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

