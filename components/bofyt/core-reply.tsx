'use client'

import { motion } from 'motion/react'
import type { Category } from '@/lib/bofyt/categories'
import type { Capability } from '@/lib/bofyt/capabilities'
import { SOCIAL_MODULE_ICONS } from './category-icons'
import { EyeMark } from './logo'

interface CoreReplyProps {
  category: Category
  capability?: Capability | null
  onPickPrompt: (prompt: string) => void
}

const CAPABILITY_PROMPTS: Record<Capability['id'], string> = {
  grow: 'What do you want to grow?',
  reach: 'Who do you want to reach?',
  build: 'What do you want to build?',
  optimize: 'What do you want to optimize?',
  automate: 'What do you want to automate?',
  discover: 'What do you want to discover?',
  career: 'What role are you looking for?',
}

const ease = [0.22, 1, 0.36, 1] as const

export function CoreReply({ category, capability, onPickPrompt }: CoreReplyProps) {
  const title = capability?.title ?? category.title
  const prompt = capability ? CAPABILITY_PROMPTS[capability.id] : category.response
  const modules = (capability?.modules ?? category.modules).slice(0, 3)

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
        {title}
      </p>
      <p className="text-pretty text-base leading-relaxed text-white md:text-lg">{prompt}</p>

      <ul aria-label={`${title} starting points`} className="mt-1 grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
        {modules.map((module, index) => {
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
                className="bofyt-glass-panel group flex h-full min-h-24 w-full items-start gap-2.5 rounded-xl p-3 text-left transition-[border-color,background-color] duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
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
    </motion.div>
  )
}
