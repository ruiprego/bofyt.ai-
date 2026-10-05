'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { categoryById } from '@/lib/bofyt/categories'
import { CAPABILITY_COLUMNS, type Capability, type CapabilityId } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'
import { CategoryPanel } from './category-panel'
import { CoreCapabilityCard } from './core-capability-card'

const PRODUCTION_ORDER: CapabilityId[] = ['grow', 'reach', 'build', 'optimize', 'automate', 'discover']
const CORE_ITEM = { kind: 'core' } as const
const FOCUS_EASE = [0.22, 1, 0.36, 1] as const

type CarouselItem = { kind: 'capability'; capability: Capability } | typeof CORE_ITEM
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
  onActivateCore?: () => void
  layout?: 'flow' | 'core'
  mode?: 'normal' | 'discovery'
  showIntro?: boolean
  interactive?: boolean
}

export function CategoryCarousel({
  selected,
  highlighted,
  onSelect,
  onActivateCore,
  layout = 'flow',
  mode = 'normal',
  showIntro = true,
  interactive = true,
}: CategoryCarouselProps) {
  const coreLayout = layout === 'core'
  const discoveryLayout = coreLayout && mode === 'discovery'
  const supportCapabilities = [...CAPABILITY_COLUMNS]
    .filter((capability) => capability.id !== 'career')
    .sort((a, b) => PRODUCTION_ORDER.indexOf(a.id) - PRODUCTION_ORDER.indexOf(b.id))
  const items: CarouselItem[] = [
    ...supportCapabilities.slice(0, 3).map((capability) => ({ kind: 'capability' as const, capability })),
    CORE_ITEM,
    ...supportCapabilities.slice(3).map((capability) => ({ kind: 'capability' as const, capability })),
  ]
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

  if (discoveryLayout) {
    return (
      <FocusedCapabilityCarousel
        items={items}
        interactive={interactive}
        showIntro={showIntro}
        onSelect={onSelect}
        onActivateCore={onActivateCore}
      />
    )
  }

  return (
    <section
      id={showIntro ? 'explore' : undefined}
      aria-label={showIntro ? undefined : 'BOFYT capabilities'}
      aria-labelledby={showIntro ? 'explore-heading' : undefined}
      className={cn(
        'bofyt-capability-stage relative flex w-full scroll-mt-24 flex-col gap-4',
        coreLayout && 'min-[960px]:h-full min-[960px]:gap-0',
        discoveryLayout && 'min-[960px]:min-h-[min(78vh,48rem)]',
      )}
    >
      {showIntro && (
        <div className={cn('flex flex-col items-center gap-3', coreLayout && 'min-[960px]:hidden')}>
        <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-tech-cyan/40" />
        <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
          Explore any capability
        </h2>
          <p className="max-w-md text-xs leading-relaxed text-white/45">
            Six paths orbit the BOFYT Core. Start wherever the next useful move is.
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
        {items.map((item, index) => {
          const capability = item.kind === 'capability' ? item.capability : null
          const isCore = item.kind === 'core'
          const mapped = capability ? highlighted.includes(capability.id) : false

          return (
            <motion.li
              key={capability?.id ?? 'core'}
              layout={coreLayout}
              initial={discoveryLayout ? { opacity: 0, y: 28, scale: 0.94 } : false}
              animate={discoveryLayout ? { opacity: 1, scale: 1, x: 0, y: 0 } : { opacity: 1, scale: 1, x: 0 }}
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
                      gridColumn: String(index + 1),
                      gridRow: '1',
                    }
                  : undefined
              }
              className={cn(
                'h-[25rem] w-[calc(100vw-1.5rem)] min-w-0 shrink-0 snap-center sm:h-[28rem] sm:w-52',
                discoveryLayout && 'max-[959px]:!w-[min(80vw,20rem)] sm:w-60 md:w-64',
                coreLayout ? 'min-[960px]:!h-full min-[960px]:!w-full' : 'lg:h-[min(60vh,35rem)] lg:w-[clamp(10.5rem,14vw,14rem)]',
                isCore && 'min-[960px]:relative min-[960px]:z-20 min-[960px]:scale-[1.035]',
                !isCore && coreLayout && 'min-[960px]:opacity-90',
              )}
            >
              {capability ? (
                <CategoryPanel
                  category={categoryById[capability.categoryId]}
                  capability={capability}
                  active={selected === capability.id}
                  mapped={mapped}
                  dimmed={Boolean(selected) && selected !== capability.id}
                  displayIndex={formatCardPosition(items, index)}
                  expanded={false}
                  compact={coreLayout}
                  disableHover={coreLayout}
                  disabled={!interactive}
                  onSelect={() => {
                    if (interactive) onSelect(capability.id)
                  }}
                />
              ) : (
                <CoreCapabilityCard
                  interactive={interactive}
                  onActivateCore={onActivateCore}
                  positionLabel={formatCardPosition(items, index)}
                />
              )}
            </motion.li>
          )
        })}
      </ul>
    </section>
  )
}

