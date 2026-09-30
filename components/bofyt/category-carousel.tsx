'use client'

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { motion } from 'motion/react'
import { categoryById } from '@/lib/bofyt/categories'
import { CAPABILITY_COLUMNS, type CapabilityId } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'
import { CategoryPanel } from './category-panel'

const PRODUCTION_ORDER: CapabilityId[] = ['grow', 'reach', 'build', 'optimize', 'automate', 'discover']
const FOCUS_EASE = [0.22, 1, 0.36, 1] as const
const SWIPE_DISTANCE = 48
const SWIPE_AXIS_THRESHOLD = 10

interface SwipeGesture {
  pointerId: number
  startX: number
  startY: number
  startIndex: number
  horizontal: boolean
}

interface CategoryCarouselProps {
  selected: CapabilityId | null
  highlighted: CapabilityId[]
  onSelect: (id: CapabilityId) => void
  layout?: 'flow' | 'core'
  mode?: 'normal' | 'discovery'
  showIntro?: boolean
  interactive?: boolean
}

export function CategoryCarousel({
  selected,
  highlighted,
  onSelect,
  layout = 'flow',
  mode = 'normal',
  showIntro = true,
  interactive = true,
}: CategoryCarouselProps) {
  const coreLayout = layout === 'core'
  const discoveryLayout = coreLayout && mode === 'discovery'
  const capabilities = coreLayout
    ? [...CAPABILITY_COLUMNS].sort((a, b) => PRODUCTION_ORDER.indexOf(a.id) - PRODUCTION_ORDER.indexOf(b.id))
    : CAPABILITY_COLUMNS
  const [focusedCapability, setFocusedCapability] = useState<CapabilityId | null>(null)
  const focusedIndex = focusedCapability ? capabilities.findIndex(({ id }) => id === focusedCapability) : -1
  const leftFocusActive = coreLayout && mode === 'normal' && focusedIndex >= 0 && focusedIndex < 3
  const carouselRef = useRef<HTMLUListElement>(null)
  const swipeRef = useRef<SwipeGesture | null>(null)
  const suppressClickRef = useRef(false)
  const [dragging, setDragging] = useState(false)

  const hasScrollableCards = () => {
    const carousel = carouselRef.current
    return Boolean(carousel && carousel.scrollWidth > carousel.clientWidth + 4)
  }

  const nearestCardIndex = () => {
    const carousel = carouselRef.current
    if (!carousel) return 0

    const viewport = carousel.getBoundingClientRect()
    const center = viewport.left + viewport.width / 2
    let nearest = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    Array.from(carousel.children).forEach((child, index) => {
      const card = child.getBoundingClientRect()
      const distance = Math.abs(card.left + card.width / 2 - center)
      if (distance < nearestDistance) {
        nearest = index
        nearestDistance = distance
      }
    })

    return nearest
  }

  const centerCard = (index: number) => {
    const card = carouselRef.current?.children.item(index)
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLUListElement>) => {
    suppressClickRef.current = false

    if (!interactive || !event.isPrimary || event.pointerType === 'mouse' || !hasScrollableCards()) {
      swipeRef.current = null
      return
    }

    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startIndex: nearestCardIndex(),
      horizontal: false,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLUListElement>) => {
    const gesture = swipeRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY
    const movedX = Math.abs(deltaX)
    const movedY = Math.abs(deltaY)

    if (gesture.horizontal) return
    if (movedX < SWIPE_AXIS_THRESHOLD && movedY < SWIPE_AXIS_THRESHOLD) return
    if (movedY > movedX) {
      swipeRef.current = null
      return
    }

    gesture.horizontal = true
    suppressClickRef.current = true
    setDragging(true)
  }

  const finishPointerGesture = (event: ReactPointerEvent<HTMLUListElement>) => {
    const gesture = swipeRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const deltaX = event.clientX - gesture.startX
    if (gesture.horizontal) {
      suppressClickRef.current = true
      if (Math.abs(deltaX) >= SWIPE_DISTANCE) {
        const lastIndex = Math.max(0, (carouselRef.current?.children.length ?? 1) - 1)
        const direction = deltaX < 0 ? 1 : -1
        const targetIndex = Math.max(0, Math.min(lastIndex, gesture.startIndex + direction))
        centerCard(targetIndex)
      }
    }

    swipeRef.current = null
    setDragging(false)
  }

  const cancelPointerGesture = (event: ReactPointerEvent<HTMLUListElement>) => {
    const gesture = swipeRef.current
    if (gesture?.pointerId === event.pointerId && gesture.horizontal) suppressClickRef.current = true
    swipeRef.current = null
    setDragging(false)
  }

  const handleClickCapture = (event: ReactMouseEvent<HTMLUListElement>) => {
    if (!suppressClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    suppressClickRef.current = false
  }

  const handleKeyDownCapture = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Enter' || event.key === ' ') suppressClickRef.current = false
  }

  useEffect(() => {
    if (!coreLayout) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFocusedCapability(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [coreLayout])

  const toggleFocus = (id: CapabilityId, expandable: boolean) => {
    if (!expandable) {
      setFocusedCapability(null)
      onSelect(id)
      return
    }

    setFocusedCapability((current) => (current === id ? null : id))
  }

  return (
    <section
      id={showIntro ? 'explore' : undefined}
      aria-label={showIntro ? undefined : 'BOFYT capabilities'}
      aria-labelledby={showIntro ? 'explore-heading' : undefined}
      className={cn(
        'relative flex w-full scroll-mt-24 flex-col gap-4',
        coreLayout && 'min-[960px]:h-full min-[960px]:gap-0',
        discoveryLayout && 'min-[960px]:min-h-[min(78vh,48rem)]',
      )}
    >
      {showIntro && (
        <div className={cn('flex flex-col items-center gap-3', coreLayout && 'min-[960px]:hidden')}>
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-gold/50" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Explore any capability
        </h2>
          <p className="max-w-md text-xs leading-relaxed text-white/45">
            Six independent entry points. Start wherever the next useful move is.
          </p>
        </div>
      )}

      <ul
        ref={carouselRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerGesture}
        onPointerCancel={cancelPointerGesture}
        onClickCapture={handleClickCapture}
        onKeyDownCapture={handleKeyDownCapture}
        className={cn(
          '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth touch-auto px-4 pb-4 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden',
          !coreLayout && 'lg:-mx-8 lg:px-8',
          coreLayout &&
            'min-[960px]:absolute min-[960px]:left-1/2 min-[960px]:right-auto min-[960px]:top-1/2 min-[960px]:z-10 min-[960px]:mx-0 min-[960px]:grid min-[960px]:h-[min(68vh,42rem)] min-[960px]:w-[min(calc(100vw-2rem),112rem)] min-[960px]:-translate-x-1/2 min-[960px]:-translate-y-1/2 min-[960px]:grid-cols-[repeat(3,minmax(0,1fr))_minmax(clamp(20rem,calc(100vw_-_38rem),36rem),3.5fr)_repeat(3,minmax(0,1fr))] min-[960px]:gap-[clamp(0.5rem,0.65vw,0.75rem)] min-[960px]:overflow-visible min-[960px]:px-0 min-[960px]:pb-0',
          discoveryLayout &&
            'min-[960px]:!h-[min(78vh,48rem)] min-[960px]:!w-[min(calc(100vw-2rem),124rem)] min-[960px]:!grid-cols-[repeat(3,minmax(0,1fr))_minmax(clamp(10rem,16vw,20rem),1fr)_repeat(3,minmax(0,1fr))] min-[960px]:!gap-[clamp(0.35rem,0.5vw,0.65rem)]',
          dragging && 'cursor-grabbing select-none',
        )}
      >
        {capabilities.map((capability, index) => {
          const category = categoryById[capability.categoryId]
          const mapped = highlighted.includes(capability.id)
          const expandable = coreLayout && mode === 'normal' && index < 3
          const isFocused = focusedCapability === capability.id
          const shouldFade = leftFocusActive && !isFocused
          const baseGridColumn = index < 3 ? index + 1 : index + 2
          const slideDirection = index < focusedIndex ? -1 : 1

          return (
            <motion.li
              key={capability.id}
              layout={coreLayout}
              initial={discoveryLayout ? { opacity: 0, y: 28, scale: 0.94 } : false}
              animate={
                discoveryLayout
                  ? { opacity: 1, scale: 1, x: 0, y: 0 }
                  : shouldFade
                    ? { opacity: 0, scale: 0.84, x: slideDirection * 36 }
                    : { opacity: 1, scale: 1, x: 0 }
              }
              transition={{
                layout: { duration: 0.56, ease: FOCUS_EASE },
                opacity: { duration: discoveryLayout ? 0.5 : 0.34, ease: FOCUS_EASE, delay: discoveryLayout ? index * 0.12 : 0 },
                scale: { duration: discoveryLayout ? 0.6 : 0.48, ease: FOCUS_EASE, delay: discoveryLayout ? index * 0.12 : 0 },
                y: { duration: 0.6, ease: FOCUS_EASE, delay: discoveryLayout ? index * 0.12 : 0 },
                x: { duration: 0.48, ease: FOCUS_EASE },
              }}
              style={
                coreLayout
                  ? {
                      gridColumn: isFocused ? '1 / 4' : String(baseGridColumn),
                      gridRow: '1',
                    }
                  : undefined
              }
              className={cn(
                'h-[25rem] w-[min(76vw,18rem)] shrink-0 snap-center sm:h-[28rem] sm:w-52',
                discoveryLayout && 'max-[959px]:!w-[min(80vw,20rem)] sm:!w-60 md:!w-64',
                coreLayout ? 'min-[960px]:!h-full min-[960px]:!w-auto' : 'lg:h-[min(60vh,35rem)] lg:w-[clamp(10.5rem,14vw,14rem)]',
                isFocused && expandable && 'max-[959px]:w-[min(86vw,24rem)]',
                shouldFade && 'pointer-events-none',
                leftFocusActive && isFocused && 'z-30',
              )}
            >
              <CategoryPanel
                category={category}
                capability={capability}
                active={selected === capability.id || isFocused}
                mapped={mapped}
                dimmed={Boolean(selected) && selected !== capability.id && !isFocused}
                expanded={isFocused}
                disableHover={coreLayout}
                disabled={!interactive}
                onSelect={() => {
                  if (interactive) toggleFocus(capability.id, expandable)
                }}
              />
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}
