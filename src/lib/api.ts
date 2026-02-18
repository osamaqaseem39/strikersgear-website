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
// NOTE: This interface is intentionally limited to fields that exist
// on the backend Product model (plus Mongoose timestamps).
export interface Product {
  _id: string
  name: string
  slug?: string
  shortDescription?: string
  sizeInfo?: string
  description?: string
  sizeChart?: any
  discountPercentage?: number
  attributes?: { name: string; value: string }[]
  features?: string[]
  featuredImage?: string
  gallery?: string[]
  images: string[]
  price: number
  category: string
  categories?: string[]
  brand?: string
  isActive?: boolean
  createdAt: string
  updatedAt: string

  // Legacy/UI-only fields that are not part of the core
  // backend Product schema today. These may be populated
  // in the future or derived on the client, but are not
  // guaranteed by the backend.
  originalPrice?: number
  salePrice?: number
  isSale?: boolean
  isNew?: boolean
  rating?: number
  reviews?: number
  availableSizes?: string[]
  /** Color names or objects with name/imageUrl for swatches */
  colors?: (string | { name?: string; imageUrl?: string })[]
  sizeChartImageUrl?: string
  bodyType?: string[]
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  inStock?: boolean
  stockQuantity?: number
  stockCount?: number
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
    let imageUrls: string[] | undefined = undefined
    
    // First, try to get images from the images array
    if (Array.isArray(raw?.images)) {
      imageUrls = []
      for (const img of raw.images) {
        if (typeof img === 'string' && img.trim()) {
          const looksLikeObjectId = /^[a-f\d]{24}$/i.test(img.trim())
          if (!looksLikeObjectId) {
            imageUrls.push(img.trim())
          }
          continue
        }
        if (img && typeof img === 'object') {
          const candidate = img.url || img.imageUrl || img.path || ''
          if (candidate && candidate.trim()) {
            imageUrls.push(candidate.trim())
          }
        }
      }
      if (imageUrls.length === 0) {
        imageUrls = undefined
      }
    }
    
    // Fallback to featuredImage if images array is empty
    if ((!imageUrls || imageUrls.length === 0) && raw?.featuredImage) {
      const featuredImg = typeof raw.featuredImage === 'string' 
        ? raw.featuredImage.trim() 
        : (raw.featuredImage?.url || raw.featuredImage?.imageUrl || raw.featuredImage?.path || '').trim()
      if (featuredImg && !/^[a-f\d]{24}$/i.test(featuredImg)) {
        imageUrls = [featuredImg]
      }
    }
    
    // Fallback to gallery if still no images
    if ((!imageUrls || imageUrls.length === 0) && Array.isArray(raw?.gallery) && raw.gallery.length > 0) {
      imageUrls = []
      for (const img of raw.gallery) {
        if (typeof img === 'string' && img.trim()) {
          const looksLikeObjectId = /^[a-f\d]{24}$/i.test(img.trim())
          if (!looksLikeObjectId) {
            imageUrls.push(img.trim())
          }
        } else if (img && typeof img === 'object') {
          const candidate = img.url || img.imageUrl || img.path || ''
          if (candidate && candidate.trim()) {
            imageUrls.push(candidate.trim())
          }
        }
      }
      if (imageUrls.length === 0) {
        imageUrls = undefined
      }
    }
    
    // If still no images, use placeholder
    if (!imageUrls || imageUrls.length === 0) {
      imageUrls = [placeholder]
    }

    // Normalize brand to a readable string where possible; avoid exposing raw ObjectIds
    let brand: string | undefined
    if (typeof raw?.brand === 'string') {
      const looksLikeObjectId = /^[a-f\d]{24}$/i.test(raw.brand)
      brand = looksLikeObjectId ? undefined : raw.brand
    } else if (raw?.brand && typeof raw.brand === 'object') {
      brand = raw.brand.name || raw.brand.slug || undefined
    }

    // Category is stored as a single ObjectId in the backend
    const category: string = typeof raw?.category === 'string'
      ? raw.category
      : (raw?.category?._id || raw?.category || '')

    // Normalize availableSizes: ensure string array (backend may send refs or objects)
    let availableSizes: string[] | undefined
    if (Array.isArray(raw?.availableSizes) && raw.availableSizes.length > 0) {
      const sizes = raw.availableSizes
        .map((s: any) => (typeof s === 'string' ? s : s?.name ?? s?.size ?? s?.label))
        .filter(Boolean) as string[]
      availableSizes = sizes.length > 0 ? sizes : undefined
    }

