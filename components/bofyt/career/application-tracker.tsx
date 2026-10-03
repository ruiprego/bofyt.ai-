'use client'

import { useState } from 'react'
import type { KeyedMutator } from 'swr'
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationEmail, type ApplicationRecord, type ApplicationStatus, type CareerStatus } from '@/lib/career/types'
import { careerRequest, errorMessage } from './career-client'
import { CareerButton, LoadingLine, Notice, Panel, TextArea, TextField } from './career-ui'

interface Props {
  applications: ApplicationRecord[] | undefined
  loading: boolean
  error: unknown
  status: CareerStatus
  mutate: KeyedMutator<{ applications: ApplicationRecord[] }>
  onNotify: (message: string) => void
  onFindJobs: () => void
}

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))

export function ApplicationTracker({ applications, loading, error, status, mutate, onNotify, onFindJobs }: Props) {
  const replace = (next: ApplicationRecord) =>
    mutate((current) => current && { applications: current.applications.map((entry) => (entry.id === next.id ? next : entry)) }, { revalidate: false })

  if (loading) return <LoadingLine label="Loading your applications" />
  if (error) return <Notice tone="error" action={<CareerButton onClick={() => mutate()} className="self-start">Try again</CareerButton>}>{errorMessage(error)}</Notice>
  if (!applications?.length) {
    return (
      <Panel eyebrow="Applications" title="Nothing sent yet">
        <p className="text-sm leading-relaxed text-white/55">Applications you confirm and send from BOFYT are tracked here, with the exact CV and email used.</p>
        <CareerButton tone="gold" onClick={onFindJobs} className="self-start">Find jobs</CareerButton>
      </Panel>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {applications.map((application) => (
        <li key={application.id}>
          <ApplicationRow application={application} status={status} onUpdated={replace} onNotify={onNotify} />
        </li>
      ))}
    </ul>
  )
}

function ApplicationRow({ application, status, onUpdated, onNotify }: { application: ApplicationRecord; status: CareerStatus; onUpdated: (next: ApplicationRecord) => void; onNotify: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const [followUp, setFollowUp] = useState<ApplicationEmail | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState<'status' | 'draft' | 'send' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const act = async (kind: NonNullable<typeof busy>, task: () => Promise<void>) => {
    setBusy(kind)
    setError(null)
    try {
      await task()
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setBusy(null)
    }
  }

  const changeStatus = (next: ApplicationStatus) =>
    act('status', async () => {
      const { application: updated } = await careerRequest<{ application: ApplicationRecord }>(`/api/career/applications/${application.id}`, { method: 'PATCH', body: { status: next } })
      onUpdated(updated)
      onNotify(`Marked as ${STATUS_LABELS[next]}`)
    })

  const draftFollowUp = () =>
    act('draft', async () => {
      const { email } = await careerRequest<{ email: ApplicationEmail }>(`/api/career/applications/${application.id}/follow-up`, { body: { mode: 'draft' } })
      setFollowUp(email)
    })

  const sendFollowUp = () =>
    act('send', async () => {
      if (!followUp) return
      const { application: updated } = await careerRequest<{ application: ApplicationRecord }>(`/api/career/applications/${application.id}/follow-up`, {
        body: { mode: 'send', confirmed: true, ...followUp },
      })
      onUpdated(updated)
      setFollowUp(null)
      setConfirming(false)
      onNotify('Follow-up sent')
    })

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-display text-base font-semibold text-white text-pretty">{application.role}</h3>
          <p className="text-sm text-white/60">{application.company}</p>
          <p className="text-xs text-white/40">
            Sent {formatDate(application.appliedAt)} to {application.recipient}
            {application.followUpSentAt && ` · followed up ${formatDate(application.followUpSentAt)}`}
          </p>
        </div>
        <label className="flex items-center gap-2">
          <span className="sr-only">Status for {application.role}</span>
          <select
            value={application.status}
            disabled={busy === 'status'}
            onChange={(event) => changeStatus(event.target.value as ApplicationStatus)}
            className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold-light focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            {APPLICATION_STATUSES.map((value) => (
              <option key={value} value={value} className="bg-void text-white">{STATUS_LABELS[value]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <CareerButton tone="ghost" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="min-h-8 px-3 text-xs">
          {open ? 'Hide email' : 'View sent email'}
        </CareerButton>
        {application.jobUrl && (
          <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center rounded-full border border-white/15 px-3 text-xs text-white hover:border-gold/50">
            Job posting
          </a>
        )}
        {!followUp && (
          <CareerButton tone="ghost" busy={busy === 'draft'} onClick={draftFollowUp} className="min-h-8 px-3 text-xs">
            Draft follow-up
          </CareerButton>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-1 rounded-xl border border-white/[0.07] p-3">
          <p className="text-sm font-medium text-white">{application.emailSubject}</p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-white/60">{application.emailBody}</p>
        </div>
      )}

      {followUp && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] p-3">
          <TextField label="Follow-up subject" value={followUp.subject} onChange={(event) => setFollowUp({ ...followUp, subject: event.target.value })} />
          <TextArea label="Follow-up message" value={followUp.body} onChange={(event) => setFollowUp({ ...followUp, body: event.target.value })} />
          {!status.email.configured ? (
            <Notice>Email sending is not configured yet.</Notice>
          ) : confirming ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gold-light">Send this follow-up to {application.recipient}? It cannot be unsent.</p>
              <div className="flex flex-wrap gap-2">
                <CareerButton tone="gold" busy={busy === 'send'} onClick={sendFollowUp}>Confirm and send</CareerButton>
                <CareerButton tone="quiet" disabled={busy === 'send'} onClick={() => setConfirming(false)}>Keep editing</CareerButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <CareerButton tone="gold" disabled={!followUp.subject.trim() || !followUp.body.trim()} onClick={() => setConfirming(true)}>Review follow-up</CareerButton>
              <CareerButton tone="quiet" onClick={() => setFollowUp(null)}>Discard</CareerButton>
            </div>
          )}
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </article>
  )
}
