'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { CapabilityId } from '@/lib/bofyt/capabilities'
import { CategoryCarousel } from './category-carousel'

type DiscoveryPhase = 'revealing' | 'ready' | 'leaving'

interface CapabilityDiscoveryProps {
  onSelectCapability: (id: CapabilityId) => void
}

export function CapabilityDiscovery({ onSelectCapability }: CapabilityDiscoveryProps) {
  const reduceMotion = useReducedMotion() === true
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [phase, setPhase] = useState<DiscoveryPhase>('revealing')
  const [selectedCapability, setSelectedCapability] = useState<CapabilityId | null>(null)

  useEffect(() => {
    const revealTimer = window.setTimeout(() => setPhase('ready'), reduceMotion ? 0 : 1700)
    return () => window.clearTimeout(revealTimer)
  }, [reduceMotion])

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
      className="fixed inset-0 z-[90] isolate overflow-hidden bg-void text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(226,184,101,0.15),transparent_34%),radial-gradient(ellipse_at_center,#090806_0%,#020201_72%)]" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,rgba(246,221,161,0.08),transparent)]" />

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
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col justify-center pt-5 min-[960px]:pt-3">
          <motion.p
            aria-live="polite"
            className="relative z-20 mb-4 text-center text-[10px] uppercase tracking-[0.24em] text-white/35"
            animate={{ opacity: leaving ? 0 : 1 }}
          >
            {ready ? 'Cards revealed · select one to continue' : 'Mapping available experiences'}
          </motion.p>

          <div className="relative min-h-0 flex-1 min-[960px]:h-[calc(100dvh-12rem)]">
            <CategoryCarousel
              layout="core"
              mode="discovery"
              showIntro={false}
              selected={selectedCapability}
              highlighted={[]}
              interactive={ready}
              onSelect={selectCapability}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
