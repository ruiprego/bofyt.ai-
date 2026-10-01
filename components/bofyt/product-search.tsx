'use client'

import type { RefObject } from 'react'
import type { CategoryModule } from '@/lib/bofyt/categories'
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LoaderCircle, Search as SearchIcon } from 'lucide-react'
import type { ProductSearchFeedback } from '@/lib/products/types'
import { GoalResult, type GoalResultData, type GoalResultHandlers } from './goal-result'
import { GoalThinking } from './goal-thinking'
import { ProductSearchStatus } from './product-search-status'

interface ProductSearchProps {
  open: boolean
  autoFocus: boolean
  inputRef: RefObject<HTMLInputElement | null>
  headingRef: RefObject<HTMLHeadingElement | null>
  query: string
  busy: boolean
  result: GoalResultData | null
  resultHandlers: GoalResultHandlers
  feedback: ProductSearchFeedback | null
  suggestions: CategoryModule[]
  onPickPrompt: (prompt: string) => void
  onQueryChange: (value: string) => void
  onSubmit: (query: string) => void
  onRetry: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

export function ProductSearch({
  open,
  autoFocus,
  inputRef,
  headingRef,
  query,
  busy,
  result,
  resultHandlers,
  feedback,
  suggestions,
  onPickPrompt,
  onQueryChange,
  onSubmit,
  onRetry,
}: ProductSearchProps) {
  const focusedOnOpen = useRef(false)

  useEffect(() => {
    if (!open || !autoFocus) {
      focusedOnOpen.current = false
      return
    }
    if (focusedOnOpen.current) return
    if (busy || result) {
      focusedOnOpen.current = true
      return
    }

    focusedOnOpen.current = true
    const timer = window.setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      inputRef.current?.focus({ preventScroll: true })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [autoFocus, busy, inputRef, open, result])

  return (
    <section
      aria-labelledby="product-search-heading"
      className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 px-1 pb-6 pt-2 text-center lg:gap-6 lg:pb-10 lg:pt-2"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-[10px] uppercase tracking-[0.42em] text-gold-light">08 · Product search</p>
        <h1
          ref={headingRef}
          id="product-search-heading"
          className="scroll-mt-6 font-display text-[clamp(2.2rem,5vw,4rem)] font-normal leading-[1.05] tracking-tight text-balance text-white"
        >
          Find what you need.
        </h1>
        <p className="max-w-md text-pretty text-sm leading-relaxed text-white/55">
          Search live products, brands and options without leaving BOFYT.
        </p>
      </motion.div>

      <motion.form
        role="search"
        aria-label="Search products"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(query)
        }}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, delay: 0.08, ease }}
        className="w-full max-w-2xl"
      >
        <div className="group relative flex items-center gap-3 rounded-[28px] border border-gold/45 bg-black/65 p-2 pl-5 shadow-[0_0_40px_-14px_rgba(226,184,101,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl transition-[border-color,box-shadow] duration-500 focus-within:border-gold-light focus-within:shadow-[0_0_64px_-12px_rgba(226,184,101,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <SearchIcon aria-hidden className="size-5 shrink-0 text-gold-light" />
          <span aria-hidden className="h-8 w-px shrink-0 bg-gold/25" />
          <label htmlFor="product-search-input" className="sr-only">
            Search products, brands or anything you want
          </label>
          <input
            id="product-search-input"
            ref={inputRef}
            value={query}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Search products, brands or anything you want..."
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) {
                event.preventDefault()
              }
            }}
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/45 md:text-lg"
          />
          <button
            type="submit"
            disabled={busy || !query.trim()}
            aria-label="Search products"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-light to-gold text-black shadow-[0_0_24px_-4px_rgba(226,184,101,0.8)] transition-transform duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:size-14"
          >
            {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <SearchIcon aria-hidden className="size-5" />}
          </button>
        </div>
      </motion.form>

      <p className="-mt-2 text-[10px] uppercase tracking-[0.3em] text-white/35">Live products · real prices · compare options</p>

      {!result && !busy && !feedback && suggestions.length > 0 && (
        <section className="w-full max-w-2xl text-left" aria-labelledby="product-search-examples-heading">
          <p id="product-search-examples-heading" className="text-[10px] uppercase tracking-[0.28em] text-gold-light">
            Start with an example
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Product search examples">
            {suggestions.slice(0, 3).map((suggestion) => (
              <li key={suggestion.name}>
                <button
                  type="button"
                  onClick={() => onPickPrompt(suggestion.prompt)}
                  className="group flex min-h-24 w-full flex-col justify-between rounded-xl border border-gold/25 bg-black/40 p-3 text-left transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/70 hover:bg-gold/[0.07] active:scale-[0.98]"
                >
                  <span className="text-[13px] font-medium text-white group-hover:text-gold-light">{suggestion.name}</span>
                  <span className="mt-2 text-xs leading-relaxed text-white/55">{suggestion.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex w-full flex-col items-center empty:hidden">
        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <GoalResult
              key={result.id}
              goal={result.goal}
              areas={result.areas}
              products={result.products}
              closestProducts={result.closestProducts}
              priceConstraint={result.priceConstraint}
              {...resultHandlers}
            />
          ) : busy ? (
            <GoalThinking key="product-thinking" mode="search" />
          ) : feedback ? (
            <ProductSearchStatus key="product-search-status" message={feedback.message} onRetry={onRetry} />
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  )
}
