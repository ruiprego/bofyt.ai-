'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import type { CareerProfile } from '@/lib/career/types'
import { CareerRequestError, errorMessage } from './career-client'
import { CareerButton, Notice } from './career-ui'

interface Props {
  onExtracted: (profile: CareerProfile) => void
  label?: string
  tone?: 'gold' | 'ghost'
}

export function CvImportButton({ onExtracted, label = 'Upload CV', tone = 'gold' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/career/cv/import', { method: 'POST', body, cache: 'no-store' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new CareerRequestError(payload?.error?.message ?? 'We could not read that CV.', payload?.error?.code ?? 'UPSTREAM', response.status)
      onExtracted(payload.profile as CareerProfile)
    } catch (caught) {
      setError(errorMessage(caught, 'We could not read that CV.'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf,text/plain,.txt,.md"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
        }}
      />
      <CareerButton tone={tone} busy={busy} onClick={() => inputRef.current?.click()} className="self-start">
        {!busy && <Upload aria-hidden className="size-4" />}
        {busy ? 'Reading your CV' : label}
      </CareerButton>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  )
}
