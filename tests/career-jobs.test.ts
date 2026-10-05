import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getJobSearchParameters, parseJobSearch, toJobQuery } from '../lib/career/job-query'
import {
  interleave,
  prioritizeByLocation,
  resolveKnownLocation,
  targetFromCanonicalLocation,
} from '../lib/career/job-location'

test('maps required locations to SerpApi canonical location, country and language', () => {
  const cases = [
    ['Zurich', 'Zurich', 'Zurich,Zurich,Switzerland', 'ch', 'de'],
    ['Zürich', 'Zurich', 'Zurich,Zurich,Switzerland', 'ch', 'de'],
    ['zurich', 'Zurich', 'Zurich,Zurich,Switzerland', 'ch', 'de'],
    ['Switzerland', 'Switzerland', 'Switzerland', 'ch', 'de'],
    ['Geneva', 'Geneva', 'Geneva,Geneva,Geneva,Switzerland', 'ch', 'fr'],
    ['lausanne', 'Lausanne', 'Lausanne,Vaud,Switzerland', 'ch', 'fr'],
    ['Basel', 'Basel', 'Basel,Basel City,Switzerland', 'ch', 'de'],
    ['Bern', 'Bern', 'Bern,Canton of Bern,Switzerland', 'ch', 'de'],
  ] as const

  for (const [input, label, location, gl, hl] of cases) {
    const plan = resolveKnownLocation(input, false)
    assert.equal(plan?.label, label, input)
    assert.deepEqual(plan?.targets, [{ location, gl, hl }], input)
    assert.equal(plan?.remote, false, input)
  }
})

test('maps Europe to several hubs and Remote to the remote filter', () => {
  const europe = resolveKnownLocation('Europe', false)
  assert.equal(europe?.label, 'Europe')
  assert.deepEqual(europe?.targets.map((target) => target.gl), ['uk', 'de', 'ch'])

  const remote = resolveKnownLocation('Remote', false)
  assert.equal(remote?.label, 'Remote')
  assert.deepEqual(remote?.targets, [])
  assert.equal(remote?.remote, true)
})

test('keeps the job query free of the location for provider calls', () => {
  for (const input of ['AI job in Zurich', 'AI job in Switzerland']) {
    const parameters = getJobSearchParameters(input)
    assert.equal(parameters.query, 'AI job', input)
    assert.doesNotMatch(parameters.query, /zurich|switzerland/i, input)
  }
})

test('derives market language for resolved locations', () => {
  assert.deepEqual(targetFromCanonicalLocation('Lugano,Ticino,Switzerland', 'CH'), {
    location: 'Lugano,Ticino,Switzerland',
    gl: 'ch',
    hl: 'it',
  })
  assert.equal(targetFromCanonicalLocation('Manchester,England,United Kingdom', 'GB').gl, 'uk')
  assert.equal(targetFromCanonicalLocation('Paris,Paris,Ile-de-France,France', 'FR').hl, 'fr')
})

test('surfaces listings in the requested city first and interleaves regions', () => {
  const jobs = [{ location: 'St. Gallen' }, { location: 'Zürich' }, { location: 'Bern' }]
  assert.deepEqual(prioritizeByLocation(jobs, ['zurich', 'zürich']).map((job) => job.location), ['Zürich', 'St. Gallen', 'Bern'])
  assert.deepEqual(interleave([[1, 2], [3], [4, 5]]), [1, 3, 4, 2, 5])
})

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
