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

export default function Hero() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(1) // 1 for next, -1 for previous

  // Fetch all banners from backend dynamically
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        // Fetch all active banners from backend
        const fetchedBanners = await apiClient.getHeroBanners()
        
        // Filter banners by position="hero" or banners without position field
        // Dynamically set all banners from backend (works with any number of banners)
        if (fetchedBanners && Array.isArray(fetchedBanners) && fetchedBanners.length > 0) {
          // Filter banners: only show those with position="hero" or no position field
          const heroBanners = fetchedBanners.filter(
            banner => !banner.position || banner.position === 'hero'
          )
          console.log(`Loaded ${heroBanners.length} banner(s) from backend (filtered by position):`, heroBanners)
          console.log('Banner imageUrls:', heroBanners.map(b => ({ id: b._id, imageUrl: b.imageUrl, title: b.title })))
          setBanners(heroBanners)
        } else {
          console.warn('No banners found from backend')
          setBanners([])
        }
      } catch (error) {
        console.error('Error fetching banners from backend:', error)
        setBanners([])
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  // Auto-play functionality - rotates banners automatically
  // Only auto-slide if there are multiple banners and position allows it
  useEffect(() => {
    // Auto-slide only if there are multiple banners
    // Position field is already filtered in fetchBanners, so all banners here are eligible
    if (!isAutoPlaying || banners.length <= 1) {
      console.log('Auto-slide disabled:', { isAutoPlaying, bannerCount: banners.length })
      return
    }

    console.log('Auto-slide enabled for', banners.length, 'banners')
    const interval = setInterval(() => {
      setDirection(1)
      setCurrentSlide((prev) => {
        const next = (prev + 1) % banners.length
        console.log('Auto-sliding from', prev, 'to', next)
        return next
      })
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, banners.length])

  // Resume auto-play after 10 seconds of user inactivity
  useEffect(() => {
    if (isAutoPlaying) return

    const timeout = setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000) // Resume auto-play after 10 seconds

    return () => clearTimeout(timeout)
  }, [isAutoPlaying])

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

  // Don't render if loading or no banners
  if (loading) {
    return (
      <section className="relative w-full overflow-hidden max-w-full aspect-video">
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      </section>
    )
  }

  if (banners.length === 0) {
    console.warn('No banners to display')
    return (
      <section className="relative w-full overflow-hidden max-w-full aspect-video">
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">No banners available</span>
        </div>
      </section>
    )
  }

  return (
    <section className="relative w-full overflow-hidden max-w-full aspect-video">
      {/* Slider Container */}
      <div className="relative w-full h-full max-w-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {banners.map((banner, index) => {
            if (index !== currentSlide) return null

            const bannerLink = banner.linkUrl || '/shop'
            
            return (
              <motion.div
                key={banner._id || index}
                initial={{ opacity: 0, x: direction * 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -100 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <Link href={bannerLink} className="block w-full h-full cursor-pointer">
                  {/* Background Image */}
                  <div className="absolute inset-0 overflow-hidden">
                    {banner.imageUrl ? (
                      <Image
                        src={banner.imageUrl}
                        alt={banner.altText || banner.title}
                        fill
                        priority={index === 0}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        quality={85}
                        sizes="100vw"
                        className="object-contain w-full h-full"
                        onError={(e) => {
                          console.error('Image load error:', banner.imageUrl, e)
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - Always visible */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-300 group shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full p-2 sm:p-3 transition-all duration-300 group shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white w-6 sm:w-8'
                : 'bg-white/50 hover:bg-white/75 w-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 right-8 z-20 hidden sm:block"
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
  )
}