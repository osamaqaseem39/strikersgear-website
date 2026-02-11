// Prefer a relative base so we can proxy via Next.js rewrites in all environments
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Minimal default headers to avoid triggering unnecessary CORS preflights
export const getCorsHeaders = () => ({
  'Accept': 'application/json',
})

export const getCorsConfig = (): RequestInit => ({
  credentials: 'include',
  mode: 'cors',
})

// No sample data - API only

// Product interface for landing page
export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  salePrice?: number
  images: string[]
  category: string
  categories?: string[]
  brand: string
  status: 'draft' | 'published' | 'archived'
  inStock: boolean
  stockQuantity: number
  stockCount?: number
  isNew?: boolean
  isSale?: boolean
  rating?: number
  reviews?: number
  availableSizes?: string[]
  colors?: string[]
  sizeChartImageUrl?: string
  features?: string[]
  bodyType?: string[]
  occasion?: string
  season?: string
  sizeChart?: {
    _id: string
    name: string
    description?: string
    sizeType: 'numeric' | 'alphabetic' | 'custom'
    sizes: Array<{
      size: string
      measurements: {
        bust?: string
        waist?: string
        hips?: string
        shoulder?: string
        sleeveLength?: string
        length?: string
        custom?: Record<string, string>
      }
    }>
    imageUrl?: string
    imageAltText?: string
    isActive: boolean
  }
  attributes?: {
    color?: string
    sizes?: string[]
    material?: string
    gender?: string
  }
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  page?: number
  limit?: number
  search?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  status?: string
  sizes?: string[]
  fabrics?: string[]
  occasions?: string[]
  colorFamilies?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface Brand {
  _id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  country?: string
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  icon?: string
  color?: string
  parentId?: string
  parent?: string
  children?: Category[]
  isActive: boolean
  sortOrder?: number
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  createdAt: string 
  updatedAt: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private normalizeProduct = (raw: any): Product => {
    const placeholder = '/images/logo.png'

    // Normalize images from multiple possible shapes
    // Possible shapes: string[], [{ url }], [{ imageUrl }], [{ path }], [ObjectId]
    let imageUrls: string[] = []
    if (Array.isArray(raw?.images)) {
      for (const img of raw.images) {
        if (typeof img === 'string') {
          // If it looks like a URL/path, accept; if it looks like an ObjectId, skip
          const looksLikeObjectId = /^[a-f\d]{24}$/i.test(img)
          if (!looksLikeObjectId) {
            imageUrls.push(img)
          }
          continue
        }
        if (img && typeof img === 'object') {
          const candidate = img.url || img.imageUrl || img.path || ''
          if (candidate) imageUrls.push(candidate)
        }
      }
    }
    if (imageUrls.length === 0) {
      imageUrls = [placeholder]
    }

    // Normalize brand to a readable string; avoid showing ObjectId
    let brandName: string = ''
    if (typeof raw?.brand === 'string') {
      const looksLikeObjectId = /^[a-f\d]{24}$/i.test(raw.brand)
      brandName = looksLikeObjectId ? '' : raw.brand
    } else if (raw?.brand && typeof raw.brand === 'object') {
      brandName = raw.brand.name || raw.brand.slug || raw.brand._id || ''
    }
    const brandDisplay = brandName && String(brandName).trim() !== '' ? brandName : ''

    // Normalize categories to human-readable names; preserve IDs for filtering
    let categoryNames: string[] | undefined = undefined
    let categoryIds: string[] | undefined = undefined
    if (Array.isArray(raw?.categories)) {
      const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
      const names: string[] = []
      const ids: string[] = []
      
      raw.categories.forEach((cat: any) => {
        if (!cat) return
        if (typeof cat === 'string') {
          if (isObjectId(cat)) {
            // Preserve category ID for filtering
            ids.push(cat)
          } else {
            // It's already a name
            names.push(cat)
          }
        } else if (typeof cat === 'object') {
          const label = cat.name || cat.slug || ''
          if (label && !isObjectId(String(label))) {
            names.push(String(label))
          }
          // Also preserve the ID if available
          if (cat._id && isObjectId(cat._id)) {
            ids.push(cat._id)
          }
        }
      })
      
      // Use names if available, otherwise preserve IDs for filtering
      categoryNames = names.length > 0 ? names : undefined
      categoryIds = ids.length > 0 ? ids : undefined
    }

    // Normalize price/originalPrice/salePrice logic
    // Priority: salePrice (if lower) > price > originalPrice
    let normalizedPrice = raw?.price || 0
    let normalizedOriginalPrice = raw?.originalPrice
    let normalizedSalePrice = raw?.salePrice
    let normalizedIsSale = raw?.isSale || false
    
    // If salePrice exists, mark product as on sale
    if (normalizedSalePrice !== undefined && typeof normalizedSalePrice === 'number' && normalizedSalePrice > 0) {
      normalizedIsSale = true
      
      // If salePrice is lower than price, use it as the display price
      if (normalizedSalePrice < normalizedPrice) {
        // Use the higher of price or originalPrice as the original price
        normalizedOriginalPrice = normalizedOriginalPrice 
          ? Math.max(normalizedOriginalPrice, normalizedPrice)
          : normalizedPrice
        normalizedPrice = normalizedSalePrice
      }
    } else if (normalizedOriginalPrice && normalizedOriginalPrice < normalizedPrice) {
      // If originalPrice is less than price, swap them
      const temp = normalizedPrice
      normalizedPrice = normalizedOriginalPrice
      normalizedOriginalPrice = temp
    }
    
    // Ensure originalPrice is only shown if it's greater than the display price
    if (normalizedOriginalPrice && normalizedOriginalPrice <= normalizedPrice) {
      normalizedOriginalPrice = undefined
    }

    // Normalize colors to human-readable strings
    let normalizedColors: string[] | undefined = undefined
    if (Array.isArray(raw?.colors)) {
      const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
      normalizedColors = raw.colors
        .map((c: any) => {
          if (!c) return null
          if (typeof c === 'string') {
            return isObjectId(c) ? null : c
          }
          if (typeof c === 'object') {
            const label = c.name || c.colorName || c.label || c.title || c.value || ''
            if (label && !isObjectId(String(label))) return String(label)
            // As a last resort, avoid exposing raw ObjectId colorId
            if (c.colorId && !isObjectId(String(c.colorId))) return String(c.colorId)
            return null
          }
          return null
        })
        .filter((v: any) => typeof v === 'string' && v.trim() !== '')
    }

    // Normalize sizes from multiple possible locations
    let normalizedSizes: string[] | undefined = undefined
    // Check availableSizes first
    if (Array.isArray(raw?.availableSizes) && raw.availableSizes.length > 0) {
      normalizedSizes = raw.availableSizes.filter((s: any) => s && typeof s === 'string' && s.trim() !== '')
    }
    // Check sizes field
    else if (Array.isArray(raw?.sizes) && raw.sizes.length > 0) {
      normalizedSizes = raw.sizes.filter((s: any) => s && typeof s === 'string' && s.trim() !== '')
    }
    // Check sizeChart.sizes
    else if (raw?.sizeChart && Array.isArray(raw.sizeChart.sizes) && raw.sizeChart.sizes.length > 0) {
      normalizedSizes = raw.sizeChart.sizes
        .map((s: any) => {
          if (typeof s === 'string') return s
          if (typeof s === 'object' && s.size) return s.size
          return null
        })
        .filter((s: any): s is string => s && typeof s === 'string' && s.trim() !== '')
    }
    // Check attributes.sizes
    else if (raw?.attributes?.sizes && Array.isArray(raw.attributes.sizes) && raw.attributes.sizes.length > 0) {
      normalizedSizes = raw.attributes.sizes.filter((s: any) => s && typeof s === 'string' && s.trim() !== '')
    }

    return {
      ...raw,
      images: imageUrls,
      brand: brandDisplay || 'Unknown',
      categories: categoryNames || categoryIds || raw?.categories,
      // Preserve category field - use first category name or ID
      category: categoryNames?.[0] || categoryIds?.[0] || raw?.category || '',
      price: normalizedPrice,
      originalPrice: normalizedOriginalPrice,
      salePrice: normalizedSalePrice,
      isSale: normalizedIsSale,
      colors: normalizedColors ?? raw?.colors,
      availableSizes: normalizedSizes ?? raw?.availableSizes ?? raw?.sizes,
    } as Product
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // Compose headers without forcing Content-Type for GET to keep it a simple request
    const baseHeaders: Record<string, string> = {
      ...getCorsHeaders(),
    }

    const method = (options.method || 'GET').toUpperCase()
    const hasBody = typeof options.body !== 'undefined' && options.body !== null
    if (method !== 'GET' && hasBody) {
      baseHeaders['Content-Type'] = (options.headers as any)?.['Content-Type'] || 'application/json'
    }

    const config: RequestInit = {
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
      ...getCorsConfig(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Products API - backed by simple `/products` endpoint
  // Backend currently returns a plain array without pagination or advanced filters.
  // We fetch all active products and apply pagination client-side.
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 100

    // Backend supports categoryId & activeOnly; for now we just request active products
    const raw = await this.request<any[]>(`/products?activeOnly=true`)
    const all = Array.isArray(raw) ? raw.map(this.normalizeProduct) : []

    const total = all.length
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1
    const start = (page - 1) * limit
    const end = start + limit
    const data = all.slice(start, end)

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }

  async getProduct(id: string): Promise<Product> {
    const raw = await this.request<any>(`/products/${id}`)
    const normalized = this.normalizeProduct(raw)
    
    // Fallback: If brand is still an ObjectId, fetch the brand details
    if (normalized.brand === 'Unknown' || normalized.brand === '') {
      const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
      const brandId = raw?.brand
      
      if (brandId && ((typeof brandId === 'string' && isObjectId(brandId)) || (typeof brandId === 'object' && brandId._id))) {
        try {
          const brandData = typeof brandId === 'string' 
            ? await this.getBrand(brandId)
            : await this.getBrand(brandId._id)
          if (brandData && brandData.name) {
            normalized.brand = brandData.name
          }
        } catch (err) {
          console.warn('Failed to fetch brand details:', err)
        }
      }
    }
    
    // Fallback: If categories are still ObjectIds, fetch category details
    const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
    if (!normalized.categories || normalized.categories.length === 0 || 
        (Array.isArray(normalized.categories) && normalized.categories.every((cat: any) => 
          typeof cat === 'string' && isObjectId(cat)))) {
      if (Array.isArray(raw?.categories) && raw.categories.length > 0) {
        try {
          const categoryPromises = raw.categories
            .map((catId: any) => {
              const id = typeof catId === 'string' ? catId : (catId?._id || catId)
              if (id && isObjectId(String(id))) {
                return this.getCategory(String(id))
              }
              return null
            })
            .filter(Boolean)
          
          const categoryData = await Promise.all(categoryPromises)
          const categoryNames = categoryData
            .filter((cat: any) => cat && cat.name)
            .map((cat: any) => cat.name)
          
          if (categoryNames.length > 0) {
            normalized.categories = categoryNames
          }
        } catch (err) {
          console.warn('Failed to fetch category details:', err)
        }
      }
    }
    
    return normalized
  }

  async getProductBySlug(slug: string): Promise<Product> {
    // Backend now supports slug field on products, but does not expose a dedicated slug endpoint.
    // Strategy:
    // 1) Try to resolve by slug from the active products list.
    // 2) If not found, fall back to treating the slug as an ID (for backward compatibility).
    const rawList = await this.request<any[]>(`/products?activeOnly=true`)
    let raw = (rawList || []).find((p: any) => p.slug === slug)

    // Fallback: if nothing matches by slug, try fetching directly by ID
    if (!raw) {
      try {
        raw = await this.request<any>(`/products/${slug}`)
      } catch {
        throw new Error('Product not found')
      }
    }

    const normalized = this.normalizeProduct(raw)
    
    // Fallback: If brand is still an ObjectId, fetch the brand details
    if (normalized.brand === 'Unknown' || normalized.brand === '') {
      const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
      const brandId = raw?.brand
      
      if (brandId && ((typeof brandId === 'string' && isObjectId(brandId)) || (typeof brandId === 'object' && brandId._id))) {
        try {
          const brandData = typeof brandId === 'string' 
            ? await this.getBrand(brandId)
            : await this.getBrand(brandId._id)
          if (brandData && brandData.name) {
            normalized.brand = brandData.name
          }
        } catch (err) {
          console.warn('Failed to fetch brand details:', err)
        }
      }
    }
    
    // Fallback: If categories are still ObjectIds, fetch category details
    const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s)
    if (!normalized.categories || normalized.categories.length === 0 || 
        (Array.isArray(normalized.categories) && normalized.categories.every((cat: any) => 
          typeof cat === 'string' && isObjectId(cat)))) {
      if (Array.isArray(raw?.categories) && raw.categories.length > 0) {
        try {
          const categoryPromises = raw.categories
            .map((catId: any) => {
              const id = typeof catId === 'string' ? catId : (catId?._id || catId)
              if (id && isObjectId(String(id))) {
                return this.getCategory(String(id))
              }
              return null
            })
            .filter(Boolean)
          
          const categoryData = await Promise.all(categoryPromises)
          const categoryNames = categoryData
            .filter((cat: any) => cat && cat.name)
            .map((cat: any) => cat.name)
          
          if (categoryNames.length > 0) {
            normalized.categories = categoryNames
          }
        } catch (err) {
          console.warn('Failed to fetch category details:', err)
        }
      }
    }
    
    return normalized
  }

  async getFeaturedProducts(): Promise<Product[]> {
    const published = await this.getPublishedProducts()
    return published.data
  }

  async getTrendingProducts(): Promise<Product[]> {
    const published = await this.getPublishedProducts()
    return published.data
  }

  async searchProducts(query: string, _filters: Omit<ProductFilters, 'search'> = {}): Promise<PaginatedResponse<Product>> {
    // Simple client-side search over active products
    const base = await this.getProducts({ page: 1, limit: 1000 })
    const q = query.toLowerCase()
    const matched = base.data.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
    )

    return {
      data: matched,
      total: matched.length,
      page: 1,
      limit: matched.length || 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }
  }

  async getPublishedProducts(filters: Omit<ProductFilters, 'status'> = {}): Promise<PaginatedResponse<Product>> {
    // Backend does not distinguish draft/published; reuse getProducts
    return this.getProducts(filters as ProductFilters)
  }

  async getProductsByCategory(categoryId: string, filters: Omit<ProductFilters, 'category'> = {}): Promise<PaginatedResponse<Product>> {
    const base = await this.getProducts({ page: 1, limit: 1000, ...filters })
    const filtered = base.data.filter((p: any) => {
      if (!p) return false
      if (p.category === categoryId) return true
      if (p.category && typeof p.category === 'object' && p.category._id === categoryId) return true
      if (Array.isArray(p.categories)) {
        return p.categories.some((cat: any) => {
          if (!cat) return false
          if (typeof cat === 'string') return cat === categoryId
          if (typeof cat === 'object') return cat._id === categoryId
          return false
        })
      }
      return false
    })

    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      limit: filtered.length || 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }
  }

  async getProductsByBrand(brandId: string, filters: Omit<ProductFilters, 'brand'> = {}): Promise<PaginatedResponse<Product>> {
    const base = await this.getProducts({ page: 1, limit: 1000, ...filters })
    const filtered = base.data.filter((p: any) => {
      if (!p) return false
      if (p.brand === brandId) return true
      if (p.brand && typeof p.brand === 'object' && p.brand._id === brandId) return true
      return false
    })

    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      limit: filtered.length || 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }
  }

  // Categories API
  async getCategories(): Promise<Category[]> {
    // Backend exposes simple /categories endpoint (optionally with activeOnly)
    try {
      const payload = await this.request<any>('/categories?activeOnly=true')
      if (Array.isArray(payload)) return payload as Category[]
      if (payload?.data && Array.isArray(payload.data)) return payload.data as Category[]
      return []
    } catch (error) {
      console.error('Error in getCategories:', error)
      return []
    }
  }

  async getRootCategories(): Promise<Category[]> {
    // Get root categories (categories without parent) - filter from all categories
    try {
      const allCategories = await this.getCategories()
      // Filter for root categories (no parentId or parentId is null/undefined)
      return allCategories.filter(cat => !cat.parentId && !cat.parent)
    } catch (error) {
      console.error('Error fetching root categories:', error)
      return []
    }
  }

  async getCategory(id: string): Promise<Category> {
    return await this.request<Category>(`/categories/${id}`)
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const all = await this.getCategories()
    const match = all.find(cat => cat.slug === slug || cat.name === slug)
    if (!match) {
      throw new Error('Category not found')
    }
    return match
  }

  // Brands API
  async getBrands(): Promise<Brand[]> {
    // Backend exposes /brands with optional activeOnly flag
    const payload = await this.request<any>('/brands?activeOnly=true')
    if (Array.isArray(payload)) return payload as Brand[]
    if (payload?.data && Array.isArray(payload.data)) return payload.data as Brand[]
    return []
  }

  async getBrand(id: string): Promise<Brand> {
    return await this.request<Brand>(`/brands/${id}`)
  }

  async getBrandBySlug(slug: string): Promise<Brand> {
    const all = await this.getBrands()
    const match = all.find(brand => brand.slug === slug || brand.name === slug)
    if (!match) {
      throw new Error('Brand not found')
    }
    return match
  }

  async getBrandsByCountry(country: string, _params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Brand>> {
    const all = await this.getBrands()
    const filtered = all.filter(brand => (brand.country || '').toLowerCase() === country.toLowerCase())
    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      limit: filtered.length || 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    }
  }

  // Filter Options API - derived client-side from products & categories
  async getFilterOptions(): Promise<{
    categories: Array<{ _id: string; name: string; slug: string }>;
    brands: Array<{ _id: string; name: string; slug: string }>;
    sizes: string[];
    colors: string[];
    priceRange: { min: number; max: number };
  }> {
    const [categories, products, brands] = await Promise.all([
      this.getCategories(),
      this.getProducts({ page: 1, limit: 1000 }),
      this.getBrands(),
    ])

    const sizeSet = new Set<string>()
    const colorSet = new Set<string>()
    let minPrice = Number.POSITIVE_INFINITY
    let maxPrice = 0

    products.data.forEach((p) => {
      if (Array.isArray(p.availableSizes)) {
        p.availableSizes.forEach((s) => s && sizeSet.add(s))
      }
      if (Array.isArray(p.colors)) {
        p.colors.forEach((c) => c && colorSet.add(c))
      }
      if (typeof p.price === 'number') {
        if (p.price < minPrice) minPrice = p.price
        if (p.price > maxPrice) maxPrice = p.price
      }
    })

    if (!isFinite(minPrice)) {
      minPrice = 0
    }

    return {
      categories: categories.map((c) => ({ _id: c._id, name: c.name, slug: c.slug })),
      brands: brands.map((b) => ({ _id: b._id, name: b.name, slug: b.slug })),
      sizes: Array.from(sizeSet),
      colors: Array.from(colorSet),
      priceRange: { min: minPrice, max: maxPrice },
    }
  }

  // Orders API - simple client-side filtering over /orders
  async getCustomerOrders(customerId: string, filters: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<any>> {
    // Backend does not yet expose customer-specific orders; fetch all and filter by phone/session if needed.
    const all = await this.request<any[]>('/orders')
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20

    // For now, return all orders (no real customer linkage available)
    const total = all.length
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1
    const start = (page - 1) * limit
    const end = start + limit

    return {
      data: all.slice(start, end),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }
  }

  async getOrder(id: string): Promise<any> {
    return await this.request(`/orders/${id}`)
  }

  async createOrder(orderData: any): Promise<any> {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  // Banner API - hero banners (active only)
  async getHeroBanners(): Promise<Array<{
    _id: string
    title?: string
    subtitle?: string
    description?: string
    imageUrl: string
    altText?: string
    linkUrl?: string
    linkText?: string
  }>> {
    // Backend supports /banners with ?activeOnly=true
    const response = await this.request<any[]>(`/banners?activeOnly=true`)
    if (!Array.isArray(response)) return []

    return response.map((banner: any) => ({
      _id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.image,
      altText: banner.title || banner.subtitle || 'Hero banner',
      linkUrl: banner.buttonLink || '/shop',
      linkText: banner.buttonText || 'Shop Now',
    }))
  }

  // Shipping "API" - computed client-side (no backend route yet)
  async calculateShipping(data: {
    shippingAddress: {
      country: string
      state?: string
      city?: string
      postalCode?: string
    }
    orderTotal?: number
    packageDetails?: {
      weight?: number
      itemCount?: number
      dimensions?: {
        length?: number
        width?: number
        height?: number
      }
    }
  }): Promise<{
    availableMethods: Array<{
      methodId: string
      name: string
      cost: number
      estimatedDays: number
      description?: string
    }>
    totalCost: number
    currency: string
  }> {
    const baseCost = 500
    const freeThreshold = 10000
    const orderTotal = data.orderTotal ?? 0

    const cost = orderTotal >= freeThreshold ? 0 : baseCost

    return {
      availableMethods: [
        {
          methodId: 'standard',
          name: 'Standard Delivery',
          cost,
          estimatedDays: 3,
          description: 'Standard nationwide delivery',
        },
      ],
      totalCost: cost,
      currency: 'PKR',
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL)