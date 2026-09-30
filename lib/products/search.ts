import { parseProductSearchParams } from './parse'
import { SerpApiProductSearchProvider } from './providers/http'
import type { ProductSearchProvider } from './types'

export function createProductSearchProvider(): ProductSearchProvider {
  return new SerpApiProductSearchProvider()
}

export async function searchProducts(query: string, signal?: AbortSignal) {
  return createProductSearchProvider().search(parseProductSearchParams(query), signal)
}
