import 'server-only'
import { getJobSearchParameters } from './job-query'
import {
  interleave,
  prioritizeByLocation,
  resolveKnownLocation,
  targetFromCanonicalLocation,
  type ProviderLocationPlan,
  type ProviderLocationTarget,
} from './job-location'
import { CareerError, JOBS_NOT_CONFIGURED_MESSAGE, type Job } from './types'

export { getJobSearchParameters, parseJobSearch, toJobQuery } from './job-query'

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json'
const SERPAPI_LOCATIONS_ENDPOINT = 'https://serpapi.com/locations.json'
const REQUEST_TIMEOUT_MS = 25_000
const PER_CALL_TIMEOUT_MS = 18_000

type JsonRecord = Record<string, unknown>

const asRecord = (value: unknown): JsonRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : null

const asString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

function asUrl(value: unknown) {
  const raw = asString(value)
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function isJobSearchConfigured() {
  return Boolean(process.env.SERPAPI_API_KEY?.trim())
}


export function normalizeJob(value: unknown): Job | null {
  const record = asRecord(value)
  if (!record) return null

  const title = asString(record.title)
  const company = asString(record.company_name)
  if (!title || !company) return null

  const extensions = asRecord(record.detected_extensions) ?? {}
  const applyOptions = (Array.isArray(record.apply_options) ? record.apply_options : [])
    .map((option) => {
      const entry = asRecord(option)
      const url = asUrl(entry?.link)
      const label = asString(entry?.title)
      return url && label ? { title: label.slice(0, 120), url } : null
    })
    .filter((option): option is { title: string; url: string } => Boolean(option))
    .slice(0, 10)

  const highlights = (Array.isArray(record.job_highlights) ? record.job_highlights : [])
    .flatMap((group) => {
      const items = asRecord(group)?.items
      return Array.isArray(items) ? items.map(asString).filter((item): item is string => Boolean(item)) : []
    })
    .map((item) => item.slice(0, 600))
    .slice(0, 30)

  const location = asString(record.location) ?? ''
  const remote = extensions.work_from_home === true || /\b(remote|anywhere)\b/i.test(location)
  const applyUrl = applyOptions[0]?.url ?? asUrl(record.share_link)

  return {
    id: (asString(record.job_id) ?? `${company}-${title}-${location}`).slice(0, 400),
    title: title.slice(0, 300),
    company: company.slice(0, 200),
    location: location.slice(0, 200),
    remote,
    description: (asString(record.description) ?? '').slice(0, 12000),
    highlights,
    salary: asString(extensions.salary)?.slice(0, 120),
    postedAt: asString(extensions.posted_at)?.slice(0, 80),
    employmentType: asString(extensions.schedule_type)?.slice(0, 80),
    source: (asString(record.via)?.replace(/^via\s+/i, '') ?? 'Google Jobs').slice(0, 120),
    applyUrl,
    applyOptions,
  }
}

async function resolveUnknownLocation(location: string, signal: AbortSignal): Promise<ProviderLocationTarget | null> {
  const url = new URL(SERPAPI_LOCATIONS_ENDPOINT)
  url.searchParams.set('q', location)
  url.searchParams.set('limit', '1')
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'force-cache', signal })
    if (!response.ok) return null
    const payload: unknown = await response.json().catch(() => null)
    const match = asRecord(Array.isArray(payload) ? payload[0] : null)
    const canonicalName = asString(match?.canonical_name)
    const countryCode = asString(match?.country_code)
    return canonicalName && countryCode ? targetFromCanonicalLocation(canonicalName, countryCode) : null
  } catch (error) {
    if (signal.aborted) throw error
    return null
  }
}

async function buildLocationPlan(location: string | undefined, remote: boolean, signal: AbortSignal): Promise<ProviderLocationPlan> {
  if (!location) return { label: '', targets: [], remote, matchTerms: [] }
  const known = resolveKnownLocation(location, remote)
  if (known) return known
  const resolved = await resolveUnknownLocation(location, signal)
  return {
    label: location,
    targets: resolved ? [resolved] : [],
    remote,
    matchTerms: [location.toLocaleLowerCase()],
  }
}

