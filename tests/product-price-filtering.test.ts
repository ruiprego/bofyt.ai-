import assert from 'node:assert/strict'
import test from 'node:test'
import { parseProductSearchParams } from '../lib/products/parse'
import { buildRequestUrl, filterProductsByPrice, normalizeProduct } from '../lib/products/providers/http'
import type { Product } from '../lib/products/types'

function rawProduct(id: string, price: unknown, extra: Record<string, unknown> = {}) {
  return {
    title: id,
    product_link: `https://example.com/products/${id}`,
    price,
    ...extra,
  }
}

function searchFixture(query: string, values: Array<[string, unknown, Record<string, unknown>?]>) {
  const params = parseProductSearchParams(query)
  const products = values
    .map(([id, price, extra]) => normalizeProduct(rawProduct(id, price, extra)))
    .filter((product): product is Product => Boolean(product))
  return { params, ...filterProductsByPrice(products, params) }
}

function names(products: Product[]) {
  return products.map((product) => product.title)
}

test('returns only exact EUR matches for running shoes under €50', () => {
  const result = searchFixture('black running shoes under €50', [
    ['€49.99', '€49.99'],
    ['€50.00', '€50.00'],
    ['€50.01', '€50.01'],
    ['$165.00', '$165.00'],
    ['from-€39.99', 'From €39.99'],
    ['€49-€59', '€49–€59'],
    ['price-on-request', 'Price on request'],
  ])

  assert.equal(result.params.maxPrice, 50)
  assert.equal(result.params.currency, 'EUR')
  assert.deepEqual(names(result.products), ['€49.99', '€50.00'])
  assert.deepEqual(names(result.closestProducts), ['€50.01'])
})

test('enforces a lower €20 budget without comparing USD to EUR', () => {
  const result = searchFixture('black running shoes under €20', [
    ['€19.99', '€19,99 €'],
    ['€20.01', '€20.01'],
    ['$10.00', '$10.00'],
    ['unknown-currency', '10.00'],
  ])

  assert.equal(result.params.maxPrice, 20)
  assert.deepEqual(names(result.products), ['€19.99'])
  assert.deepEqual(names(result.closestProducts), ['€20.01'])
})

test('keeps both boundaries for a EUR range', () => {
  const result = searchFixture('black running shoes between €50 and €100', [
    ['€49.99', '€49.99'],
    ['€50.00', '€50.00'],
    ['€75.00', '€75.00'],
    ['€100.00', '€100.00'],
    ['€100.01', '€100.01'],
    ['$75.00', '$75.00'],
    ['€49-€59', '€49–€59'],
  ])

  assert.equal(result.params.minPrice, 50)
  assert.equal(result.params.maxPrice, 100)
  assert.equal(result.params.currency, 'EUR')
  assert.deepEqual(names(result.products), ['€50.00', '€75.00', '€100.00'])
  assert.deepEqual(names(result.closestProducts), ['€49.99', '€100.01'])
})

test('enforces a laptop budget before returning server results', () => {
  const result = searchFixture('best laptop under €500', [
    ['€499.99', '€499.99'],
    ['€500.00', '€500.00'],
    ['$165.00', '$165.00'],
    ['from-€399.00', 'From €399.00'],
  ])

  assert.equal(result.params.maxPrice, 500)
  assert.equal(result.params.currency, 'EUR')
  assert.deepEqual(names(result.products), ['€499.99', '€500.00'])
  assert.ok(result.products.every((product) => product.price !== undefined && product.price <= 500))
})

test('plain "Jeans" searches without any price limit', () => {
  const params = parseProductSearchParams('Jeans')
  assert.equal(params.query, 'Jeans')
  assert.equal(params.maxPrice, undefined)
  assert.equal(params.minPrice, undefined)
  assert.equal(params.currency, undefined)
})

