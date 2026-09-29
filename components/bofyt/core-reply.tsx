'use client'

import { motion } from 'motion/react'
import type { Category } from '@/lib/bofyt/categories'
import { cn } from '@/lib/utils'
import { SOCIAL_MODULE_ICONS } from './category-icons'
import { EyeMark } from './logo'

interface CoreReplyProps {
  category: Category
  onPickPrompt: (prompt: string) => void
}

const ease = [0.22, 1, 0.36, 1] as const

export function CoreReply({ category, onPickPrompt }: CoreReplyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.45, ease }}
      aria-live="polite"
      className="flex w-full max-w-2xl flex-col items-center gap-3 text-center"
    >
      <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-gold/90">
        <EyeMark className="h-2.5 w-4" />
        {category.title}
      </p>
      <p className="text-pretty text-base leading-relaxed text-white md:text-lg">{category.response}</p>

      {category.featured ? (
        <ul aria-label={`${category.title} tools`} className="mt-1 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
          {category.modules.map((module, index) => {
            const Icon = SOCIAL_MODULE_ICONS[module.name]
            return (
              <motion.li
                key={module.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.05, duration: 0.4, ease }}
              >
                <button
                  type="button"
                  onClick={() => onPickPrompt(module.prompt)}
                  className="group flex h-full w-full items-start gap-2.5 rounded-xl border border-gold/25 bg-black/40 p-3 text-left transition-[border-color,background-color] duration-300 hover:border-gold/70 hover:bg-gold/[0.07] active:scale-[0.98]"
                >
                  {Icon && <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-light" />}
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[13px] font-medium text-white">{module.name}</span>
                    <span className="text-xs leading-relaxed text-white/55">{module.description}</span>
                  </span>
                </button>
              </motion.li>
            )
          })}
        </ul>
      ) : (
        <ul aria-label={`${category.title} options`} className={cn('flex flex-wrap justify-center gap-2')}>
          {category.modules.map((module, index) => (
            <motion.li
              key={module.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.05, duration: 0.4, ease }}
            >
              <button
                type="button"
                title={module.description}
                onClick={() => onPickPrompt(module.prompt)}
                className="min-h-10 rounded-full border border-gold/40 bg-gold/[0.06] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white transition-[border-color,background-color,transform] duration-300 hover:border-gold hover:bg-gold/15 active:scale-95"
              >
                {module.name}
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