async function fetchJobs(
  apiKey: string,
  query: string,
  target: ProviderLocationTarget | null,
  remote: boolean,
  signal: AbortSignal,
) {
  const url = new URL(SERPAPI_ENDPOINT)
  url.searchParams.set('engine', 'google_jobs')
  url.searchParams.set('q', query)
  url.searchParams.set('hl', target?.hl ?? 'en')
  url.searchParams.set('api_key', apiKey)
  if (target) {
    url.searchParams.set('location', target.location)
    url.searchParams.set('gl', target.gl)
  }
  if (remote) url.searchParams.set('ltype', '1')

  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', signal })
  if (response.status === 401 || response.status === 403) {
    throw new CareerError('The job search provider rejected the configured API key.', 'UPSTREAM', 502)
  }
  if (response.status === 429) throw new CareerError('Job search rate limit reached. Try again shortly.', 'UPSTREAM', 502)

  const payload = asRecord(await response.json().catch(() => null))
  const providerError = asString(payload?.error)
  if (providerError && /hasn't returned any results|unsupported .* location/i.test(providerError)) return [] as Job[]
  if (!response.ok || providerError || !payload) {
    throw new CareerError('The live job search could not be completed. Try again.', 'UPSTREAM', 502)
  }

  return (Array.isArray(payload.jobs_results) ? payload.jobs_results : [])
    .map(normalizeJob)
    .filter((job): job is Job => Boolean(job))
}

/**
 * Google Jobs is inconsistent in non-English markets: "AI developer jobs" in Zurich returns
 * nothing while "AI developer" returns listings, and for other titles it is the reverse.
 * Both forms run in parallel and are merged; each call has its own timeout so one slow
 * region cannot fail a multi-region search.
 */
async function fetchTarget(
  apiKey: string,
  query: string,
  target: ProviderLocationTarget | null,
  remote: boolean,
  signal: AbortSignal,
) {
  const callSignal = () => AbortSignal.any([signal, AbortSignal.timeout(PER_CALL_TIMEOUT_MS)])
  const bareQuery = query.replace(/\s+jobs$/i, '')
  const variants = target && target.hl !== 'en' && bareQuery !== query ? [query, bareQuery] : [query]

  const settled = await Promise.allSettled(
    variants.map((variant) => fetchJobs(apiKey, variant, target, remote, callSignal())),
  )
  const groups = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
  if (!groups.length) throw (settled[0] as PromiseRejectedResult).reason
  return groups.flat()
}

export async function searchJobs(goal: string, signal?: AbortSignal) {
  const apiKey = process.env.SERPAPI_API_KEY?.trim()
  if (!apiKey) throw new CareerError(JOBS_NOT_CONFIGURED_MESSAGE, 'CONFIGURATION', 503)

  const { query, location, remote } = getJobSearchParameters(goal)

  const controller = new AbortController()
  const forwardAbort = () => controller.abort(signal?.reason)
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    const plan = await buildLocationPlan(location, remote, controller.signal)
    if (location && !plan.targets.length && !plan.remote) return { query, location: plan.label, jobs: [] as Job[] }

    const targets = plan.targets.length ? plan.targets : [null]
    const settled = await Promise.allSettled(
      targets.map((target) => fetchTarget(apiKey, query, target, plan.remote, controller.signal)),
    )
    const groups = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
    if (!groups.length) {
      const failure = settled.find((result): result is PromiseRejectedResult => result.status === 'rejected')
      throw failure?.reason
    }
    const jobs = prioritizeByLocation(interleave(groups), plan.matchTerms)
      .filter((job, index, all) => all.findIndex((other) => other.id === job.id) === index)

    return { query, location: plan.label || location, jobs }
  } catch (error) {
    if (error instanceof CareerError) throw error
    if (signal?.aborted) throw error
    throw new CareerError('The live job search could not be reached. Try again.', 'UPSTREAM', 502)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
