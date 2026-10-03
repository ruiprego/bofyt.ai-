'use client'

import { useEffect, useRef, useState } from 'react'
import type { Capability, CapabilityId, CapabilitySearchRequest } from '@/lib/bofyt/capabilities'
import { GoalInput } from './goal-input'

export const CAPABILITY_SEARCH_PLACEHOLDERS: Record<CapabilityId, string> = {
  grow: 'What do you want to grow?',
  build: 'What do you want to build?',
  reach: 'Who do you want to reach?',
  optimize: 'What do you want to optimize?',
  automate: 'What do you want to automate?',
  discover: 'What are you looking for?',
  career: 'What role are you looking for?',
}

interface CapabilitySearchProps {
  capability: Capability
  onSubmit: (request: CapabilitySearchRequest) => void
}

export function CapabilitySearch({ capability, onSubmit }: CapabilitySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setQuery('')
  }, [capability.id])

  const handleSubmit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      inputRef.current?.focus({ preventScroll: true })
      return
    }

    onSubmit({
      capabilityId: capability.id,
      categoryId: capability.categoryId,
      query: trimmed,
    })
  }

  return (
    <section
      aria-labelledby={`${capability.id}-contextual-search-heading`}
      className="rounded-2xl border border-gold/25 bg-gold/[0.035] p-4 sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold-light">Contextual search</p>
          <h3 id={`${capability.id}-contextual-search-heading`} className="mt-1 font-display text-xl text-white sm:text-2xl">
            Start with this capability
          </h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-white/50">
            Your query will stay connected to {capability.title.toLowerCase()} while BOFYT routes the next step.
          </p>
        </div>
        <span className="w-fit rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-gold-light/85">
          {capability.title} context
        </span>
      </div>

      <div className="mt-4">
        <GoalInput
          id={`${capability.id}-contextual-search-input`}
          inputRef={inputRef}
          value={query}
          placeholder={CAPABILITY_SEARCH_PLACEHOLDERS[capability.id]}
          busy={false}
          ariaLabel={`Search within ${capability.title} capability`}
          inputLabel={`Search within ${capability.title}`}
          submitLabel={`Search ${capability.title}`}
          onChange={setQuery}
          onSubmit={handleSubmit}
          onFocusChange={() => {}}
        />
      </div>
    </section>
  )
}
