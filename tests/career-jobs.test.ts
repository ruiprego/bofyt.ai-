import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getJobSearchParameters, parseJobSearch, toJobQuery } from '../lib/career/job-query'

test('separates natural-language locations from job queries', () => {
  const cases = [
    ['AI developer Zurich', 'AI developer', 'Zurich'],
    ['AI developer zurich', 'AI developer', 'Zurich'],
    ['AI developer near zurich', 'AI developer', 'Zurich'],
    ['AI jobs in Zurich', 'AI jobs', 'Zurich'],
    ['AI Product Builder jobs in Switzerland', 'AI Product Builder jobs', 'Switzerland'],
    ['remote AI jobs in Europe', 'remote AI jobs', 'Europe'],
    ['UX designer in Berlin', 'UX designer', 'Berlin'],
  ] as const

  for (const [input, query, location] of cases) {
    assert.deepEqual(parseJobSearch(input), { query, location }, input)
  }
})

test('keeps searches without a location unchanged', () => {
  assert.deepEqual(parseJobSearch('AI developer'), { query: 'AI developer' })
  assert.equal(toJobQuery('AI developer'), 'AI developer jobs')
})

test('sends query and location as separate provider parameters', () => {
  const parameters = getJobSearchParameters('AI developer Zurich')
  assert.equal(parameters.query, 'AI developer jobs')
  assert.equal(parameters.location, 'Zurich')
  assert.equal(parameters.remote, false)
  assert.notEqual(parameters.query, 'AI developer Zurich jobs')
})

test('does not send a location for a title-only search', () => {
  const parameters = getJobSearchParameters('AI developer')
  assert.equal(parameters.query, 'AI developer jobs')
  assert.equal(parameters.location, undefined)
  assert.equal(parameters.remote, false)
})
