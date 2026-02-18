'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useRecentlyViewed } from '@/contexts/RecentlyViewedContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useCart } from '@/contexts/CartContext'
import { apiClient, Product } from '@/lib/api'
import { Star, Heart, ShoppingBag, Minus, Plus, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import LoadingSpinner from '../LoadingSpinner'
import SizeChart from '../SizeChart'

export default function MobileProductPage() {
  const params = useParams()
  const slug = (params?.slug as string) || ''
  const { addToRecentlyViewed } = useRecentlyViewed()
  const { trackProductView, trackCartAction } = useAnalytics()
  const { addToCart, isInCart } = useCart()
  
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

  useEffect(() => {
    if (product && product._id && hasAddedToRecentlyViewed.current !== product._id) {
      hasAddedToRecentlyViewed.current = product._id
      const productForRecentlyViewed = {
        id: parseInt(product._id) || 0,
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
      trackProductView(product._id, product.categories?.[0] || 'General', product.brand || 'Unknown')
    }
  }, [product?._id, slug, addToRecentlyViewed, trackProductView])

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
          <h2 className="text-xl font-bold text-gray-900 mb-3">Product not found</h2>
          <p className="text-sm text-gray-600 mb-4">The product you're looking for doesn't exist or is currently unavailable.</p>
          <div className="flex flex-col gap-2">
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

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change))
  }

  const handleAddToCart = () => {
    if (!product) return
    
    const requiresSize = Array.isArray(product?.availableSizes) && product!.availableSizes!.length > 0
    const requiresColor = Array.isArray((product as any)?.colors) && (product as any).colors.length > 0
    if ((requiresSize && !selectedSize) || (requiresColor && !selectedColor)) {
      return
    }
    
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.images?.[0],
      size: selectedSize || undefined,
      color: selectedColor || undefined
    })
    
    trackCartAction(product._id, 'add')
  }
  
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

  const normalizeImageUrl = (img: any): string => {
    if (!img) return '/images/1.png'
    
    let imageUrl = ''
    
    if (typeof img === 'string') {
      imageUrl = img.trim()
    } else if (typeof img === 'object') {
      imageUrl = (img.url || img.imageUrl || img.path || '').trim()
    }
    
    if (!imageUrl || /^[a-f\d]{24}$/i.test(imageUrl)) {
      return '/images/1.png'
    }
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    
    if (imageUrl.startsWith('/')) {
      return imageUrl
    }
    
    if (imageUrl.startsWith('uploads/') || imageUrl.includes('/uploads/')) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api'
      const cleanApiBase = apiBase.replace(/\/api\/?$/, '')
      if (cleanApiBase.startsWith('http')) {
        return `${cleanApiBase}/${imageUrl}`
      }
      return `/${imageUrl}`
    }
    
    return `/${imageUrl}`
  }

  // Combine images and gallery arrays, removing duplicates
  const imagesList = Array.isArray(product.images) ? product.images : []
  const galleryList = Array.isArray((product as any).gallery) ? (product as any).gallery : []
  const combinedImages = [...imagesList, ...galleryList]
  // Remove duplicates by converting to Set and back to array
  const imageArray = Array.from(new Set(combinedImages)).filter(Boolean)
  const mainImageUrl = imageArray.length > 0
    ? normalizeImageUrl(imageArray[selectedImage] || imageArray[0])
    : '/images/1.png'

  const isExternalUrl = mainImageUrl.startsWith('http')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Breadcrumb - Compact */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-2">
          <nav className="flex items-center space-x-1 text-xs overflow-x-auto">
            <a href="/" className="text-gray-500 hover:text-primary-600 whitespace-nowrap">Home</a>
            <span className="text-gray-400">/</span>
            <a href="/shop" className="text-gray-500 hover:text-primary-600 whitespace-nowrap">Shop</a>
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
                    <a href={`/shop?category=${categoryName.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-500 hover:text-primary-600 whitespace-nowrap truncate">{categoryName}</a>
                  </>
                )
              }
              return null
            })()}
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Images - Mobile Optimized - 1:1 Container and Image */}
      <div className="relative bg-white">
        <div className="relative aspect-square bg-gray-100">
          {isExternalUrl ? (
            <Image
              src={mainImageUrl}
              alt={product.name || 'Product'}
              fill
              className="object-contain aspect-square"
              unoptimized={true}
              sizes="100vw"
            />
          ) : (
            <img
              src={mainImageUrl}
              alt={product.name || 'Product'}
              className="absolute inset-0 w-full h-full object-contain aspect-square"
              onError={(e) => {
                e.currentTarget.src = '/images/1.png'
              }}
            />
          )}
        
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.isNew && (
              <span className="bg-primary-600 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                New
              </span>
            )}
            {product.isSale && (
              <span className="bg-secondary-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                Sale
              </span>
            )}
          </div>

          {/* Navigation Arrows */}
          {imageArray.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg active:bg-white z-10"
              >
                <ChevronLeft className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg active:bg-white z-10"
              >
                <ChevronRight className="h-4 w-4 text-gray-700" />
              </button>
            </>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg active:scale-95 z-10 ${
              isWishlisted ? 'bg-primary-600 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Gallery Thumbnails - Horizontal Scroll */}
        {imageArray.length >= 1 && (
          <div className="px-4 py-3 overflow-x-auto border-t border-gray-100">
            <div className="flex gap-2 min-h-[72px]">
              {imageArray.map((image: any, index: number) => {
                const imageUrl = normalizeImageUrl(image)
                const isExternal = imageUrl.startsWith('http')
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-16 h-16 aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary-600 ring-2 ring-primary-200' : 'border-gray-200'
                    }`}
                  >
                    {isExternal ? (
                      <Image
                        src={imageUrl}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-contain aspect-square"
                        unoptimized
                        sizes="80px"
                      />
                    ) : (
                      <img
                        src={imageUrl}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain aspect-square"
                        onError={(e) => { e.currentTarget.src = '/images/1.png' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product Info - Mobile Optimized */}
      <div className="px-4 py-4 space-y-4 bg-white">
        {/* Title & Rating */}
        <div>
          <h1 className="text-xl font-serif font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {product.rating || 0} ({product.reviews || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-primary-600">
              PKR {typeof product.price === 'number' ? product.price.toLocaleString() : '0'}
            </span>
            {product.originalPrice && typeof product.originalPrice === 'number' && product.originalPrice > product.price && (
              <>
                <span className="text-base text-gray-400 line-through">
                  PKR {product.originalPrice.toLocaleString()}
                </span>
                <span className="bg-secondary-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Save PKR {(product.originalPrice - product.price).toLocaleString()}
                </span>
              </>
            )}
          </div>

          {/* Brand */}
          {product.brand && product.brand !== 'Unknown' && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-600">Brand:</span>
              <span className="text-sm font-semibold text-primary-600">{product.brand}</span>
            </div>
          )}
        </div>

        {/* Size options - always show (sizes or "One Size") */}
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
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border-2 rounded-lg text-xs font-medium transition-all ${
                      selectedSize === size
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 active:border-primary-400'
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
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Select Color</h3>
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
                    className={`flex items-center gap-1.5 px-3 py-2 border-2 rounded-lg text-xs font-medium transition-all ${
                      selectedColor === label
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-300 text-gray-700 active:border-primary-400'
                    }`}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={label} className="h-5 w-5 rounded object-cover border border-gray-200" />
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
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quantity</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="p-2 active:bg-gray-50"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-4 py-2 font-semibold text-base border-x border-gray-300">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-2 active:bg-gray-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="text-xs text-gray-600 font-medium">
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
                className="text-xs text-primary-600 hover:text-primary-800 underline font-semibold w-full text-center"
              >
                View Size Chart
              </button>
            ) : null}

            {isSizeImageOpen && product.sizeChartImageUrl && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Size Guide</h3>
                    <button
                      onClick={() => setIsSizeImageOpen(false)}
                      className="text-gray-400 active:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-4 flex justify-center">
                    <img
                      src={product.sizeChartImageUrl}
                      alt="Size chart"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setIsSizeImageOpen(false)}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg active:bg-gray-700 text-sm font-medium"
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
        <div className="space-y-2 pt-2">
          <button
            onClick={handleAddToCart}
            className={`w-full font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
              isProductInCart
                ? 'bg-green-600 active:bg-green-700 text-white'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 active:from-primary-700 active:to-primary-800 text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            {isProductInCart ? 'Added to Cart' : 'Add to Cart'}
          </button>
          <button className="w-full border-2 border-gray-300 rounded-lg font-semibold text-gray-700 active:bg-gray-50 active:border-gray-400 transition-all py-3 px-4 flex items-center justify-center gap-2 text-sm">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Product Description - Tabbed Interface - Mobile */}
      <div className="mt-4 bg-white">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('Overview')}
              className={`py-3 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'Overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 active:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('Details')}
              className={`py-3 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'Details'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 active:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('Additional')}
              className={`py-3 px-4 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'Additional'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 active:text-gray-700'
              }`}
            >
              More Info
            </button>
          </nav>
        </div>

        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              {(product.description || product.shortDescription) && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description || product.shortDescription}</p>
                </div>
              )}

              {(product as any).modelMeasurements?.height && (
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Model height:</span> {(product as any).modelMeasurements.height}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-base font-bold text-gray-900 mb-3">Product Information</h3>
                <div className="space-y-2">
                  {(() => {
                    const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
                    if (!product.categories || product.categories.length === 0) return null
                    const validCategories = product.categories
                      .filter((cat: any) => cat && typeof cat === 'string' && !isObjectId(cat))
                    if (validCategories.length === 0) return null
                    return (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-700">Category:</span>
                        <span className="text-xs text-gray-600 text-right">{validCategories.join(', ')}</span>
                      </div>
                    )
                  })()}

                  {product.brand && product.brand !== 'Unknown' && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-700">Brand:</span>
                      <span className="text-xs text-gray-600">{product.brand}</span>
                    </div>
                  )}

                  {(product as any).collectionName && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-700">Collection:</span>
                      <span className="text-xs text-gray-600">{(product as any).collectionName}</span>
                    </div>
                  )}

                </div>
              </div>

              {Array.isArray(product.features) && product.features.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'Details' && (
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-4">Product Specifications</h3>
              <div className="space-y-2">
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
                ].filter(([k, v]) => !!v && v !== '—').map(([k, v]) => (
                  <div key={k as string} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-700">{k as string}:</span>
                    <span className="text-xs text-gray-600 text-right">{v as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info Tab */}
          {activeTab === 'Additional' && (
            <div className="space-y-4">
              {(product as any).designer && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Designer</h3>
                  <p className="text-sm text-gray-700">{(product as any).designer}</p>
                </div>
              )}

              {((product as any).shippingWeight || (product as any).shippingDimensions) && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">Shipping Details</h3>
                  <div className="space-y-2">
                    {(product as any).shippingWeight && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-600 font-medium mb-1">Weight</div>
                        <div className="text-sm font-bold text-gray-900">{(product as any).shippingWeight}</div>
                      </div>
                    )}
                    {(product as any).shippingDimensions && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-600 font-medium mb-1">Dimensions</div>
                        <div className="text-sm font-bold text-gray-900">
                          {`${(product as any).shippingDimensions.length || '-'} × ${(product as any).shippingDimensions.width || '-'} × ${(product as any).shippingDimensions.height || '-'}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!((product as any).designer || (product as any).shippingWeight || (product as any).shippingDimensions) && (
                <div className="text-gray-500 text-center py-6 text-sm">
                  No additional information available
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

