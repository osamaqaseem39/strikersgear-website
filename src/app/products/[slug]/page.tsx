'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useIsMobile } from '@/utils/useMobile'
import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useCart } from '@/contexts/CartContext'
import { apiClient, Product } from '@/lib/api'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import MobileBottomNav from '@/components/MobileBottomNav'
import Footer from '@/components/Footer'
import MobileProductPage from '@/components/mobile/MobileProductPage'
// import SimilarProducts from '@/components/SimilarProducts'
import LoadingSpinner from '@/components/LoadingSpinner'
import SizeChart from '@/components/SizeChart'
import { Star, Heart, ShoppingBag, Minus, Plus, Share2, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, User, X } from 'lucide-react'
import Image from 'next/image'

// No hardcoded related products

export default function ProductPage() {
  const isMobile = useIsMobile()
  // All hooks must be called unconditionally at the top level - same order every render
  const params = useParams()
  const slug = (params?.slug as string) || ''
  const { addToRecentlyViewed } = useRecentlyViewed()
  const { trackProductView, trackCartAction } = useAnalytics()
  const { addToCart, isInCart, items } = useCart()
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('Overview')
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSizeImageOpen, setIsSizeImageOpen] = useState(false)
  const hasAddedToRecentlyViewed = useRef<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setLoading(false)
        setError('Invalid product')
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        // Reset the ref when fetching a new product
        hasAddedToRecentlyViewed.current = null
        const productData = await apiClient.getProductBySlug(slug)
        setProduct(productData)
      } catch (err) {
        setError('Product not found')
        console.error('Error fetching product:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  // Add product to recently viewed when component mounts
  useEffect(() => {
    if (product && product._id && hasAddedToRecentlyViewed.current !== product._id) {
      hasAddedToRecentlyViewed.current = product._id
      const productForRecentlyViewed = {
        id: parseInt(product._id) || 0, // Convert string ID to number
        name: product.name || 'Product',
        price: product.price || 0,
        originalPrice: product.originalPrice,
        image: product.images?.[0] || '/images/1.png',
        category: product.categories?.[0] || 'General',
        rating: product.rating || 0,
        reviews: product.reviews || 0,
        isNew: product.isNew || false,
        isSale: product.isSale || false,
        slug: slug
      }
      addToRecentlyViewed(productForRecentlyViewed)
      
      // Track product view for analytics
      trackProductView(product._id, product.categories?.[0] || 'General', product.brand || 'Unknown')
    }
  }, [product?._id, slug, addToRecentlyViewed, trackProductView]) // Include all dependencies

  // Auto-select "One Size" when product has no size options
  useEffect(() => {
    if (!product) return
    const hasSizes = (Array.isArray(product.availableSizes) && product.availableSizes.length > 0) ||
      (product.sizeChart && Array.isArray(product.sizeChart?.sizes) && product.sizeChart.sizes.length > 0) ||
      (Array.isArray((product as any).attributes?.sizes) && (product as any).attributes.sizes.length > 0)
    if (!hasSizes) setSelectedSize('One Size')
  }, [product])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <p className="text-sm md:text-base text-gray-600 mb-4">The product you're looking for doesn't exist or is currently unavailable.</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 justify-center">
            <a href="/shop" className="btn-primary text-sm py-2">
              Back to Shop
            </a>
            <a href="/" className="btn-secondary text-sm py-2">
              Go Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  // Render mobile version if on mobile
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          onMenuClick={handleMenuToggle} 
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="flex">
          <Sidebar isOpen={isMobileMenuOpen} onClose={handleMenuClose} />
          <main className="flex-1 pb-20 pt-20">
            <MobileProductPage />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change))
  }

  const handleAddToCart = () => {
    if (!product) return
    
    const requiresSize = Array.isArray(product?.availableSizes) && product!.availableSizes!.length > 0
    const requiresColor = Array.isArray((product as any)?.colors) && (product as any).colors.length > 0
    if ((requiresSize && !selectedSize) || (requiresColor && !selectedColor)) {
      // Show message via cart context instead of alert
      return
    }
    
    // Add to cart using context
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.images?.[0],
      size: selectedSize || undefined,
      color: selectedColor || undefined
    })
    
    // Track cart action for analytics
    trackCartAction(product._id, 'add')
  }
  
  // Recalculate when cart items, selected size, or selected color changes
  const isProductInCart = product ? isInCart(product._id, selectedSize || undefined, selectedColor || undefined) : false

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
  }

  const nextImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImage((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
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
          {/* Breadcrumb */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <nav className="flex items-center space-x-2 text-sm">
                <a href="/" className="text-gray-500 hover:text-primary-600">Home</a>
                <span className="text-gray-400">/</span>
                <a href="/shop" className="text-gray-500 hover:text-primary-600">Shop</a>
                {(() => {
                  const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
                  const firstCategory = product.categories?.[0]
                  const categoryName = firstCategory && typeof firstCategory === 'string' && !isObjectId(firstCategory)
                    ? firstCategory
                    : null
                  
                  if (categoryName) {
                    return (
                      <>
                        <span className="text-gray-400">/</span>
                        <a href={`/shop?category=${categoryName.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-500 hover:text-primary-600">{categoryName}</a>
                      </>
                    )
                  }
                  return null
                })()}
                <span className="text-gray-400">/</span>
                <span className="text-gray-900">{product.name}</span>
              </nav>
            </div>
          </div>

          {/* Product Details */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Product Images - Slider + Gallery Thumbnails */}
              {(() => {
                const normalizeImageUrl = (img: any): string => {
                  if (!img) return '/images/1.png'
                  let imageUrl = typeof img === 'string' ? img.trim() : (img.url || img.imageUrl || img.path || '').trim()
                  if (!imageUrl || /^[a-f\d]{24}$/i.test(imageUrl)) return '/images/1.png'
                  if (imageUrl.startsWith('http')) return imageUrl
                  if (imageUrl.startsWith('/')) return imageUrl
                  if (imageUrl.startsWith('uploads/') || imageUrl.includes('/uploads/')) {
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api'
                    const cleanApiBase = apiBase.replace(/\/api\/?$/, '')
                    return cleanApiBase.startsWith('http') ? `${cleanApiBase}/${imageUrl}` : `/${imageUrl}`
                  }
                  return `/${imageUrl}`
                }
                // Combine images and gallery arrays, removing duplicates
                const imagesList = Array.isArray(product.images) ? product.images : []
                const galleryList = Array.isArray((product as any).gallery) ? (product as any).gallery : []
                const combinedImages = [...imagesList, ...galleryList]
                // Remove duplicates by converting to Set and back to array
                const imageArray = Array.from(new Set(combinedImages)).filter(Boolean)
                const mainImageUrl = imageArray.length > 0 ? normalizeImageUrl(imageArray[selectedImage] || imageArray[0]) : '/images/1.png'
                const isExternalUrl = mainImageUrl.startsWith('http')
                const imageSrc = mainImageUrl.startsWith('/') ? mainImageUrl : (isExternalUrl ? mainImageUrl : '/images/1.png')

                return (
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Gallery Thumbnails - Left (desktop) / Below (mobile) */}
                    {imageArray.length >= 1 && (
                      <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 order-2 sm:order-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                        {imageArray.map((image: any, index: number) => {
                          const imageUrl = normalizeImageUrl(image)
                          const isExt = imageUrl.startsWith('http')
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setSelectedImage(index)}
                              className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                selectedImage === index
                                  ? 'border-primary-600 ring-2 ring-primary-200 shadow-md'
                                  : 'border-gray-200 hover:border-primary-400 hover:shadow-sm'
                              }`}
                            >
                              {isExt ? (
                                <Image src={imageUrl} alt="" fill className="object-cover" unoptimized sizes="80px" />
                              ) : (
                                <img src={imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/1.png' }} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Main Image Slider */}
                    <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 flex-1 order-1 sm:order-2 min-h-[280px] sm:min-h-0">
                      <div key={selectedImage} className="absolute inset-0">
                        {isExternalUrl ? (
                          <Image
                            src={imageSrc}
                            alt={product.name || 'Product'}
                            fill
                            className="object-contain transition-opacity duration-300"
                            unoptimized
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <img
                            src={imageSrc}
                            alt={product.name || 'Product'}
                            className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
                            onError={(e) => { e.currentTarget.src = '/images/1.png' }}
                          />
                        )}
                      </div>

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {product.isNew && <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">New</span>}
                        {product.isSale && <span className="bg-secondary-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">Sale</span>}
                      </div>

                      {/* Slider Arrows */}
                      {imageArray.length > 1 && (
                        <>
                          <button type="button" onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white transition-all duration-200 hover:scale-110 z-10" aria-label="Previous image">
                            <ChevronLeft className="h-5 w-5 text-gray-700" />
                          </button>
                          <button type="button" onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white transition-all duration-200 hover:scale-110 z-10" aria-label="Next image">
                            <ChevronRight className="h-5 w-5 text-gray-700" />
                          </button>
                        </>
                      )}

                      {/* Wishlist */}
                      <button type="button" onClick={handleWishlist} className={`absolute top-4 right-4 p-3 rounded-full shadow-xl transition-all duration-200 hover:scale-110 z-10 ${isWishlisted ? 'bg-primary-600 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white'}`} aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                        <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Product Info */}
              <div className="space-y-6">
                {/* Product Title & Rating */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">{product.name}</h1>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        {product.rating || 0} ({product.reviews || 0} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <span className="text-3xl md:text-4xl font-bold text-primary-600">
                      PKR {typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
                    </span>
                    {product.originalPrice && typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          PKR {product.originalPrice.toLocaleString()}
                        </span>
                        <span className="bg-secondary-500 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                          Save PKR {(product.originalPrice - product.price).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Brand */}
                  {product.brand && product.brand !== 'Unknown' && (
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-sm text-gray-600 font-medium">Brand:</span>
                      <span className="text-lg font-semibold text-primary-600">{product.brand}</span>
                    </div>
                  )}
                </div>

                {/* Product Options & Actions - Combined Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                  {/* Size Selection - always show (sizes or "One Size") */}
                  {(() => {
                    let sizes: string[] = []
                    if (Array.isArray(product.availableSizes) && product.availableSizes.length > 0) {
                      sizes = product.availableSizes
                    } else if (product.sizeChart && Array.isArray(product.sizeChart.sizes) && product.sizeChart.sizes.length > 0) {
                      sizes = product.sizeChart.sizes.map((s: any) => s.size || s).filter(Boolean)
                    } else if ((product as any).attributes?.sizes && Array.isArray((product as any).attributes.sizes) && (product as any).attributes.sizes.length > 0) {
                      sizes = (product as any).attributes.sizes
                    }
                    const sizeOptions = sizes.length > 0 ? sizes : ['One Size']
                    return (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4 text-lg">Size</h3>
                        <div className="flex flex-wrap gap-2">
                          {sizeOptions.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              className={`px-5 py-2.5 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedSize === size
                                  ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                                  : 'border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-gray-50'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Color Selection */}
                  {Array.isArray((product as any).colors) && (product as any).colors.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 text-lg">Select Color</h3>
                      <div className="flex flex-wrap gap-2">
                        {(product as any).colors.map((c: any, idx: number) => {
                          const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
                          const label = typeof c === 'string' 
                            ? (isObjectId(c) ? '' : c)
                            : (c.name || c.colorName || c.label || c.title || (!isObjectId(String(c?.colorId)) ? String(c?.colorId) : ''))
                          const imgUrl = typeof c === 'object' ? (c.imageUrl || c.url) : ''
                          if (!label) return null
                          return (
                            <button
                              key={label + idx}
                              onClick={() => setSelectedColor(label)}
                              className={`flex items-center gap-2 px-4 py-2.5 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedColor === label
                                  ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm'
                                  : 'border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-gray-50'
                              }`}
                            >
                              {imgUrl ? (
                                <img src={imgUrl} alt={label} className="h-6 w-6 rounded object-cover border border-gray-200" />
                              ) : null}
                              <span>{label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  {(typeof product.stockQuantity === 'number' || typeof product.stockCount === 'number') && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4 text-lg">Quantity</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleQuantityChange(-1)}
                            className="p-3 hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-6 py-3 font-semibold text-lg border-x border-gray-300">{quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(1)}
                            className="p-3 hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {(product.stockQuantity ?? product.stockCount) as number} in stock
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Size Chart Link */}
                  {(product.sizeChart || product.sizeChartImageUrl) && (
                    <div>
                      {product.sizeChart ? (
                        <SizeChart 
                          sizeChart={product.sizeChart} 
                          availableSizes={product.availableSizes || []} 
                        />
                      ) : product.sizeChartImageUrl ? (
                        <button
                          onClick={() => setIsSizeImageOpen(true)}
                          className="text-sm text-primary-600 hover:text-primary-800 underline font-semibold w-full text-center"
                        >
                          View Size Chart
                        </button>
                      ) : null}

                      {isSizeImageOpen && product.sizeChartImageUrl && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                              <h3 className="text-xl font-bold text-gray-900">Size Guide</h3>
                              <button
                                onClick={() => setIsSizeImageOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="h-6 w-6" />
                              </button>
                            </div>
                            <div className="p-6 flex justify-center">
                              <img
                                src={product.sizeChartImageUrl}
                                alt="Size chart"
                                className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                              />
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                              <button
                                onClick={() => setIsSizeImageOpen(false)}
                                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleAddToCart}
                      className={`w-full font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl ${
                        isProductInCart
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white'
                      }`}
                    >
                      <ShoppingBag className="h-5 w-5" />
                      {isProductInCart ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                    <button className="w-full border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 py-4 px-6 flex items-center justify-center gap-3">
                      <Share2 className="h-5 w-5" />
                      Share
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Product Description and Details - Tabbed Interface */}
            <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Tab Headers */}
                <div className="border-b border-gray-200">
                  <nav className="flex flex-wrap -mb-px px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('Overview')}
                      className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'Overview'
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('Details')}
                      className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'Details'
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Product Details
                    </button>
                    <button
                      onClick={() => setActiveTab('Additional')}
                      className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'Additional'
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Additional Info
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {/* Overview Tab */}
                  {activeTab === 'Overview' && (
                    <div className="space-y-8">
                      {/* Description */}
                      {(product.description || product.shortDescription) && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                          <p className="text-gray-600 leading-relaxed text-base">{product.description || product.shortDescription}</p>
                        </div>
                      )}

                      {/* Model Height */}
                      {(product as any).modelMeasurements?.height && (
                        <div>
                          <p className="text-gray-600 leading-relaxed text-base">
                            <span className="font-semibold text-gray-900">Model height:</span> {(product as any).modelMeasurements.height}
                          </p>
                        </div>
                      )}

                      {/* Product Information */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Product Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Category */}
                          {(() => {
                            const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
                            if (!product.categories || product.categories.length === 0) return null
                            const validCategories = product.categories
                              .filter((cat: any) => cat && typeof cat === 'string' && !isObjectId(cat))
                            if (validCategories.length === 0) return null
                            return (
                              <div>
                                <span className="text-sm font-semibold text-gray-700">Category:</span>
                                <span className="ml-2 text-gray-600">{validCategories.join(', ')}</span>
                              </div>
                            )
                          })()}

                          {/* Brand */}
                          {product.brand && product.brand !== 'Unknown' && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Brand:</span>
                              <span className="ml-2 text-gray-600">{product.brand}</span>
                            </div>
                          )}

                          {/* Collection */}
                          {(product as any).collectionName && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Collection:</span>
                              <span className="ml-2 text-gray-600">{(product as any).collectionName}</span>
                            </div>
                          )}

                          {/* Fabric */}
                          {(product as any).fabric && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700">Fabric:</span>
                              <span className="ml-2 text-gray-600">{(product as any).fabric}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      {Array.isArray(product.features) && product.features.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Features</h3>
                          <ul className="space-y-3">
                            {product.features.map((feature, index) => (
                              <li key={index} className="flex items-start gap-3 text-gray-700">
                                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-base">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(!product.description && !product.shortDescription && (!Array.isArray(product.features) || product.features.length === 0) && !(product as any).modelMeasurements?.height) && (
                        <div className="text-gray-500 text-center py-8">
                          No overview information available
                        </div>
                      )}
                    </div>
                  )}

                  {/* Details Tab */}
                  {activeTab === 'Details' && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Product Specifications</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Specification</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Details</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {[
                              ['SKU', (product as any).sku],
                              ['Category', (() => {
                                const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
                                if (!product.categories || product.categories.length === 0) return '—'
                                const validCategories = product.categories
                                  .filter((cat: any) => cat && typeof cat === 'string' && !isObjectId(cat))
                                return validCategories.length > 0 ? validCategories.join(', ') : '—'
                              })()],
                              ['Brand', product.brand && product.brand !== 'Unknown' ? product.brand : '—'],
                              ['Collection', (product as any).collectionName],
                              ['Fabric', (product as any).fabric],
                              ['Pattern', (product as any).pattern],
                              ['Sleeve Length', (product as any).sleeveLength],
                              ['Limited Edition', (product as any).isLimitedEdition ? 'Yes' : undefined],
                              ['Custom Made', (product as any).isCustomMade ? 'Yes' : undefined],
                            ].filter(([k, v]) => !!v && v !== '—' && !(k as string).toLowerCase().includes('id')).map(([k, v]) => (
                              <tr key={k as string} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 bg-gray-50 w-1/3">
                                  {k as string}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {v as string}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Additional Info Tab */}
                  {activeTab === 'Additional' && (
                    <div className="space-y-8">
                      {/* Designer */}
                      {(product as any).designer ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Designer</h3>
                            <p className="text-gray-700 text-base">{(product as any).designer}</p>
                          </div>
                        </div>
                      ) : null}


                      {/* Shipping Details */}
                      {(product as any).shippingWeight || (product as any).shippingDimensions ? (
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-6">Shipping Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {(product as any).shippingWeight ? (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-sm text-gray-600 font-medium mb-1">Weight</div>
                                <div className="text-lg font-bold text-gray-900">{(product as any).shippingWeight}</div>
                              </div>
                            ) : null}
                            {(product as any).shippingDimensions ? (
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-sm text-gray-600 font-medium mb-1">Dimensions</div>
                                <div className="text-lg font-bold text-gray-900">
                                  {`${(product as any).shippingDimensions.length || '-'} × ${(product as any).shippingDimensions.width || '-'} × ${(product as any).shippingDimensions.height || '-'}`}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {!((product as any).designer || (product as any).shippingWeight || (product as any).shippingDimensions) && (
                        <div className="text-gray-500 text-center py-8">
                          No additional information available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* No hardcoded related products */}
          </div>

          {/* SimilarProducts removed to avoid hardcoded fallbacks */}

          <Footer />
        </main>
      </div>
      
      <MobileBottomNav />
    </div>
  )
}