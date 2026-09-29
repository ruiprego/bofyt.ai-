import { isProductSearchResponse, type ProductSearchErrorCode, type ProductSearchResponse } from './types'

export class ProductSearchClientError extends Error {
  readonly code: ProductSearchErrorCode | 'UNKNOWN'

  constructor(message: string, code: ProductSearchErrorCode | 'UNKNOWN') {
    super(message)
    this.name = 'ProductSearchClientError'
    this.code = code
  }
}

export async function searchProducts(query: string, signal?: AbortSignal): Promise<ProductSearchResponse> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ProductSearchClientError('The product search returned an unreadable response. Try again.', 'INVALID_RESPONSE')
  }

  if (!response.ok) {
    const error = payload && typeof payload === 'object' ? (payload as { error?: { message?: unknown; code?: unknown } }).error : undefined
    const message = typeof error?.message === 'string' ? error.message : 'The live product search could not be reached. Try again.'
    const code = typeof error?.code === 'string' ? (error.code as ProductSearchErrorCode) : 'UNKNOWN'
    throw new ProductSearchClientError(message, code)
  }

  if (!isProductSearchResponse(payload)) {
    throw new ProductSearchClientError('The product search returned an invalid product list. Try again.', 'INVALID_RESPONSE')
  }

  return payload
}
