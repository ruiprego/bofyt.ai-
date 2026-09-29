import type { Product, ProductSearchParams, ProductSearchProvider, ProductSearchResponse } from '../types'
import {
  PRODUCT_SEARCH_CONFIGURATION_MESSAGE,
  ProductSearchError,
} from '../types'

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json'
const REQUEST_TIMEOUT_MS = 15_000

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined

  const normalized = value.trim().replace(/[^\d,.-]/g, '')
  if (!normalized) return undefined

  const lastComma = normalized.lastIndexOf(',')
  const lastDot = normalized.lastIndexOf('.')
  let canonical = normalized

  if (lastComma >= 0 && lastDot >= 0) {
    canonical = lastComma > lastDot ? normalized.replace(/\./g, '').replace(',', '.') : normalized.replace(/,/g, '')
  } else if (lastComma >= 0) {
    const fractionalDigits = normalized.length - lastComma - 1
    canonical = fractionalDigits === 3 ? normalized.replace(/,/g, '') : normalized.replace(',', '.')
  }

  const parsed = Number(canonical)
  return Number.isFinite(parsed) ? parsed : undefined
}

function asUrl(value: unknown) {
  const raw = asString(value)
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asString(record[key])
    if (value) return value
  }
  return undefined
}

function parseCurrency(rawPrice: unknown, record: Record<string, unknown>, fallback?: string) {
  const value = firstString(record, ['currency', 'currency_code', 'currencyCode', 'priceCurrency'])
  if (value) return value.toUpperCase()

  const price = [asString(rawPrice), asString(record.price), asString(record.currentPrice), asString(record.salePrice)]
    .filter(Boolean)
    .join(' ')
  if (price.includes('€')) return 'EUR'
  if (price.includes('$')) return 'USD'
  if (price.includes('£')) return 'GBP'
  if (/\bCHF\b/i.test(price)) return 'CHF'
  if (/\bCAD\b/i.test(price)) return 'CAD'
  if (/\bAUD\b/i.test(price)) return 'AUD'
  if (/\bEUR\b/i.test(price)) return 'EUR'
  if (/\bUSD\b/i.test(price)) return 'USD'
  if (/\bGBP\b/i.test(price)) return 'GBP'
  return fallback?.toUpperCase()
}

function imageUrls(record: Record<string, unknown>) {
  const candidates: unknown[] = [
    record.thumbnail,
    record.serpapi_thumbnail,
    record.imageUrl,
    record.image,
    record.product_image,
    record.product_image_url,
  ]

  for (const key of ['thumbnails', 'images', 'image_urls', 'additional_images']) {
    const values = record[key]
    if (Array.isArray(values)) candidates.push(...values)
  }

  return candidates
    .map(asUrl)
    .filter((value): value is string => Boolean(value))
    .filter((value, index, list) => list.indexOf(value) === index)
}

function normalizeProduct(value: unknown, fallbackCurrency?: string): Product | null {
  const record = asRecord(value)
  if (!record) return null

  const title = firstString(record, ['title', 'name', 'productName'])
  const productUrl = asUrl(record.product_link ?? record.productUrl ?? record.url ?? record.link ?? record.offerUrl)
  if (!title || !productUrl) return null

  const rawPrice = record.extracted_price ?? record.price ?? record.currentPrice ?? record.salePrice
  const rawOldPrice =
    record.extracted_old_price ?? record.old_price ?? record.original_price ?? record.originalPrice ?? record.was_price
  const images = imageUrls(record)
  const rawAvailability = record.availability ?? record.stock
  const availability =
    typeof rawAvailability === 'boolean' ? (rawAvailability ? 'In stock' : 'Out of stock') : asString(rawAvailability)
  const id = firstString(record, ['product_id', 'id', 'productId', 'sku']) ?? productUrl
  const source = firstString(record, ['source', 'retailer', 'store', 'seller', 'merchant'])
  const reviews = asNumber(record.reviews ?? record.review_count ?? record.reviewCount)

  return {
    id,
    title,
    brand: firstString(record, ['brand', 'manufacturer']),
    description: firstString(record, ['snippet', 'description', 'summary']),
    imageUrl: images[0],
    image: images[0],
    imageUrls: images.length > 1 ? images : undefined,
    price: asNumber(rawPrice),
    oldPrice: asNumber(rawOldPrice),
    currency: parseCurrency(rawPrice, record, fallbackCurrency),
    rating: asNumber(record.rating),
    reviewCount: reviews,
    reviews,
    retailer: source,
    source,
    productUrl,
    availability,
    delivery: firstString(record, ['delivery', 'shipping', 'delivery_info']),
    category: firstString(record, ['category', 'productType', 'type']),
  }
}

function hasPriceConstraint(params: ProductSearchParams) {
  return params.minPrice !== undefined || params.maxPrice !== undefined
}

function hasMatchingCurrency(product: Product, currency?: string) {
  return !currency || product.currency?.toUpperCase() === currency.toUpperCase()
}

