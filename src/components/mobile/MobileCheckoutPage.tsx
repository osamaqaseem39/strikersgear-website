'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useCustomer } from '@/contexts/CustomerContext'
import { X, Plus, Minus, ShoppingBag, CreditCard, MapPin, Phone, Mail, User, Lock } from 'lucide-react'
import Image from 'next/image'
import { apiClient } from '@/lib/api'

const PAKISTAN_PROVINCES = {
  'Punjab': { cities: ['Lahore', 'Karachi', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Sargodha', 'Bahawalpur', 'Sheikhupura', 'Jhelum', 'Gujrat', 'Kasur', 'Sahiwal', 'Okara', 'Mianwali', 'Attock', 'Pakpattan', 'Vehari', 'Burewala'] },
  'Sindh': { cities: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad', 'Shikarpur', 'Khairpur', 'Dadu', 'Tando Adam', 'Tando Allahyar', 'Kotri', 'Thatta', 'Badin'] },
  'Khyber Pakhtunkhwa': { cities: ['Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Kohat', 'Bannu', 'Charsadda', 'Nowshera', 'Dera Ismail Khan', 'Mansehra', 'Haripur', 'Mingora', 'Chitral', 'Timergara', 'Tank'] },
  'Balochistan': { cities: ['Quetta', 'Turbat', 'Chaman', 'Khuzdar', 'Gwadar', 'Dera Bugti', 'Sibi', 'Loralai', 'Zhob', 'Kohlu', 'Mastung', 'Kalat', 'Bolan', 'Nushki', 'Panjgur'] },
  'Azad Jammu and Kashmir': { cities: ['Muzaffarabad', 'Mirpur', 'Bhimber', 'Kotli', 'Rawalakot', 'Bagh', 'Sudhnuti', 'Hattian Bala', 'Neelum', 'Haveli', 'Poonch', 'Bhimber'] },
  'Gilgit-Baltistan': { cities: ['Gilgit', 'Skardu', 'Hunza', 'Astore', 'Ghanche', 'Shigar', 'Diamer', 'Nagar', 'Kharmang', 'Ghizer', 'Gupis-Yasin', 'Roundu'] },
  'Islamabad Capital Territory': { cities: ['Islamabad', 'Rawalpindi'] },
}

export default function MobileCheckoutPage() {
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, clearCart } = useCart()
  const { customer } = useCustomer()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null)

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
  const itemsHash = useMemo(() => 
    items.map(i => `${i.productId}-${i.quantity}-${i.size || ''}-${i.color || ''}`).join('|'),
    [items]
  )

  const calculateTotalWeight = async (): Promise<number> => {
    if (items.length === 0) return 0
    try {
      const productPromises = items.map(item => apiClient.getProduct(item.productId).catch(() => null))
      const products = await Promise.all(productPromises)
      let totalWeight = 0
      items.forEach((item, index) => {
        const product = products[index]
        if (product) {
          let itemWeight = 0
          if ((item.size || item.color) && (product as any).variations) {
            const variation = (product as any).variations.find((v: any) => 
              (!item.size || v.size === item.size) && (!item.color || v.color === item.color)
            )
            if (variation && variation.weight) {
              itemWeight = variation.weight
            }
          }
          if (itemWeight === 0) {
            itemWeight = (product as any).weight || (product as any).shippingWeight || 0
          }
          totalWeight += itemWeight * item.quantity
        }
      })
      return totalWeight
    } catch (error) {
      console.error('Error calculating weight:', error)
      return 0
    }
  }

  useEffect(() => {
    const fetchShippingCost = async () => {
      if (!formData.province || !formData.city || !formData.country) {
        setShippingCost(0)
        setEstimatedDays(null)
        return
      }

      setCalculatingShipping(true)
      try {
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

        const cost = response.totalCost || (response.availableMethods?.[0]?.cost || 0)
        const days = response.availableMethods?.[0]?.estimatedDays || null
        setShippingCost(cost === 0 ? 0 : cost)
        setEstimatedDays(days)
      } catch (err: any) {
        console.error('Error calculating shipping:', err)
        setShippingCost(500)
        setEstimatedDays(null)
      } finally {
        setCalculatingShipping(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchShippingCost()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData.province, formData.city, formData.country, formData.postalCode, total, itemsHash])

  const shipping = shippingCost
  const finalTotal = total + shipping

  const availableCities = formData.province 
    ? PAKISTAN_PROVINCES[formData.province as keyof typeof PAKISTAN_PROVINCES]?.cities || []
    : []

  useEffect(() => {
    if (formData.province) {
      setFormData(prev => ({ ...prev, city: '' }))
    }
  }, [formData.province])

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
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.province || !formData.city) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      const orderData: any = {
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
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          total: item.price * item.quantity,
        })),
        total: finalTotal,
        subtotal: total,
        shippingTotal: shipping,
        discountTotal: 0,
        taxTotal: 0,
        paymentMethod: formData.paymentMethod,
        currency: 'PKR',
      }

      try {
        const order = await apiClient.createOrder(orderData)
        clearCart()
        router.push(`/checkout/success?orderId=${order._id}`)
      } catch (apiError: any) {
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-sm text-gray-600 mb-6">Add items to your cart to proceed</p>
          <a href="/shop" className="btn-primary inline-block text-sm py-2">
            Continue Shopping
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-2">
          <nav className="flex items-center space-x-1 text-xs overflow-x-auto">
            <a href="/" className="text-gray-500">Home</a>
            <span className="text-gray-400">/</span>
            <a href="/shop" className="text-gray-500">Shop</a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">Checkout</span>
          </nav>
        </div>
      </div>

      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-primary-600" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-600" />
              Shipping Address
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Province *</label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select Province</option>
                  {Object.keys(PAKISTAN_PROVINCES).map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.province}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                >
                  <option value="">Select City</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              {formData.province && formData.city && (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">Delivery</p>
                      <p className="text-[10px] text-gray-600 mt-1">{formData.city}, {formData.province}</p>
                    </div>
                    <div className="text-right">
                      {calculatingShipping ? (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                          <span className="text-[10px] text-gray-500">Calculating...</span>
                        </div>
                      ) : shipping === 0 ? (
                        <span className="text-xs font-bold text-green-600">Free</span>
                      ) : (
                        <span className="text-xs font-bold text-primary-600">PKR {shipping.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-600" />
              Payment Method
            </h2>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={formData.paymentMethod === 'cash_on_delivery'}
                  onChange={handleInputChange}
                  className="mr-2 h-3 w-3 text-primary-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Cash on Delivery</span>
                  <p className="text-xs text-gray-600">Pay when you receive</p>
                </div>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={formData.paymentMethod === 'bank_transfer'}
                  onChange={handleInputChange}
                  className="mr-2 h-3 w-3 text-primary-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
                  <p className="text-xs text-gray-600">Transfer to bank account</p>
                </div>
              </label>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map((item, index) => (
                <div key={`${item.productId}-${item.size || 'no-size'}-${item.color || 'no-color'}-${index}`} className="flex gap-2 pb-3 border-b border-gray-100 last:border-0">
                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {item.image ? (
                      item.image.startsWith('http') ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                      ) : (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/1.png' }} />
                      )
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-900 truncate">{item.name}</h3>
                    {(item.size || item.color) && (
                      <p className="text-[10px] text-gray-600">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.size && item.color && <span className="mx-1">•</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </p>
                    )}
                    <p className="text-xs font-medium text-primary-600 mt-1">
                      PKR {(item.price * item.quantity).toLocaleString()} x{item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>PKR {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>
                  {!formData.province || !formData.city ? (
                    <span className="text-[10px] text-gray-400">Select location</span>
                  ) : calculatingShipping ? (
                    <div className="flex items-center gap-1">
                      <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-primary-600"></div>
                      <span className="text-[10px]">Calculating...</span>
                    </div>
                  ) : shipping === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    `PKR ${shipping.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="flex justifyBetween text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-primary-600">PKR {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Place Order
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

