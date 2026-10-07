'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ExternalLink, Send } from 'lucide-react'
import type { ApplicationEmail, ApplicationRecord, CareerProfile, CareerStatus, CvDocument, Job, JobAnalysis } from '@/lib/career/types'
import { careerRequest, errorMessage, newId } from './career-client'
import { CareerButton, Chips, LoadingLine, Notice, Panel, TextArea, TextField } from './career-ui'
import { CvPreview } from './cv-preview'

interface Props {
  job: Job
  profile: CareerProfile
  status: CareerStatus
  onBack: () => void
  onApplied: (application: ApplicationRecord | null, warning?: string) => void
}

type Busy = 'analysis' | 'cv' | 'email' | 'send' | null

export function JobWorkspace({ job, profile, status, onBack, onApplied }: Props) {
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null)
  const [cv, setCv] = useState<CvDocument | null>(null)
  const [email, setEmail] = useState<ApplicationEmail | null>(null)
  const [recipient, setRecipient] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [draftId] = useState(newId)
  const sendingRef = useRef(false)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<{ step: Busy; message: string } | null>(null)

  const run = async <T,>(step: Exclude<Busy, null>, task: () => Promise<T>) => {
    setBusy(step)
    setError(null)
    try {
      return await task()
    } catch (caught) {
      setError({ step, message: errorMessage(caught) })
      return null
    } finally {
      setBusy(null)
    }
  }

  const analyze = () =>
    run('analysis', async () => {
      const response = await careerRequest<{ analysis: JobAnalysis }>('/api/career/analyze', { body: { job } })
      setAnalysis(response.analysis)
    })

  const tailor = () =>
    run('cv', async () => {
      const response = await careerRequest<{ cv: CvDocument }>('/api/career/cv', { body: { job, analysis } })
      setCv(response.cv)
    })

  const draft = () =>
    run('email', async () => {
      if (!cv) return
      const response = await careerRequest<{ email: ApplicationEmail }>('/api/career/email', { body: { job, cv, analysis } })
      setEmail(response.email)
    })

  const validRecipient = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.trim())

  const send = () => {
    if (sendingRef.current) return
    sendingRef.current = true
    return run('send', async () => {
      if (!cv || !email) return
      const response = await careerRequest<{ application: ApplicationRecord | null; warning?: string }>('/api/career/applications', {
        body: { ...email, draftId, confirmed: true, recipient: recipient.trim(), job, cv },
      })
      setConfirming(false)
      onApplied(response.application, response.warning)
    }).finally(() => {
      sendingRef.current = false
    })
  }

  const stepError = (step: Busy) => error?.step === step && <Notice tone="error">{error.message}</Notice>

  return (
    <div className="flex flex-col gap-4">
      <CareerButton tone="quiet" onClick={onBack} className="min-h-8 self-start px-0">
        <ArrowLeft aria-hidden className="size-4" />
        All listings
      </CareerButton>

      <Panel eyebrow={job.company} title={job.title}>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
          {job.location && <span>{job.location}</span>}
          {job.remote && <span className="text-gold-light">Remote</span>}
          {job.employmentType && <span>{job.employmentType}</span>}
          {job.salary && <span>{job.salary}</span>}
          {job.source && <span>via {job.source}</span>}
        </div>
        {job.description && <p className="line-clamp-6 whitespace-pre-line text-sm leading-relaxed text-white/65">{job.description}</p>}
        {job.applyOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.applyOptions.slice(0, 3).map((option) => (
              <a
                key={option.url}
                href={option.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:border-gold/40 hover:text-gold-light"
              >
                {option.title}
                <ExternalLink aria-hidden className="size-3" />
              </a>
            ))}
          </div>
        )}
      </Panel>

      <Panel eyebrow="Step 1" title="Match against your profile">
        {!analysis && busy !== 'analysis' && (
          <CareerButton tone="gold" onClick={analyze} className="self-start">
            Analyse this job
          </CareerButton>
        )}
        {busy === 'analysis' && <LoadingLine label="Reading the posting and comparing it with your profile" />}
        {stepError('analysis')}
        {analysis && (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnalysisGroup label="Matching from your profile"><Chips items={analysis.matchingSkills} tone="match" /></AnalysisGroup>
            <AnalysisGroup label="Not in your profile"><Chips items={analysis.missingRequirements} tone="gap" /></AnalysisGroup>
            <AnalysisGroup label="Required skills"><Chips items={analysis.requiredSkills} /></AnalysisGroup>
            <AnalysisGroup label="Tech stack"><Chips items={analysis.techStack} /></AnalysisGroup>
            <AnalysisGroup label="Relevant experience"><Chips items={[...analysis.relevantExperience, ...analysis.relevantProjects]} tone="match" /></AnalysisGroup>
            <AnalysisGroup label="Experience asked for"><Chips items={analysis.experienceRequirements} /></AnalysisGroup>
            {analysis.needsClarification.length > 0 && (
              <AnalysisGroup label="Worth clarifying"><Chips items={analysis.needsClarification} tone="gap" /></AnalysisGroup>
            )}
          </div>
        )}
      </Panel>

      <Panel eyebrow="Step 2" title="Tailored CV">
        {!cv && busy !== 'cv' && (
          <CareerButton tone={analysis ? 'gold' : 'ghost'} onClick={tailor} className="self-start">
            Adapt my CV to this job
          </CareerButton>
        )}
        {busy === 'cv' && <LoadingLine label="Reordering and rewording your real experience for this role" />}
        {stepError('cv')}
        {cv && <CvPreview cv={cv} profile={profile} onChange={setCv} />}
      </Panel>

      <Panel eyebrow="Step 3" title="Application email">
        {!cv && <p className="text-sm text-white/40">Adapt your CV first, so the email can reference it.</p>}
        {cv && !email && busy !== 'email' && (
          <CareerButton tone="gold" onClick={draft} className="self-start">
            Draft application email
          </CareerButton>
        )}
        {busy === 'email' && <LoadingLine label="Writing an email specific to this company and role" />}
        {stepError('email')}
        {email && (
          <>
            <TextField label="Recipient" type="email" required value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="hiring@company.com" hint="Listings rarely publish an email. Use the address from the posting or recruiter." />
            <TextField label="Subject" value={email.subject} onChange={(event) => setEmail({ ...email, subject: event.target.value })} />
            <TextArea label="Message" value={email.body} onChange={(event) => setEmail({ ...email, body: event.target.value })} className="[&_textarea]:min-h-64" />
            <p className="text-xs text-white/45">Your tailored CV is attached as a PDF. Replies go to {profile.email}.</p>
          </>
        )}
      </Panel>

      {email && cv && (
        <Panel eyebrow="Step 4" title="Review and send">
          {!status.email.configured ? (
            <Notice>Email sending is not configured yet. You can still download the CV and copy the email.</Notice>
          ) : !confirming ? (
            <CareerButton tone="gold" disabled={!validRecipient || !email.subject.trim() || !email.body.trim()} onClick={() => setConfirming(true)} className="self-start">
              Review before sending
            </CareerButton>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-gold/30 bg-gold/[0.05] p-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-white/45">To</dt><dd className="break-all text-white">{recipient.trim()}</dd>
                <dt className="text-white/45">From</dt><dd className="break-all text-white">{profile.fullName} &lt;{status.email.sender}&gt;</dd>
                <dt className="text-white/45">Reply-to</dt><dd className="break-all text-white">{profile.email}</dd>
                <dt className="text-white/45">Subject</dt><dd className="text-white">{email.subject}</dd>
                <dt className="text-white/45">Attachment</dt><dd className="text-white">Tailored CV (PDF)</dd>
              </dl>
              <p className="text-sm text-gold-light">This sends a real email to {job.company}. It cannot be unsent.</p>
              {stepError('send')}
              <div className="flex flex-wrap gap-2">
                <CareerButton tone="gold" busy={busy === 'send'} onClick={send}>
                  <Send aria-hidden className="size-4" />
                  Confirm and send
                </CareerButton>
                <CareerButton tone="quiet" disabled={busy === 'send'} onClick={() => setConfirming(false)}>
                  Keep editing
                </CareerButton>
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}

function AnalysisGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-white/50">{label}</p>
      {children}
    </div>
  )
}
