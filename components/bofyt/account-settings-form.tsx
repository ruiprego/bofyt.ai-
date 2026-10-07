'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { categories, type CategoryId } from '@/lib/bofyt/categories'
import { upsertProfileSettings } from '@/lib/bofyt/persistence'
import { cn } from '@/lib/utils'

const DISPLAY_NAME_MAX = 60
const focusOptions = categories.filter((category) => category.id !== 'search')

export function AccountSettingsForm({
  userId,
  initialDisplayName,
  initialFocusAreas,
}: {
  userId: string
  initialDisplayName: string
  initialFocusAreas: CategoryId[]
}) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [focusAreas, setFocusAreas] = useState<CategoryId[]>(initialFocusAreas)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const toggleArea = (id: CategoryId) => {
    setStatus('idle')
    setFocusAreas((current) => (current.includes(id) ? current.filter((area) => area !== id) : [...current, id]))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('saving')
    const trimmed = displayName.trim().slice(0, DISPLAY_NAME_MAX)
    const orderedAreas = focusOptions.map((category) => category.id).filter((id) => focusAreas.includes(id))
    const { error } = await upsertProfileSettings(userId, { displayName: trimmed || null, focusAreas: orderedAreas })

    if (error) {
      setStatus('error')
      return
    }
    setDisplayName(trimmed)
    setStatus('saved')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="account-display-name" className="text-[10px] uppercase tracking-[0.2em] text-white/50">
          Display name
        </label>
        <input
          id="account-display-name"
          name="displayName"
          type="text"
          autoComplete="nickname"
          maxLength={DISPLAY_NAME_MAX}
          placeholder="How BOFYT should address you"
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value)
            setStatus('idle')
          }}
          className="bofyt-auth-input h-12 rounded-xl px-4 text-base placeholder:text-white/30 transition-colors focus:outline-none"
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[10px] uppercase tracking-[0.2em] text-white/50">Focus areas</legend>
        <div className="flex flex-wrap gap-2">
          {focusOptions.map((category) => {
            const active = focusAreas.includes(category.id)
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleArea(category.id)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-xs uppercase tracking-[0.14em] transition-colors',
                  active
                    ? 'border-gold/70 bg-gold/10 text-gold-light'
                    : 'border-white/15 text-white/60 hover:border-gold/40 hover:text-white',
                )}
              >
                {active && <Check aria-hidden className="size-3.5" />}
                {category.shortTitle}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          disabled={status === 'saving'}
          className="bofyt-primary-action h-11 rounded-xl px-6 text-[10px] font-semibold uppercase tracking-[0.16em]"
        >
          {status === 'saving' ? 'Saving…' : 'Save profile'}
        </Button>
        <p aria-live="polite" className={cn('text-sm', status === 'error' ? 'text-destructive' : 'text-gold-light/80')}>
          {status === 'saved' && 'Profile saved.'}
          {status === 'error' && 'Unable to save your profile. Please try again.'}
        </p>
      </div>
    </form>
  )
}
