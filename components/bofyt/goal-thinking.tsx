'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const STEPS = ['Understanding your goal…', 'Mapping your focus areas…', 'Structuring your path…']

export function GoalThinking() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), 700)
    return () => clearInterval(timer)
  }, [])

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
            className="text-[11px] uppercase tracking-[0.4em] text-gold/90"
          >
            {STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div aria-hidden className="flex gap-1.5">
        {STEPS.map((label, index) => (
          <span
            key={label}
            className={`h-px w-8 transition-colors duration-500 ${index <= step ? 'bg-gold' : 'bg-white/15'}`}
          />
        ))}
      </div>
    </motion.div>
  )
}
