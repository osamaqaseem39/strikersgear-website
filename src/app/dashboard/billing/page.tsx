'use client'

import { useState, useEffect } from 'react'
import { useCustomer } from '@/contexts/CustomerContext'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import { CreditCard, Receipt, Calendar } from 'lucide-react'

export default function BillingPage() {
  const { customer, token } = useCustomer()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSpent, setTotalSpent] = useState(0)
  const [orderStats, setOrderStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  })

  useEffect(() => {
    if (customer?._id && token) {
      fetchBillingData()
    }
  }, [customer, token])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      if (!customer?._id || !token) return

      const response = await apiClient.getCustomerOrders(customer._id, { page: 1, limit: 100 }, token)
      const allOrders = response.data || []
      
      setOrders(allOrders)
      
      // Calculate statistics
      const total = allOrders.length
      const completed = allOrders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length
      const pending = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'processing').length
      const cancelled = allOrders.filter((o: any) => o.status === 'cancelled').length
      
      setOrderStats({ total, completed, pending, cancelled })
      
      // Calculate total spent
      const spent = allOrders
        .filter((o: any) => o.status !== 'cancelled')
        .reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
      
      setTotalSpent(spent)
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">PKR {totalSpent.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.completed}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Order History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No orders found</p>
            </div>
          ) : (
            orders.map((order: any) => {
              const orderDate = new Date(order.createdAt).toLocaleDateString()
              const statusColors = {
                'delivered': 'bg-green-100 text-green-800',
                'completed': 'bg-green-100 text-green-800',
                'shipped': 'bg-blue-100 text-blue-800',
                'processing': 'bg-yellow-100 text-yellow-800',
                'pending': 'bg-gray-100 text-gray-800',
                'cancelled': 'bg-red-100 text-red-800',
              }
              
              return (
                <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <p className="font-medium text-gray-900">
                          Order {order.orderNumber || order._id?.slice(-8) || 'N/A'}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status?.toLowerCase() as keyof typeof statusColors] || 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{orderDate}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Payment: {order.paymentMethod || 'COD'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        PKR {order.totalAmount?.toLocaleString() || '0'}
                      </p>
                      <a
                        href={`/dashboard/orders/${order._id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>

      {/* Payment Methods Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong className="text-gray-900">Accepted Payment Methods:</strong> Cash on Delivery (COD)
          </p>
          <p>
            <strong className="text-gray-900">Billing Address:</strong> Same as shipping address
          </p>
          <p>
            <strong className="text-gray-900">Currency:</strong> Pakistani Rupee (PKR)
          </p>
        </div>
      </motion.div>
    </div>
  )
}
