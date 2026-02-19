'use client'

import { useState } from 'react'
import { useIsMobile } from '@/utils/useMobile'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import NewHomepage from '@/components/NewHomepage'
import MobileNewHomepage from '@/components/mobile/MobileNewHomepage'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileFilters from '@/components/MobileFilters'
import UserProfileInsights from '@/components/UserProfileInsights'

export default function Home() {
  const isMobile = useIsMobile()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const handleFilterToggle = () => {
    setIsMobileFiltersOpen(!isMobileFiltersOpen)
  }

  const handleFilterClose = () => {
    setIsMobileFiltersOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
        onFilterClick={handleFilterToggle}
      />
      <div className="flex">
        <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-32 sm:pt-24 lg:pt-24">
          {isMobile ? <MobileNewHomepage /> : <NewHomepage />}
          <Footer />
        </main>
      </div>
      <MobileBottomNav />
      <MobileFilters isOpen={isMobileFiltersOpen} onClose={handleFilterClose} />
    </div>
  )
}