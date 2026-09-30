'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { categories, type CategoryId } from '@/lib/bofyt/categories'
import { cn } from '@/lib/utils'
import { CategoryPanel } from './category-panel'

export type WallSide = 'left' | 'right'

export const LEFT_WALL = categories.slice(0, 4)
export const RIGHT_WALL = categories.slice(4)

export const wallSideOf = (id: CategoryId | null): WallSide | null =>
  id ? (LEFT_WALL.some((category) => category.id === id) ? 'left' : 'right') : null

// Panels nearest the core stand tallest; outer panels step back.
const HEIGHTS = ['h-full', 'h-[94%]', 'h-[88%]', 'h-[82%]']

interface CategoryWallProps {
  side: WallSide
  focusId: CategoryId | null
  highlighted: CategoryId[]
  receded: boolean
  onSelect: (id: CategoryId) => void
  onPreview: (id: CategoryId | null) => void
}

export function CategoryWall({ side, focusId, highlighted, receded, onSelect, onPreview }: CategoryWallProps) {
  const reduceMotion = useReducedMotion()
  const pointer = useMotionValue(0)
  const smooth = useSpring(pointer, { stiffness: 35, damping: 16 })
  const baseAngle = side === 'left' ? 22 : -22
  const rotateY = useTransform(smooth, (v) => baseAngle + v * 4)

  useEffect(() => {
    if (reduceMotion) return
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') pointer.set((event.clientX / window.innerWidth) * 2 - 1)
    }
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMove)
  }, [pointer, reduceMotion])

  const items = side === 'left' ? LEFT_WALL : RIGHT_WALL

  return (
    <nav
      aria-label={side === 'left' ? 'Capabilities 01 to 04' : 'Capabilities 05 to 08'}
      className="relative hidden h-[min(60vh,560px)] self-start [perspective:1300px] xl:block"
    >
      <motion.ul
        className={cn(
          'flex h-full items-center gap-2 [transform-style:preserve-3d] 2xl:gap-3',
          side === 'left' ? 'origin-right' : 'origin-left',
        )}
        style={{ rotateY }}
        animate={{
          opacity: receded ? 0.35 : 1,
          scale: receded ? 0.94 : 1,
          x: receded ? (side === 'left' ? -24 : 24) : 0,
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {items.map((category, index) => {
          const rank = side === 'left' ? items.length - 1 - index : index
          const active = focusId === category.id
          return (
            <motion.li
              key={category.id}
              className={cn('flex-1', HEIGHTS[rank])}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: active ? -10 : 0, z: active ? 40 : 0 }}
              transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.15 + rank * 0.08, ease: [0.22, 1, 0.36, 1] }}
              onPointerEnter={(event) => event.pointerType === 'mouse' && onPreview(category.id)}
              onPointerLeave={(event) => event.pointerType === 'mouse' && onPreview(null)}
            >
              <CategoryPanel
                category={category}
                shade={rank}
                active={active}
                mapped={highlighted.includes(category.id)}
                dimmed={Boolean(focusId) && !active}
                onSelect={() => onSelect(category.id)}
              />
            </motion.li>
          )
        })}
      </motion.ul>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 -bottom-3 h-6 rounded-[50%] bg-[radial-gradient(ellipse,rgba(226,184,101,0.35),transparent_70%)] blur-md"
      />
    </nav>
  )
}
