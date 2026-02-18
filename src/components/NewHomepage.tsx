'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Star,
  ArrowRight,
  Heart,
  Zap
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { apiClient, Product, Category } from '@/lib/api'
import { useProducts } from '@/contexts/ProductsContext'
import ProductCard from './ProductCard'
import ProductsByCategory from './ProductsByCategory'

interface Banner {
  _id: string
  title: string
  subtitle?: string
  description?: string
  imageUrl: string
  altText?: string
  linkUrl?: string
  linkText?: string
}

export default function NewHomepage() {
  const { products: allProducts, loading: productsLoading } = useProducts()
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [categoriesData, bannersData] = await Promise.all([
          apiClient.getCategories(),
          apiClient.getBannersByPosition('hero').catch(() => [])
        ])
        setCategories(categoriesData || [])
        setBanners(bannersData || [])
      } catch (error) {
        console.error('Error fetching homepage data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Get featured products (high rated, new, or on sale)
  const featuredProducts = allProducts
    .filter(product =>
      (product.rating && product.rating >= 4.5) ||
      product.isNew === true ||
      product.isSale === true
    )
    .slice(0, 8)

  // Get new arrivals
  const newArrivals = allProducts
    .filter(product => product.isNew === true)
    .slice(0, 6)

  // Get trending products (high reviews or recently viewed)
  const trendingProducts = allProducts
    .filter(product =>
      (product.reviews && product.reviews >= 10) ||
      (product.rating && product.rating >= 4.0)
    )
    .slice(0, 6)

  const getProductImage = (product: Product) => {
    return (
      (Array.isArray(product.images) && product.images[0]) ||
      product.featuredImage ||
      (Array.isArray(product.gallery) && product.gallery[0]) ||
      '/images/logo.png'
    )
  }

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-[600px] bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - 16:9 */}
      <section className="relative w-full aspect-video flex items-center justify-center overflow-hidden">
        {banners.length > 0 ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={banners[0].imageUrl}
              alt={banners[0].title}
              fill
              className="object-contain"
              priority
              quality={90}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600"></div>
        )}

        {/* Hero content removed as per user request */}


        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* All Products Section */}
      {allProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-3">
                Our Football Gear
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Browse football cleats, grip socks and grippers, jerseys, shin pads, and performance socks from our latest drops.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allProducts.slice(0, 12).map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <ProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={getProductImage(product)}
                    category={product.categories?.[0] || (typeof product.category === 'string' ? product.category : (product as any).category?.name) || 'Football'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    availableSizes={product.availableSizes}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 border border-gray-300 rounded-full text-sm font-semibold text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
              >
                View all products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
                Shop by Category
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our curated collections tailored to every style and occasion
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
              {categories.slice(0, 6).map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/shop?category=${category.slug || category.name}`}>
                    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl font-bold text-gray-300">
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
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

      {/* Category Products Section - Dynamic rows for all categories */}
      <ProductsByCategory showHeader={false} productsPerCategory={8} />

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-8 w-8 text-primary-600" />
                  <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900">
                    New Arrivals
                  </h2>
                </div>
                <p className="text-lg text-gray-600">
                  Discover the latest additions to our collection
                </p>
              </motion.div>
              <Link
                href="/shop?filter=new"
                className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                View All
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {newArrivals.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={getProductImage(product)}
                    category={product.categories?.[0] || product.category || 'General'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    availableSizes={product.availableSizes}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900">
                  Featured Products
                </h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Handpicked bestsellers and trending pieces our customers love
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={getProductImage(product)}
                    category={product.categories?.[0] || product.category || 'General'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    availableSizes={product.availableSizes}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Special Offer Banner */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-4">
              Limited Time Offer
            </h2>
            <p className="text-xl mb-8 text-gray-100">
              Get 20% off on your first order. Use code: <span className="font-bold text-secondary-300">WELCOME20</span>
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-8 w-8 text-primary-600" />
                  <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900">
                    Trending Now
                  </h2>
                </div>
                <p className="text-lg text-gray-600">
                  What everyone is loving right now
                </p>
              </motion.div>
              <Link
                href="/shop?filter=featured"
                className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                View All
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard
                    id={product._id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={getProductImage(product)}
                    category={product.categories?.[0] || product.category || 'General'}
                    brand={product.brand}
                    isNew={product.isNew}
                    isOnSale={product.isSale}
                    slug={product.slug}
                    availableSizes={product.availableSizes}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Zap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">
              Stay in Style
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Subscribe to our newsletter and be the first to know about new arrivals, exclusive offers, and style tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap"
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

