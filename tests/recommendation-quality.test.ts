import assert from 'node:assert/strict'
import test from 'node:test'
import { capabilityById, type CapabilityId } from '../lib/bofyt/capabilities'
import { detectCategories } from '../lib/bofyt/categories'
import { detectGoalIntent } from '../lib/bofyt/intent'
import { buildResult, refineItems } from '../lib/bofyt/results'
import { isProductSearchQuery } from '../lib/products/parse'

// Mirrors submitGoal in components/bofyt/experience.tsx for a goal typed inside a capability flow.
function recommendInCapability(capabilityId: CapabilityId, goal: string) {
  const { categoryId } = capabilityById[capabilityId]
  const areas = detectCategories(goal, categoryId).filter((id) => id !== 'search')
  const model = buildResult(goal, areas.length ? areas : [categoryId])
  const ranked = refineItems(model.items, model.defaultRefinement)
  return { model, ranked, text: ranked.map((item) => `${item.name} ${item.subtitle} ${item.summary}`).join(' ') }
}

test('GROW: fitness goals recommend fitness, not finance', () => {
  for (const goal of ['I want to get fitter', 'I want to get in shape', 'I want to start exercising and feel healthier', 'I want to work out more']) {
    assert.equal(detectGoalIntent(goal).kind, 'fitness', goal)
    const { model, text } = recommendInCapability('grow', goal)
    assert.equal(model.heading, 'Fitness path', goal)
    assert.doesNotMatch(text, /financ|savings|budget/i, goal)
    assert.match(text, /training|recovery|fitness/i, goal)
  }
})

test('OPTIMIZE: website conversion goals recommend CRO, not productivity', () => {
  for (const goal of [
    'I want to improve my website conversion rate',
    'Get more visitors to sign up on my landing page',
    'reduce cart abandonment in my online shop',
    'make my site load faster so people stop bouncing',
    'run A/B tests on my checkout',
  ]) {
    assert.equal(detectGoalIntent(goal).kind, 'conversion', goal)
    const { model, text } = recommendInCapability('optimize', goal)
    assert.equal(model.heading, 'Conversion optimization', goal)
    assert.doesNotMatch(text, /procrastinat|deep work|weekly review/i, goal)
    for (const concept of [/analytics/i, /funnel/i, /UX/, /A\/B/, /performance|speed/i]) assert.match(text, concept, goal)
  }
})

test('AUTOMATE: invoice and workflow goals recommend business automation, not creativity', () => {
  for (const goal of [
    'I want to automate my invoices and stop doing them manually',
    'stop doing my bookkeeping by hand',
    'I want my reports sent automatically every Monday',
    'connect my CRM and accounting tools',
  ]) {
    assert.equal(detectGoalIntent(goal).kind, 'automation', goal)
    const { model, text } = recommendInCapability('automate', goal)
    assert.equal(model.heading, 'Business automation', goal)
    assert.doesNotMatch(text, /creativ|portfolio|novel/i, goal)
    for (const concept of [/workflow/i, /invoic/i, /integration/i, /AI/]) assert.match(text, concept, goal)
  }
})

test('BUILD: an online clothing store stays a business build', () => {
  const goal = 'I want to create an online clothing store'
  assert.equal(detectGoalIntent(goal).kind, 'category')
  assert.equal(detectGoalIntent(goal).categoryId, 'business')
  assert.equal(recommendInCapability('build', goal).model.heading, 'Business options')
})

test('REACH: growing an Instagram audience stays audience and social growth', () => {
  const goal = 'I want to grow my Instagram audience and reach more people'
  assert.equal(detectGoalIntent(goal).kind, 'category')
  const { model, ranked } = recommendInCapability('reach', goal)
  assert.equal(model.heading, 'Marketing options')
  assert.ok(ranked.some((item) => item.areaId === 'social'))
})

test('DISCOVER: product searches still route to live product search', () => {
  for (const goal of ['Jeans under €50', 'Black shoes under €50', 'Jeans below €30']) {
    assert.equal(isProductSearchQuery(goal), true, goal)
    assert.equal(detectGoalIntent(goal).kind, 'shopping', goal)
  }
})

test('ambiguous words do not hijack unrelated goals', () => {
  assert.equal(detectGoalIntent('I want to run my business better').kind, 'category')
  assert.equal(detectGoalIntent('I want to save time on admin').kind, 'category')
  assert.equal(detectGoalIntent('I want to connect with people who share my goals').kind, 'category')
  assert.equal(detectGoalIntent('I want to write a book').kind, 'category')
  assert.equal(detectGoalIntent('I want to save €5000').kind, 'finance')
})
