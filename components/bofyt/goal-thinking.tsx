'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const GOAL_STEPS = ['Understanding your goal…', 'Mapping your focus areas…', 'Structuring your path…']
const SEARCH_STEPS = ['Reading your search…', 'Finding live products…', 'Preparing your options…']

export function GoalThinking({ mode = 'goal' }: { mode?: 'goal' | 'search' }) {
  const steps = mode === 'search' ? SEARCH_STEPS : GOAL_STEPS
  const [step, setStep] = useState(0)
  useEffect(() => {
    setStep(0)
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, steps.length - 1)), 700)
    return () => clearInterval(timer)
  }, [steps])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-3"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-5 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] uppercase tracking-[0.4em] text-tech-cyan/90"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div aria-hidden className="flex gap-1.5">
        {steps.map((label, index) => (
          <span
            key={label}
            className={`h-px w-8 transition-colors duration-500 ${index <= step ? 'bg-tech-cyan' : 'bg-white/15'}`}
          />
        ))}
      </div>
    </motion.div>
  )
}
