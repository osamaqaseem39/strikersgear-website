'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import ProductCard from './ProductCard'
import { useProducts } from '@/contexts/ProductsContext'

export default function TrendingProducts() {
  const { products: allProducts, loading } = useProducts()
  
  // Filter trending products (products with high ratings or many reviews)
  const products = useMemo(() => {
    return allProducts
      .filter(product => 
        (product.rating && product.rating >= 4.0) || 
        (product.reviews && product.reviews >= 5) ||
        product.isNew === true
      )
      .slice(0, 8) // Show only 8 products
  }, [allProducts])
  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-4">
            Featured Collections
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most popular couture pieces
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg"></div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
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
                  image={product.images[0] || ''}
                  category={product.category || ''}
                  brand={product.brand}
                  color={(product as any)?.attributes?.color || (product.colors && product.colors[0])}
                  isNew={product.isNew}
                  isOnSale={product.isSale}
                  slug={product.slug}
                  availableSizes={product.availableSizes}
                />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary"
          >
            View All Collections
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}