'use client'

import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ProductCardProps {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  brand?: string
  color?: string
  isNew?: boolean
  isOnSale?: boolean
  slug?: string
}

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  image,
  category,
  brand,
  color,
  isNew = false,
  isOnSale = false,
  slug
}: ProductCardProps) {
  return (
    <Link href={slug ? `/products/${slug}` : `/products/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="group relative bg-white rounded-lg overflow-hidden card-hover cursor-pointer w-full max-w-full min-w-0"
      >
        {/* Image Container - 1:1 Aspect Ratio (Square) */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 w-full">
          {image && image.startsWith('http') ? (
            <Image
              src={image || '/images/1.png'}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              quality={80}
              onError={(e) => {
                e.currentTarget.src = '/images/1.png'
              }}
            />
          ) : (
            <img
              src={image || '/images/1.png'}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = '/images/1.png'
              }}
            />
          )}
          
          {/* Badges */}
          {(isNew || isOnSale) && (
            <div className="absolute top-2 left-2 flex gap-1">
              {isNew && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                  New
                </span>
              )}
              {isOnSale && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                  Sale
                </span>
              )}
            </div>
          )}
        </div>

        {/* Product Info - Minimal Design */}
        <div className="p-2 sm:p-2.5">
          {/* Name and Brand in one line */}
          <div className="flex items-center gap-1 sm:gap-2 mb-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate flex-1 min-w-0">{name}</h3>
            {brand && (
              <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0 hidden sm:inline">{brand}</span>
            )}
          </div>

          {/* Price and Add to Cart in one line */}
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <span className="text-sm sm:text-base font-semibold text-primary-600 whitespace-nowrap">
                PKR {typeof price === 'number' ? price.toLocaleString() : '0'}
              </span>
              {originalPrice && typeof originalPrice === 'number' && originalPrice > price && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through whitespace-nowrap">
                  PKR {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                // Add to cart logic here
              }}
              className="p-1 sm:p-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors flex-shrink-0"
            >
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}