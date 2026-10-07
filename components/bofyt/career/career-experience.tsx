'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { X } from 'lucide-react'
import { emptyProfile, isProfileReady, type ApplicationRecord, type CareerProfile, type CareerStatus, type CvDocument, type Job } from '@/lib/career/types'
import { cn } from '@/lib/utils'
import { ApplicationTracker } from './application-tracker'
import { careerFetcher, careerRequest, errorMessage } from './career-client'
import { CareerProfileForm } from './career-profile-form'
import { CareerButton, LoadingLine, Notice, Panel } from './career-ui'
import { CvImportButton } from './cv-import'
import { CvPreview } from './cv-preview'
import { QuickProfile } from './quick-profile'
import { JobSearch } from './job-search'
import { JobWorkspace } from './job-workspace'

type Tab = 'jobs' | 'profile' | 'applications'

interface Props {
  initialQuery: string
  accountHref: string
  onClose: () => void
  onNotify: (message: string) => void
}

const CV_ONLY = /\b(cv|resume|résumé|curriculum)\b/i
const JOB_WORDS = /\b(job|jobs|role|roles|position|hiring|apply|vacanc)/i

export function CareerExperience({ initialQuery, accountHref, onClose, onNotify }: Props) {
  const wantsCvOnly = CV_ONLY.test(initialQuery) && !JOB_WORDS.test(initialQuery)
  const [tab, setTab] = useState<Tab>(wantsCvOnly ? 'profile' : 'jobs')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const status = useSWR<CareerStatus>('/api/career/status', careerFetcher, { revalidateOnFocus: false })
  const signedIn = status.data?.signedIn === true
  const profile = useSWR<{ profile: CareerProfile | null }>(signedIn ? '/api/career/profile' : null, careerFetcher, { revalidateOnFocus: false })
  const applications = useSWR<{ applications: ApplicationRecord[] }>(signedIn ? '/api/career/applications' : null, careerFetcher, { revalidateOnFocus: false })

  const savedProfile = profile.data?.profile ?? null
  const ready = isProfileReady(savedProfile)
  const [draft, setDraft] = useState<CareerProfile | null>(null)
  const [draftVersion, setDraftVersion] = useState(0)

  const account = status.data?.account
  const knownProfile: CareerProfile = {
    ...(savedProfile ?? emptyProfile()),
    fullName: savedProfile?.fullName || account?.name || '',
    email: savedProfile?.email || account?.email || '',
  }

  const reviewExtracted = (extracted: CareerProfile) => {
    setDraft(extracted)
    setDraftVersion((v) => v + 1)
    setTab('profile')
  }

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previous?.focus?.()
    }
  }, [])

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'jobs', label: 'Jobs' },
    { id: 'profile', label: 'Profile & CV' },
    { id: 'applications', label: 'Applications', count: applications.data?.applications.length },
  ]

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-title"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      className="bofyt-career-shell fixed inset-0 z-[60] flex flex-col text-white backdrop-blur-sm focus:outline-none"
    >
      <header className="border-b border-tech-cyan/15">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-6">
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold">BOFYT Career</p>
            <h2 id="career-title" className="font-display text-lg font-semibold text-white text-balance">
              {initialQuery ? initialQuery : 'Find work that fits you'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/60 hover:border-gold/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <X aria-hidden className="size-4" />
            <span className="sr-only">Close career workspace</span>
          </button>
        </div>
        {signedIn && (
          <nav aria-label="Career sections" className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-4 sm:px-6">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => setTab(item.id)}
                className={cn(
                  'bofyt-career-tab relative shrink-0 px-3 pb-3 pt-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tech-cyan/60',
                  tab === item.id ? 'text-white' : 'text-white/45 hover:text-white/80',
                )}
              >
                {item.label}
                {item.count ? <span className="ml-1.5 text-xs text-gold">{item.count}</span> : null}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pb-16 pt-5 sm:px-6">
          {status.isLoading && <LoadingLine label="Preparing your career workspace" />}
          {status.error && <Notice tone="error">{errorMessage(status.error)}</Notice>}

          {status.data && !signedIn && (
            <Panel eyebrow="Sign in required" title="Your career data stays private to your account">
              <p className="text-sm leading-relaxed text-white/55">
                Sign in to build your career profile, generate tailored CVs, send applications from your own name and track every response.
              </p>
              <a href={accountHref} className="inline-flex min-h-10 items-center self-start rounded-full bg-gold px-4 text-sm font-medium text-void hover:bg-gold-light">
                Sign in to continue
              </a>
            </Panel>
          )}

          {signedIn && profile.isLoading && <LoadingLine label="Loading your career profile" />}
          {signedIn && profile.error && <Notice tone="error">{errorMessage(profile.error)}</Notice>}

          {signedIn && status.data && profile.data && (
            <>
              {tab === 'jobs' && !ready && !selectedJob && (
                <Panel eyebrow="Optional" title="Have a CV? Upload it.">
                  <p className="text-sm leading-relaxed text-white/55">
                    Start searching now. A CV lets BOFYT fill in your profile for you to check, ready for tailored applications.
                  </p>
                  <CvImportButton tone="ghost" onExtracted={reviewExtracted} />
                </Panel>
              )}

              {tab === 'jobs' && (
                <div className={cn(selectedJob && 'hidden')}>
                  <JobSearch initialQuery={wantsCvOnly ? '' : initialQuery} configured={status.data.jobs.configured} onSelect={setSelectedJob} />
                </div>
              )}

              {tab === 'jobs' && selectedJob && savedProfile && ready && (
                <JobWorkspace
                  key={selectedJob.id}
                  job={selectedJob}
                  profile={savedProfile}
                  status={status.data}
                  onBack={() => setSelectedJob(null)}
                  onApplied={(application, warning) => {
                    if (application) {
                      applications.mutate((current) => ({ applications: [application, ...(current?.applications ?? [])] }), { revalidate: false })
                    }
                    onNotify(warning ?? `Application sent to ${selectedJob.company}`)
                    setSelectedJob(null)
                    setTab('applications')
                  }}
                />
              )}
              {tab === 'jobs' && selectedJob && !ready && (
                <QuickProfile
                  base={knownProfile}
                  company={selectedJob.company}
                  onExtracted={reviewExtracted}
                  onSaved={(next) => profile.mutate({ profile: next }, { revalidate: false })}
                  onBack={() => setSelectedJob(null)}
                />
              )}

              {tab === 'profile' && (
                <>
                  {!draft && (
                    <Panel eyebrow="Fastest way" title="Have a CV? Upload it.">
                      <p className="text-sm leading-relaxed text-white/55">BOFYT reads it and fills in your profile. You check everything before it is saved.</p>
                      <CvImportButton onExtracted={reviewExtracted} label={savedProfile ? 'Update from CV' : 'Upload CV'} />
                    </Panel>
                  )}
                  {draft && (
                    <Notice action={<CareerButton tone="quiet" onClick={() => setDraft(null)} className="self-start px-0">Discard changes</CareerButton>}>
                      We filled this in from your CV. Check and edit anything, then save. Nothing is stored until you do.
                    </Notice>
                  )}
                  {ready && savedProfile && !draft && <BaseCv profile={savedProfile} />}
                  <CareerProfileForm
                    key={draftVersion}
                    initial={draft ?? knownProfile}
                    onNotify={onNotify}
                    onSaved={(next) => {
                      profile.mutate({ profile: next }, { revalidate: false })
                      if (draft) {
                        setDraft(null)
                        setDraftVersion((v) => v + 1)
                        if (selectedJob) setTab('jobs')
                      }
                    }}
                  />
                </>
              )}

              {tab === 'applications' && (
                <ApplicationTracker
                  applications={applications.data?.applications}
                  loading={applications.isLoading}
                  error={applications.error}
                  status={status.data}
                  mutate={applications.mutate}
                  onNotify={onNotify}
                  onFindJobs={() => setTab('jobs')}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function BaseCv({ profile }: { profile: CareerProfile }) {
  const [cv, setCv] = useState<CvDocument | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await careerRequest<{ cv: CvDocument }>('/api/career/cv', { body: {} })
      setCv(response.cv)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel eyebrow="Your CV" title="A clean CV from your profile" action={!cv ? undefined : <CareerButton tone="quiet" onClick={generate} busy={busy} className="min-h-8 px-2 text-xs">Refresh</CareerButton>}>
      {!cv && (
        <>
          <p className="text-sm leading-relaxed text-white/55">Generate a general CV from your saved profile. Tailored versions are created per job from the Jobs tab.</p>
          <CareerButton tone="gold" onClick={generate} busy={busy} className="self-start">Create my CV</CareerButton>
        </>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {cv && <CvPreview cv={cv} profile={profile} onChange={setCv} />}
    </Panel>
  )
}
