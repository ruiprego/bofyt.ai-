/**
 * Maps a parsed, human location ("Zurich") to what SerpApi Google Jobs actually honours.
 * Verified against the live provider: `location` must be a SerpApi canonical name, and
 * non-English markets only return listings when `gl` (country) and `hl` (language) match
 * that market — e.g. Zurich with hl=en returns nothing, with hl=de it returns Zürich jobs.
 */
export interface ProviderLocationTarget {
  location: string
  gl: string
  hl: string
}

export interface ProviderLocationPlan {
  label: string
  targets: ProviderLocationTarget[]
  remote: boolean
  matchTerms: string[]
}

interface KnownLocation {
  label: string
  targets: ProviderLocationTarget[]
  matchTerms?: string[]
  remote?: boolean
}

const ZURICH: ProviderLocationTarget = { location: 'Zurich,Zurich,Switzerland', gl: 'ch', hl: 'de' }
const LONDON: ProviderLocationTarget = { location: 'London,England,United Kingdom', gl: 'uk', hl: 'en' }
const BERLIN: ProviderLocationTarget = { location: 'Berlin,Berlin,Germany', gl: 'de', hl: 'de' }

const zurich: KnownLocation = { label: 'Zurich', targets: [ZURICH], matchTerms: ['zurich', 'zürich'] }
const geneva: KnownLocation = {
  label: 'Geneva',
  targets: [{ location: 'Geneva,Geneva,Geneva,Switzerland', gl: 'ch', hl: 'fr' }],
  matchTerms: ['geneva', 'genève', 'geneve', 'genf'],
}
const bern: KnownLocation = {
  label: 'Bern',
  targets: [{ location: 'Bern,Canton of Bern,Switzerland', gl: 'ch', hl: 'de' }],
  matchTerms: ['bern', 'berne'],
}

const KNOWN_LOCATIONS = new Map<string, KnownLocation>([
  ['zurich', zurich],
  ['zürich', zurich],
  ['zuerich', zurich],
  ['switzerland', { label: 'Switzerland', targets: [{ location: 'Switzerland', gl: 'ch', hl: 'de' }] }],
  ['geneva', geneva],
  ['genève', geneva],
  ['geneve', geneva],
  ['lausanne', {
    label: 'Lausanne',
    targets: [{ location: 'Lausanne,Vaud,Switzerland', gl: 'ch', hl: 'fr' }],
    matchTerms: ['lausanne'],
  }],
  ['basel', {
    label: 'Basel',
    targets: [{ location: 'Basel,Basel City,Switzerland', gl: 'ch', hl: 'de' }],
    matchTerms: ['basel', 'bâle', 'bale'],
  }],
  ['bern', bern],
  ['berne', bern],
  ['berlin', { label: 'Berlin', targets: [BERLIN], matchTerms: ['berlin'] }],
  ['london', { label: 'London', targets: [LONDON], matchTerms: ['london'] }],
  // Google Jobs has no continent-level location, so Europe fans out across major hubs.
  ['europe', { label: 'Europe', targets: [LONDON, BERLIN, ZURICH] }],
  ['remote', { label: 'Remote', targets: [], remote: true }],
  ['anywhere', { label: 'Remote', targets: [], remote: true }],
])

const COUNTRY_LANGUAGE: Record<string, string> = {
  ch: 'de',
  de: 'de',
  at: 'de',
  fr: 'fr',
  be: 'fr',
  lu: 'fr',
  es: 'es',
  it: 'it',
  pt: 'pt',
  br: 'pt',
  nl: 'nl',
  pl: 'pl',
  se: 'sv',
  dk: 'da',
  no: 'no',
  fi: 'fi',
  mx: 'es',
  jp: 'ja',
}

const FRENCH_SWISS_REGIONS = /\b(geneva|vaud|neuch[aâ]tel|fribourg|jura|valais)\b/i

const normalizeKey = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()

export function resolveKnownLocation(location: string, remote: boolean): ProviderLocationPlan | null {
  const known = KNOWN_LOCATIONS.get(normalizeKey(location))
  if (!known) return null
  return {
    label: known.label,
    targets: known.targets,
    remote: remote || Boolean(known.remote),
    matchTerms: known.matchTerms ?? [],
  }
}

/** Builds a target from a SerpApi Locations API match for locations not in the known list. */
export function targetFromCanonicalLocation(canonicalName: string, countryCode: string): ProviderLocationTarget {
  const gl = countryCode.toLocaleLowerCase()
  const swissFrench = gl === 'ch' && FRENCH_SWISS_REGIONS.test(canonicalName)
  const swissItalian = gl === 'ch' && /\bticino\b/i.test(canonicalName)
  const hl = swissFrench ? 'fr' : swissItalian ? 'it' : (COUNTRY_LANGUAGE[gl] ?? 'en')
  return { location: canonicalName, gl: gl === 'gb' ? 'uk' : gl, hl }
}

/** Stable sort that surfaces listings in the requested city first without dropping nearby ones. */
export function prioritizeByLocation<T extends { location: string }>(jobs: T[], matchTerms: string[]) {
  if (!matchTerms.length) return jobs
  const matches = (job: T) => matchTerms.some((term) => job.location.toLocaleLowerCase().includes(term))
  return [...jobs.filter(matches), ...jobs.filter((job) => !matches(job))]
}

/** Round-robin merge so a multi-region search (Europe) is not dominated by one hub. */
export function interleave<T>(groups: T[][]) {
  const merged: T[] = []
  const longest = Math.max(0, ...groups.map((group) => group.length))
  for (let index = 0; index < longest; index += 1) {
    for (const group of groups) if (group[index]) merged.push(group[index])
  }
  return merged
}
