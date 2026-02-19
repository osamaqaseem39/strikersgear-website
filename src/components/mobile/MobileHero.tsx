'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { apiClient } from '@/lib/api'

interface Banner {
  _id: string
  title: string
  subtitle?: string
  description?: string
  imageUrl: string
  altText?: string
  linkUrl?: string
  linkText?: string
  position?: string
}

export default function MobileHero() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(1)

  // Same API and filtering as Hero.tsx for consistent banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        const fetchedBanners = await apiClient.getHeroBanners()
        if (fetchedBanners && Array.isArray(fetchedBanners) && fetchedBanners.length > 0) {
          const heroBanners = fetchedBanners.filter(
            (b) => !b.position || b.position === 'hero'
          )
          setBanners(heroBanners)
        } else {
          setBanners([])
        }
      } catch (error) {
        console.error('Error fetching banners:', error)
        setBanners([])
      } finally {
        setLoading(false)
      }
    }
    fetchBanners()
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return

    const interval = setInterval(() => {
      setDirection(1)
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, banners])

  const nextSlide = () => {
    setDirection(1)
    setCurrentSlide((prev) => (prev + 1) % banners.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setDirection(-1)
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1)
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }

  if (loading) {
    return (
      <section className="relative w-full overflow-hidden aspect-video max-h-[50vh] bg-gray-200 animate-pulse" />
    )
  }

  if (banners.length === 0) {
    return (
      <section className="relative w-full overflow-hidden aspect-video max-h-[50vh] bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400 text-sm">No banners</span>
      </section>
    )
  }

  return (
    <section className="relative w-full overflow-hidden aspect-video max-h-[50vh] min-h-[200px]">
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {banners.map((banner, index) => {
            if (index !== currentSlide) return null

            const bannerLink = banner.linkUrl || '/shop'

            return (
              <motion.div
                key={banner._id || index}
                initial={{ opacity: 0, x: direction * 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -80 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute inset-0 w-full h-full"
              >
                <Link href={bannerLink} className="block w-full h-full cursor-pointer active:opacity-95">
                  <div className="absolute inset-0 overflow-hidden">
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.altText || banner.title}
                        fill
                        priority={index === 0}
                        quality={85}
                        sizes="(max-width: 768px) 100vw, 896px"
                        className="object-contain w-full h-full object-center"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - only when multiple banners, larger tap targets */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/40 active:bg-black/50 backdrop-blur-sm rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all touch-manipulation"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 text-white shrink-0" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/25 hover:bg-black/40 active:bg-black/50 backdrop-blur-sm rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all touch-manipulation"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 text-white shrink-0" />
          </button>
        </>
      )}

      {/* Dot indicators - only when multiple banners, safe area */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full transition-all duration-300 touch-manipulation min-w-[10px] min-h-[10px] ${
                index === currentSlide
                  ? 'bg-white w-7 h-2.5'
                  : 'bg-white/60 active:bg-white/80 w-2.5 h-2.5'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

