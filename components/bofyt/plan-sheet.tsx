'use client'

import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, X } from 'lucide-react'
import type { CategoryId } from '@/lib/bofyt/categories'
import { buildPlan } from '@/lib/bofyt/plan'
import { EyeMark } from './logo'

interface PlanSheetProps {
  source: { goal: string; areas: CategoryId[] } | null
  onClose: () => void
  onStart: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

export function PlanSheet({ source, onClose, onStart }: PlanSheetProps) {
  const plan = source ? buildPlan(source.goal, source.areas) : null

  return (
    <AnimatePresence>
      {plan && (
        <>
          <motion.div
            key="plan-backdrop"
            aria-hidden
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="plan-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-title"
            className="fixed inset-x-0 bottom-0 z-[61] max-h-[88dvh] overflow-y-auto rounded-t-3xl border border-gold/25 bg-[#0b0a08] px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6 md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(92vw,560px)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:pb-6"
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-gold/90">
                <EyeMark className="h-2.5 w-4" />
                Your personalized plan
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close plan"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/40"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>

            <h2 id="plan-title" className="mt-3 text-balance font-display text-3xl leading-tight text-white">
              {plan.title}
            </h2>
            <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/50">
              12 weeks · {plan.focus.map((item) => item.label).join(' · ')}
            </p>

            <ol className="relative mt-7 flex flex-col gap-6 border-l border-gold/25 pl-6">
              {plan.phases.map((phase, index) => (
                <motion.li
                  key={phase.stage}
                  className="relative"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.12, duration: 0.5, ease }}
                >
                  <span
                    aria-hidden
                    className="absolute -left-[29px] top-1 size-2.5 rounded-full bg-gold shadow-[0_0_12px_rgba(226,184,101,0.9)]"
                  />
                  <p className="text-[11px] uppercase tracking-[0.25em] text-gold/80">
                    {phase.window} · {phase.stage}
                  </p>
                  <h3 className="mt-1.5 text-lg text-white">{phase.title}</h3>
                  <p className="text-sm text-white/55">{phase.description}</p>
                  <ul className="mt-2.5 flex flex-col gap-1.5">
                    {phase.actions.map((action) => (
                      <li key={action} className="flex gap-2.5 text-sm leading-relaxed text-white/75">
                        <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-white/40" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </motion.li>
              ))}
            </ol>

            <motion.button
              type="button"
              onClick={onStart}
              whileTap={{ scale: 0.97 }}
              className="group mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold text-sm font-medium uppercase tracking-[0.18em] text-black shadow-[0_0_30px_-8px_rgba(226,184,101,0.9)]"
            >
              Start this plan
              <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
