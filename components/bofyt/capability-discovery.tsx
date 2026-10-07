'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { BriefcaseBusiness } from 'lucide-react'
import type { CapabilityId } from '@/lib/bofyt/capabilities'
import { CategoryCarousel } from './category-carousel'

type DiscoveryPhase = 'ready' | 'leaving'

interface CapabilityDiscoveryProps {
  onSelectCapability: (id: CapabilityId) => void
  onActivateCore?: () => void
  onOpenCareer?: () => void
}

export function CapabilityDiscovery({ onSelectCapability, onActivateCore, onOpenCareer }: CapabilityDiscoveryProps) {
  const reduceMotion = useReducedMotion() === true
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [phase, setPhase] = useState<DiscoveryPhase>('ready')
  const [selectedCapability, setSelectedCapability] = useState<CapabilityId | null>(null)

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
    },
    [],
  )

  const selectCapability = (id: CapabilityId) => {
    if (phase !== 'ready' || transitionTimer.current) return

    setSelectedCapability(id)
    setPhase('leaving')
    transitionTimer.current = setTimeout(() => onSelectCapability(id), reduceMotion ? 0 : 520)
  }

  const leaving = phase === 'leaving'
  const ready = phase === 'ready'

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capability-discovery-title"
      className="bofyt-app-shell fixed inset-0 z-[90] isolate overflow-hidden text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div aria-hidden className="bofyt-discovery-field pointer-events-none fixed inset-0" />
      <div aria-hidden className="bofyt-discovery-edge pointer-events-none fixed inset-x-0 top-0 h-40" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[124rem] flex-col px-3 pb-6 pt-5 sm:px-5 lg:px-8 lg:pt-7">
        <header className="relative z-30 shrink-0 text-center">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold-light/75">
            {ready ? 'Choose an experience' : 'Experiences initializing'}
          </p>
          <h1 id="capability-discovery-title" className="mt-2 font-display text-[clamp(1.8rem,4vw,3.5rem)] leading-[0.98] tracking-tight text-balance">
            Where do you want to begin?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/55">
            {ready ? 'Choose one path. BOFYT opens that experience next.' : 'The Core is revealing the paths around it.'}
          </p>
          {onOpenCareer && (
            <button
              type="button"
              onClick={() => ready && onOpenCareer()}
              disabled={!ready}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-tech-cyan/25 bg-tech-navy/60 px-5 text-[11px] font-medium uppercase tracking-[0.3em] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition-colors hover:border-tech-cyan/50 hover:text-white active:border-tech-cyan/60 active:text-white disabled:opacity-50"
            >
              <BriefcaseBusiness aria-hidden className="size-4 text-tech-cyan" />
              Career
            </button>
          )}
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col justify-center pt-5 min-[960px]:pt-3">
          <motion.p
            aria-live="polite"
            className="relative z-20 mb-4 text-center text-[10px] uppercase tracking-[0.24em] text-white/35"
            animate={{ opacity: leaving ? 0 : 1 }}
          >
            {ready ? 'Cards revealed · select one to continue' : 'Mapping available experiences'}
          </motion.p>

          <div className="relative min-h-0 flex-1 min-[960px]:h-[calc(100dvh-17rem)]">
            <CategoryCarousel
              layout="core"
              mode="discovery"
              showIntro={false}
              selected={selectedCapability}
              highlighted={[]}
              interactive={ready}
              onSelect={selectCapability}
              onActivateCore={onActivateCore}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