interface FocusedCapabilityCarouselProps {
  items: CarouselItem[]
  interactive: boolean
  showIntro: boolean
  onSelect: (id: CapabilityId) => void
  onActivateCore?: () => void
}

interface FocusedPointerGesture {
  pointerId: number
  startX: number
  startY: number
  horizontal: boolean
}

function FocusedCapabilityCarousel({
  items,
  interactive,
  showIntro,
  onSelect,
  onActivateCore,
}: FocusedCapabilityCarouselProps) {
  const reduceMotion = useReducedMotion() === true
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [direction, setDirection] = useState(1)
  const gestureRef = useRef<FocusedPointerGesture | null>(null)
  const suppressClickRef = useRef(false)
  const suppressClickResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wheelDeltaRef = useRef(0)
  const wheelGestureHandledRef = useRef(false)
  const wheelResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeItem = items[activeIndex]

  const resetWheelGesture = () => {
    wheelDeltaRef.current = 0
    wheelGestureHandledRef.current = false
  }

  const scheduleWheelReset = () => {
    if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current)
    wheelResetTimerRef.current = setTimeout(() => {
      resetWheelGesture()
      wheelResetTimerRef.current = null
    }, 180)
  }

  useEffect(
    () => () => {
      if (suppressClickResetRef.current) clearTimeout(suppressClickResetRef.current)
      if (wheelResetTimerRef.current) clearTimeout(wheelResetTimerRef.current)
    },
    [],
  )

  if (!activeItem) return null

  const positionLabel = formatCardPosition(items, activeIndex)

  const move = (step: number) => {
    if (!interactive || items.length < 2) return

    setDirection(step > 0 ? 1 : -1)
    setActiveIndex((current) => Math.max(0, Math.min(items.length - 1, current + step)))
    setDragX(0)
  }

  const resetSuppressedClickSoon = () => {
    if (suppressClickResetRef.current) clearTimeout(suppressClickResetRef.current)
    suppressClickResetRef.current = setTimeout(() => {
      suppressClickRef.current = false
      suppressClickResetRef.current = null
    }, 0)
  }

  const releasePointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    suppressClickRef.current = false
    if (suppressClickResetRef.current) {
      clearTimeout(suppressClickResetRef.current)
      suppressClickResetRef.current = null
    }
    resetWheelGesture()

    if (
      !interactive ||
      !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      items.length < 2
    ) {
      gestureRef.current = null
      return
    }

    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      horizontal: false,
    }

  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY
    const movedX = Math.abs(deltaX)
    const movedY = Math.abs(deltaY)

    if (!gesture.horizontal && movedX < SWIPE_AXIS_THRESHOLD && movedY < SWIPE_AXIS_THRESHOLD) return

    if (!gesture.horizontal && movedY > movedX) {
      releasePointer(event)
      gestureRef.current = null
      setDragging(false)
      setDragX(0)
      return
    }

    const startedHorizontal = !gesture.horizontal
    gesture.horizontal = true
    if (startedHorizontal && !event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    event.preventDefault()
    setDragging(true)
    setDragX(Math.max(-220, Math.min(220, deltaX * 0.88)))
  }

  const finishPointerGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const deltaX = event.clientX - gesture.startX
    if (gesture.horizontal) {
      suppressClickRef.current = true
      resetSuppressedClickSoon()
      if (Math.abs(deltaX) >= SWIPE_DISTANCE) {
        move(deltaX < 0 ? 1 : -1)
      } else {
        setDragX(0)
      }
    }

    gestureRef.current = null
    setDragging(false)
    releasePointer(event)
  }

  const cancelPointerGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (gesture?.pointerId === event.pointerId && gesture.horizontal) {
      suppressClickRef.current = true
      resetSuppressedClickSoon()
    }
    gestureRef.current = null
    setDragging(false)
    setDragX(0)
    releasePointer(event)
  }

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    suppressClickRef.current = false
    if (suppressClickResetRef.current) {
      clearTimeout(suppressClickResetRef.current)
      suppressClickResetRef.current = null
    }
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    }
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const scaleX = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerWidth : 1
    const scaleY = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
    const deltaX = event.deltaX * scaleX
    const deltaY = event.deltaY * scaleY
    const movedX = Math.abs(deltaX)
    const movedY = Math.abs(deltaY)

    if (!interactive || movedX < 2 || movedY > movedX * 2) {
      if (movedY > movedX) resetWheelGesture()
      return
    }

    event.preventDefault()
    scheduleWheelReset()
    if (wheelGestureHandledRef.current) return

    wheelDeltaRef.current += deltaX
    if (Math.abs(wheelDeltaRef.current) < 36) return

    wheelGestureHandledRef.current = true
    const step = wheelDeltaRef.current > 0 ? 1 : -1
    wheelDeltaRef.current = 0
    move(step)
  }

  return (
    <section
      id={showIntro ? 'explore' : undefined}
      aria-label={showIntro ? undefined : 'BOFYT capabilities'}
      aria-labelledby={showIntro ? 'explore-heading' : undefined}
      className="bofyt-capability-stage relative flex min-h-[min(68vh,42rem)] w-full flex-1 lg:min-h-0 scroll-mt-24 flex-col gap-3 pb-4" 
    >
      {showIntro && (
        <div className="flex flex-col items-center gap-3">
          <span aria-hidden className="h-8 w-px bg-gradient-to-b from-transparent to-tech-cyan/40" />
          <h2 id="explore-heading" className="text-[11px] uppercase tracking-[0.35em] text-white/70">
            Explore any capability
          </h2>
          <p className="max-w-md text-xs leading-relaxed text-white/45">
            Six paths orbit the BOFYT Core. Start wherever the next useful move is.
          </p>
        </div>
      )}

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="BOFYT capability deck"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerGesture}
        onPointerCancel={cancelPointerGesture}
        onClickCapture={handleClickCapture}
        onWheel={handleWheel}
        className={cn(
          'relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-hidden px-1 py-2 outline-none sm:px-4',
          dragging && 'cursor-grabbing select-none',
        )}
        style={{ touchAction: 'pan-y' }}
      >
        <p className="relative z-10 text-center text-[10px] uppercase tracking-[0.24em] text-white/35">
          {interactive ? 'Swipe horizontally · tap to enter' : 'Opening your experience'}
        </p>

        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <motion.div
            aria-hidden
            animate={{ x: dragX * 0.55 }}
            transition={{ duration: dragging || reduceMotion ? 0 : 0.6, ease: FOCUS_EASE }}
            className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)] lg:[mask-image:linear-gradient(90deg,transparent,black_16%,black_84%,transparent)]"
          >
            {items.map((item, index) => {
              const offset = index - activeIndex
              const distance = Math.abs(offset)
              if (distance === 0 || distance > 2) return null
              const key = item.kind === 'core' ? 'core' : item.capability.id

              return (
                <div
                  key={key}
                  inert
                  className={cn('absolute inset-0 flex items-center justify-center', distance === 2 && 'max-lg:hidden')}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      x: `${offset * (distance === 1 ? 86 : 82)}%`,
                      scale: distance === 1 ? 0.84 : 0.72,
                      opacity: distance === 1 ? 0.42 : 0.16,
                      filter: distance === 1 ? 'blur(1.5px) saturate(0.7)' : 'blur(4px) saturate(0.5)',
                    }}
                    transition={{ duration: reduceMotion ? 0 : 0.6, ease: FOCUS_EASE }}
                    className={CARD_SLOT}
                  >
                    {item.kind === 'core' ? (
                      <CoreCapabilityCard interactive={false} positionLabel={formatCardPosition(items, index)} />
                    ) : (
                      <CategoryPanel
                        category={categoryById[item.capability.categoryId]}
                        capability={item.capability}
                        displayIndex={formatCardPosition(items, index)}
                        active={false}
                        mapped={false}
                        dimmed={false}
                        expanded={false}
                        disableHover
                        disabled
                        onSelect={() => {}}
                      />
                    )}
                  </motion.div>
                </div>
              )
            })}
          </motion.div>

          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={activeItem.kind === 'core' ? 'core' : activeItem.capability.id}
              initial={{ opacity: 0, x: direction * 72, scale: 0.965, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: dragX, scale: dragging ? 0.985 : 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: direction * -72, scale: 0.965, filter: 'blur(6px)' }}
              transition={{
                duration: dragging ? 0 : reduceMotion ? 0 : 0.6,
                ease: FOCUS_EASE,
              }}
              className={cn('relative z-10 min-w-0', CARD_SLOT)}
            >
              {activeItem.kind === 'core' ? (
                <CoreCapabilityCard interactive={interactive} onActivateCore={onActivateCore} positionLabel={positionLabel} />
              ) : (
                <CategoryPanel
                  category={categoryById[activeItem.capability.categoryId]}
                  capability={activeItem.capability}
                  displayIndex={positionLabel}
                  active
                  mapped={false}
                  dimmed={false}
                  expanded={false}
                  disableHover
                  disabled={!interactive}
                  onSelect={() => {
                    if (interactive) onSelect(activeItem.capability.id)
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <NavigationSignal count={items.length} activeIndex={activeIndex} coreIndex={items.indexOf(CORE_ITEM)} reduceMotion={reduceMotion} />

        <p aria-live="polite" className="sr-only">
          {positionLabel ? `Card ${positionLabel}` : 'Core'}
        </p>
      </div>
    </section>
  )
}

const CARD_SLOT =
  'h-[min(58dvh,32rem)] w-[min(86vw,30rem)] sm:h-[min(66dvh,38rem)] sm:w-[min(72vw,34rem)] lg:h-[min(calc(100dvh-24.5rem),42rem)] lg:w-[min(36vw,36rem,calc((100dvh-24.5rem)*0.85))]'
const SIGNAL_GAP = 18

interface NavigationSignalProps {
  count: number
  activeIndex: number
  coreIndex: number
  reduceMotion: boolean
}

function NavigationSignal({ count, activeIndex, coreIndex, reduceMotion }: NavigationSignalProps) {
  const transition = { duration: reduceMotion ? 0 : 0.6, ease: FOCUS_EASE }

  return (
    <div aria-hidden className="relative z-10 flex w-full flex-col items-center">
      <span className="h-4 w-px bg-gradient-to-b from-transparent to-tech-cyan/45" />
      <div className="relative h-5 w-44 [mask-image:linear-gradient(90deg,transparent,black_28%,black_72%,transparent)]">
        <motion.div
          initial={false}
          animate={{ x: -activeIndex * SIGNAL_GAP }}
          transition={transition}
          className="absolute left-1/2 top-1/2 h-0"
          style={{ width: (count - 1) * SIGNAL_GAP }}
        >
          <span className="absolute inset-x-0 top-0 h-px -translate-y-1/2 bg-white/10" />
          <motion.span
            initial={false}
            animate={{ width: activeIndex * SIGNAL_GAP }}
            transition={transition}
            className="absolute left-0 top-0 h-px -translate-y-1/2 bg-gradient-to-r from-tech-cyan/10 to-tech-cyan/60"
          />
          {Array.from({ length: count }, (_, index) => (
            <span
              key={index}
              className={cn(
                'absolute top-0 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color,box-shadow,border-color] duration-500',
                index === activeIndex
                  ? 'bofyt-nav-node-active size-1.5 bg-tech-cyan'
                  : index === coreIndex
                    ? 'size-1.5 border border-tech-cyan/60 bg-transparent'
                    : index < activeIndex
                      ? 'size-1 bg-tech-cyan/50'
                      : 'size-1 bg-white/25',
              )}
              style={{ left: index * SIGNAL_GAP }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function formatCardPosition(items: CarouselItem[], index: number) {
  if (items[index]?.kind !== 'capability') return undefined

  const pad = (value: number) => String(value).padStart(2, '0')
  const total = items.filter((item) => item.kind === 'capability').length
  const position = items.slice(0, index + 1).filter((item) => item.kind === 'capability').length
  return `${pad(position)} / ${pad(total)}`
}
