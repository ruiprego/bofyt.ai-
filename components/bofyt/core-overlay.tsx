'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import type { Category, CategoryId } from '@/lib/bofyt/categories'
import type { ProductSearchFeedback } from '@/lib/products/types'
import { AiCore, type CoreMode } from './ai-core'
import { PLACEHOLDERS } from './center-stage'
import { GoalInput } from './goal-input'
import { GoalResult, type GoalResultData, type GoalResultHandlers } from './goal-result'
import { GoalThinking } from './goal-thinking'
import { ProductSearchStatus } from './product-search-status'

interface CoreOverlayProps {
  open: boolean
  category: Category | null
  goal: string
  activating: boolean
  pulseKey: number
  result: GoalResultData | null
  resultHandlers: GoalResultHandlers
  productFeedback: ProductSearchFeedback | null
  onGoalChange: (value: string) => void
  onSubmit: () => void
  onPulse: () => void
  onRetryProductSearch: () => void
  onClose: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

export function CoreOverlay({
  open,
  category,
  goal,
  activating,
  pulseKey,
  result,
  resultHandlers,
  productFeedback,
  onGoalChange,
  onSubmit,
  onPulse,
  onRetryProductSearch,
  onClose,
}: CoreOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 450)
    return () => {
      document.body.style.overflow = previous
      clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (open && !result && !activating) inputRef.current?.focus({ preventScroll: true })
  }, [open, result, activating])

  const mode: CoreMode = activating ? 'activating' : result ? 'selected' : 'typing'
  const compact = Boolean(result)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="core-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="core-overlay-title"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <OrbitalField />

          <div className="relative flex justify-end p-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close AI Core"
              className="grid size-11 place-items-center rounded-full border border-white/15 bg-black/40 text-white/80 transition-colors hover:border-white/40 active:scale-95"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>

          <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-5 pb-16 text-center">
            <motion.div
              initial={{ scale: 0.35, y: 220, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.35, y: 220, opacity: 0 }}
              transition={{ duration: 0.7, ease }}
            >
              <motion.div animate={{ scale: compact ? 0.72 : 1 }} transition={{ duration: 0.6, ease }}>
                <AiCore
                  mode={mode}
                  energy={Math.min(goal.length / 80, 1)}
                  typingTick={goal.length}
                  pulseKey={pulseKey}
                  onActivate={onPulse}
                  particles
                  className="size-[min(72vw,300px)]"
                />
              </motion.div>
            </motion.div>

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
              ) : (
                <motion.div
                  key="ask"
                  className="flex w-full flex-col items-center gap-6"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, delay: 0.2, ease }}
                >
                  {category && (
                    <p className="-mb-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold-light">
                      {category.index} · {category.title}
                    </p>
                  )}
                  <h2 id="core-overlay-title" className="font-display text-[clamp(2rem,8vw,3.25rem)] leading-[1.05] tracking-tight text-balance">
                    <span className="block text-white">What do you want</span>
                    <span className="block text-gold-metal">
                      {category ? `to achieve ${category.phrase}?` : 'to achieve?'}
                    </span>
                  </h2>
                  <div className="relative w-full">
                    <span aria-hidden className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-gold/60" />
                    <GoalInput
                      id="core-goal-input"
                      inputRef={inputRef}
                      value={goal}
                      placeholder={category ? PLACEHOLDERS[category.id] : 'Describe your goal…'}
                      linkKey={category?.id ?? null}
                      busy={activating}
                      onChange={onGoalChange}
                      onSubmit={onSubmit}
                      onFocusChange={() => {}}
                    />
                  </div>
                  <div className="min-h-10">
                    {activating ? (
                      <GoalThinking />
                    ) : productFeedback ? (
                      <ProductSearchStatus message={productFeedback.message} onRetry={onRetryProductSearch} />
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function OrbitalField() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease }}
    >
      <div className="absolute left-1/2 top-[38%] size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(226,184,101,0.16),transparent_60%)]" />
      <svg viewBox="0 0 800 800" className="absolute left-1/2 top-[38%] size-[max(140vw,820px)] -translate-x-1/2 -translate-y-1/2">
        <ellipse cx="400" cy="400" rx="380" ry="120" fill="none" stroke="rgba(226,184,101,0.18)" strokeWidth="0.8" transform="rotate(-14 400 400)" />
        <ellipse cx="400" cy="400" rx="300" ry="200" fill="none" stroke="rgba(226,184,101,0.12)" strokeWidth="0.8" strokeDasharray="2 8" transform="rotate(20 400 400)" />
        <circle cx="400" cy="400" r="250" fill="none" stroke="rgba(246,221,161,0.07)" strokeWidth="0.6" />
      </svg>
    </motion.div>
  )
}