test('extracts query and €50 max price from natural-language jeans searches', () => {
  const phrasings = [
    'Jeans under €50',
    'Jeans below €50',
    'Jeans less than €50',
    'Jeans up to €50',
    'Jeans under 50 euros',
  ]
  for (const phrase of phrasings) {
    const params = parseProductSearchParams(phrase)
    assert.equal(params.query, 'Jeans', phrase)
    assert.equal(params.maxPrice, 50, phrase)
    assert.equal(params.minPrice, undefined, phrase)
    assert.equal(params.currency, 'EUR', phrase)
  }
})

test('enforces "Jeans under €50" on the server result set', () => {
  const result = searchFixture('Jeans under €50', [
    ['€29.99', '€29.99'],
    ['€50.00', '€50.00'],
    ['€79.00', '€79.00'],
    ['$40.00', '$40.00'],
  ])
  assert.deepEqual(names(result.products), ['€29.99', '€50.00'])
  assert.ok(result.products.every((product) => product.currency === 'EUR' && product.price! <= 50))
})

test('keeps color in "Black shoes under €50" and enforces the price', () => {
  const result = searchFixture('Black shoes under €50', [
    ['€45.00', '€45.00'],
    ['€65.00', '€65.00'],
  ])
  assert.equal(result.params.query, 'Black shoes')
  assert.equal(result.params.color, 'black')
  assert.equal(result.params.maxPrice, 50)
  assert.deepEqual(names(result.products), ['€45.00'])
})

test('enforces "Jeans below €30"', () => {
  const result = searchFixture('Jeans below €30', [
    ['€25.00', '€25.00'],
    ['€30.00', '€30.00'],
    ['€35.00', '€35.00'],
  ])
  assert.equal(result.params.query, 'Jeans')
  assert.equal(result.params.maxPrice, 30)
  assert.deepEqual(names(result.products), ['€25.00', '€30.00'])
})

test('a new search after a price-constrained search does not reuse the old limit', () => {
  const first = searchFixture('Jeans under €50', [
    ['€40.00', '€40.00'],
    ['€90.00', '€90.00'],
  ])
  assert.equal(first.params.maxPrice, 50)
  assert.deepEqual(names(first.products), ['€40.00'])

  const second = searchFixture('Jeans', [
    ['€40.00', '€40.00'],
    ['€90.00', '€90.00'],
  ])
  assert.equal(second.params.maxPrice, undefined)
  assert.equal(second.params.currency, undefined)
  assert.deepEqual(names(second.products), ['€40.00', '€90.00'])
})

test('requests a euro market for € searches and leaves plain searches untouched', () => {
  const priced = buildRequestUrl(parseProductSearchParams('Jeans under €50'), 'key')
  assert.equal(priced.searchParams.get('q'), 'Jeans')
  assert.equal(priced.searchParams.get('max_price'), '50')
  assert.equal(priced.searchParams.get('gl'), 'ie')

  const plain = buildRequestUrl(parseProductSearchParams('Jeans'), 'key')
  assert.equal(plain.searchParams.get('q'), 'Jeans')
  assert.equal(plain.searchParams.get('max_price'), null)
  assert.equal(plain.searchParams.get('currency'), null)
  assert.equal(plain.searchParams.get('gl'), null)
})

test('normalizes common exact price strings without accepting ranges', () => {
  const exactExamples = [
    ['€49.99', 49.99, 'EUR'],
    ['49,99 €', 49.99, 'EUR'],
    ['165,00 US$', 165, 'USD'],
  ] as const

  for (const [price, expectedAmount, expectedCurrency] of exactExamples) {
    const product = normalizeProduct(rawProduct(price, price))
    assert.equal(product?.price, expectedAmount, price)
    assert.equal(product?.currency, expectedCurrency, price)
  }

  assert.equal(normalizeProduct(rawProduct('from-price', 'From €39.99'))?.price, undefined)
  assert.equal(normalizeProduct(rawProduct('range-price', '€49–€59'))?.price, undefined)
})
