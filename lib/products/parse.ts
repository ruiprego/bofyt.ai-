import type { ProductSearchParams } from './types'

const SEARCH_INTENT = /\b(find|search|show|shop|buy|recommend|compare|looking for|where can i get|help me find|best|top|cheap|cheapest|affordable|budget|deal|deals|price|cost|under|below|less than|up to)\b/i
const PRODUCT_TERMS = /\b(shoes?|sneakers?|trainers?|laptops?|macbooks?|computers?|phones?|smartphones?|tablets?|televisions?|tvs?|headphones?|earbuds?|cameras?|monitors?|keyboards?|mice|dresses?|jackets?|coats?|jeans?|backpacks?|watches?|appliances?|products?)\b/i
const MODEL_NUMBER_PATTERN = /\b[a-z][a-z0-9-]*(?:\s+[a-z0-9-]+){0,4}\s+\d{2,4}\b/i
const PRICE_PATTERN = /\b(?:under|below|less than|up to|max(?:imum)?(?: of)?|budget(?: of)?|within)\s*(?:€|\$|£|chf|eur|usd|gbp|cad|aud)?\s*([\d][\d.,]*)/i
const MIN_PRICE_PATTERN = /\b(?:over|above|more than|at least|from)\s*(?:€|\$|£|chf|eur|usd|gbp|cad|aud)?\s*([\d][\d.,]*)/i
const BETWEEN_PRICE_PATTERN = /\bbetween\s*(?:€|\$|£|chf|eur|usd|gbp|cad|aud)?\s*([\d][\d.,]*)\s*(?:and|-)\s*(?:€|\$|£|chf|eur|usd|gbp|cad|aud)?\s*([\d][\d.,]*)/i
const SYMBOL_PRICE_PATTERN = /(?:€|\$|£|chf|eur|usd|gbp|cad|aud)\s*([\d][\d.,]*)/i

const CURRENCY_CODES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'] as const
const CURRENCY_SYMBOLS: Record<string, string> = { '€': 'EUR', $: 'USD', '£': 'GBP' }
const COLORS = ['black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 'orange', 'pink', 'purple', 'brown', 'beige', 'silver', 'gold']
const GENDERS = ["women's", 'women', 'woman', "men's", 'mens', 'men', 'man', 'unisex', 'kids', 'children', 'boys', 'girls']
const BRANDS = [
  'adidas',
  'apple',
  'asus',
  'bose',
  'canon',
  'dell',
  'dyson',
  'fitbit',
  'google',
  'hp',
  'huawei',
  'jbl',
  'lenovo',
  'lg',
  'microsoft',
  'nike',
  'nintendo',
  'oneplus',
  'panasonic',
  'playstation',
  'samsung',
  'sony',
  'surface',
  'under armour',
  'xiaomi',
]

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'best',
  'buy',
  'cheap',
  'cheapest',
  'compare',
  'find',
  'for',
  'get',
  'help',
  'i',
  'me',
  'my',
  'of',
  'on',
  'please',
  'recommend',
  'search',
  'show',
  'shop',
  'the',
  'to',
  'under',
  'want',
  'with',
])

function parseAmount(value: string) {
  const normalized = value.replace(/\s/g, '')
  if (normalized.includes(',') && normalized.includes('.')) {
    return normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
      ? Number(normalized.replace(/\./g, '').replace(',', '.'))
      : Number(normalized.replace(/,/g, ''))
  }
  return Number(normalized.replace(/,/g, ''))
}

function findCurrency(text: string) {
  const code = CURRENCY_CODES.find((value) => new RegExp(`\\b${value}\\b`, 'i').test(text))
  if (code) return code
  const symbol = Object.keys(CURRENCY_SYMBOLS).find((value) => text.includes(value))
  return symbol ? CURRENCY_SYMBOLS[symbol] : undefined
}

function findValue(text: string, values: string[]) {
  const normalized = text.toLowerCase()
  return [...values].sort((a, b) => b.length - a.length).find((value) => normalized.includes(value))
}

function extractSize(text: string) {
  const labeled = text.match(/\b(?:size|sz)\s*([a-z0-9][a-z0-9.-]*)\b/i)?.[1]
  if (labeled) return labeled.toUpperCase()
  return text.match(/\b(?:eu|us|uk)\s*\d{1,3}(?:\.\d+)?\b/i)?.[0]?.toUpperCase()
}

function extractCategory(text: string) {
  return text.match(PRODUCT_TERMS)?.[0]?.toLowerCase()
}

function extractBrand(text: string) {
  const normalized = text.toLowerCase()
  return BRANDS.find((brand) => normalized.includes(brand))
}

function hasKnownBrand(text: string) {
  return BRANDS.some((brand) => {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, 'i').test(text)
  })
}

function extractKeywords(text: string, brand?: string, color?: string, gender?: string) {
  return text
    .toLowerCase()
    .replace(/[€$£]/g, ' ')
    .replace(/\b(?:eur|usd|gbp|chf|cad|aud|under|below|less|than|up|to|maximum|max|budget|within)\b/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word) && !/^\d+$/.test(word))
    .filter((word) => word !== brand && word !== color && word !== gender)
    .filter((word, index, words) => words.indexOf(word) === index)
}

export function isProductSearchQuery(text: string) {
  const query = text.trim()
  if (!query) return false

  const hasProductTerm = PRODUCT_TERMS.test(query)
  const hasShoppingIntent =
    SEARCH_INTENT.test(query) ||
    PRICE_PATTERN.test(query) ||
    MIN_PRICE_PATTERN.test(query) ||
    BETWEEN_PRICE_PATTERN.test(query) ||
    SYMBOL_PRICE_PATTERN.test(query)
  const knownBrand = hasKnownBrand(query)
  const hasModelNumber = MODEL_NUMBER_PATTERN.test(query)

  return (hasProductTerm && hasShoppingIntent) || (knownBrand && (hasProductTerm || hasModelNumber))
}

export function parseProductSearchParams(text: string): ProductSearchParams {
  const query = text.trim()
  const betweenPriceMatch = query.match(BETWEEN_PRICE_PATTERN)
  const maxPriceMatch = query.match(PRICE_PATTERN)
  const minPriceMatch = query.match(MIN_PRICE_PATTERN)
  const currency = findCurrency(query)
  const brand = extractBrand(query)
  const color = findValue(query, COLORS)
  const gender = findValue(query, GENDERS)
  const minPrice = betweenPriceMatch ? parseAmount(betweenPriceMatch[1]) : minPriceMatch ? parseAmount(minPriceMatch[1]) : undefined
  const maxPrice = betweenPriceMatch ? parseAmount(betweenPriceMatch[2]) : maxPriceMatch ? parseAmount(maxPriceMatch[1]) : undefined
  const size = extractSize(query)

  return {
    query,
    category: extractCategory(query),
    brand,
    keywords: extractKeywords(query, brand, color, gender),
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    currency,
    color,
    size,
    gender,
  }
}
