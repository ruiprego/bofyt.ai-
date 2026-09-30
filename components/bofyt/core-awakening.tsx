'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { AiCore } from './ai-core'

type AwakeningPhase = 'ready' | 'leaving'

interface CoreAwakeningProps {
  onContinue: () => void
}

export function CoreAwakening({ onContinue }: CoreAwakeningProps) {
  const reduceMotion = useReducedMotion() === true
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [phase, setPhase] = useState<AwakeningPhase>('ready')
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current)
    },
    [],
  )

  const continueToDiscovery = () => {
    if (phase !== 'ready') return

    setPulseKey((key) => key + 1)
    setPhase('leaving')
    transitionTimer.current = setTimeout(onContinue, reduceMotion ? 0 : 520)
  }

  const leaving = phase === 'leaving'
  const motionDuration = reduceMotion ? 0.12 : 1.2

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="BOFYT Core opening"
      className="fixed inset-0 z-[100] isolate overflow-hidden bg-void text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,184,101,0.2),transparent_38%),radial-gradient(ellipse_at_center,#090806_0%,#020201_72%)]"
        animate={{ opacity: leaving ? 0 : 1 }}
      />

      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[min(76vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/35 bg-[radial-gradient(circle,rgba(246,221,161,0.18),rgba(226,184,101,0.06)_34%,transparent_70%)] shadow-[0_0_90px_-18px_rgba(226,184,101,0.85)]"
        initial={{ scale: 0.7, opacity: 0.2 }}
        animate={leaving ? { scale: [1.2, 8, 28], opacity: [0.85, 0.55, 0] } : { scale: 1, opacity: 0.45 }}
        transition={{ duration: leaving ? motionDuration : 0.2, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[min(48vw,15rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-light/35"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={leaving ? { scale: [1, 14], opacity: [0.8, 0] } : { scale: 1, opacity: 0.18 }}
        transition={{ duration: leaving ? motionDuration : 0.2, ease: 'easeOut' }}
      />

      <motion.div
        className={cn('absolute inset-0 flex flex-col items-center justify-center gap-7 px-6', leaving && 'pointer-events-none')}
        animate={leaving ? { scale: [1, 1.08, 0.3], opacity: [1, 0.9, 0] } : { scale: 1, opacity: 1 }}
        transition={{ duration: leaving ? motionDuration : 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <AiCore
          mode={leaving ? 'activating' : 'idle'}
          energy={leaving ? 1 : 0.2}
          typingTick={0}
          pulseKey={pulseKey}
          particles
          ariaLabel={leaving ? 'Opening BOFYT experiences' : 'Continue to BOFYT experiences'}
          disabled={phase !== 'ready'}
          onActivate={continueToDiscovery}
          className="size-[min(58vw,19rem)] sm:size-[min(44vw,23rem)]"
        />

        <motion.p
          aria-live="polite"
          className="text-center text-[10px] uppercase tracking-[0.35em] text-gold-light/65"
          animate={{ opacity: leaving ? 0 : 1, y: leaving ? 8 : 0 }}
          transition={{ duration: 0.35 }}
        >
          {leaving ? 'Opening experiences' : 'Click the Core to continue'}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
