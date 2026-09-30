'use client'

import Image from 'next/image'
import { ArrowRight, Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Category, CategoryModule } from '@/lib/bofyt/categories'
import type { Capability } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'

interface CapabilityOverlayProps {
  category: Category | null
  capability: Capability | null
  displayIndex?: string
  displayTitle?: string
  displayDescription?: string
  onClose: () => void
  onStart: () => void
  onEnter: () => void
  onSelectModule: (module: CategoryModule) => void
}

const ease = [0.22, 1, 0.36, 1] as const

export function CapabilityOverlay({
  category,
  capability,
  displayIndex,
  displayTitle,
  displayDescription,
  onClose,
  onStart,
  onEnter,
  onSelectModule,
}: CapabilityOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const open = Boolean(category && capability)

  const handleCardClick = (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('button')) return
    onEnter()
  }

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    contentRef.current?.scrollTo({ top: 0 })
    const timer = window.setTimeout(() => closeRef.current?.focus(), 260)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(timer)
    }
  }, [open, category?.id, capability?.id])

  return (
    <div className={cn('contents', !open && 'pointer-events-none')}>
      <AnimatePresence initial={false}>
        {category && capability && (
          <motion.div
          key={category.id}
          role="dialog"
          aria-modal="true"
          aria-labelledby="capability-overlay-title"
          className="fixed inset-0 z-30 overflow-y-auto bg-void/75 px-3 pb-24 pt-3 backdrop-blur-md sm:px-5 sm:pt-5 lg:pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <motion.div
            className="mx-auto flex min-h-full w-full max-w-5xl items-start justify-center lg:items-center"
            initial={{ scale: 0.58, y: '24vh', opacity: 0, filter: 'blur(8px)' }}
            animate={{ scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.58, y: '24vh', opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: 0.7, ease }}
          >
            <section
              aria-describedby="capability-overlay-description"
              onClick={handleCardClick}
              className="relative flex max-h-[calc(100dvh-7rem)] min-h-0 w-full flex-col overflow-hidden rounded-[1.75rem] border border-gold/55 bg-void/95 shadow-[0_0_100px_-28px_rgba(226,184,101,0.85),0_28px_90px_-30px_rgba(0,0,0,0.95)] sm:max-w-4xl"
            >
              <div className="relative h-40 shrink-0 overflow-hidden border-b border-gold/30 sm:h-48">
                <Image
                  src={capability.imageSrc}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 896px, 100vw"
                  className="object-cover object-center opacity-65"
                  priority
                />
                <span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.98),rgba(5,5,5,0.58),rgba(5,5,5,0.72)),linear-gradient(0deg,#050505,transparent_70%)]" />
                <span aria-hidden className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-light/80 to-transparent" />

                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-6">
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
                      {displayIndex ?? category.index} · BOFYT capability
                    </p>
                    <h2 id="capability-overlay-title" className="mt-2 max-w-2xl font-display text-[clamp(1.75rem,5vw,3.4rem)] leading-none tracking-tight text-white text-balance">
                      {displayTitle ?? capability.title}
                    </h2>
                    <p id="capability-overlay-description" className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
                      {displayDescription ?? capability.description}
                    </p>
                  </div>

                  <button
                    ref={closeRef}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onClose()
                    }}
                    aria-label={`Close ${capability.title} capability`}
                    className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-void/70 px-3 text-[10px] uppercase tracking-[0.18em] text-white/75 transition-[border-color,color,background-color] hover:border-gold/70 hover:bg-gold/10 hover:text-gold-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                  >
                    <X aria-hidden className="size-4" />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>
              </div>

              <div ref={contentRef} className="min-h-0 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-6 p-5 text-left sm:gap-7 sm:p-7">
                  <div className="flex flex-wrap gap-2" aria-label="Capability focus areas">
                    {capability.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-gold-light/90">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-[0.26em] text-white/45">What BOFYT builds</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/75">{capability.response}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[10px] uppercase tracking-[0.26em] text-white/45">Your path</p>
                      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2" aria-label="Capability path">
                        {capability.paths.map((path) => (
                          <li key={path} className="flex items-center gap-1.5 text-sm text-white/70">
                            <Check aria-hidden className="size-3.5 shrink-0 text-gold-light" />
                            {path}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-gold-light">Plans and options</p>
                        <h3 className="mt-1 font-display text-2xl text-white sm:text-3xl">Choose a place to start</h3>
                      </div>
                      <span className="hidden text-right text-[10px] uppercase tracking-[0.2em] text-white/40 sm:block">
                        {capability.modules.length} paths available
                      </span>
                    </div>

                    <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label={`${capability.title} plans and options`}>
                      {capability.modules.map((module) => (
                        <ModuleCard key={module.name} module={module} onSelect={() => onSelectModule(module)} />
                      ))}
                    </ul>
                  </div>

                  {capability.evidenceLevels && capability.evidenceLevels.length > 0 && (
                    <section aria-labelledby={`${capability.id}-evidence-heading`}>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-gold-light">Evidence lens</p>
                      <h3 id={`${capability.id}-evidence-heading`} className="mt-1 font-display text-2xl text-white sm:text-3xl">
                        Keep context visible
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
                        BOFYT separates established evidence from lifestyle practice, tradition and emerging ideas so you can choose with the right level of confidence.
                      </p>
                      <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-label="Evidence levels">
                        {capability.evidenceLevels.map((level) => (
                          <li key={level.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-sm text-white">{level.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-white/50">{level.description}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <section aria-labelledby={`${capability.id}-books-heading`}>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-gold-light">Recommended books</p>
                    <h3 id={`${capability.id}-books-heading`} className="mt-1 font-display text-2xl text-white sm:text-3xl">
                      Read into the next move
                    </h3>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-3" aria-label={`${capability.title} recommended books`}>
                      {capability.books.map((book) => (
                        <li key={book.title}>
                          <button
                            type="button"
                            onClick={() =>
                              onSelectModule({
                                name: book.title,
                                description: book.reason,
                                prompt: `I want to explore ${book.title} by ${book.author} and apply its ideas to my goal.`,
                              })
                            }
                            className="group flex h-full w-full flex-col rounded-2xl border border-white/10 bg-black/35 p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                          >
                            <span className="font-display text-lg text-white group-hover:text-gold-light">{book.title}</span>
                            <span className="mt-1 text-xs uppercase tracking-[0.14em] text-gold-light/75">{book.author}</span>
                            <span className="mt-3 text-sm leading-relaxed text-white/50">{book.reason}</span>
                            <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-white/65">
                              Explore with Core <ArrowRight aria-hidden className="size-3.5" />
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-white">Ready to make this your next move?</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/50">BOFYT will keep the capability connected to your goal.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onStart}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold/70 bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-void transition-[transform,box-shadow,background-color] hover:bg-gold-light hover:shadow-[0_0_30px_-8px_rgba(246,221,161,0.95)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-void"
                    >
                      {category.id === 'search' ? 'Open live search' : 'Plan with AI Core'}
                      <ArrowRight aria-hidden className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModuleCard({ module, onSelect }: { module: CategoryModule; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="group flex min-h-40 w-full flex-col justify-between rounded-2xl border border-white/10 bg-black/35 p-4 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
      >
        <span>
          <span className="block font-display text-lg text-white group-hover:text-gold-light">{module.name}</span>
          <span className="mt-1 block text-sm leading-relaxed text-white/55">{module.description}</span>
        </span>
        <span className="mt-4 inline-flex min-h-10 items-center justify-between gap-3 rounded-xl border border-gold/30 px-3 text-[10px] uppercase tracking-[0.18em] text-gold-light transition-[border-color,background-color,color] group-hover:border-gold/70 group-hover:bg-gold/10">
          <span>Start this path</span>
          <ArrowRight aria-hidden className="size-3.5" />
        </span>
      </button>
    </li>
  )
}
