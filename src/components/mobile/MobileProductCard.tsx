'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Heart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface MobileProductCardProps {
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
  rating?: number
  reviews?: number
  availableSizes?: string[]
}

export default function MobileProductCard({
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
  slug,
  rating,
  reviews,
  availableSizes
}: MobileProductCardProps) {
  return (
    <Link href={slug ? `/products/${slug}` : `/products/${id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="group relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 active:scale-95 transition-transform"
      >
        {/* Image Container - Optimized for mobile */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 w-full">
          {image && image.startsWith('http') ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-active:scale-105"
              loading="lazy"
              quality={75}
            />
          ) : (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-active:scale-105"
              loading="lazy"
            />
          )}
          
          {/* Badges - Mobile optimized */}
          {(isNew || isOnSale) && (
            <div className="absolute top-2 left-2 flex gap-1">
              {isNew && (
                <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  New
                </span>
              )}
              {isOnSale && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Sale
                </span>
              )}
            </div>
          )}

          {/* Quick Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              // Wishlist logic
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="h-3.5 w-3.5 text-gray-600" />
          </button>
        </div>

        {/* Product Info - Compact for mobile */}
        <div className="p-2.5">
          {/* Name */}
          <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1 min-h-[2rem]">{name}</h3>
          
          {/* Brand */}
          {brand && (
            <p className="text-[10px] text-gray-500 mb-1 truncate">{brand}</p>
          )}

          {/* Sizes */}
          {availableSizes && availableSizes.length > 0 && (
            <div className="mb-1.5">
              <div className="flex flex-wrap gap-1">
                {availableSizes.slice(0, 3).map((size, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200"
                  >
                    {size}
                  </span>
                ))}
                {availableSizes.length > 3 && (
                  <span className="text-[9px] px-1 py-0.5 text-gray-500">
                    +{availableSizes.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rating - Compact */}
          {rating !== undefined && (
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] text-yellow-500">★</span>
              <span className="text-[10px] text-gray-600 font-medium">{rating.toFixed(1)}</span>
              {reviews !== undefined && reviews > 0 && (
                <span className="text-[10px] text-gray-400">({reviews})</span>
              )}
            </div>
          )}

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-sm font-bold text-primary-600 whitespace-nowrap">
                PKR {typeof price === 'number' ? price.toLocaleString() : '0'}
              </span>
              {originalPrice && typeof originalPrice === 'number' && originalPrice > price && (
                <span className="text-[10px] text-gray-400 line-through whitespace-nowrap">
                  PKR {originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                // Add to cart logic
              }}
              className="p-1.5 bg-primary-600 text-white rounded active:bg-primary-700 transition-colors flex-shrink-0"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

