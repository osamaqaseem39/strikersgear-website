'use client'

import { useState, useEffect } from 'react'
import { useCustomer } from '@/contexts/CustomerContext'
import { motion } from 'framer-motion'
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react'

export default function AddressesPage() {
  const { customer, token, refreshCustomer } = useCustomer()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
    isDefault: false,
  })

  const addresses = customer?.addresses || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const updatedAddresses = [...addresses]
      
      if (editingIndex !== null) {
        updatedAddresses[editingIndex] = formData
      } else {
        // If this is the first address or marked as default, set it as default
        if (formData.isDefault || updatedAddresses.length === 0) {
          updatedAddresses.forEach(addr => addr.isDefault = false)
          formData.isDefault = true
        }
        updatedAddresses.push(formData)
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${API_BASE_URL}/customers/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: updatedAddresses }),
      })

      if (!response.ok) {
        throw new Error('Failed to update addresses')
      }

      await refreshCustomer()
      setSuccess(true)
      setShowForm(false)
      setEditingIndex(null)
      setFormData({
        street: '',
        city: '',
        state: '',
        country: 'Pakistan',
        postalCode: '',
        isDefault: false,
      })
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err?.message || 'Failed to update addresses')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (index: number) => {
    const address = addresses[index]
    setFormData({
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || 'Pakistan',
      postalCode: address.postalCode || '',
      isDefault: address.isDefault || false,
    })
    setEditingIndex(index)
    setShowForm(true)
  }

  const handleDelete = async (index: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const updatedAddresses = addresses.filter((_, i) => i !== index)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${API_BASE_URL}/customers/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: updatedAddresses }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete address')
      }

      await refreshCustomer()
    } catch (err: any) {
      setError(err?.message || 'Failed to delete address')
    }
  }

  const handleSetDefault = async (index: number) => {
    try {
      const updatedAddresses = addresses.map((addr, i) => ({
        ...addr,
        isDefault: i === index,
      }))

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${API_BASE_URL}/customers/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: updatedAddresses }),
      })

      if (!response.ok) {
        throw new Error('Failed to update default address')
      }

      await refreshCustomer()
    } catch (err: any) {
      setError(err?.message || 'Failed to update default address')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Addresses</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingIndex(null)
            setFormData({
              street: '',
              city: '',
              state: '',
              country: 'Pakistan',
              postalCode: '',
              isDefault: false,
            })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Address
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Address saved successfully!
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingIndex !== null ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Set as default address
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingIndex(null)
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {addresses.length === 0 && !showForm ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-12 shadow-sm text-center"
        >
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No addresses saved yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add Your First Address
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-gray-200 transition-colors"
            >
              {address.isDefault && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
                  Default
                </span>
              )}
              <div className="space-y-2 mb-4">
                <p className="font-medium text-gray-900">{address.street}</p>
                <p className="text-sm text-gray-600">
                  {address.city}
                  {address.state && `, ${address.state}`}
                </p>
                <p className="text-sm text-gray-600">
                  {address.country}
                  {address.postalCode && ` ${address.postalCode}`}
                </p>
              </div>
              <div className="flex gap-2">
                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(index)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Set as default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(index)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
