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
}

export default function MobileHero() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(1) // 1 for next, -1 for previous

  // Fetch banners from backend
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        const fetchedBanners = await apiClient.getBannersByPosition('hero')
        if (fetchedBanners && fetchedBanners.length > 0) {
          setBanners(fetchedBanners)
        } else {
          // Fallback to default banners
          setBanners([
            {
              _id: '1',
              title: 'Élégance',
              subtitle: 'Couture',
              description: 'Exclusive couture for the sophisticated woman.',
              imageUrl: '/images/banner1.png',
              altText: 'Women\'s Couture',
            },
            {
              _id: '2',
              title: 'Timeless',
              subtitle: 'Elegance',
              description: 'Discover our curated collection of women\'s fashion.',
              imageUrl: '/images/banner2.png',
              altText: 'Fashion Collection',
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching banners:', error)
        setBanners([
          {
            _id: '1',
            title: 'Élégance',
            subtitle: 'Couture',
            description: 'Exclusive couture for the sophisticated woman.',
            imageUrl: '/images/banner1.png',
            altText: 'Women\'s Couture',
          },
          {
            _id: '2',
            title: 'Timeless',
            subtitle: 'Elegance',
            description: 'Discover our curated collection of women\'s fashion.',
            imageUrl: '/images/banner2.png',
            altText: 'Fashion Collection',
          }
        ])
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

  if (loading || banners.length === 0) {
    return (
      <section className="relative w-full overflow-hidden" style={{ aspectRatio: '9/16' }}>
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      </section>
    )
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ aspectRatio: '9/16' }}>
      <div className="relative w-full h-full overflow-hidden">
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
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.altText || banner.title}
                      fill
                      priority={index === 0}
                      quality={80}
                      sizes="100vw"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - Smaller for mobile */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/30 backdrop-blur-sm rounded-full p-2 active:bg-white/50 transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-4 w-4 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/30 backdrop-blur-sm rounded-full p-2 active:bg-white/50 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4 text-white" />
      </button>

      {/* Dot Indicators - Compact for mobile */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white w-6'
                : 'bg-white/50 active:bg-white/75 w-1.5'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

