'use client'

import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { progressOf, type GoalEntry } from '@/lib/bofyt/goals'
import { toGoalTitle } from '@/lib/bofyt/plan'

interface ContinueGoalProps {
  entry: GoalEntry
  onContinue: () => void
}

export function ContinueGoal({ entry, onContinue }: ContinueGoalProps) {
  const { percent, next } = progressOf(entry)

  return (
    <motion.button
      type="button"
      onClick={onContinue}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex w-full max-w-xl items-center gap-4 rounded-2xl border border-gold/25 bg-black/50 p-4 text-left backdrop-blur-md transition-colors hover:border-gold/60 focus-visible:border-gold focus-visible:outline-none"
    >
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-full font-mono text-xs text-gold-light"
        style={{ background: `conic-gradient(var(--color-gold) ${percent * 3.6}deg, rgba(255,255,255,0.1) 0deg)` }}
      >
        <span className="grid size-10 place-items-center rounded-full bg-void">{percent}%</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold/80">Continue your goal</span>
        <span className="truncate text-base text-white">{toGoalTitle(entry.goal)}</span>
        {next && (
          <span className="truncate text-sm text-white/60">
            <span className="text-white/40">Next: </span>
            {next}
          </span>
        )}
      </span>
      <ArrowRight aria-hidden className="size-5 shrink-0 text-gold transition-transform group-hover:translate-x-1" />
      <span className="sr-only">{`${percent}% complete`}</span>
    </motion.button>
  )
}
