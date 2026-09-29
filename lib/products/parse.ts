import type { ProductSearchParams } from './types'

const SEARCH_INTENT = /\b(find|search|show|shop|buy|recommend|compare|looking for|where can i get|help me find|best|top|cheap|cheapest|affordable|budget|deal|deals|price|cost|under|below|less than|up to)\b/i
const PRODUCT_TERMS = /\b(shoes?|sneakers?|trainers?|laptops?|macbooks?|computers?|phones?|smartphones?|tablets?|televisions?|tvs?|headphones?|earbuds?|cameras?|monitors?|keyboards?|mice|dresses?|jackets?|coats?|jeans?|backpacks?|watches?|appliances?|products?)\b/i
const MODEL_NUMBER_PATTERN = /\b[a-z][a-z0-9-]*(?:\s+[a-z0-9-]+){0,4}\s+\d{2,4}\b/i
const CURRENCY_CODES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'] as const
const CURRENCY_SYMBOLS: Record<string, string> = { '€': 'EUR', $: 'USD', '£': 'GBP' }
const CURRENCY_WORDS: Record<string, string> = {
  euro: 'EUR',
  euros: 'EUR',
  dollar: 'USD',
  dollars: 'USD',
  pound: 'GBP',
  pounds: 'GBP',
  franc: 'CHF',
  francs: 'CHF',
}
const CURRENCY_TOKEN = '(?:€|\\$|£|\\bchf\\b|\\beur\\b|\\busd\\b|\\bgbp\\b|\\bcad\\b|\\baud\\b|\\beuros?\\b|\\bdollars?\\b|\\bpounds?\\b|\\bfrancs?\\b)'
const AMOUNT_TOKEN = '[\\d][\\d.,]*'
const PRICE_PATTERN = new RegExp(
  `\\b(?:under|below|less\\s+than|up\\s+to|max(?:imum)?(?:\\s+of)?|budget(?:\\s+of)?|within)\\s*(?:${CURRENCY_TOKEN})?\\s*(${AMOUNT_TOKEN})\\s*(?:${CURRENCY_TOKEN})?`,
  'i',
)
const MIN_PRICE_PATTERN = new RegExp(
  `\\b(?:over|above|more\\s+than|at\\s+least|from)\\s*(?:${CURRENCY_TOKEN})?\\s*(${AMOUNT_TOKEN})\\s*(?:${CURRENCY_TOKEN})?`,
  'i',
)
const BETWEEN_PRICE_PATTERN = new RegExp(
  `\\bbetween\\s*(?:${CURRENCY_TOKEN})?\\s*(${AMOUNT_TOKEN})\\s*(?:${CURRENCY_TOKEN})?\\s*(?:and|-)\\s*(?:${CURRENCY_TOKEN})?\\s*(${AMOUNT_TOKEN})\\s*(?:${CURRENCY_TOKEN})?`,
  'i',
)
const FOR_PRICE_PATTERN = new RegExp(`\\bfor\\s*(?:${CURRENCY_TOKEN})?\\s*(${AMOUNT_TOKEN})\\s*(?:${CURRENCY_TOKEN})?`, 'i')
const SYMBOL_PRICE_PATTERN = new RegExp(`(?:${CURRENCY_TOKEN})\\s*(${AMOUNT_TOKEN})|(${AMOUNT_TOKEN})\\s*(?:${CURRENCY_TOKEN})`, 'i')
const COLORS = ['black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 'orange', 'pink', 'purple', 'brown', 'beige', 'silver', 'gold']
const GENDERS = ["women's", 'women', 'woman', "men's", 'mens', 'men', 'man', 'unisex', 'kids', 'children', 'boys', 'girls']
const GOAL_LANGUAGE = /\b(i|we|my|want|need|goal|trying|plan|build|launch|create|learn|lose|save|grow|become|finish|improve|stop|start|develop)\b/i
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
  if (normalized.includes(',')) {
    const fractionalDigits = normalized.length - normalized.lastIndexOf(',') - 1
    return fractionalDigits <= 2 ? Number(normalized.replace(',', '.')) : Number(normalized.replace(/,/g, ''))
  }
  if (normalized.includes('.')) {
    const fractionalDigits = normalized.length - normalized.lastIndexOf('.') - 1
    return fractionalDigits === 3 ? Number(normalized.replace(/\./g, '')) : Number(normalized)
  }
  return Number(normalized)
}

