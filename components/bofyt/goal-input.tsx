'use client'

import type { RefObject } from 'react'
import { ArrowRight, LoaderCircle, Sparkle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoalInputProps {
  inputRef: RefObject<HTMLInputElement | null>
  value: string
  placeholder: string
  busy: boolean
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onFocusChange: (focused: boolean) => void
  id?: string
  linkKey?: string | null
  ariaLabel?: string
  inputLabel?: string
  submitLabel?: string
}

export function GoalInput({
  inputRef,
  value,
  placeholder,
  busy,
  onChange,
  onSubmit,
  onFocusChange,
  id = 'goal-input',
  linkKey = null,
  ariaLabel = 'Describe your goal',
  inputLabel = 'Your goal',
  submitLabel = 'Submit goal',
}: GoalInputProps) {
  return (
    <form
      role="search"
      aria-label={ariaLabel}
      className="relative z-20 w-full max-w-xl min-[960px]:max-w-[clamp(20rem,calc(100vw_-_38rem),36rem)]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(value)
      }}
    >
      <div
        className={cn(
          'bofyt-input-shell group relative flex items-center gap-3 rounded-[28px] p-2 pl-5 transition-[border-color,box-shadow] duration-500',
          linkKey && 'border-tech-cyan/60',
        )}
      >
        {linkKey && (
          <span
            key={linkKey}
            aria-hidden
            className="pointer-events-none absolute -inset-px animate-out fade-out-0 fill-mode-forwards rounded-[28px] border border-gold-light shadow-[0_0_50px_-4px_rgba(226,184,101,0.9)] duration-[1400ms]"
          />
        )}
        <Sparkle aria-hidden className="size-5 shrink-0 fill-tech-cyan/80 text-tech-cyan transition-colors group-focus-within:fill-gold-light group-focus-within:text-gold-light" />
        <span aria-hidden className="h-8 w-px shrink-0 bg-tech-cyan/20" />
        <label htmlFor={id} className="sr-only">
          {inputLabel}
        </label>
        <input
          id={id}
          ref={inputRef}
          value={value}
          autoComplete="off"
          enterKeyHint="go"
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) {
              event.preventDefault()
            }
          }}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45 md:text-lg"
        />
        <button
          type="submit"
          disabled={busy}
          aria-label={submitLabel}
          className="bofyt-primary-action grid size-12 shrink-0 place-items-center rounded-full transition-transform duration-300 hover:scale-105 active:scale-95 disabled:opacity-80 md:size-14"
        >
          {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <ArrowRight aria-hidden className="size-5" />}
        </button>
      </div>
    </form>
  )
}
