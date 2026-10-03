'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, ExternalLink, Navigation, Plus, X } from 'lucide-react'
import { directionsUrl, metaFor, type ResultItem, type ResultKind } from '@/lib/bofyt/results'
import { cn } from '@/lib/utils'

export type ResultSheetState = { type: 'view'; item: ResultItem } | { type: 'compare'; items: ResultItem[] } | null

interface ResultSheetProps {
  state: ResultSheetState
  kind: ResultKind
  compared: string[]
  onToggleCompare: (item: ResultItem) => void
  onChoose: (item: ResultItem) => void
  onClose: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

export function ResultSheet({ state, kind, compared, onToggleCompare, onChoose, onClose }: ResultSheetProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!state) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [state, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {state && (
        <>
          <motion.div
            key="result-backdrop"
            aria-hidden
            className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="result-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-sheet-title"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.45, ease }}
            className="bofyt-sheet fixed inset-x-0 bottom-0 z-[71] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl border-t px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5 text-left text-white md:inset-x-auto md:left-1/2 md:w-[min(92vw,560px)] md:-translate-x-1/2 md:rounded-3xl md:border lg:bottom-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold/90">
                {state.type === 'view' ? 'Option details' : `Comparing ${state.items.length}`}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 grid size-11 shrink-0 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-gold hover:text-gold active:scale-95"
              >
                <X aria-hidden className="size-4" />
              </button>
            </div>

            {state.type === 'view' ? (
              <ViewBody
                item={state.item}
                kind={kind}
                isCompared={compared.includes(state.item.id)}
                onToggleCompare={onToggleCompare}
                onChoose={onChoose}
              />
            ) : (
              <CompareBody items={state.items} kind={kind} onChoose={onChoose} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ViewBody({
  item,
  kind,
  isCompared,
  onToggleCompare,
  onChoose,
}: {
  item: ResultItem
  kind: ResultKind
  isCompared: boolean
  onToggleCompare: (item: ResultItem) => void
  onChoose: (item: ResultItem) => void
}) {
  return (
    <>
      {kind === 'products' && item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={`${item.brand ? `${item.brand} ` : ''}${item.name} product image`}
          className="mt-4 h-48 w-full rounded-xl object-contain bg-white/5"
          loading="lazy"
          decoding="async"
        />
      )}
      <h2 id="result-sheet-title" className="mt-2 text-balance font-display text-3xl leading-tight">
        {item.name}
      </h2>
      {item.subtitle && <p className="mt-1 text-sm text-white/55">{item.subtitle}</p>}
      <MetaRow item={item} className="mt-4" />
      {item.summary && <p className="mt-4 text-pretty text-base leading-relaxed text-white/80">{item.summary}</p>}

      {item.steps.length > 0 && (
        <>
          <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-white/45">Next steps</p>
          <ol className="mt-3 flex flex-col gap-2.5">
            {item.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed text-white/80">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-gold/40 font-mono text-[11px] text-gold-light">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </>
      )}

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        {kind === 'products' && item.productUrl ? (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bofyt-primary-action inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium uppercase tracking-[0.16em] active:scale-[0.98]"
          >
            <ExternalLink aria-hidden className="size-4" />
            Open product
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onChoose(item)}
            className="bofyt-primary-action inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-medium uppercase tracking-[0.16em] active:scale-[0.98]"
          >
            {kind === 'places' ? (
              <>
                <Navigation aria-hidden className="size-4" />
                Directions
              </>
            ) : (
              <>
                Add to my plan
                <ArrowRight aria-hidden className="size-4" />
              </>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => onToggleCompare(item)}
          aria-pressed={isCompared}
          className={cn(
            'bofyt-secondary-action inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm uppercase tracking-[0.16em] transition-colors active:scale-[0.98]',
            isCompared && 'border-gold bg-gold/15 text-gold-light',
          )}
        >
          {isCompared ? <Check aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
          {isCompared ? 'In compare' : 'Add to compare'}
        </button>
      </div>
    </>
  )
}

function CompareBody({ items, kind, onChoose }: { items: ResultItem[]; kind: ResultKind; onChoose: (item: ResultItem) => void }) {
  const rows =
    kind === 'places'
      ? [
          { label: 'Distance', value: (i: ResultItem) => `${i.distanceKm} km`, best: (a: ResultItem[]) => minBy(a, (i) => i.distanceKm ?? 0) },
          { label: 'Price', value: (i: ResultItem) => '€'.repeat(i.priceLevel ?? 1), best: (a: ResultItem[]) => minBy(a, (i) => i.priceLevel ?? 0) },
          { label: 'Rating', value: (i: ResultItem) => (i.rating === undefined ? '—' : `★ ${i.rating.toFixed(1)}`), best: (a: ResultItem[]) => minBy(a, (i) => -(i.rating ?? Number.POSITIVE_INFINITY)) },
          { label: 'Status', value: (i: ResultItem) => (i.openNow ? 'Open' : 'Closed'), best: () => null },
        ]
      : kind === 'products'
        ? [
            { label: 'Price', value: (i: ResultItem) => productPrice(i), best: (a: ResultItem[]) => minBy(a, (i) => i.price ?? Number.POSITIVE_INFINITY) },
            { label: 'Retailer', value: (i: ResultItem) => i.retailer ?? '—', best: () => null },
            { label: 'Rating', value: (i: ResultItem) => (i.rating === undefined ? '—' : `★ ${i.rating.toFixed(1)}`), best: (a: ResultItem[]) => minBy(a, (i) => -(i.rating ?? Number.POSITIVE_INFINITY)) },
            { label: 'Availability', value: (i: ResultItem) => i.availability ?? '—', best: () => null },
          ]
        : [
            { label: 'Time', value: (i: ResultItem) => `${i.weeks} wks`, best: (a: ResultItem[]) => minBy(a, (i) => i.weeks ?? 0) },
            { label: 'Effort', value: (i: ResultItem) => ['Low', 'Med', 'High'][(i.effort ?? 1) - 1], best: (a: ResultItem[]) => minBy(a, (i) => i.effort ?? 0) },
            { label: 'Impact', value: (i: ResultItem) => (i.rating === undefined ? '—' : `★ ${i.rating.toFixed(1)}`), best: (a: ResultItem[]) => minBy(a, (i) => -(i.rating ?? Number.POSITIVE_INFINITY)) },
            { label: 'Cost', value: (i: ResultItem) => (i.free ? 'Free' : 'Premium'), best: () => null },
          ]

  return (
    <>
      <h2 id="result-sheet-title" className="mt-2 font-display text-3xl leading-tight">
        Side by side
      </h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="w-20 pb-3 text-left text-[11px] font-normal uppercase tracking-[0.2em] text-white/40">
                <span className="sr-only">Attribute</span>
              </th>
              {items.map((item) => (
                <th key={item.id} scope="col" className="pb-3 pr-2 text-left align-bottom font-medium leading-snug text-white">
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const bestId = row.best(items)
              return (
                <tr key={row.label} className="border-t border-white/10">
                  <th scope="row" className="py-3 text-left text-[11px] font-normal uppercase tracking-[0.2em] text-white/45">
                    {row.label}
                  </th>
                  {items.map((item) => (
                    <td key={item.id} className={cn('py-3 pr-2', item.id === bestId ? 'text-gold-light' : 'text-white/80')}>
                      {row.value(item)}
                    </td>
                  ))}
                </tr>
              )
            })}
            <tr className="border-t border-white/10">
              <td />
              {items.map((item) => (
                <td key={item.id} className="pr-2 pt-4">
                  <button
                    type="button"
                    onClick={() => onChoose(item)}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-gold/60 px-3 text-[11px] uppercase tracking-[0.16em] text-gold-light transition-colors hover:bg-gold/15 active:scale-95"
                  >
                    {kind === 'places' ? 'Go here' : kind === 'products' ? 'Open' : 'Choose'}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-white/45">Best value in each row is highlighted in gold.</p>
    </>
  )
}

function productPrice(item: ResultItem) {
  if (item.price === undefined) return '—'
  try {
    return item.currency
      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: item.currency, maximumFractionDigits: 2 }).format(item.price)
      : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(item.price)
  } catch {
    return item.currency ? `${item.price} ${item.currency}` : String(item.price)
  }
}

function minBy(items: ResultItem[], score: (item: ResultItem) => number) {
  const scored = items.map((item) => ({ item, value: score(item) })).filter(({ value }) => Number.isFinite(value))
  if (scored.length < 2) return null
  return scored.reduce((best, current) => (current.value < best.value ? current : best)).item.id
}

export function MetaRow({ item, className }: { item: ResultItem; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60', className)} aria-label="Details">
      {metaFor(item).map((meta) => (
        <li
          key={meta}
          className={cn(
            (meta === 'Open now' || meta === 'Free') && 'text-gold-light',
            meta.startsWith('★') && 'text-white/85',
          )}
        >
          {meta}
        </li>
      ))}
    </ul>
  )
}

export const openDirections = (item: ResultItem) => window.open(directionsUrl(item), '_blank', 'noopener,noreferrer')

export const openProduct = (item: ResultItem) => {
  if (item.productUrl) window.open(item.productUrl, '_blank', 'noopener,noreferrer')
}
