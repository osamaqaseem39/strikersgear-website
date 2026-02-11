'use client'

import { motion } from 'framer-motion'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'Categories', href: '/categories' },
    { name: 'Brands', href: '/brands' },
  ],
  account: [
    { name: 'My Account', href: '/dashboard' },
    { name: 'Orders', href: '/dashboard/orders' },
    { name: 'Wishlist', href: '/dashboard/wishlist' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Blog', href: '/blog' },
  ]
}

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/share/18ABiKbjsu/' },
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/stri_kers_gear?igsh=OXVsYXcxY3BwOThm' },
]

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            {/* Logo */}
            <div className="mb-4">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo.png"
                  alt="Striker Gear"
                  width={100}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Exquisite couture for the sophisticated woman. Discover fashion that defines elegance and style.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 rounded-full hover:bg-primary-100 hover:text-primary-600 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4 text-gray-600" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Shop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="font-semibold text-gray-900 mb-3">Shop</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="font-semibold text-gray-900 mb-3">Account</h4>
            <ul className="space-y-2">
              {footerLinks.account.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="font-semibold text-gray-900 mb-3">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-900 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm"
          >
            <p>&copy; 2024 Striker Gear. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Crafted with ❤️ for the sophisticated woman</p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}