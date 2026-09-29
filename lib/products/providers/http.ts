import type { Product, ProductSearchParams, ProductSearchProvider, ProductSearchResponse } from '../types'
import {
  PRODUCT_SEARCH_CONFIGURATION_MESSAGE,
  ProductSearchError,
} from '../types'

const REQUEST_TIMEOUT_MS = 10_000

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return undefined
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '')
  const parsed = Number(normalized.replace(',', '.'))
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

function findCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  const record = asRecord(payload)
  if (!record) return []
  for (const key of ['products', 'results', 'items', 'shopping_results']) {
    if (Array.isArray(record[key])) return record[key]
  }
  for (const key of ['data', 'response']) {
    const nested = findCandidates(record[key])
    if (nested.length) return nested
  }
  return []
}

function parseCurrency(rawPrice: unknown, record: Record<string, unknown>) {
  const value = firstString(record, ['currency', 'currencyCode', 'priceCurrency'])
  if (value) return value.toUpperCase()
  const price = asString(rawPrice)
  if (price?.includes('€')) return 'EUR'
  if (price?.includes('$')) return 'USD'
  if (price?.includes('£')) return 'GBP'
  if (/\bCHF\b/i.test(price ?? '')) return 'CHF'
  return undefined
}

function normalizeProduct(value: unknown): Product | null {
  const record = asRecord(value)
  if (!record) return null

  const title = firstString(record, ['title', 'name', 'productName'])
  const productUrl = asUrl(record.productUrl ?? record.url ?? record.link ?? record.product_link ?? record.offerUrl)
  if (!title || !productUrl) return null

  const rawPrice = record.extracted_price ?? record.price ?? record.currentPrice ?? record.salePrice ?? asRecord(record.offers)?.price
  const rawAvailability = record.availability ?? record.stock
  const availability = typeof rawAvailability === 'boolean' ? (rawAvailability ? 'In stock' : 'Out of stock') : asString(rawAvailability)
  const imageUrl = asUrl(record.imageUrl ?? record.image ?? record.thumbnail ?? (Array.isArray(record.images) ? record.images[0] : undefined))
  const id = firstString(record, ['id', 'productId', 'product_id', 'sku']) ?? productUrl
  const price = asNumber(rawPrice)

  return {
    id,
    title,
    brand: firstString(record, ['brand', 'manufacturer']),
    description: firstString(record, ['description', 'snippet', 'summary']),
    imageUrl,
    price,
    currency: parseCurrency(rawPrice, record),
    retailer: firstString(record, ['retailer', 'source', 'store', 'seller', 'merchant']),
    productUrl,
    availability,
    category: firstString(record, ['category', 'productType', 'type']),
  }
}

function normalizeResponse(payload: unknown): ProductSearchResponse {
  const products = findCandidates(payload).map(normalizeProduct).filter((product): product is Product => Boolean(product))
  const uniqueProducts = products.filter((product, index, list) => list.findIndex((item) => item.productUrl === product.productUrl) === index)
  const record = asRecord(payload)
  const total = asNumber(record?.total ?? record?.totalResults ?? record?.results_count)
  const nextPage = asUrl(record?.nextPage ?? record?.next_page ?? record?.nextUrl) ?? null

  return { products: uniqueProducts, total: total ?? uniqueProducts.length, nextPage }
}

function buildRequestUrl(baseUrl: string, params: ProductSearchParams) {
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    throw new ProductSearchError('The product-search API URL is invalid.', 'CONFIGURATION')
  }

  url.searchParams.set('q', params.query)
  if (params.category) url.searchParams.set('category', params.category)
  if (params.brand) url.searchParams.set('brand', params.brand)
  if (params.keywords.length) url.searchParams.set('keywords', params.keywords.join(','))
  if (params.minPrice !== undefined) url.searchParams.set('min_price', String(params.minPrice))
  if (params.maxPrice !== undefined) url.searchParams.set('max_price', String(params.maxPrice))
  if (params.currency) url.searchParams.set('currency', params.currency)
  if (params.color) url.searchParams.set('color', params.color)
  if (params.size) url.searchParams.set('size', params.size)
  if (params.gender) url.searchParams.set('gender', params.gender)
  if (params.page) url.searchParams.set('page', String(params.page))
  return url
}

export class HttpProductSearchProvider implements ProductSearchProvider {
  async search(params: ProductSearchParams, signal?: AbortSignal): Promise<ProductSearchResponse> {
    const baseUrl = process.env.PRODUCT_SEARCH_API_URL?.trim()
    const apiKey = process.env.PRODUCT_SEARCH_API_KEY?.trim()
    if (!baseUrl || !apiKey) {
      throw new ProductSearchError(PRODUCT_SEARCH_CONFIGURATION_MESSAGE, 'CONFIGURATION', 503)
    }

    const controller = new AbortController()
    const forwardAbort = () => controller.abort(signal?.reason)
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    signal?.addEventListener('abort', forwardAbort, { once: true })

    try {
      const response = await fetch(buildRequestUrl(baseUrl, params), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
        },
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new ProductSearchError(`Product search provider returned ${response.status}.`, 'UPSTREAM', 502)
      }

      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new ProductSearchError('Product search provider returned invalid JSON.', 'INVALID_RESPONSE', 502)
      }

      const normalized = normalizeResponse(payload)
      if (!Array.isArray(normalized.products)) {
        throw new ProductSearchError('Product search provider returned an invalid product list.', 'INVALID_RESPONSE', 502)
      }
      return normalized
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
