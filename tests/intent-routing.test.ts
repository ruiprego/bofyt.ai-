import assert from 'node:assert/strict'
import test from 'node:test'
import { detectGoalIntent } from '../lib/bofyt/intent'

test('routes physical product shopping queries to product search', () => {
  const productQueries = [
    'Black shoes under 50€',
    'black running shoes under €20',
    'best laptop under €500',
    'cheap gaming PC',
    'iPhone under 600€',
  ]

  for (const query of productQueries) {
    assert.equal(detectGoalIntent(query).kind, 'shopping', query)
  }
})

test('keeps genuine personal goals out of product search', () => {
  assert.equal(detectGoalIntent('improve my finances').kind, 'finance')
  assert.equal(detectGoalIntent('get fit').kind, 'fitness')
})
