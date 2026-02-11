'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/utils/useMobile'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileCheckoutPage from '@/components/mobile/MobileCheckoutPage'
import { useCart } from '@/contexts/CartContext'
import { useCustomer } from '@/contexts/CustomerContext'
import { X, Plus, Minus, ShoppingBag, CreditCard, MapPin, Phone, Mail, User, ChevronRight, Lock } from 'lucide-react'
import Image from 'next/image'
import { apiClient } from '@/lib/api'

// Pakistan Provinces and Cities (for dropdowns only - delivery charges fetched from backend)
const PAKISTAN_PROVINCES = {
  'Punjab': {
    cities: ['Lahore', 'Karachi', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Sargodha', 'Bahawalpur', 'Sheikhupura', 'Jhelum', 'Gujrat', 'Kasur', 'Sahiwal', 'Okara', 'Mianwali', 'Attock', 'Pakpattan', 'Vehari', 'Burewala'],
  },
  'Sindh': {
    cities: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad', 'Shikarpur', 'Khairpur', 'Dadu', 'Tando Adam', 'Tando Allahyar', 'Kotri', 'Thatta', 'Badin'],
  },
  'Khyber Pakhtunkhwa': {
    cities: ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Kohat', 'Bannu', 'Charsadda', 'Nowshera', 'Dera Ismail Khan', 'Mansehra', 'Haripur', 'Mingora', 'Chitral', 'Timergara', 'Tank'],
  },
  'Balochistan': {
    cities: ['Quetta', 'Turbat', 'Chaman', 'Khuzdar', 'Gwadar', 'Dera Bugti', 'Sibi', 'Loralai', 'Zhob', 'Kohlu', 'Mastung', 'Kalat', 'Bolan', 'Nushki', 'Panjgur'],
  },
  'Azad Jammu and Kashmir': {
    cities: ['Muzaffarabad', 'Mirpur', 'Bhimber', 'Kotli', 'Rawalakot', 'Bagh', 'Sudhnuti', 'Hattian Bala', 'Neelum', 'Haveli', 'Poonch', 'Bhimber'],
  },
  'Gilgit-Baltistan': {
    cities: ['Gilgit', 'Skardu', 'Hunza', 'Astore', 'Ghanche', 'Shigar', 'Diamer', 'Nagar', 'Kharmang', 'Ghizer', 'Gupis-Yasin', 'Roundu'],
  },
  'Islamabad Capital Territory': {
    cities: ['Islamabad', 'Rawalpindi'],
  },
}

export default function CheckoutPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { items, itemCount, updateQuantity, removeFromCart, clearCart } = useCart()
  const { customer } = useCustomer()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null)
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    province: '',
    city: '',
    postalCode: '',
    country: 'PK',
    paymentMethod: 'cash_on_delivery',
  })

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Create a stable hash of items for dependency tracking
  const itemsHash = useMemo(() => 
    items.map(i => `${i.productId}-${i.quantity}-${i.size || ''}-${i.color || ''}`).join('|'),
    [items]
  )
  
  // Calculate total weight from cart items
  const calculateTotalWeight = async (): Promise<number> => {
    if (items.length === 0) return 0
    
    try {
      // Fetch product details for all cart items to get weight
      const productPromises = items.map(item => 
        apiClient.getProduct(item.productId).catch(() => null)
      )
      const products = await Promise.all(productPromises)
      
      // Calculate total weight: sum of (product weight * quantity) for each item
      let totalWeight = 0
      items.forEach((item, index) => {
        const product = products[index]
        if (product) {
          // Check for weight in product or variations
          // Priority: variation weight > product weight > shippingWeight
          let itemWeight = 0
          
          // If product has variations and we have size/color, try to find matching variation
          if ((item.size || item.color) && (product as any).variations) {
            const variation = (product as any).variations.find((v: any) => 
              (!item.size || v.size === item.size) && 
              (!item.color || v.color === item.color)
            )
            if (variation && variation.weight) {
              itemWeight = variation.weight
            }
          }
          
          // Fallback to product weight or shippingWeight
          if (itemWeight === 0) {
            itemWeight = (product as any).weight || (product as any).shippingWeight || 0
          }
          
          // Add weight * quantity to total
          totalWeight += itemWeight * item.quantity
        }
      })
      
      return totalWeight
    } catch (error) {
      console.error('Error calculating weight:', error)
      return 0
    }
  }
  
  // Fetch shipping cost from backend when province and city are selected
  useEffect(() => {
    const fetchShippingCost = async () => {
      if (!formData.province || !formData.city || !formData.country) {
        setShippingCost(0)
        setFreeShippingThreshold(null)
        setEstimatedDays(null)
        return
      }

      setCalculatingShipping(true)
      try {
        // Calculate total weight from product details
        const totalWeight = await calculateTotalWeight()
        
        const response = await apiClient.calculateShipping({
          shippingAddress: {
            country: formData.country,
            state: formData.province,
            city: formData.city,
            postalCode: formData.postalCode || undefined,
          },
          orderTotal: total,
          packageDetails: {
            itemCount: items.length,
            weight: totalWeight > 0 ? totalWeight : undefined,
          },
        })

        // Use the lowest cost shipping method or totalCost
        const cost = response.totalCost || (response.availableMethods?.[0]?.cost || 0)
        const days = response.availableMethods?.[0]?.estimatedDays || null

        // Check if shipping is free (cost is 0)
        if (cost === 0) {
          setShippingCost(0)
        } else {
          setShippingCost(cost)
        }
        
        // Note: freeShippingThreshold would need to be included in the backend response
        // For now, we rely on the backend to return cost=0 when free shipping applies
        setFreeShippingThreshold(null)
        setEstimatedDays(days)
      } catch (err: any) {
        console.error('Error calculating shipping:', err)
        // Fallback to default shipping on error
        setShippingCost(500)
        setFreeShippingThreshold(null)
        setEstimatedDays(null)
      } finally {
        setCalculatingShipping(false)
      }
    }

    // Debounce shipping calculation
    const timeoutId = setTimeout(() => {
      fetchShippingCost()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.province, formData.city, formData.country, formData.postalCode, total, itemsHash])

  const shipping = shippingCost
  const finalTotal = total + shipping

  // Get available cities for selected province
  const availableCities = formData.province 
    ? PAKISTAN_PROVINCES[formData.province as keyof typeof PAKISTAN_PROVINCES]?.cities || []
    : []

  // Reset city when province changes
  useEffect(() => {
    if (formData.province) {
      setFormData(prev => ({ ...prev, city: '' }))
    }
  }, [formData.province])

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !loading) {
      router.push('/shop')
    }
  }, [items.length, router, loading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.province || !formData.city) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Create order payload matching the DTO structure
      // Allow guest checkout - customerId is optional
      const orderData: any = {
        // Only include customerId if it exists and is a valid value
        ...(customer?._id && customer._id.trim() !== '' && { customerId: customer._id }),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.address,
          addressLine2: '',
          city: formData.city,
          state: formData.province,
          postalCode: formData.postalCode || '',
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
        },
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.address,
          addressLine2: '',
          city: formData.city,
          state: formData.province,
          postalCode: formData.postalCode || '',
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
        },
        items: items.map(item => {
          const itemSubtotal = item.price * item.quantity
          return {
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: itemSubtotal,
            total: itemSubtotal, // Can be adjusted if there are item-level discounts
            // Note: sku is optional in the DTO, but CartItem doesn't have it
            // Note: size and color are not in the DTO, but variationId can be used if needed
            // variationId: item.variationId, // Uncomment if you have variationId
          }
        }),
        total: finalTotal,
        subtotal: total,
        shippingTotal: shipping,
        discountTotal: 0,
        taxTotal: 0,
        paymentMethod: formData.paymentMethod,
        currency: 'PKR',
      }

      // Create order via API
      try {
        const order = await apiClient.createOrder(orderData)
        // Clear cart and redirect to success page with order ID
        clearCart()
        router.push(`/checkout/success?orderId=${order._id}`)
      } catch (apiError: any) {
        console.error('Order creation error:', apiError)
        // Show detailed error message
        const errorMessage = apiError.response?.data?.message || 
                           (Array.isArray(apiError.response?.data?.message) 
                             ? apiError.response.data.message.join(', ') 
                             : apiError.message) || 
                           'Failed to place order. Please try again.'
        setError(errorMessage)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to place order. Please try again.')
      setLoading(false)
    }
  }

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          onMenuClick={handleMenuToggle} 
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">Add items to your cart to proceed with checkout</p>
                <a href="/shop" className="btn-primary inline-block">
                  Continue Shopping
                </a>
              </div>
            </div>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex">
        <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
        <main className="flex-1 lg:ml-64 pb-16 lg:pb-0">
          {/* Breadcrumb */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <nav className="flex items-center space-x-2 text-sm">
                <a href="/" className="text-gray-500 hover:text-primary-600">Home</a>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <a href="/shop" className="text-gray-500 hover:text-primary-600">Shop</a>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">Checkout</span>
              </nav>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Checkout</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary-600" />
                      Customer Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary-600" />
                      Shipping Address
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Province * {formData.province && formData.city && !calculatingShipping && (
                              <span className="text-xs text-primary-600 ml-2">
                                (Delivery: PKR {shipping === 0 ? 'Free' : shipping.toLocaleString()})
                              </span>
                            )}
                          </label>
                          <select
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select Province</option>
                            {Object.keys(PAKISTAN_PROVINCES).map((province) => (
                              <option key={province} value={province}>
                                {province}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <select
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                            disabled={!formData.province}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Select City</option>
                            {availableCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                          {formData.province && availableCities.length === 0 && (
                            <p className="mt-1 text-xs text-gray-500">No cities available for this province</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="PK">Pakistan</option>
                          </select>
                        </div>
                      </div>
                      {formData.province && formData.city && (
                        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Delivery Information</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Shipping to {formData.city}, {formData.province}
                              </p>
                              {estimatedDays && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Estimated delivery: {estimatedDays} {estimatedDays === 1 ? 'day' : 'days'}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {calculatingShipping ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                  <span className="text-xs text-gray-500">Calculating...</span>
                                </div>
                              ) : shipping === 0 ? (
                                <span className="text-sm font-bold text-green-600">Free Shipping</span>
                              ) : (
                                <span className="text-sm font-bold text-primary-600">
                                  PKR {shipping.toLocaleString()}
                                </span>
                              )}
                              {!calculatingShipping && freeShippingThreshold && total < freeShippingThreshold && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Free shipping on orders over PKR {freeShippingThreshold.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary-600" />
                      Payment Method
                    </h2>
                    <div className="space-y-3">
                      <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash_on_delivery"
                          checked={formData.paymentMethod === 'cash_on_delivery'}
                          onChange={handleInputChange}
                          className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">Cash on Delivery</span>
                          <p className="text-sm text-gray-600">Pay when you receive your order</p>
                        </div>
                      </label>
                      <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={formData.paymentMethod === 'bank_transfer'}
                          onChange={handleInputChange}
                          className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">Bank Transfer</span>
                          <p className="text-sm text-gray-600">Transfer money directly to our bank account</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        Place Order
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                  
                  {/* Cart Items */}
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {items.map((item, index) => (
                      <div
                        key={`${item.productId}-${item.size || 'no-size'}-${item.color || 'no-color'}-${index}`}
                        className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
                      >
                        <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {item.image ? (
                            item.image.startsWith('http') ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/1.png'
                                }}
                              />
                            )
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ShoppingBag className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h3>
                          {(item.size || item.color) && (
                          <p className="text-xs text-gray-600">
                              {item.size && <span>Size: {item.size}</span>}
                              {item.size && item.color && <span className="mx-1">•</span>}
                              {item.color && <span>Color: {item.color}</span>}
                            </p>
                          )}
                          <p className="text-sm font-medium text-primary-600 mt-1">
                            PKR {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">x{item.quantity}</div>
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="space-y-3 pt-6 border-t border-gray-200">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>PKR {total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>
                        {!formData.province || !formData.city ? (
                          <span className="text-xs text-gray-400">Select location</span>
                        ) : calculatingShipping ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                            <span className="text-xs">Calculating...</span>
                          </div>
                        ) : shipping === 0 ? (
                          <span className="text-green-600 font-medium">Free</span>
                        ) : (
                          `PKR ${shipping.toLocaleString()}`
                        )}
                      </span>
                    </div>
                    {formData.province && formData.city && !calculatingShipping && freeShippingThreshold && total < freeShippingThreshold && shipping > 0 && (
                      <p className="text-xs text-primary-600">
                        Free shipping on orders over PKR {freeShippingThreshold.toLocaleString()}
                      </p>
                    )}
                    {(!formData.province || !formData.city) && (
                      <p className="text-xs text-gray-500">
                        Please select province and city to calculate shipping
                      </p>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-primary-600">
                        PKR {finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </main>
      </div>
      
      <MobileBottomNav />
    </div>
  )
}

