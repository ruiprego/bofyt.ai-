'use client'

import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { categories, categoryById, type CategoryId } from '@/lib/bofyt/categories'
import { progressOf, type GoalEntry } from '@/lib/bofyt/goals'

export type SheetKind = 'progress' | 'profile'

interface InfoSheetProps {
  kind: SheetKind | null
  goals: GoalEntry[]
  onClose: () => void
  onOpenGoal: (entry: GoalEntry) => void
  onAdvance: (id: string) => void
}

export function InfoSheet({ kind, goals, onClose, onOpenGoal, onAdvance }: InfoSheetProps) {
  return (
    <AnimatePresence>
      {kind && (
        <>
          <motion.div
            key="backdrop"
            aria-hidden
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl border-t border-gold/30 bg-[#0b0a08] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-[420px] lg:rounded-3xl lg:border"
          >
            <div className="flex items-center justify-between">
              <h2 id="sheet-title" className="font-display text-2xl text-white">
                {kind === 'progress' ? 'Progress' : 'Profile'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-10 place-items-center rounded-full border border-white/15 text-white/80 hover:border-gold hover:text-gold"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>
            {kind === 'progress' ? <ProgressView goals={goals} onOpenGoal={onOpenGoal} onAdvance={onAdvance} /> : <ProfileView goals={goals} />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ProgressView({
  goals,
  onOpenGoal,
  onAdvance,
}: {
  goals: GoalEntry[]
  onOpenGoal: (entry: GoalEntry) => void
  onAdvance: (id: string) => void
}) {
  if (goals.length === 0) {
    return (
      <p className="mt-6 text-pretty text-base leading-relaxed text-white/60">
        No goals yet. Tell BOFYT what you want to achieve and your goals will appear here.
      </p>
    )
  }
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {goals.map((entry) => {
        const progress = progressOf(entry)
        return (
          <li key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <button type="button" onClick={() => onOpenGoal(entry)} className="w-full text-left">
              <div className="flex items-start justify-between gap-3">
                <p className="text-pretty text-base text-white">{entry.goal}</p>
                <span className="shrink-0 font-mono text-xs text-gold-light">{progress.percent}%</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gold/80">
                {entry.areas.map((id) => categoryById[id].shortTitle).join(' + ')}
              </p>
              <span className="mt-3 block h-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-light" style={{ width: `${progress.percent}%` }} />
              </span>
            </button>
            {progress.next ? (
              <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
                <p className="min-w-0 flex-1 truncate text-sm text-white/60">
                  <span className="text-white/35">Next: </span>
                  {progress.next}
                </p>
                <button
                  type="button"
                  onClick={() => onAdvance(entry.id)}
                  className="min-h-11 shrink-0 rounded-full border border-gold/45 px-3 text-[10px] uppercase tracking-[0.12em] text-gold-light hover:bg-gold/10"
                >
                  Complete
                </button>
              </div>
            ) : (
              <p className="mt-3 border-t border-white/10 pt-3 text-xs uppercase tracking-[0.18em] text-gold-light">Complete</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function ProfileView({ goals }: { goals: GoalEntry[] }) {
  const counts = categories.map((category) => ({
    category,
    count: goals.filter((goal) => goal.areas.includes(category.id)).length,
  }))
  const max = Math.max(1, ...counts.map((c) => c.count))

  return (
    <div className="mt-6">
      <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">Focus areas</p>
      <ul className="mt-4 flex flex-col gap-3">
        {counts.map(({ category, count }) => (
          <li key={category.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-sm text-white/80">{category.shortTitle}</span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-light transition-[width] duration-700"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </span>
            <span className="w-4 text-right font-mono text-xs text-white/50">{count}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-pretty text-sm leading-relaxed text-white/50">
        Your focus profile adapts as you set goals across areas.
      </p>
    </div>
  )
}
