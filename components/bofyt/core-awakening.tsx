'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiCore } from './ai-core'

const INTRO_STORAGE_KEY = 'bofyt_intro_completed'

type AwakeningPhase = 'checking' | 'ready' | 'activating' | 'expanding'

interface CoreAwakeningProps {
  onComplete: () => void
}

export function CoreAwakening({ onComplete }: CoreAwakeningProps) {
  const reduceMotion = useReducedMotion() === true
  const [phase, setPhase] = useState<AwakeningPhase>('checking')
  const [pulseKey, setPulseKey] = useState(0)
  const expansionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let completed = false
    try {
      completed = window.localStorage.getItem(INTRO_STORAGE_KEY) === '1'
    } catch {
      completed = false
    }

    if (completed) {
      onComplete()
      return
    }

    setPhase('ready')
  }, [onComplete])

  useEffect(
    () => () => {
      if (expansionTimer.current) clearTimeout(expansionTimer.current)
      if (completionTimer.current) clearTimeout(completionTimer.current)
    },
    [],
  )

  const complete = () => {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, '1')
    } catch {
      // The experience should still be usable if storage is unavailable.
    }
    onComplete()
  }

  const skip = () => {
    if (phase === 'checking') return
    complete()
  }

  const activate = () => {
    if (phase !== 'ready') return

    setPulseKey((key) => key + 1)
    setPhase('activating')
    expansionTimer.current = setTimeout(() => setPhase('expanding'), reduceMotion ? 20 : 560)
    completionTimer.current = setTimeout(complete, reduceMotion ? 180 : 1900)
  }

  const isActivating = phase === 'activating' || phase === 'expanding'
  const isExpanding = phase === 'expanding'
  const motionDuration = reduceMotion ? 0.12 : 1.2

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="BOFYT Core awakening"
      className="fixed inset-0 z-[100] isolate overflow-hidden text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,184,101,0.2),transparent_38%),radial-gradient(ellipse_at_center,#090806_0%,#020201_72%)]"
        animate={{ opacity: isExpanding ? 0 : 1 }}
        transition={{ duration: motionDuration, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[min(76vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/35 bg-[radial-gradient(circle,rgba(246,221,161,0.18),rgba(226,184,101,0.06)_34%,transparent_70%)] shadow-[0_0_90px_-18px_rgba(226,184,101,0.85)]"
        initial={{ scale: 0.7, opacity: 0.25 }}
        animate={
          isExpanding
            ? { scale: [1.2, 8, 28], opacity: [0.85, 0.55, 0] }
            : isActivating
              ? { scale: [1, 1.08, 1.2], opacity: [0.45, 0.9, 0.8] }
              : { scale: 1, opacity: 0.45 }
        }
        transition={{ duration: isExpanding ? motionDuration : isActivating ? 0.56 : 1.2, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 size-[min(48vw,15rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-light/35"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={
          isExpanding
            ? { scale: [1, 14], opacity: [0.8, 0] }
            : isActivating
              ? { scale: [1, 1.35], opacity: [0.65, 0] }
              : { scale: 1, opacity: 0.18 }
        }
        transition={{ duration: isExpanding ? motionDuration : isActivating ? 0.9 : 1.2, ease: 'easeOut' }}
      />

      <motion.div
        className={cn('absolute inset-0 flex flex-col items-center justify-center gap-7 px-6', isExpanding && 'pointer-events-none')}
        animate={isExpanding ? { scale: [1, 1.08, 0.3], opacity: [1, 0.9, 0] } : { scale: 1, opacity: 1 }}
        transition={{ duration: isExpanding ? motionDuration : 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <AiCore
          mode={isActivating ? 'activating' : 'idle'}
          energy={isActivating ? 1 : 0.2}
          typingTick={0}
          pulseKey={pulseKey}
          particles={phase !== 'checking'}
          onActivate={activate}
          className="size-[min(58vw,19rem)] sm:size-[min(44vw,23rem)]"
        />

        <motion.p
          aria-live="polite"
          className="text-center text-[10px] uppercase tracking-[0.35em] text-gold-light/65"
          animate={{ opacity: isExpanding ? 0 : phase === 'checking' ? 0 : 1, y: isActivating ? 8 : 0 }}
          transition={{ duration: 0.35 }}
        >
          {isActivating ? 'BOFYT Core activating' : 'Activate the Core to begin'}
        </motion.p>
      </motion.div>

      <button
        type="button"
        onClick={skip}
        disabled={phase === 'checking'}
        aria-label="Skip BOFYT Core awakening"
        className="absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full border border-white/15 text-white/45 transition-colors hover:border-gold/55 hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 disabled:pointer-events-none disabled:opacity-0 sm:right-7 sm:top-7"
      >
        <X aria-hidden className="size-4" />
      </button>
    </motion.div>
  )
}