    // Normalize colors: ensure string array or array of { name, imageUrl } (backend may send refs)
    let colors: (string | { name?: string; imageUrl?: string })[] | undefined
    if (Array.isArray(raw?.colors) && raw.colors.length > 0) {
      const colorList = raw.colors
        .map((c: any) => {
          if (typeof c === 'string' && c.trim() && !/^[a-f\d]{24}$/i.test(c.trim())) return c.trim()
          if (c && typeof c === 'object') {
            const name = c.name ?? c.colorName ?? c.label ?? c.title ?? (typeof c.colorId === 'string' && !/^[a-f\d]{24}$/i.test(c.colorId) ? c.colorId : '')
            if (name) return { name: String(name), imageUrl: c.imageUrl ?? c.url }
          }
          return null
        })
        .filter(Boolean) as (string | { name?: string; imageUrl?: string })[]
      colors = colorList.length > 0 ? colorList : undefined
    }

    return {
      _id: String(raw._id),
      name: raw.name,
      slug: raw.slug,
      shortDescription: raw.shortDescription,
      sizeInfo: raw.sizeInfo,
      description: raw.description,
      sizeChart: raw.sizeChart,
      discountPercentage: raw.discountPercentage,
      attributes: raw.attributes,
      features: raw.features,
      featuredImage: raw.featuredImage,
      gallery: raw.gallery,
      images: imageUrls ?? raw.images ?? [placeholder],
      sizeChartImageUrl: raw.sizeChartImageUrl,
      price: raw.price,
      category,
      brand,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      originalPrice: raw.originalPrice,
      salePrice: raw.salePrice,
      isSale: raw.isSale,
      isNew: raw.isNew,
      rating: raw.rating,
      reviews: raw.reviews,
      availableSizes,
      colors,
      bodyType: raw.bodyType,
      tags: raw.tags,
      status: raw.status,
      inStock: raw.inStock,
      stockQuantity: raw.stockQuantity,
      stockCount: raw.stockCount,
    }
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
        p.colors.forEach((c) => {
          const name = typeof c === 'string' ? c : (c as { name?: string })?.name
          if (name) colorSet.add(name)
        })
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

  // Orders API - customer-specific orders
  async getCustomerOrders(customerId: string, filters: { page?: number; limit?: number; status?: string } = {}, token?: string): Promise<PaginatedResponse<any>> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    
    // Use authenticated endpoint if token is provided
    if (token) {
      const headers: Record<string, string> = {
        ...getCorsHeaders(),
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const url = `/orders/my-orders${filters.status ? `?status=${filters.status}` : ''}`
      const response = await fetch(`${this.baseURL}${url}`, {
        headers,
        ...getCorsConfig(),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const all = await response.json()
      const total = Array.isArray(all) ? all.length : 0
      const totalPages = total > 0 ? Math.ceil(total / limit) : 1
      const start = (page - 1) * limit
      const end = start + limit
      
      return {
        data: Array.isArray(all) ? all.slice(start, end) : [],
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    }
    
    // Fallback to customer ID endpoint
    const all = await this.request<any[]>(`/orders/customer/${customerId}${filters.status ? `?status=${filters.status}` : ''}`)
    const total = Array.isArray(all) ? all.length : 0
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1
    const start = (page - 1) * limit
    const end = start + limit

    return {
      data: Array.isArray(all) ? all.slice(start, end) : [],
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
    title: string
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
      // Ensure title is always a string to satisfy Hero's Banner type
      title: banner.title || banner.subtitle || 'Hero banner',
      subtitle: banner.subtitle,
      description: banner.description,
      imageUrl: banner.image,
      altText: banner.title || banner.subtitle || 'Hero banner',
      linkUrl: banner.buttonLink || '/shop',
      linkText: banner.buttonText || 'Shop Now',
    }))
  }

  /**
   * Generic banner fetcher by "position".
   * Currently the backend only exposes a single banners collection,
   * so we ignore the position and reuse hero banners. This keeps
   * MobileHero and any other callers working without extra backend logic.
   */
  async getBannersByPosition(
    _position: 'hero' | string,
  ): Promise<Array<{
    _id: string
    title: string
    subtitle?: string
    description?: string
    imageUrl: string
    altText?: string
    linkUrl?: string
    linkText?: string
  }>> {
    return this.getHeroBanners()
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