import assert from 'node:assert/strict'
import test from 'node:test'
import { detectGoalIntent } from '../lib/bofyt/intent'

test('routes product-shaped text to the existing Search capability', () => {
  const productQueries = [
    'Black running shoes under 50€',
    'black running shoes',
    'Nike shoes',
    'laptop for video editing',
    'iPhone under €800',
    'cheap winter jacket',
  ]

  for (const query of productQueries) {
    const intent = detectGoalIntent(query)
    assert.equal(intent.kind, 'shopping', query)
    assert.equal(intent.categoryId, 'search', query)
  }
})

test('keeps genuine personal goals in the personal-goal flow', () => {
  assert.equal(detectGoalIntent('I want to save €5000').kind, 'finance')
  assert.equal(detectGoalIntent('I want to lose 10kg').kind, 'fitness')
  assert.equal(detectGoalIntent('I want to grow my Instagram').kind, 'category')
  assert.equal(detectGoalIntent('I want to find a new job').kind, 'career')
  assert.equal(detectGoalIntent('improve my finances').kind, 'finance')
})
