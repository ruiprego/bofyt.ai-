'use client'

import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { ArrowRight, Briefcase, MapPin, Search } from 'lucide-react'
import type { Job } from '@/lib/career/types'
import { careerRequest, errorMessage } from './career-client'
import { CareerButton, LoadingLine, Notice } from './career-ui'

interface Props {
  initialQuery: string
  configured: boolean
  onSelect: (job: Job) => void
}

export function JobSearch({ initialQuery, configured, onSelect }: Props) {
  const [draft, setDraft] = useState(initialQuery)
  const [submitted, setSubmitted] = useState(initialQuery.trim())
  const { data, error, isLoading, mutate } = useSWR(
    configured && submitted ? ['career-jobs', submitted] : null,
    ([, query]) => careerRequest<{ query: string; jobs: Job[] }>('/api/career/jobs', { body: { query } }),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next = draft.trim()
    if (next.length < 2) return
    if (next === submitted) void mutate()
    else setSubmitted(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} role="search" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5 pl-4 focus-within:border-gold/50">
        <Search aria-hidden className="size-4 shrink-0 text-white/40" />
        <label htmlFor="career-job-query" className="sr-only">
          Job search
        </label>
        <input
          id="career-job-query"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="AI Product Engineer, remote"
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        <CareerButton type="submit" tone="gold" disabled={!configured || draft.trim().length < 2} className="min-h-9">
          Search
        </CareerButton>
      </form>

      {!configured && <Notice>Live job search is not configured yet.</Notice>}
      {isLoading && <LoadingLine label="Searching live job listings" />}
      {error && (
        <Notice tone="error" action={<CareerButton onClick={() => mutate()} className="self-start">Try again</CareerButton>}>
          {errorMessage(error)}
        </Notice>
      )}
      {data && data.jobs.length === 0 && (
        <Notice>No live listings matched “{data.query}”. Try a broader title or remove the location.</Notice>
      )}

      {data && data.jobs.length > 0 && (
        <>
          <p className="text-xs text-white/45">
            {data.jobs.length} live listings for “{data.query}”
          </p>
          <ul className="flex flex-col gap-2">
            {data.jobs.map((job) => (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => onSelect(job)}
                  className="group flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left transition-colors hover:border-gold/40 hover:bg-gold/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-display text-base font-semibold text-white text-pretty">{job.title}</span>
                      <span className="flex items-center gap-1.5 text-sm text-white/65">
                        <Briefcase aria-hidden className="size-3.5" />
                        {job.company}
                      </span>
                    </div>
                    <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin aria-hidden className="size-3" />
                        {job.location}
                      </span>
                    )}
                    {job.remote && <span className="text-gold-light">Remote</span>}
                    {job.employmentType && <span>{job.employmentType}</span>}
                    {job.salary && <span>{job.salary}</span>}
                    {job.postedAt && <span>{job.postedAt}</span>}
                    {job.source && <span>via {job.source}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
