'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product } from '@/lib/api'

interface UserProfile {
  id: string
  ipAddress: string
  userAgent: string
  location?: {
    country: string
    city: string
    region: string
  }
  preferences: {
    favoriteCategories: string[]
    priceRange: {
      min: number
      max: number
    }
    favoriteColors: string[]
    favoriteBrands: string[]
    sizePreferences: string[]
    bodyType: string[]
    occasion: string[]
    season: string[]
  }
  behavior: {
    totalVisits: number
    lastVisit: string
    averageSessionDuration: number
    pagesViewed: string[]
    searchHistory: string[]
    clickPatterns: {
      productClicks: number
      categoryClicks: number
      brandClicks: number
      searchClicks: number
    }
    purchaseHistory: {
      totalPurchases: number
      totalSpent: number
      averageOrderValue: number
      lastPurchase: string
    }
  }
  recommendations: {
    suggestedProducts: string[]
    trendingCategories: string[]
    personalizedOffers: string[]
  }
}

interface AnalyticsEvent {
  type: 'page_view' | 'product_view' | 'search' | 'category_click' | 'brand_click' | 'add_to_cart' | 'purchase' | 'scroll' | 'time_on_page'
  data: any
  timestamp: string
  sessionId: string
}

interface AnalyticsContextType {
  userProfile: UserProfile | null
  isTrackingEnabled: boolean
  trackEvent: (event: AnalyticsEvent) => void
  updateUserProfile: (updates: Partial<UserProfile>) => void
  getPersonalizedRecommendations: () => Product[]
  getTrendingProducts: () => Product[]
  getRecommendedCategories: () => string[]
  getPersonalizedOffers: () => string[]
  enableTracking: () => void
  disableTracking: () => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false)
  const [sessionId] = useState(() => generateSessionId())

  // Initialize analytics on mount
  useEffect(() => {
    initializeAnalytics()
  }, [])

  const initializeAnalytics = async () => {
    try {
      // Check if user has consented to tracking
      const consent = localStorage.getItem('analytics-consent')
      if (consent === 'true') {
        setIsTrackingEnabled(true)
        await loadUserProfile()
      } else {
        // Show consent banner
        showConsentBanner()
      }
    } catch (error) {
      console.error('Error initializing analytics:', error)
    }
  }

  const showConsentBanner = () => {
    // This would typically show a GDPR consent banner
    // For now, we'll assume consent is given
    localStorage.setItem('analytics-consent', 'true')
    setIsTrackingEnabled(true)
    initializeAnalytics()
  }

  const loadUserProfile = async () => {
    try {
      // Try to get existing profile from localStorage
      const storedProfile = localStorage.getItem('user-profile')
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile))
        return
      }

      // Create new profile
      const profile = await createUserProfile()
      setUserProfile(profile)
      localStorage.setItem('user-profile', JSON.stringify(profile))
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const createUserProfile = async (): Promise<UserProfile> => {
    // Get IP address and location
    const ipData = await getIPAndLocation()
    
    const profile: UserProfile = {
      id: generateUserId(),
      ipAddress: ipData.ip,
      userAgent: navigator.userAgent,
      location: ipData.location,
      preferences: {
        favoriteCategories: [],
        priceRange: { min: 0, max: 10000 },
        favoriteColors: [],
        favoriteBrands: [],
        sizePreferences: [],
        bodyType: [],
        occasion: [],
        season: []
      },
      behavior: {
        totalVisits: 1,
        lastVisit: new Date().toISOString(),
        averageSessionDuration: 0,
        pagesViewed: [],
        searchHistory: [],
        clickPatterns: {
          productClicks: 0,
          categoryClicks: 0,
          brandClicks: 0,
          searchClicks: 0
        },
        purchaseHistory: {
          totalPurchases: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastPurchase: ''
        }
      },
      recommendations: {
        suggestedProducts: [],
        trendingCategories: [],
        personalizedOffers: []
      }
    }

    return profile
  }

  const getIPAndLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return {
        ip: data.ip,
        location: {
          country: data.country_name,
          city: data.city,
          region: data.region
        }
      }
    } catch (error) {
      console.error('Error fetching IP data:', error)
      return {
        ip: 'unknown',
        location: undefined
      }
    }
  }

  const trackEvent = (event: AnalyticsEvent) => {
    if (!isTrackingEnabled || !userProfile) return

    // Update user profile based on event
    updateProfileFromEvent(event)
    
    // Store event for analysis
    storeEvent(event)
    
    // Update recommendations
    updateRecommendations()
  }

  const updateProfileFromEvent = (event: AnalyticsEvent) => {
    if (!userProfile) return

    const updatedProfile = { ...userProfile }

    switch (event.type) {
      case 'page_view':
        updatedProfile.behavior.pagesViewed.push(event.data.page)
        updatedProfile.behavior.totalVisits += 1
        updatedProfile.behavior.lastVisit = new Date().toISOString()
        break

      case 'product_view':
        updatedProfile.behavior.clickPatterns.productClicks += 1
        // Learn from product preferences
        if (event.data.product) {
          learnFromProductView(event.data.product, updatedProfile)
        }
        break

      case 'search':
        updatedProfile.behavior.searchHistory.push(event.data.query)
        updatedProfile.behavior.clickPatterns.searchClicks += 1
        break

      case 'category_click':
        updatedProfile.behavior.clickPatterns.categoryClicks += 1
        if (event.data.category) {
          learnFromCategoryClick(event.data.category, updatedProfile)
        }
        break

      case 'brand_click':
        updatedProfile.behavior.clickPatterns.brandClicks += 1
        if (event.data.brand) {
          learnFromBrandClick(event.data.brand, updatedProfile)
        }
        break

      case 'purchase':
        updatedProfile.behavior.purchaseHistory.totalPurchases += 1
        updatedProfile.behavior.purchaseHistory.totalSpent += event.data.amount || 0
        updatedProfile.behavior.purchaseHistory.averageOrderValue = 
          updatedProfile.behavior.purchaseHistory.totalSpent / updatedProfile.behavior.purchaseHistory.totalPurchases
        updatedProfile.behavior.purchaseHistory.lastPurchase = new Date().toISOString()
        break
    }

    setUserProfile(updatedProfile)
    localStorage.setItem('user-profile', JSON.stringify(updatedProfile))
  }

  const learnFromProductView = (product: Product, profile: UserProfile) => {
    // Learn from product attributes
    if (product.categories) {
      product.categories.forEach(category => {
        if (!profile.preferences.favoriteCategories.includes(category)) {
          profile.preferences.favoriteCategories.push(category)
        }
      })
    }

    if (product.colors) {
      product.colors.forEach(color => {
        if (!profile.preferences.favoriteColors.includes(color)) {
          profile.preferences.favoriteColors.push(color)
        }
      })
    }

    if (product.brand) {
      if (!profile.preferences.favoriteBrands.includes(product.brand)) {
        profile.preferences.favoriteBrands.push(product.brand)
      }
    }

    if (product.availableSizes) {
      product.availableSizes.forEach(size => {
        if (!profile.preferences.sizePreferences.includes(size)) {
          profile.preferences.sizePreferences.push(size)
        }
      })
    }

    // Learn from Pakistani clothing specific fields
    if (product.bodyType) {
      product.bodyType.forEach(bodyType => {
        if (!profile.preferences.bodyType.includes(bodyType)) {
          profile.preferences.bodyType.push(bodyType)
        }
      })
    }

    const productOccasion = (product as any).occasion
    if (productOccasion) {
      if (!profile.preferences.occasion.includes(productOccasion)) {
        profile.preferences.occasion.push(productOccasion)
      }
    }

    const productSeason = (product as any).season
    if (productSeason) {
      if (!profile.preferences.season.includes(productSeason)) {
        profile.preferences.season.push(productSeason)
      }
    }

    // Update price range based on viewed products
    if (product.price) {
      if (product.price < profile.preferences.priceRange.min) {
        profile.preferences.priceRange.min = product.price
      }
      if (product.price > profile.preferences.priceRange.max) {
        profile.preferences.priceRange.max = product.price
      }
    }
  }

  const learnFromCategoryClick = (category: string, profile: UserProfile) => {
    if (!profile.preferences.favoriteCategories.includes(category)) {
      profile.preferences.favoriteCategories.push(category)
    }
  }

  const learnFromBrandClick = (brand: string, profile: UserProfile) => {
    if (!profile.preferences.favoriteBrands.includes(brand)) {
      profile.preferences.favoriteBrands.push(brand)
    }
  }

  const storeEvent = (event: AnalyticsEvent) => {
    try {
      const events = JSON.parse(localStorage.getItem('analytics-events') || '[]')
      events.push(event)
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000)
      }
      localStorage.setItem('analytics-events', JSON.stringify(events))
    } catch (error) {
      console.error('Error storing event:', error)
    }
  }

  const updateRecommendations = () => {
    if (!userProfile) return

    // This would typically call an API to get personalized recommendations
    // For now, we'll generate basic recommendations based on preferences
    const recommendations = generateRecommendations(userProfile)
    
    setUserProfile(prev => prev ? {
      ...prev,
      recommendations
    } : null)
  }

  const generateRecommendations = (profile: UserProfile) => {
    // Generate recommendations based on user preferences
    const suggestedProducts: string[] = []
    const trendingCategories: string[] = []
    const personalizedOffers: string[] = []

    // Add personalized offers based on behavior
    if (profile.behavior.purchaseHistory.totalPurchases > 0) {
      personalizedOffers.push('VIP Customer Discount')
    }

    if (profile.preferences.favoriteCategories.includes('evening-wear')) {
      personalizedOffers.push('Evening Wear Collection')
    }

    return {
      suggestedProducts,
      trendingCategories,
      personalizedOffers
    }
  }

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    if (!userProfile) return

    const updatedProfile = { ...userProfile, ...updates }
    setUserProfile(updatedProfile)
    localStorage.setItem('user-profile', JSON.stringify(updatedProfile))
  }

  const getPersonalizedRecommendations = (): Product[] => {
    // This would typically fetch from an API
    // For now, return empty array
    return []
  }

  const getTrendingProducts = (): Product[] => {
    // This would typically fetch from an API
    // For now, return empty array
    return []
  }

  const getRecommendedCategories = (): string[] => {
    if (!userProfile) return []
    return userProfile.preferences.favoriteCategories
  }

  const getPersonalizedOffers = (): string[] => {
    if (!userProfile) return []
    return userProfile.recommendations.personalizedOffers
  }

  const enableTracking = () => {
    setIsTrackingEnabled(true)
    localStorage.setItem('analytics-consent', 'true')
  }

  const disableTracking = () => {
    setIsTrackingEnabled(false)
    localStorage.setItem('analytics-consent', 'false')
    localStorage.removeItem('user-profile')
    localStorage.removeItem('analytics-events')
  }

  return (
    <AnalyticsContext.Provider value={{
      userProfile,
      isTrackingEnabled,
      trackEvent,
      updateUserProfile,
      getPersonalizedRecommendations,
      getTrendingProducts,
      getRecommendedCategories,
      getPersonalizedOffers,
      enableTracking,
      disableTracking
    }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Utility functions
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}
