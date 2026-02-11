'use client'

import { Search, ShoppingBag, User, ChevronDown, Menu, X, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient, Category } from '@/lib/api'

interface HeaderProps {
  onMenuClick: () => void
  isMobileMenuOpen: boolean
  onFilterClick?: () => void
}

export default function Header({ onMenuClick, isMobileMenuOpen, onFilterClick }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [mobileSearchQuery, setMobileSearchQuery] = useState<string>('')
  const [showMobileSearchDropdown, setShowMobileSearchDropdown] = useState(false)
  const { itemCount, message, openCart } = useCart()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Get all categories from default /categories endpoint
        const categoriesData = await apiClient.getCategories()
        setCategories(categoriesData)
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Keep empty array on error, will just show "All Categories"
      }
    }

    fetchCategories()
  }, [])

  // Filter categories based on search query, or show all if no query
  const filteredCategories = searchQuery.trim()
    ? categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories

  // Filter categories for mobile search
  const filteredMobileCategories = mobileSearchQuery.trim()
    ? categories.filter(category =>
        category.name.toLowerCase().includes(mobileSearchQuery.toLowerCase())
      )
    : categories

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}${selectedCategory ? `&category=${selectedCategory}` : ''}`
    }
    setShowSearchDropdown(false)
  }

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mobileSearchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`
    }
    setShowMobileSearchDropdown(false)
  }

  const handleCategoryClick = (category: Category) => {
    window.location.href = `/shop?category=${category.slug || category.name || category._id}`
    setShowSearchDropdown(false)
  }

  const handleMobileCategoryClick = (category: Category) => {
    window.location.href = `/shop?category=${category.slug || category.name || category._id}`
    setShowMobileSearchDropdown(false)
  }

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-[100] hidden lg:block w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="/" className="flex items-center">
                <Image
                  src="/images/logo.png"
                  alt="Striker Gear"
                  width={100}
                  height={100}
                  className="h-20 w-auto"
                />
              </a>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="flex shadow-lg rounded-xl overflow-hidden bg-white border border-gray-200 hover:border-primary-300 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 transition-all duration-200">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-sm font-medium text-gray-700 focus:outline-none border-r border-gray-200 hover:from-gray-100 hover:to-gray-200 transition-colors"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSearchDropdown(true)
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                    onBlur={() => {
                      // Delay hiding to allow clicks on dropdown items
                      setTimeout(() => setShowSearchDropdown(false), 200)
                    }}
                    placeholder="Search pieces, brands, styles..."
                    className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none bg-white"
                  />
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 transition-all duration-200 flex items-center gap-2 font-medium"
                  >
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
                {/* Categories dropdown */}
                {showSearchDropdown && filteredCategories.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
                      <div className="space-y-1">
                        {filteredCategories.map((category) => (
                          <button
                            key={category._id}
                            type="button"
                            onClick={() => handleCategoryClick(category)}
                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded transition-colors"
                          >
                            <span className="capitalize-first">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              {/* Delivery/Currency */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Deliver To</span>
                <ChevronDown className="h-4 w-4" />
                <span className="mx-2">|</span>
                <span>Currency</span>
                <ChevronDown className="h-4 w-4" />
              </div>

              {/* Shopping Cart */}
              <div className="relative">
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -top-12 right-0 bg-primary-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50"
                    >
                      {message}
                      <div className="absolute bottom-0 right-4 transform translate-y-full">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary-600"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    openCart()
                  }}
                >
                  <ShoppingBag className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>Sign In / Register</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Account
                      </a>
                      <a href="/dashboard/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Orders
                      </a>
                      <a href="/dashboard/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Wishlist
                      </a>
                      <div className="border-t border-gray-100" />
                      <a href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign In
                      </a>
                      <a href="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Register
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-[100] lg:hidden w-full">
        <div className="px-4">
          <div className="flex items-center justify-between h-20">
            {/* Menu Button */}
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <div className="flex-1 text-center">
              <a href="/" className="flex items-center justify-center">
                <Image
                  src="/images/logo.png"
                  alt="Striker Gear"
                  width={100}
                  height={40}
                  className="h-10 w-auto"
                />
              </a>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-700 hover:text-primary-600 transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <div className="relative">
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute -top-12 right-0 bg-primary-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50"
                    >
                      {message}
                      <div className="absolute bottom-0 right-4 transform translate-y-full">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary-600"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    openCart()
                  }}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary-500 text-black text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3">
            <form onSubmit={handleMobileSearchSubmit} className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={mobileSearchQuery}
                  onChange={(e) => {
                    setMobileSearchQuery(e.target.value)
                    setShowMobileSearchDropdown(true)
                  }}
                  onFocus={() => setShowMobileSearchDropdown(true)}
                  onBlur={() => {
                    // Delay hiding to allow clicks on dropdown items
                    setTimeout(() => setShowMobileSearchDropdown(false), 200)
                  }}
                  placeholder="Search pieces..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
                {/* Mobile Categories dropdown */}
                {showMobileSearchDropdown && filteredMobileCategories.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Categories</p>
                      <div className="space-y-1">
                        {filteredMobileCategories.map((category) => (
                          <button
                            key={category._id}
                            type="button"
                            onClick={() => handleMobileCategoryClick(category)}
                            className="block w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded transition-colors"
                          >
                            <span className="capitalize-first">{category.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {onFilterClick && (
                <button
                  type="button"
                  onClick={onFilterClick}
                  className="p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      </header>
    </>
  )
}