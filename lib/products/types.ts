export interface ProductSearchParams {
  query: string
  category?: string
  brand?: string
  keywords: string[]
  minPrice?: number
  maxPrice?: number
  currency?: string
  color?: string
  size?: string
  gender?: string
  page?: number
}

export interface Product {
  id: string
  title: string
  brand?: string
  description?: string
  imageUrl?: string
  imageUrls?: string[]
  price?: number
  oldPrice?: number
  currency?: string
  rating?: number
  reviewCount?: number
  retailer?: string
  productUrl: string
  availability?: string
  delivery?: string
  category?: string
}

export interface ProductSearchResponse {
  products: Product[]
  total?: number
  nextPage?: string | null
}

export interface ProductSearchProvider {
  search(params: ProductSearchParams, signal?: AbortSignal): Promise<ProductSearchResponse>
}

export type ProductSearchErrorCode = 'CONFIGURATION' | 'UPSTREAM' | 'INVALID_RESPONSE'

export class ProductSearchError extends Error {
  readonly code: ProductSearchErrorCode
  readonly status?: number

  constructor(message: string, code: ProductSearchErrorCode, status?: number) {
    super(message)
    this.name = 'ProductSearchError'
    this.code = code
    this.status = status
  }
}

export interface ProductSearchFeedback {
  kind: 'configuration' | 'error'
  message: string
}

export const PRODUCT_SEARCH_CONFIGURATION_MESSAGE =
  "Product search isn't connected yet. Add SERPAPI_API_KEY to enable live results."

export const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== 'object') return false
  const product = value as Record<string, unknown>
  return typeof product.id === 'string' && typeof product.title === 'string' && typeof product.productUrl === 'string'
}

export const isProductSearchResponse = (value: unknown): value is ProductSearchResponse => {
  if (!value || typeof value !== 'object') return false
  const response = value as Record<string, unknown>
  return Array.isArray(response.products) && response.products.every(isProduct)
}