function matchesPriceConstraint(product: Product, params: ProductSearchParams) {
  if (!hasPriceConstraint(params)) return true
  if (product.price === undefined || !Number.isFinite(product.price)) return false
  if (!hasMatchingCurrency(product, params.currency)) return false
  if (params.minPrice !== undefined && product.price < params.minPrice) return false
  if (params.maxPrice !== undefined && product.price > params.maxPrice) return false
  return true
}

function distanceFromPriceConstraint(product: Product, params: ProductSearchParams) {
  if (params.minPrice !== undefined && product.price !== undefined && product.price < params.minPrice) {
    return params.minPrice - product.price
  }
  if (params.maxPrice !== undefined && product.price !== undefined && product.price > params.maxPrice) {
    return product.price - params.maxPrice
  }
  return Number.POSITIVE_INFINITY
}

export function filterProductsByPrice(products: Product[], params: ProductSearchParams) {
  if (!hasPriceConstraint(params)) return { products, closestProducts: [] as Product[] }

  const comparableProducts = products.filter(
    (product) => product.price !== undefined && Number.isFinite(product.price) && hasMatchingCurrency(product, params.currency),
  )
  const exactProducts = comparableProducts.filter((product) => matchesPriceConstraint(product, params))
  const closestProducts = comparableProducts
    .filter((product) => !matchesPriceConstraint(product, params))
    .sort((a, b) => distanceFromPriceConstraint(a, params) - distanceFromPriceConstraint(b, params))
    .slice(0, 5)

  return { products: exactProducts, closestProducts }
}

function normalizeResponse(payload: unknown, params: ProductSearchParams): ProductSearchResponse {
  const record = asRecord(payload)
  const providerError = asString(record?.error)
  if (providerError) {
    throw new ProductSearchError('SerpApi returned an error for this search.', 'UPSTREAM', 502)
  }

  if (!record || !Array.isArray(record.shopping_results)) {
    throw new ProductSearchError('SerpApi returned an invalid shopping result list.', 'INVALID_RESPONSE', 502)
  }

  const normalizedProducts = record.shopping_results
    .map((item) => normalizeProduct(item, params.currency))
    .filter((product): product is Product => Boolean(product))
  const uniqueProducts = normalizedProducts.filter(
    (product, index, list) => list.findIndex((item) => item.productUrl === product.productUrl) === index,
  )
  const filtered = filterProductsByPrice(uniqueProducts, params)
  const priceConstraint = hasPriceConstraint(params)
    ? {
        ...(params.minPrice !== undefined ? { minPrice: params.minPrice } : {}),
        ...(params.maxPrice !== undefined ? { maxPrice: params.maxPrice } : {}),
        ...(params.currency ? { currency: params.currency } : {}),
      }
    : undefined

  return {
    products: filtered.products,
    closestProducts: filtered.closestProducts.length ? filtered.closestProducts : undefined,
    priceConstraint,
    total: filtered.products.length,
    nextPage: null,
  }
}

function buildRequestUrl(params: ProductSearchParams, apiKey: string) {
  const url = new URL(SERPAPI_ENDPOINT)
  url.searchParams.set('engine', 'google_shopping')
  url.searchParams.set('q', params.query)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('output', 'json')
  if (params.minPrice !== undefined) url.searchParams.set('min_price', String(params.minPrice))
  if (params.maxPrice !== undefined) url.searchParams.set('max_price', String(params.maxPrice))
  if (params.currency) url.searchParams.set('currency', params.currency)
  if (params.page && params.page > 1) url.searchParams.set('start', String((params.page - 1) * 40))
  return url
}

export class SerpApiProductSearchProvider implements ProductSearchProvider {
  async search(params: ProductSearchParams, signal?: AbortSignal): Promise<ProductSearchResponse> {
    const apiKey = process.env.SERPAPI_API_KEY?.trim()
    if (!apiKey) {
      throw new ProductSearchError(PRODUCT_SEARCH_CONFIGURATION_MESSAGE, 'CONFIGURATION', 503)
    }

    const controller = new AbortController()
    const forwardAbort = () => controller.abort(signal?.reason)
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    signal?.addEventListener('abort', forwardAbort, { once: true })

    try {
      const response = await fetch(buildRequestUrl(params, apiKey), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new ProductSearchError('SerpApi rejected the configured API key.', 'UPSTREAM', 502)
        }
        if (response.status === 429) {
          throw new ProductSearchError('SerpApi rate limit reached. Try again shortly.', 'UPSTREAM', 502)
        }
        throw new ProductSearchError(`SerpApi returned ${response.status}.`, 'UPSTREAM', 502)
      }

      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new ProductSearchError('SerpApi returned invalid JSON.', 'INVALID_RESPONSE', 502)
      }

      return normalizeResponse(payload, params)
    } catch (error) {
      if (error instanceof ProductSearchError) throw error
      if (signal?.aborted) throw error
      throw new ProductSearchError('The live product search could not be reached. Try again.', 'UPSTREAM', 502)
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', forwardAbort)
    }
  }
}
