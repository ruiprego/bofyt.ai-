'use client'

import { AlertCircle, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'

interface ProductSearchStatusProps {
  message: string
  onRetry: () => void
}

export function ProductSearchStatus({ message, onRetry }: ProductSearchStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-center"
      role="alert"
      aria-live="assertive"
    >
      <p className="flex items-start gap-2 text-sm leading-relaxed text-white/75">
        <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-light" />
        <span>{message}</span>
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 px-4 text-[11px] uppercase tracking-[0.16em] text-gold-light transition-colors hover:bg-gold/10 active:scale-95"
      >
        <RotateCcw aria-hidden className="size-3.5" />
        Retry search
      </button>
    </motion.div>
  )
}