function findCurrency(text: string) {
  const code = CURRENCY_CODES.find((value) => new RegExp(`\\b${value}\\b`, 'i').test(text))
  if (code) return code
  const word = Object.keys(CURRENCY_WORDS).find((value) => new RegExp(`\\b${value}\\b`, 'i').test(text))
  if (word) return CURRENCY_WORDS[word]
  const symbol = Object.keys(CURRENCY_SYMBOLS).find((value) => text.includes(value))
  return symbol ? CURRENCY_SYMBOLS[symbol] : undefined
}

function hasCurrency(text: string) {
  return Boolean(findCurrency(text))
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
    .replace(/\b(?:eur|usd|gbp|chf|cad|aud|euro|euros|dollar|dollars|pound|pounds|franc|francs|under|below|less|than|up|to|maximum|max|budget|within)\b/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word) && !/^\d+$/.test(word))
    .filter((word) => word !== brand && word !== color && word !== gender)
    .filter((word, index, words) => words.indexOf(word) === index)
}

function collapseSearchQuery(text: string) {
  return text.replace(/\s+/g, ' ').replace(/[\s,.;:!?-]+$/g, '').trim()
}

function cleanSearchQuery(text: string) {
  const betweenPriceMatch = text.match(BETWEEN_PRICE_PATTERN)
  if (betweenPriceMatch) return collapseSearchQuery(text.replace(betweenPriceMatch[0], ' '))

  const maxPriceMatch = text.match(PRICE_PATTERN)
  if (maxPriceMatch) return collapseSearchQuery(text.replace(maxPriceMatch[0], ' '))

  const minPriceMatch = text.match(MIN_PRICE_PATTERN)
  if (minPriceMatch) return collapseSearchQuery(text.replace(minPriceMatch[0], ' '))

  const forPriceMatch = text.match(FOR_PRICE_PATTERN)
  if (forPriceMatch && hasCurrency(forPriceMatch[0])) return collapseSearchQuery(text.replace(forPriceMatch[0], ' '))

  const symbolPriceMatch = text.match(SYMBOL_PRICE_PATTERN)
  if (symbolPriceMatch) return collapseSearchQuery(text.replace(symbolPriceMatch[0], ' '))

  return collapseSearchQuery(text)
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
    FOR_PRICE_PATTERN.test(query) ||
    SYMBOL_PRICE_PATTERN.test(query)
  const knownBrand = hasKnownBrand(query)
  const hasModelNumber = MODEL_NUMBER_PATTERN.test(query)
  const hasProductAttribute = Boolean(findValue(query, COLORS) || findValue(query, GENDERS) || extractBrand(query) || extractSize(query))
  const isBareProductPhrase = hasProductTerm && !GOAL_LANGUAGE.test(query) && query.split(/\s+/).length <= 8

  return (
    (hasProductTerm && (hasShoppingIntent || hasProductAttribute || isBareProductPhrase)) ||
    (knownBrand && (hasProductTerm || hasModelNumber))
  )
}

export function parseProductSearchParams(text: string): ProductSearchParams {
  const input = text.trim()
  const betweenPriceMatch = input.match(BETWEEN_PRICE_PATTERN)
  const maxPriceMatch = input.match(PRICE_PATTERN)
  const minPriceMatch = input.match(MIN_PRICE_PATTERN)
  const forPriceMatch = input.match(FOR_PRICE_PATTERN)
  const symbolPriceMatch = input.match(SYMBOL_PRICE_PATTERN)
  const currency = findCurrency(input)
  const searchQuery = cleanSearchQuery(input) || input
  const brand = extractBrand(searchQuery)
  const color = findValue(searchQuery, COLORS)
  const gender = findValue(searchQuery, GENDERS)
  const minPrice = betweenPriceMatch ? parseAmount(betweenPriceMatch[1]) : minPriceMatch ? parseAmount(minPriceMatch[1]) : undefined
  const maxPrice = betweenPriceMatch
    ? parseAmount(betweenPriceMatch[2])
    : maxPriceMatch
      ? parseAmount(maxPriceMatch[1])
      : forPriceMatch && hasCurrency(forPriceMatch[0])
        ? parseAmount(forPriceMatch[1])
        : symbolPriceMatch
          ? parseAmount(symbolPriceMatch[1] ?? symbolPriceMatch[2])
          : undefined
  const size = extractSize(input)

  return {
    query: searchQuery,
    category: extractCategory(searchQuery),
    brand,
    keywords: extractKeywords(searchQuery, brand, color, gender),
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    currency,
    color,
    size,
    gender,
  }
}
