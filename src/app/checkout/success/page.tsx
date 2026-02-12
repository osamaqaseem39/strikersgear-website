'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import { CheckCircle, ShoppingBag, Home, Package, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { apiClient } from '@/lib/api'

function CheckoutSuccessPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const orderData = await apiClient.getOrder(orderId)
          setOrder(orderData)
        } catch (error) {
          console.error('Failed to fetch order:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex">
        <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0 pt-20 sm:pt-24 lg:pt-24">
          <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-2xl w-full text-center">
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-green-100 rounded-full p-4">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
                Order Placed Successfully!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Thank you for your order. We've received your order and will begin processing it right away.
              </p>

              {/* Order ID and Tracking ID */}
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : order ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary-600" />
                    Order Information
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="text-lg font-semibold text-gray-900 font-mono">{order._id}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(order._id, 'orderId')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Copy Order ID"
                      >
                        {copied === 'orderId' ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                    {order.trackingId && (
                      <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-200">
                        <div>
                          <p className="text-sm text-gray-600">Tracking ID</p>
                          <p className="text-lg font-semibold text-primary-600 font-mono">{order.trackingId}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(order.trackingId, 'trackingId')}
                          className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
                          title="Copy Tracking ID"
                        >
                          {copied === 'trackingId' ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <Copy className="h-5 w-5 text-primary-600" />
                          )}
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 mt-4">
                      {order.trackingId 
                        ? 'You can use the Tracking ID to track your order. A confirmation email has been sent to your email address.'
                        : 'A confirmation email has been sent to your email address with order details and tracking information.'}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Order Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-center gap-2 text-primary-600 mb-4">
                  <Package className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">What's Next?</h2>
                </div>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order Confirmation</p>
                      <p className="text-sm text-gray-600">You'll receive an email confirmation shortly with your order details.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Processing</p>
                      <p className="text-sm text-gray-600">We'll prepare your order for shipment.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Shipping</p>
                      <p className="text-sm text-gray-600">You'll receive tracking information once your order ships.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Continue Shopping
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Package className="h-5 w-5" />
                  View Orders
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Home className="h-5 w-5" />
                  Back to Home
                </Link>
              </div>

              {/* Help Text */}
              <p className="mt-8 text-sm text-gray-600">
                Have questions? <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">Contact us</Link>
              </p>
            </div>
          </div>

          <Footer />
        </main>
      </div>
      
      <MobileBottomNav />
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CheckoutSuccessPageInner />
    </Suspense>
  )
}

