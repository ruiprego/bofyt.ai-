import { parseProductSearchParams } from './parse'
import { HttpProductSearchProvider } from './providers/http'
import type { ProductSearchProvider } from './types'

export function createProductSearchProvider(): ProductSearchProvider {
  return new HttpProductSearchProvider()
}

export async function searchProducts(query: string, signal?: AbortSignal) {
  return createProductSearchProvider().search(parseProductSearchParams(query), signal)
}
