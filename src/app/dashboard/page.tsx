'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, CreditCard, MapPin, Heart, Star, TrendingUp } from 'lucide-react'
import { useCustomer } from '@/contexts/CustomerContext'
import { apiClient } from '@/lib/api'

interface Order {
  _id: string
  orderNumber: string
  status: string
  totalAmount: number
  items: any[]
  createdAt: string
}

export default function Dashboard() {
  const { customer, isLoading: customerLoading, token } = useCustomer()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
    reviewsGiven: 0
  })

  useEffect(() => {
    if (!customerLoading && customer && token) {
      fetchDashboardData()
    } else if (!customerLoading && !customer) {
      setLoading(false)
    }
  }, [customer, customerLoading, token])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      if (!customer?._id || !token) return

      // Fetch recent orders
      const response = await apiClient.getCustomerOrders(customer._id, { page: 1, limit: 5 }, token)
      const fetchedOrders = response.data || []
      setOrders(fetchedOrders)
      
      // Calculate stats
      const totalOrders = response.total || 0
      const totalSpent = fetchedOrders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0)
      
      setStats({
        totalOrders,
        totalSpent: Math.round(totalSpent),
        wishlistItems: 0, // TODO: Connect to wishlist API
        reviewsGiven: 0    // TODO: Connect to reviews API
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || customerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
          <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {customer.firstName || customer.email?.split('@')[0] || 'User'}! 👋
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Here's what's happening with your account and orders.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-xs text-green-600 mt-1">Recently placed</p>
            </div>
            <div className="p-2 sm:p-3 bg-gray-100 rounded-full">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">${stats.totalSpent}</p>
              <p className="text-xs text-green-600 mt-1">This month</p>
            </div>
            <div className="p-2 sm:p-3 bg-gray-100 rounded-full">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Wishlist Items</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.wishlistItems}</p>
              <p className="text-xs text-green-600 mt-1">Saved for later</p>
            </div>
            <div className="p-2 sm:p-3 bg-gray-100 rounded-full">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Reviews Given</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.reviewsGiven}</p>
              <p className="text-xs text-green-600 mt-1">All positive</p>
            </div>
            <div className="p-2 sm:p-3 bg-gray-100 rounded-full">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h2>
            <a href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All Orders
            </a>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {orders.length > 0 ? orders.map((order) => {
            const orderDate = new Date(order.createdAt).toLocaleDateString()
            const itemCount = order.items?.length || 0
            const statusColors = {
              'Delivered': 'bg-green-100 text-green-800',
              'Shipped': 'bg-blue-100 text-blue-800',
              'Processing': 'bg-yellow-100 text-yellow-800',
              'Pending': 'bg-gray-100 text-gray-800'
            }
            
            return (
              <div key={order._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Order {order.orderNumber || order._id.slice(-8)}</p>
                        <p className="text-xs sm:text-sm text-gray-500">{orderDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs sm:text-sm text-gray-600">
                      <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                      <span>${order.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <a 
                    href={`/dashboard/orders/${order._id}`}
                    className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium self-start sm:self-auto"
                  >
                    View Details
                  </a>
                </div>
              </div>
            )
          }) : (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm sm:text-base">No orders yet. Start shopping!</p>
              <a href="/shop" className="text-blue-600 hover:text-blue-700 underline mt-2 inline-block text-sm sm:text-base">
                Browse Products
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href="/dashboard/addresses" className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Addresses</p>
                <p className="text-sm text-gray-600">Update shipping info</p>
              </div>
            </div>
          </a>
          
          <a href="/dashboard/wishlist" className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Wishlist</p>
                <p className="text-sm text-gray-600">View saved items</p>
              </div>
            </div>
          </a>
          
          <a href="/dashboard/orders" className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Order History</p>
                <p className="text-sm text-gray-600">View all orders</p>
              </div>
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  )
}