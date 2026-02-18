'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerCustomer } from '@/lib/auth'
import { useCustomer } from '@/contexts/CustomerContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useCustomer()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await registerCustomer({ firstName, lastName, email, password })
      const token = data.token || data.accessToken || data.access_token
      const customer = data.customer || data.user || data
      
      if (token && customer) {
        login(token, customer)
        router.push('/dashboard')
      } else {
        setError('Invalid response from server')
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={handleMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12 px-6 pt-20 sm:pt-24 lg:pt-24">
        <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900">Create account</h1>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">First name</label>
              <input 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Last name</label>
              <input 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" 
              required 
            />
          </div>
          <button 
            disabled={loading} 
            className="w-full bg-gray-900 text-white rounded-lg py-2 disabled:opacity-60 hover:bg-gray-800 transition-colors"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
          <p className="text-xs text-gray-600 text-center">
            Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login</a>
          </p>
        </form>
      </div>
      <Footer />
    </div>
  )
}


