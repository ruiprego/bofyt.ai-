'use client'

import { Compass, House, LineChart, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Category } from '@/lib/bofyt/categories'
import { cn } from '@/lib/utils'
import { EyeMark } from './logo'

export type NavTarget = 'home' | 'explore' | 'core' | 'progress' | 'profile'

interface BottomNavProps {
  active: NavTarget
  progressCount: number
  category: Category | null
  capability: Capability | null
  hasGoal: boolean
  onNavigate: (target: NavTarget) => void
}

const ITEMS = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'core', label: 'AI Core', icon: null },
  { id: 'progress', label: 'Progress', icon: LineChart },
  { id: 'profile', label: 'Profile', icon: UserRound },
] as const

export function BottomNav({ active, progressCount, category, capability, hasGoal, onNavigate }: BottomNavProps) {
  const engaged = Boolean(category) || hasGoal
  const contextLabel = capability?.shortTitle ?? category?.shortTitle
  const contextIndex = capability?.index ?? category?.index
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
        {ITEMS.map((item) => {
          const isActive = active === item.id
          if (item.id === 'core') {
            return (
              <li key={item.id} className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate('core')}
                  aria-label={contextLabel ? `AI Core, plan your ${contextLabel} goal` : 'AI Core, describe a goal'}
                  className="-mt-6 mb-1.5 flex flex-col items-center gap-1"
                >
                  <span className="relative grid size-14 place-items-center">
                    {engaged && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full border border-gold/70"
                        animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                        transition={{ duration: hasGoal ? 1.4 : 2.4, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                    <span
                      className={cn(
                        'grid size-14 place-items-center rounded-full border bg-black transition-[border-color,box-shadow,transform] duration-500 active:scale-95',
                        engaged
                          ? 'border-gold shadow-[0_0_38px_-4px_rgba(226,184,101,1)]'
                          : 'border-gold/60 shadow-[0_0_30px_-6px_rgba(226,184,101,0.9)]',
                      )}
                    >
                      <EyeMark className="h-5 w-8" />
                    </span>
                    <AnimatePresence>
                      {contextIndex && (
                        <motion.span
                          key={contextIndex}
                          aria-hidden
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold font-display text-[9px] font-semibold text-black"
                        >
                          {contextIndex}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="max-w-20 truncate text-[11px] tracking-wide text-gold-light">
                    {contextLabel ?? item.label}
                  </span>
                </button>
              </li>
            )
          }
          const Icon = item.icon
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex w-full flex-col items-center gap-1 py-3 text-[11px] tracking-wide transition-colors',
                  isActive ? 'text-white' : 'text-white/45',
                )}
              >
                <Icon aria-hidden className={cn('size-5', isActive && 'text-gold')} />
                {item.label}
                {item.id === 'progress' && progressCount > 0 && (
                  <span className="absolute right-[22%] top-2 grid size-4 place-items-center rounded-full bg-gold text-[10px] font-semibold text-black">
                    {progressCount}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
