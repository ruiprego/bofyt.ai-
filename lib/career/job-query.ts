const FILLER = /\b(i\s+want\s+to|i'?d\s+like\s+to|help\s+me|please|can\s+you|find\s+me|find|search\s+for|look\s+for|looking\s+for|show\s+me|get\s+me|apply\s+for|apply\s+to|work\s+as|become|an?|the|that\s+match(es)?\s+my\s+experience|matching\s+my\s+(experience|profile))\b/gi

const LOCATION_ALIASES = new Map([
  ['zurich', 'Zurich'],
  ['zürich', 'Zurich'],
  ['berlin', 'Berlin'],
  ['europe', 'Europe'],
  ['switzerland', 'Switzerland'],
  ['lisbon', 'Lisbon'],
  ['london', 'London'],
  ['paris', 'Paris'],
  ['amsterdam', 'Amsterdam'],
  ['madrid', 'Madrid'],
  ['barcelona', 'Barcelona'],
  ['munich', 'Munich'],
  ['vienna', 'Vienna'],
  ['stockholm', 'Stockholm'],
  ['copenhagen', 'Copenhagen'],
  ['dublin', 'Dublin'],
  ['brussels', 'Brussels'],
  ['geneva', 'Geneva'],
  ['basel', 'Basel'],
  ['new york city', 'New York City'],
  ['new york', 'New York'],
  ['san francisco', 'San Francisco'],
  ['los angeles', 'Los Angeles'],
  ['seattle', 'Seattle'],
  ['boston', 'Boston'],
  ['chicago', 'Chicago'],
  ['toronto', 'Toronto'],
  ['vancouver', 'Vancouver'],
  ['montreal', 'Montreal'],
  ['united states', 'United States'],
  ['usa', 'United States'],
  ['us', 'United States'],
  ['united kingdom', 'United Kingdom'],
  ['uk', 'United Kingdom'],
  ['canada', 'Canada'],
  ['germany', 'Germany'],
  ['france', 'France'],
  ['spain', 'Spain'],
  ['portugal', 'Portugal'],
  ['netherlands', 'Netherlands'],
  ['ireland', 'Ireland'],
  ['austria', 'Austria'],
  ['sweden', 'Sweden'],
  ['denmark', 'Denmark'],
  ['norway', 'Norway'],
  ['finland', 'Finland'],
  ['poland', 'Poland'],
  ['india', 'India'],
  ['singapore', 'Singapore'],
  ['australia', 'Australia'],
  ['asia', 'Asia'],
  ['north america', 'North America'],
  ['south america', 'South America'],
  ['middle east', 'Middle East'],
])

const LOCATION_SUFFIXES = [...LOCATION_ALIASES.entries()].sort(([first], [second]) => second.length - first.length)
const LOCATION_MARKER = /\s+(?:in|near|around|close\s+to|within)\s+(.+)$/i

function cleanJobSearchText(goal: string) {
  return goal.replace(FILLER, ' ').replace(/[.?!]+$/g, '').replace(/\s+/g, ' ').trim()
}

function normalizeLocation(value: string) {
  const cleaned = value.replace(/^[,\s]+|[,\s.!?]+$/g, '').replace(/\s+/g, ' ').trim()
  return LOCATION_ALIASES.get(cleaned.toLocaleLowerCase()) ?? cleaned
}

export interface ParsedJobSearch {
  query: string
  location?: string
}

export function parseJobSearch(goal: string): ParsedJobSearch {
  const cleaned = cleanJobSearchText(goal)
  const fallbackQuery = cleaned || goal.trim()
  const markedLocation = cleaned.match(LOCATION_MARKER)

  if (markedLocation?.index !== undefined) {
    const query = cleaned.slice(0, markedLocation.index).trim()
    const location = normalizeLocation(markedLocation[1])
    if (query && location) return { query, location }
  }

  const lower = cleaned.toLocaleLowerCase()
  for (const [alias, canonical] of LOCATION_SUFFIXES) {
    if (!lower.endsWith(` ${alias}`)) continue
    const query = cleaned.slice(0, cleaned.length - alias.length).replace(/[,\s-]+$/g, '').trim()
    if (query) return { query, location: canonical }
  }

  return { query: fallbackQuery }
}

function appendJobs(query: string) {
  return /\b(jobs?|positions?|roles?|vacanc(y|ies)|openings?)\b/i.test(query) ? query : `${query} jobs`
}

export function toJobQuery(goal: string) {
  return appendJobs(parseJobSearch(goal).query)
}

export interface JobSearchParameters {
  query: string
  location?: string
  remote: boolean
}

export function getJobSearchParameters(goal: string): JobSearchParameters {
  const parsed = parseJobSearch(goal)
  return {
    query: appendJobs(parsed.query),
    location: parsed.location,
    remote: /\bremote\b/i.test(goal),
  }
}
