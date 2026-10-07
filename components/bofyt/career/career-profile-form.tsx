'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { CareerProfile, EducationEntry, ExperienceEntry, ProjectEntry } from '@/lib/career/types'
import { CareerButton, Notice, Panel, TextArea, TextField } from './career-ui'
import { careerRequest, errorMessage, newId, splitList } from './career-client'

interface Props {
  initial: CareerProfile
  onSaved: (profile: CareerProfile) => void
  onNotify: (message: string) => void
}

const joinList = (items: string[]) => items.join(', ')

export function CareerProfileForm({ initial, onSaved, onNotify }: Props) {
  const [profile, setProfile] = useState(initial)
  const [lists, setLists] = useState({
    skills: joinList(initial.skills),
    languages: joinList(initial.languages),
    preferredRoles: joinList(initial.preferredRoles),
    preferredLocations: joinList(initial.preferredLocations),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof CareerProfile>(key: K, value: CareerProfile[K]) => setProfile((current) => ({ ...current, [key]: value }))

  const updateEntry = <T extends { id: string }>(key: 'experience' | 'education' | 'projects', id: string, patch: Partial<T>) =>
    setProfile((current) => ({
      ...current,
      [key]: (current[key] as unknown as T[]).map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }))

  const removeEntry = (key: 'experience' | 'education' | 'projects', id: string) =>
    setProfile((current) => ({ ...current, [key]: (current[key] as { id: string }[]).filter((entry) => entry.id !== id) }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const next: CareerProfile = {
      ...profile,
      skills: splitList(lists.skills),
      languages: splitList(lists.languages),
      preferredRoles: splitList(lists.preferredRoles),
      preferredLocations: splitList(lists.preferredLocations),
    }
    try {
      const { profile: saved } = await careerRequest<{ profile: CareerProfile }>('/api/career/profile', { method: 'PUT', body: next })
      setProfile(saved)
      onSaved(saved)
      onNotify('Career profile saved')
    } catch (caught) {
      setError(errorMessage(caught, 'Your profile could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Panel eyebrow="Career profile" title="The single source of truth for every CV and application">
        <p className="text-sm leading-relaxed text-white/55">
          BOFYT only uses what you write here. Nothing is invented when tailoring a CV or drafting an email.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Full name" required value={profile.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete="name" />
          <TextField label="Email" required type="email" value={profile.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" hint="Replies to your applications go here." />
          <TextField label="Phone" value={profile.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
          <TextField label="Location" value={profile.location} onChange={(e) => set('location', e.target.value)} />
          <TextField label="Website / portfolio" value={profile.website} onChange={(e) => set('website', e.target.value)} />
          <TextField label="LinkedIn" value={profile.linkedin} onChange={(e) => set('linkedin', e.target.value)} />
          <TextField label="GitHub" value={profile.github} onChange={(e) => set('github', e.target.value)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-white/70">Work preference</span>
            <select
              value={profile.remotePreference}
              onChange={(e) => set('remotePreference', e.target.value as CareerProfile['remotePreference'])}
              className="bofyt-auth-input w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </label>
        </div>
        <TextArea label="Professional summary" value={profile.summary} onChange={(e) => set('summary', e.target.value)} />
        <TextArea label="AI experience" value={profile.aiExperience} onChange={(e) => set('aiExperience', e.target.value)} hint="Models, tools, products or research you have actually worked with." />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextArea label="Skills" value={lists.skills} onChange={(e) => setLists((c) => ({ ...c, skills: e.target.value }))} hint="Comma separated" />
          <TextArea label="Languages" value={lists.languages} onChange={(e) => setLists((c) => ({ ...c, languages: e.target.value }))} hint="e.g. English (fluent), Portuguese (native)" />
          <TextArea label="Preferred roles" value={lists.preferredRoles} onChange={(e) => setLists((c) => ({ ...c, preferredRoles: e.target.value }))} hint="Comma separated" />
          <TextArea label="Preferred locations" value={lists.preferredLocations} onChange={(e) => setLists((c) => ({ ...c, preferredLocations: e.target.value }))} hint="Comma separated" />
        </div>
      </Panel>

      <EntryList
        title="Experience"
        onAdd={() => set('experience', [...profile.experience, { id: newId(), company: '', title: '', location: '', start: '', end: '', highlights: [] }])}
        items={profile.experience}
        onRemove={(id) => removeEntry('experience', id)}
        render={(entry: ExperienceEntry) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Title" value={entry.title} onChange={(e) => updateEntry<ExperienceEntry>('experience', entry.id, { title: e.target.value })} />
              <TextField label="Company" value={entry.company} onChange={(e) => updateEntry<ExperienceEntry>('experience', entry.id, { company: e.target.value })} />
              <TextField label="Start" placeholder="2022" value={entry.start} onChange={(e) => updateEntry<ExperienceEntry>('experience', entry.id, { start: e.target.value })} />
              <TextField label="End" placeholder="Present" value={entry.end} onChange={(e) => updateEntry<ExperienceEntry>('experience', entry.id, { end: e.target.value })} />
            </div>
            <TextField label="Location" value={entry.location} onChange={(e) => updateEntry<ExperienceEntry>('experience', entry.id, { location: e.target.value })} />
            <TextArea
              label="Achievements"
              hint="One per line"
              defaultValue={entry.highlights.join('\n')}
              onBlur={(e) => updateEntry<ExperienceEntry>('experience', entry.id, { highlights: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean) })}
            />
          </>
        )}
      />

      <EntryList
        title="Projects"
        onAdd={() => set('projects', [...profile.projects, { id: newId(), name: '', url: '', description: '', stack: [] }])}
        items={profile.projects}
        onRemove={(id) => removeEntry('projects', id)}
        render={(entry: ProjectEntry) => (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Name" value={entry.name} onChange={(e) => updateEntry<ProjectEntry>('projects', entry.id, { name: e.target.value })} />
              <TextField label="URL" value={entry.url} onChange={(e) => updateEntry<ProjectEntry>('projects', entry.id, { url: e.target.value })} />
            </div>
            <TextArea label="Description" value={entry.description} onChange={(e) => updateEntry<ProjectEntry>('projects', entry.id, { description: e.target.value })} />
          </>
        )}
      />

      <EntryList
        title="Education"
        onAdd={() => set('education', [...profile.education, { id: newId(), school: '', degree: '', start: '', end: '' }])}
        items={profile.education}
        onRemove={(id) => removeEntry('education', id)}
        render={(entry: EducationEntry) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="School" value={entry.school} onChange={(e) => updateEntry<EducationEntry>('education', entry.id, { school: e.target.value })} />
            <TextField label="Degree" value={entry.degree} onChange={(e) => updateEntry<EducationEntry>('education', entry.id, { degree: e.target.value })} />
            <TextField label="Start" value={entry.start} onChange={(e) => updateEntry<EducationEntry>('education', entry.id, { start: e.target.value })} />
            <TextField label="End" value={entry.end} onChange={(e) => updateEntry<EducationEntry>('education', entry.id, { end: e.target.value })} />
          </div>
        )}
      />

      {error && <Notice tone="error">{error}</Notice>}
      <div className="sticky bottom-0 -mx-1 flex justify-end bg-gradient-to-t from-void via-void/95 to-transparent px-1 pb-1 pt-4">
        <CareerButton type="submit" tone="gold" busy={saving}>
          Save profile
        </CareerButton>
      </div>
    </form>
  )
}

function EntryList<T extends { id: string }>({
  title,
  items,
  onAdd,
  onRemove,
  render,
}: {
  title: string
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  render: (entry: T) => React.ReactNode
}) {
  return (
    <Panel
      title={title}
      action={
        <CareerButton tone="ghost" onClick={onAdd} className="min-h-8 px-3 text-xs">
          <Plus aria-hidden className="size-3.5" />
          Add
        </CareerButton>
      }
    >
      {items.length === 0 && <p className="text-sm text-white/40">Nothing added yet.</p>}
      {items.map((entry, index) => (
        <div key={entry.id} className="bofyt-glass-panel flex flex-col gap-3 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">
              {title} {index + 1}
            </span>
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              className="rounded-full p-1.5 text-white/40 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <Trash2 aria-hidden className="size-4" />
              <span className="sr-only">Remove {title.toLowerCase()} {index + 1}</span>
            </button>
          </div>
          {render(entry)}
        </div>
      ))}
    </Panel>
  )
}
