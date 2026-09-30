import { NextResponse } from 'next/server'
import { parseProductSearchParams } from '@/lib/products/parse'
import { createProductSearchProvider } from '@/lib/products/search'
import {
  PRODUCT_SEARCH_CONFIGURATION_MESSAGE,
  ProductSearchError,
} from '@/lib/products/types'

export const dynamic = 'force-dynamic'

async function handleProductSearch(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Send a product search as JSON.' } }, { status: 400 })
  }

  const query =
    payload && typeof payload === 'object' && !Array.isArray(payload) && typeof (payload as { query?: unknown }).query === 'string'
      ? (payload as { query: string }).query.trim()
      : ''

  if (!query) {
    return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Enter a product to search for.' } }, { status: 400 })
  }
  if (query.length > 500) {
    return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Keep product searches under 500 characters.' } }, { status: 400 })
  }

  try {
    const searchParams = parseProductSearchParams(query)
    const provider = createProductSearchProvider()
    const response = await provider.search(searchParams, request.signal)
    return NextResponse.json({ query: searchParams.query, originalQuery: query, ...response })
  } catch (error) {
    if (error instanceof ProductSearchError) {
      const message = error.code === 'CONFIGURATION' ? PRODUCT_SEARCH_CONFIGURATION_MESSAGE : error.message
      return NextResponse.json({ error: { code: error.code, message } }, { status: error.status ?? 502 })
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: { code: 'ABORTED', message: 'Product search was cancelled.' } }, { status: 499 })
    }
    return NextResponse.json(
      { error: { code: 'UPSTREAM', message: 'The live product search could not be reached. Try again.' } },
      { status: 502 },
    )
  }
}

export async function POST(request: Request) {
  return handleProductSearch(request)
}
