'use client'

import { useState } from 'react'
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { itemCount } = useCart()

  const categories = [
    'Evening Wear',
    'Day Dresses', 
    'Couture',
    'Accessories',
    'Jewelry',
    'Bridal'
  ]

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-serif font-bold text-gradient">Striker Gear</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="/products"
                className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
              >
                All Products
              </a>
              <a
                href="/categories"
                className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
              >
                Categories
              </a>
              <a
                href="/brands"
                className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
              >
                Brands
              </a>
              {categories.map((category) => (
                <a
                  key={category}
                  href="#"
                  className="text-gray-700 hover:text-black px-3 py-2 text-sm font-medium transition-colors"
                >
                  {category}
                </a>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:block flex-1 max-w-lg mx-8">
            <form action="/search" method="GET" className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                name="q"
                placeholder="Search pieces..."
                className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </form>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <a 
              href="/dashboard"
              className="p-2 text-gray-700 hover:text-black transition-colors"
            >
              <User className="h-5 w-5" />
            </a>
            <button 
              className="p-2 text-gray-700 hover:text-black transition-colors relative"
              onClick={(e) => {
                e.preventDefault()
                // Prevent navigation to cart page
              }}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-black"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <form action="/search" method="GET" className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              name="q"
              placeholder="Search pieces..."
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="/products"
                className="text-gray-700 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </a>
              <a
                href="/categories"
                className="text-gray-700 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </a>
              <a
                href="/brands"
                className="text-gray-700 hover:text-black block px-3 py-2 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Brands
              </a>
              {categories.map((category) => (
                <a
                  key={category}
                  href="#"
                  className="text-gray-700 hover:text-black block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}