'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'

export interface ToastMessage {
  id: number
  text: string
}

export function Toast({ message }: { message: ToastMessage | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-[90] flex justify-center px-4 lg:bottom-8"
    >
      <AnimatePresence>
        {message && (
          <motion.p
            key={message.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="bofyt-glass-panel-gold inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm text-white"
          >
            <Check aria-hidden className="size-4 shrink-0 text-gold" />
            <span className="truncate">{message.text}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
