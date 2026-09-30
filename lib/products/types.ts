export interface ProductPriceConstraint {
  minPrice?: number
  maxPrice?: number
  currency?: string
}

export interface ProductSearchParams extends ProductPriceConstraint {
  query: string
  category?: string
  brand?: string
  keywords: string[]
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
  image?: string
  imageUrls?: string[]
  price?: number
  oldPrice?: number
  currency?: string
  rating?: number
  reviewCount?: number
  reviews?: number
  retailer?: string
  source?: string
  productUrl: string
  availability?: string
  delivery?: string
  category?: string
}

export interface ProductSearchResponse {
  products: Product[]
  closestProducts?: Product[]
  priceConstraint?: ProductPriceConstraint
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
  return (
    typeof product.id === 'string' &&
    typeof product.title === 'string' &&
    typeof product.productUrl === 'string' &&
    (product.price === undefined || (typeof product.price === 'number' && Number.isFinite(product.price))) &&
    (product.currency === undefined || typeof product.currency === 'string')
  )
}

function isProductPriceConstraint(value: unknown): value is ProductPriceConstraint {
  if (!value || typeof value !== 'object') return false
  const constraint = value as Record<string, unknown>
  return (
    (constraint.minPrice === undefined || (typeof constraint.minPrice === 'number' && Number.isFinite(constraint.minPrice))) &&
    (constraint.maxPrice === undefined || (typeof constraint.maxPrice === 'number' && Number.isFinite(constraint.maxPrice))) &&
    (constraint.currency === undefined || typeof constraint.currency === 'string')
  )
}

function isComparableProduct(product: Product, constraint: ProductPriceConstraint) {
  return (
    product.price !== undefined &&
    Number.isFinite(product.price) &&
    (!constraint.currency || product.currency?.toUpperCase() === constraint.currency.toUpperCase())
  )
}

function matchesPriceConstraint(product: Product, constraint: ProductPriceConstraint) {
  if (constraint.minPrice === undefined && constraint.maxPrice === undefined) return true
  if (!isComparableProduct(product, constraint)) return false
  const price = product.price
  if (price === undefined) return false
  if (constraint.minPrice !== undefined && price < constraint.minPrice) return false
  if (constraint.maxPrice !== undefined && price > constraint.maxPrice) return false
  return true
}

export const isProductSearchResponse = (value: unknown): value is ProductSearchResponse => {
  if (!value || typeof value !== 'object') return false
  const response = value as Record<string, unknown>
  const constraint = response.priceConstraint
  const exactProducts = response.products
  const closestProducts = response.closestProducts
  if (!Array.isArray(exactProducts) || !exactProducts.every(isProduct)) return false
  if (closestProducts !== undefined && (!Array.isArray(closestProducts) || !closestProducts.every(isProduct))) return false
  if (constraint !== undefined && !isProductPriceConstraint(constraint)) return false
  if (constraint && isProductPriceConstraint(constraint)) {
    if (!exactProducts.every((product) => matchesPriceConstraint(product, constraint))) return false
    if (closestProducts && !closestProducts.every((product) => isComparableProduct(product, constraint) && !matchesPriceConstraint(product, constraint))) return false
  }
  return true
}
