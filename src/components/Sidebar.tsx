'use client'

import { Heart, ShoppingBag, User, X, Home, Sparkles, Tag, Percent, Grid } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient, Category } from '@/lib/api'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        // Fetch all categories to match what's shown on the home page
        const data = await apiClient.getCategories()
        
        // Filter active categories and sort by sortOrder
        const activeCategories = data
          .filter(cat => cat.isActive !== false && cat.name)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        
        setCategories(activeCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const toggleExpanded = (item: string) => {
    setExpandedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    )
  }

  const handleLinkClick = () => {
    onClose()
  }

  // Capitalize first letter only
  const capitalizeFirst = (text: string): string => {
    if (!text) return text
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  const navigationItems = [
    { name: 'All', href: '/shop', icon: Home },
    { name: 'New Arrivals', href: '/shop?filter=new', icon: Sparkles },
    { name: 'Brands', href: '/brands', icon: Tag },
    { name: 'Sale', href: '/shop?filter=sale', icon: Percent },
  ]

  const accountItems = [
    { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
    { name: 'Sign In / Register', href: '/login', icon: User },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-24 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40">
        <div className="p-6">
          {/* Main Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item, index) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </div>
                </Link>
              </div>
            ))}
          </nav>

          {/* Categories Section */}
          {categoriesLoading ? (
            <div className="my-6">
              <div className="px-3 py-2">
                <div className="animate-pulse space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : categories.length > 0 ? (
            <>
              <div className="my-6 border-t border-gray-200" />
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Categories
                </h3>
                <nav className="mt-2 space-y-1">
                  {categories.map((category) => (
                    <Link
                      key={category._id || category.slug}
                      href={`/categories/${category.slug || category._id}`}
                      className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Grid className="h-4 w-4" />
                      <span>{capitalizeFirst(category.name)}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </>
          ) : null}

          {/* Separator */}
          <div className="my-6 border-t border-gray-200" />

          {/* Account Section */}
          <nav className="space-y-2">
            {accountItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold text-gradient">Striker Gear</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Main Navigation */}
              <nav className="space-y-2">
                {navigationItems.map((item, index) => (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      onClick={handleLinkClick}
                      className="flex items-center justify-between w-full px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.name}</span>
                      </div>
                    </Link>
                    
                    {/* Submenu removed for Women */}
                  </div>
                ))}
              </nav>

              {/* Categories Section */}
              {categoriesLoading ? (
                <div className="my-6">
                  <div className="px-3 py-2">
                    <div className="animate-pulse space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-8 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : categories.length > 0 ? (
                <>
                  <div className="my-6 border-t border-gray-200" />
                  <div>
                    <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Categories
                    </h3>
                    <nav className="mt-2 space-y-1">
                      {categories.map((category) => (
                        <Link
                          key={category._id || category.slug}
                          href={`/categories/${category.slug || category._id}`}
                          onClick={handleLinkClick}
                          className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Grid className="h-4 w-4" />
                          <span>{capitalizeFirst(category.name)}</span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </>
              ) : null}

              {/* Separator */}
              <div className="my-6 border-t border-gray-200" />

              {/* Account Section */}
              <nav className="space-y-2">
                {accountItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className="flex items-center space-x-3 px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}