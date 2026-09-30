'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import type { CapabilityId } from '@/lib/bofyt/capabilities'
import { AiCore } from './ai-core'
import { CategoryCarousel } from './category-carousel'
import { GoalInput } from './goal-input'

interface CapabilityDiscoveryProps {
  onSelectCapability: (id: CapabilityId) => void
  onSubmitGoal: (goal: string) => void
  canSkip?: boolean
  onSkip?: () => void
}

export function CapabilityDiscovery({ onSelectCapability, onSubmitGoal, canSkip = false, onSkip }: CapabilityDiscoveryProps) {
  const reduceMotion = useReducedMotion() === true
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [goal, setGoal] = useState('')
  const [selectedCapability, setSelectedCapability] = useState<CapabilityId | null>(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
    },
    [],
  )

  const leave = (action: () => void) => {
    if (leaving) return
    setLeaving(true)
    transitionTimer.current = setTimeout(action, reduceMotion ? 0 : 520)
  }

  const selectCapability = (id: CapabilityId) => {
    if (leaving) return
    setSelectedCapability(id)
    leave(() => onSelectCapability(id))
  }

  const submitGoal = () => {
    const trimmed = goal.trim()
    if (!trimmed || leaving) {
      inputRef.current?.focus({ preventScroll: true })
      return
    }
    leave(() => onSubmitGoal(trimmed))
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capability-discovery-title"
      className="fixed inset-0 z-[90] isolate overflow-x-clip overflow-y-auto bg-void text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(226,184,101,0.15),transparent_34%),radial-gradient(ellipse_at_center,#090806_0%,#020201_72%)]" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgba(246,221,161,0.08),transparent)]" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[124rem] flex-col px-3 pb-6 pt-5 sm:px-5 lg:px-8 lg:pt-7">
        <header className="relative z-30 flex shrink-0 items-start justify-between gap-5">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold-light/75">Core awake · system revealed</p>
            <h1 id="capability-discovery-title" className="mt-2 max-w-3xl font-display text-[clamp(1.8rem,4vw,3.5rem)] leading-[0.98] tracking-tight text-balance">
              Choose how you want to begin.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
              Six capabilities. One Core. Start with a direction or tell BOFYT what you want to achieve.
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">GROW / REACH / BUILD</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/35">CORE / OPTIMIZE / AUTOMATE / DISCOVER</p>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col min-[960px]:min-h-[calc(100dvh-11rem)]">
          <motion.div
            className="pointer-events-none relative z-20 flex shrink-0 flex-col items-center gap-3 py-7 min-[960px]:absolute min-[960px]:inset-0 min-[960px]:justify-center min-[960px]:gap-4 min-[960px]:py-0"
            animate={leaving ? { scale: 1.12, opacity: 0 } : { scale: 1, opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none flex w-full flex-col items-center gap-3">
              <div className="pointer-events-auto flex flex-col items-center gap-2">
              <AiCore
                mode={goal.trim() ? 'typing' : 'idle'}
                energy={Math.min(goal.length / 80, 1)}
                typingTick={goal.length}
                pulseKey={selectedCapability ? 1 : 0}
                ariaLabel="BOFYT Core. Focus the direct goal path"
                onActivate={() => inputRef.current?.focus({ preventScroll: true })}
                particles
                className="size-[min(34vw,15rem)] sm:size-[min(28vw,17rem)] lg:size-[min(18vw,15rem)]"
              />
              <span className="text-[10px] uppercase tracking-[0.4em] text-gold-light/75">Core</span>
            </div>

            <div className="pointer-events-auto w-full max-w-xl">
              <GoalInput
                inputRef={inputRef}
                value={goal}
                placeholder="e.g. I want to grow my Instagram"
                busy={leaving}
                linkKey={selectedCapability}
                onChange={setGoal}
                onSubmit={submitGoal}
                onFocusChange={() => undefined}
                id="discovery-goal-input"
              />
            </div>
              <p className="text-center text-[10px] uppercase tracking-[0.24em] text-white/35">Or choose a capability around the Core</p>
            </div>
          </motion.div>

          <div className="relative min-h-0 flex-1 min-[960px]:h-[calc(100dvh-11rem)]">
            <CategoryCarousel
              layout="core"
              mode="discovery"
              showIntro={false}
              selected={selectedCapability}
              highlighted={[]}
              onSelect={selectCapability}
            />
          </div>
        </div>
      </div>

      {canSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={leaving}
          aria-label="Skip BOFYT capability discovery"
          className="fixed right-4 top-4 z-40 grid size-10 place-items-center rounded-full border border-white/15 bg-void/60 text-white/45 backdrop-blur transition-colors hover:border-gold/55 hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 disabled:pointer-events-none disabled:opacity-40 sm:right-7 sm:top-7"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </motion.div>
  )
}
