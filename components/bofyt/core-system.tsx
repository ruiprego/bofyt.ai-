'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { categories, type Category, type CategoryId } from '@/lib/bofyt/categories'
import { cn } from '@/lib/utils'
import { CATEGORY_ICONS } from './category-icons'

// Angles (deg, clockwise from 3 o'clock) place four nodes on each side of the core.
const ANGLES = [-52, -18, 18, 52, 232, 198, 162, 128]
const RADIUS_X = 38
const RADIUS_Y = 40
// Connections start at the edge of the core rather than its centre so they never cross the eye.
const LINE_START = 0.46

const NODES = categories.map((category, index) => {
  const radians = (ANGLES[index] * Math.PI) / 180
  const x = 50 + Math.cos(radians) * RADIUS_X
  const y = 50 + Math.sin(radians) * RADIUS_Y
  return {
    category,
    x,
    y,
    startX: 50 + (x - 50) * LINE_START,
    startY: 50 + (y - 50) * LINE_START,
    side: x > 50 ? ('right' as const) : ('left' as const),
    depth: 4 + (index % 4) * 2,
  }
})

interface CoreSystemProps {
  selected: CategoryId | null
  preview: CategoryId | null
  highlighted: CategoryId[]
  onSelect: (id: CategoryId) => void
  onPreview: (id: CategoryId | null) => void
}

export function CoreSystem({ selected, preview, highlighted, onSelect, onPreview }: CoreSystemProps) {
  const reduceMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 40, damping: 16 })
  const smoothY = useSpring(pointerY, { stiffness: 40, damping: 16 })
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (reduceMotion) return
    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1)
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMove)
  }, [pointerX, pointerY, reduceMotion])

  useEffect(() => () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }, [])

  const focusId = preview ?? selected

  const previewNode = (id: CategoryId | null) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    if (id) onPreview(id)
    else leaveTimer.current = setTimeout(() => onPreview(null), 120)
  }

  return (
    <nav aria-label="BOFYT capabilities" className="pointer-events-none absolute inset-0 hidden lg:block xl:hidden">
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <ellipse
          cx="50"
          cy="50"
          rx={RADIUS_X}
          ry={RADIUS_Y}
          fill="none"
          stroke="rgba(226,184,101,0.1)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {NODES.map(({ category, x, y, startX, startY }) => {
          const active = focusId === category.id
          const mapped = highlighted.includes(category.id)
          return (
            <line
              key={category.id}
              x1={startX}
              y1={startY}
              x2={x}
              y2={y}
              stroke={active ? 'rgba(246,221,161,0.85)' : mapped ? 'rgba(226,184,101,0.5)' : 'rgba(226,184,101,0.16)'}
              strokeWidth={active ? 1.4 : 1}
              strokeDasharray={category.secondary && !active ? '3 5' : undefined}
              vectorEffect="non-scaling-stroke"
              className="transition-[stroke,stroke-width] duration-500"
            />
          )
        })}
      </svg>

      {!reduceMotion &&
        NODES.map((node) =>
          focusId === node.category.id ? (
            <motion.span
              key={`signal-${node.category.id}`}
              aria-hidden
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-light shadow-[0_0_10px_rgba(246,221,161,0.9)]"
              initial={{ left: `${node.x}%`, top: `${node.y}%`, opacity: 0 }}
              animate={{ left: [`${node.x}%`, `${node.startX}%`], top: [`${node.y}%`, `${node.startY}%`], opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : null,
        )}

      {NODES.map((node) => (
        <CoreNode
          key={node.category.id}
          category={node.category}
          x={node.x}
          y={node.y}
          side={node.side}
          depth={node.depth}
          pointerX={smoothX}
          pointerY={smoothY}
          active={focusId === node.category.id}
          selected={selected === node.category.id}
          mapped={highlighted.includes(node.category.id)}
          dimmed={Boolean(focusId) && focusId !== node.category.id}
          onSelect={() => onSelect(node.category.id)}
          onPreview={(on) => previewNode(on ? node.category.id : null)}
        />
      ))}
    </nav>
  )
}

interface CoreNodeProps {
  category: Category
  x: number
  y: number
  side: 'left' | 'right'
  depth: number
  pointerX: MotionValue<number>
  pointerY: MotionValue<number>
  active: boolean
  selected: boolean
  mapped: boolean
  dimmed: boolean
  onSelect: () => void
  onPreview: (on: boolean) => void
}

function CoreNode({
  category,
  x,
  y,
  side,
  depth,
  pointerX,
  pointerY,
  active,
  selected,
  mapped,
  dimmed,
  onSelect,
  onPreview,
}: CoreNodeProps) {
  const Icon = CATEGORY_ICONS[category.id]
  const offsetX = useTransform(pointerX, (v) => v * depth)
  const offsetY = useTransform(pointerY, (v) => v * depth * 0.6)
  const descriptionId = `node-${category.id}-description`

  return (
    <motion.div
      className={cn('absolute', active ? 'z-20' : 'z-10')}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        x: offsetX,
        y: offsetY,
      }}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-describedby={descriptionId}
        onClick={onSelect}
        onPointerEnter={(event) => event.pointerType === 'mouse' && onPreview(true)}
        onPointerLeave={(event) => event.pointerType === 'mouse' && onPreview(false)}
        onFocus={() => onPreview(true)}
        onBlur={() => onPreview(false)}
        className={cn(
          'group pointer-events-auto absolute top-0 flex w-44 -translate-y-5 items-start gap-3 rounded-2xl outline-none transition-opacity duration-500 xl:w-52',
          side === 'right' ? 'left-0 -translate-x-5 flex-row text-left' : 'right-0 translate-x-5 flex-row-reverse text-right',
          dimmed ? 'opacity-40' : 'opacity-100',
          'focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-void',
        )}
      >
        <span
          className={cn(
            'relative grid size-10 shrink-0 place-items-center rounded-full border bg-void/80 transition-[transform,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            active
              ? 'scale-110 border-gold-light bg-gold/15 text-gold-light shadow-[0_0_28px_-4px_rgba(226,184,101,0.8)]'
              : mapped
                ? 'border-gold/70 text-gold-light'
                : 'border-gold/30 text-white/80 group-hover:border-gold/60',
            category.featured && !active && 'border-gold/55',
          )}
        >
          <Icon aria-hidden className="size-4" />
          {category.featured && (
            <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-gold shadow-[0_0_8px_rgba(226,184,101,0.9)]" />
          )}
        </span>
        <span className="flex min-w-0 flex-col pt-1">
          <span
            className={cn(
              'text-[11px] font-medium uppercase leading-snug tracking-[0.22em] transition-colors duration-500',
              active ? 'text-gold-light' : 'text-white/85',
            )}
          >
            {category.title}
          </span>
          <span
            id={descriptionId}
            className={cn(
              '-mx-2.5 mt-1.5 rounded-lg border border-gold/20 bg-void px-2.5 py-2 text-xs leading-relaxed text-white/70 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              active ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0',
            )}
          >
            {category.description}
          </span>
        </span>
      </button>
    </motion.div>
  )
}
