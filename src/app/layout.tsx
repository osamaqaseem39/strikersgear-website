import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import './globals.css'
import { RecentlyViewedProvider } from '@/contexts/RecentlyViewedContext'
import { AnalyticsProvider } from '@/contexts/AnalyticsContext'
import { CustomerProvider } from '@/contexts/CustomerContext'
import { CartProvider } from '@/contexts/CartContext'
import { ProductsProvider } from '@/contexts/ProductsContext'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import WhatsAppButton from '@/components/WhatsAppButton'
import CartDrawer from '@/components/CartDrawer'
import PerformanceOptimizations from '@/components/PerformanceOptimizations'

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})
const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Strikers Gear - Football Cleats & Sports Accessories',
  description:
    'Strikers Gear is your football-focused sports shop for premium cleats, grip socks and grippers, football jerseys, shin pads, and performance socks.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to API and image domains for faster loading */}
        <link rel="preconnect" href="https://st.osamaqaseem.online" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://st.osamaqaseem.online" />
        <link rel="preconnect" href="https://clothing-server-cyan.vercel.app" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://clothing-server-cyan.vercel.app" />
      </head>
      <body className={`${manrope.variable} ${cormorant.variable} font-sans`}>
        <PerformanceOptimizations />
        <CustomerProvider>
          <AnalyticsProvider>
            <ProductsProvider>
              <CartProvider>
                <RecentlyViewedProvider>
                  {children}
                  <CartDrawer />
                  <CookieConsentBanner />
                  <WhatsAppButton />
                </RecentlyViewedProvider>
              </CartProvider>
            </ProductsProvider>
          </AnalyticsProvider>
        </CustomerProvider>
      </body>
    </html>
  )
}