import 'server-only'
import { getJobSearchParameters } from './job-query'
import { CareerError, JOBS_NOT_CONFIGURED_MESSAGE, type Job } from './types'

export { getJobSearchParameters, parseJobSearch, toJobQuery } from './job-query'

const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json'
const REQUEST_TIMEOUT_MS = 15_000

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

export async function searchJobs(goal: string, signal?: AbortSignal) {
  const apiKey = process.env.SERPAPI_API_KEY?.trim()
  if (!apiKey) throw new CareerError(JOBS_NOT_CONFIGURED_MESSAGE, 'CONFIGURATION', 503)

  const { query, location, remote } = getJobSearchParameters(goal)
  const url = new URL(SERPAPI_ENDPOINT)
  url.searchParams.set('engine', 'google_jobs')
  url.searchParams.set('q', query)
  url.searchParams.set('hl', 'en')
  url.searchParams.set('api_key', apiKey)
  if (location) url.searchParams.set('location', location)
  if (remote) url.searchParams.set('ltype', '1')

  const controller = new AbortController()
  const forwardAbort = () => controller.abort(signal?.reason)
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  signal?.addEventListener('abort', forwardAbort, { once: true })

  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal })
    if (response.status === 401 || response.status === 403) {
      throw new CareerError('The job search provider rejected the configured API key.', 'UPSTREAM', 502)
    }
    if (response.status === 429) throw new CareerError('Job search rate limit reached. Try again shortly.', 'UPSTREAM', 502)

    const payload = asRecord(await response.json().catch(() => null))
    const providerError = asString(payload?.error)
    if (providerError && /hasn't returned any results/i.test(providerError)) return { query, location, jobs: [] as Job[] }
    if (!response.ok || providerError || !payload) {
      throw new CareerError('The live job search could not be completed. Try again.', 'UPSTREAM', 502)
    }

    const jobs = (Array.isArray(payload.jobs_results) ? payload.jobs_results : [])
      .map(normalizeJob)
      .filter((job): job is Job => Boolean(job))
      .filter((job, index, all) => all.findIndex((other) => other.id === job.id) === index)

    return { query, location, jobs }
  } catch (error) {
    if (error instanceof CareerError) throw error
    if (signal?.aborted) throw error
    throw new CareerError('The live job search could not be reached. Try again.', 'UPSTREAM', 502)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
