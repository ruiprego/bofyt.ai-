import assert from 'node:assert/strict'
import test from 'node:test'
import { detectGoalIntent } from '../lib/bofyt/intent'

test('keeps product-shaped text in the goal flow without classifying it as shopping', () => {
  const productQueries = [
    'Black shoes under 50€',
    'black running shoes under €20',
    'best laptop under €500',
    'cheap gaming PC',
    'iPhone under 600€',
  ]

  for (const query of productQueries) {
    const intent = detectGoalIntent(query)
    assert.equal(intent.kind, 'category', query)
    assert.equal(intent.categoryId, null, query)
  }
})

test('keeps genuine personal goals out of product search', () => {
  assert.equal(detectGoalIntent('I want to grow my Instagram').kind, 'category')
  assert.equal(detectGoalIntent('I want to get fit').kind, 'fitness')
  assert.equal(detectGoalIntent('I want to find a new job').kind, 'career')
  assert.equal(detectGoalIntent('improve my finances').kind, 'finance')
})
