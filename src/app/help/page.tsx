'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { HelpCircle, Mail, MessageCircle, Phone, FileText, Truck, CreditCard, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function HelpPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const helpCategories = [
    {
      icon: FileText,
      title: 'Order Information',
      description: 'Track your orders, view order history, and manage returns'
    },
    {
      icon: Truck,
      title: 'Shipping & Delivery',
      description: 'Learn about shipping options, delivery times, and tracking'
    },
    {
      icon: CreditCard,
      title: 'Payment & Billing',
      description: 'Payment methods, billing questions, and refunds'
    },
    {
      icon: RefreshCw,
      title: 'Returns & Exchanges',
      description: 'How to return items and exchange products'
    }
  ]

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@shestrends.com',
      action: 'Send Email'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+92 300 1234567',
      action: 'Call Now'
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Available 24/7',
      action: 'Start Chat'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20 sm:pt-24 lg:pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <HelpCircle className="h-16 w-16 text-primary-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-600">
            How can we help you today?
          </p>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {helpCategories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <category.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Methods */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="text-center p-6 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
              >
                <div className="flex justify-center mb-4">
                  <method.icon className="h-10 w-10 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {method.title}
                </h3>
                <p className="text-gray-600 mb-4">{method.description}</p>
                <button className="text-primary-600 hover:text-primary-700 font-medium">
                  {method.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How do I track my order?
              </h3>
              <p className="text-gray-600">
                You can track your order by logging into your account and visiting the Orders section. 
                You'll receive a tracking number via email once your order ships.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What is your return policy?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day return policy on all items. Items must be unworn, unwashed, 
                and in their original packaging with tags attached.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long does shipping take?
              </h3>
              <p className="text-gray-600">
                Standard shipping typically takes 5-7 business days. Express shipping options 
                are available at checkout for faster delivery.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and cash on delivery (COD) 
                for select locations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

