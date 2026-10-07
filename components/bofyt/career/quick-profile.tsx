'use client'

import { useState, type FormEvent } from 'react'
import type { CareerProfile } from '@/lib/career/types'
import { careerRequest, errorMessage, splitList } from './career-client'
import { CareerButton, Notice, Panel, TextArea, TextField } from './career-ui'
import { CvImportButton } from './cv-import'

interface Props {
  base: CareerProfile
  company: string
  onSaved: (profile: CareerProfile) => void
  onExtracted: (profile: CareerProfile) => void
  onBack: () => void
}

export function QuickProfile({ base, company, onSaved, onExtracted, onBack }: Props) {
  const needsName = !base.fullName
  const needsEmail = !base.email
  const needsBackground = !base.summary && base.experience.length === 0 && base.skills.length === 0
  const [fullName, setFullName] = useState(base.fullName)
  const [email, setEmail] = useState(base.email)
  const [skills, setSkills] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const next: CareerProfile = {
      ...base,
      fullName: fullName.trim(),
      email: email.trim(),
      skills: needsBackground ? splitList(skills) : base.skills,
    }
    try {
      const { profile } = await careerRequest<{ profile: CareerProfile }>('/api/career/profile', { method: 'PUT', body: next })
      onSaved(profile)
    } catch (caught) {
      setError(errorMessage(caught, 'Your details could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel eyebrow="Almost there" title={`A few details before applying to ${company}`}>
        <p className="text-sm leading-relaxed text-white/55">
          Have a CV? Upload it and BOFYT fills this in for you to check.
        </p>
        <CvImportButton onExtracted={onExtracted} />
      </Panel>

      <form onSubmit={submit}>
        <Panel eyebrow="Or just the essentials" title="Only what this application needs">
          {needsName && <TextField label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />}
          {needsEmail && (
            <TextField label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" hint="Replies to your applications go here." />
          )}
          {needsBackground && (
            <TextArea
              label="Your key skills"
              required
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Product strategy, LLM prototyping, Python, n8n"
              hint="Comma separated. BOFYT only uses what you write, nothing is invented."
            />
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-wrap items-center gap-2">
            <CareerButton type="submit" tone="gold" busy={saving}>
              Continue
            </CareerButton>
            <CareerButton tone="quiet" onClick={onBack}>
              Back to listings
            </CareerButton>
          </div>
        </Panel>
      </form>
    </div>
  )
}
