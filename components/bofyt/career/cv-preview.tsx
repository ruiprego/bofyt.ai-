'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import type { CareerProfile, CvDocument } from '@/lib/career/types'
import { downloadCvPdf, errorMessage } from './career-client'
import { CareerButton, Notice, TextArea } from './career-ui'

interface Props {
  cv: CvDocument
  profile: CareerProfile
  onChange: (cv: CvDocument) => void
}

export function CvPreview({ cv, profile, onChange }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = async () => {
    setDownloading(true)
    setError(null)
    try {
      await downloadCvPdf(cv)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <article className="flex flex-col gap-4 rounded-xl bg-[#f7f5f1] p-5 text-[#15171b] sm:p-6">
        <header className="flex flex-col gap-1">
          <h4 className="font-display text-xl font-semibold">{profile.fullName}</h4>
          {cv.headline && <p className="text-sm font-medium text-gold-deep">{cv.headline}</p>}
          <p className="text-xs text-[#5f6470]">{[profile.email, profile.phone, profile.location].filter(Boolean).join(' · ')}</p>
        </header>
        {cv.summary && <CvSection title="Profile"><p className="text-sm leading-relaxed">{cv.summary}</p></CvSection>}
        {cv.skills.length > 0 && <CvSection title="Skills"><p className="text-sm leading-relaxed">{cv.skills.join(' · ')}</p></CvSection>}
        {cv.experience.length > 0 && (
          <CvSection title="Experience">
            {cv.experience.map((entry) => (
              <div key={`${entry.company}-${entry.title}`} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold">{[entry.title, entry.company].filter(Boolean).join(' — ')}</p>
                  {entry.period && <p className="text-xs text-[#5f6470]">{entry.period}</p>}
                </div>
                <ul className="flex list-disc flex-col gap-0.5 pl-5 text-sm leading-relaxed">
                  {entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              </div>
            ))}
          </CvSection>
        )}
        {cv.projects.length > 0 && (
          <CvSection title="Projects">
            {cv.projects.map((project) => (
              <div key={project.name} className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold">{project.name}</p>
                <p className="text-sm leading-relaxed">{project.description}</p>
              </div>
            ))}
          </CvSection>
        )}
        {cv.education.length > 0 && (
          <CvSection title="Education">
            {cv.education.map((entry) => (
              <p key={entry.school} className="text-sm">
                <span className="font-semibold">{entry.degree || entry.school}</span>
                {entry.degree && <span className="text-[#5f6470]"> · {entry.school}</span>}
                {entry.period && <span className="text-[#5f6470]"> · {entry.period}</span>}
              </p>
            ))}
          </CvSection>
        )}
      </article>

      <TextArea label="Edit tailored summary" value={cv.summary} onChange={(event) => onChange({ ...cv, summary: event.target.value })} />
      {error && <Notice tone="error">{error}</Notice>}
      <CareerButton onClick={download} busy={downloading} className="self-start">
        <Download aria-hidden className="size-4" />
        Download PDF
      </CareerButton>
    </div>
  )
}

function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-[#ddd8cf] pt-3">
      <h5 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep">{title}</h5>
      {children}
    </section>
  )
}
