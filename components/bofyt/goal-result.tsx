'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  ArrowDownUp,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  Eye,
  ExternalLink,
  GitCompareArrows,
  Navigation,
  PencilLine,
  Plus,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'
import type { CategoryId } from '@/lib/bofyt/categories'
import type { CapabilityId } from '@/lib/bofyt/capabilities'
import type { Product, ProductPriceConstraint } from '@/lib/products/types'
import { toGoalTitle } from '@/lib/bofyt/plan'
import { buildResult, reasonFor, refineItems, type ResultItem } from '@/lib/bofyt/results'
import { savedItemKey } from '@/lib/bofyt/user-data'
import { cn } from '@/lib/utils'
import { EyeMark } from './logo'
import { MetaRow, openDirections, openProduct, ResultSheet, type ResultSheetState } from './result-sheet'

export interface GoalResultHandlers {
  saved: boolean
  savedItemIds: string[]
  onEdit: () => void
  onReset: () => void
  onBuildPlan: () => void
  onSave: () => void
  onToggleSavedItem: (item: ResultItem) => void
  onOpenProgress: () => void
  onNotify: (text: string) => void
}

export interface GoalResultData {
  id: string
  goal: string
  areas: CategoryId[]
  capabilityId?: CapabilityId
  products?: Product[]
  closestProducts?: Product[]
  priceConstraint?: ProductPriceConstraint
}

interface GoalResultProps extends GoalResultHandlers {
  goal: string
  areas: CategoryId[]
  products?: Product[]
  closestProducts?: Product[]
  priceConstraint?: ProductPriceConstraint
}

const ease = [0.22, 1, 0.36, 1] as const
const MAX_COMPARE = 3

type ProductFilterState = {
  brand?: string
  retailer?: string
  currency?: string
  minRating?: number
}

type ProductFilterKey = keyof ProductFilterState
type ProductPanel = 'filters' | 'sort' | null

const PRODUCT_SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-low', label: 'Lowest price' },
  { id: 'price-high', label: 'Highest price' },
  { id: 'rated', label: 'Rating' },
] as const

export function GoalResult({
  goal,
  areas,
  products,
  closestProducts,
  priceConstraint,
  saved,
  savedItemIds,
  onEdit,
  onReset,
  onBuildPlan,
  onSave,
  onToggleSavedItem,
  onOpenProgress,
  onNotify,
}: GoalResultProps) {
  const model = useMemo(
    () => buildResult(goal, areas, products, closestProducts, priceConstraint),
    [goal, areas, products, closestProducts, priceConstraint],
  )
  const [refinement, setRefinement] = useState(model.defaultRefinement)
  const [compared, setCompared] = useState<string[]>([])
  const [sheet, setSheet] = useState<ResultSheetState>(null)
  const [productPanel, setProductPanel] = useState<ProductPanel>(null)
  const [productFilters, setProductFilters] = useState<ProductFilterState>({})
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(max-width: 1023px)').matches) return

    const frame = window.requestAnimationFrame(() => {
      resultHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const isPlaces = model.kind === 'places'
  const isProduct = model.kind === 'products'
  const filteredModelItems = useMemo(
    () => (isProduct ? filterProductItems(model.items, productFilters) : model.items),
    [isProduct, model.items, productFilters],
  )
  const items = useMemo(() => refineItems(filteredModelItems, refinement), [filteredModelItems, refinement])
  const closestItems = model.closestItems ?? []
  const [top, ...rest] = items
  const hasProductFilters = Object.values(productFilters).some((value) => value !== undefined && value !== '')

  const toggleCompare = (item: ResultItem) => {
    if (compared.includes(item.id)) {
      setCompared((ids) => ids.filter((id) => id !== item.id))
      onNotify(`Removed ${item.name} from compare`)
    } else if (compared.length >= MAX_COMPARE) {
      onNotify(`You can compare up to ${MAX_COMPARE} options`)
    } else {
      setCompared((ids) => [...ids, item.id])
      onNotify(`${item.name} added to compare`)
    }
  }

  const toggleSavedItem = (item: ResultItem) => {
    onToggleSavedItem(item)
  }

  const choose = (item: ResultItem) => {
    setSheet(null)
    if (isPlaces) {
      openDirections(item)
      onNotify(`Opening directions to ${item.name}`)
    } else if (isProduct && item.productUrl) {
      openProduct(item)
      onNotify(`Opening ${item.name}`)
    } else {
      onNotify(`${item.name} added to your plan`)
      onBuildPlan()
    }
  }

  const openCompare = () => {
    const selected = model.items.filter((item) => compared.includes(item.id))
    setSheet({ type: 'compare', items: selected.length >= 2 ? selected : items.slice(0, MAX_COMPARE) })
  }

  const runNextAction = () => {
    if (isProduct) {
      if (compared.length >= 2) {
        openCompare()
      } else if (top) {
        choose(top)
      } else {
        onEdit()
      }
      return
    }
    if (isPlaces) openCompare()
    else onBuildPlan()
  }
  const closeSheet = useCallback(() => setSheet(null), [])

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease }}
      aria-labelledby="result-heading"
      className="bofyt-result-surface flex w-full max-w-xl flex-col text-left"
    >
      {/* 2. User's goal */}
      <div className="bofyt-glass-panel flex items-center gap-3 rounded-2xl py-2 pl-4 pr-2">
        <p className="min-w-0 flex-1">
          <span className="block text-[10px] uppercase tracking-[0.3em] text-white/45">{isProduct ? 'Your search' : 'Your goal'}</span>
          <span className="block truncate text-base text-white">{`“${toGoalTitle(goal)}”`}</span>
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-gold-light active:scale-95"
        >
          <PencilLine aria-hidden className="size-4" />
          Edit
        </button>
      </div>

      {/* 3. Processing / result status */}
      <div className="flex flex-col items-center py-2" aria-hidden>
        <span className="h-5 w-px bg-gradient-to-b from-white/20 to-gold/70" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex min-w-0 items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold/90">
          <EyeMark className="h-2.5 w-4 shrink-0" />
          <span className="truncate">BOFYT processed · {model.statusLabel}</span>
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-1 text-[11px] uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-white active:scale-95"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          New
        </button>
      </div>

      {isProduct && (
        <ProductResultControls
          items={model.items}
          priceConstraint={model.priceConstraint}
          comparedCount={compared.length}
          onOpenCompare={openCompare}
          filters={productFilters}
          refinement={refinement}
          panel={productPanel}
          onPanelChange={setProductPanel}
          onFilterChange={(key, value) => setProductFilters((current) => ({ ...current, [key]: value }))}
          onClearFilters={() => setProductFilters({})}
          onSort={(value) => {
            setRefinement(value)
            setProductPanel(null)
          }}
        />
      )}

      <h2 ref={resultHeadingRef} id="result-heading" className="mt-3 scroll-mt-24 font-display text-2xl leading-tight text-white md:text-3xl">
        Your results
        <span className="mt-1 block font-sans text-sm text-white/55">{model.heading}</span>
      </h2>

      {top ? (
        <>
          {/* 4. Main result / recommended action */}
          <motion.article
            key={`${refinement}-${top.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            aria-label={`Recommended: ${top.name}`}
            className="bofyt-result-featured mt-4 rounded-2xl border p-4"
          >
            {isProduct && top.imageUrl && (
              <img
                src={top.imageUrl}
                alt={`${top.brand ? `${top.brand} ` : ''}${top.name} product image`}
                className="mb-4 h-40 w-full rounded-xl object-contain bofyt-media-well"
                loading="eager"
                decoding="async"
              />
            )}
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
              {isProduct ? 'Live result' : `Recommended · ${reasonFor(refinement)}`}
            </p>
            <h3 className="mt-2 text-xl text-white">{top.name}</h3>
            {top.subtitle && <p className="text-sm text-white/55">{top.subtitle}</p>}
            <MetaRow item={top} className="mt-3 text-sm" />
            <ItemActions
              item={top}
              isPlaces={isPlaces}
              isProduct={isProduct}
              isCompared={compared.includes(top.id)}
              isSaved={savedItemIds.includes(savedItemKey(top))}
              onView={() => setSheet({ type: 'view', item: top })}
              onCompare={() => toggleCompare(top)}
              onSaveItem={() => toggleSavedItem(top)}
              onThird={() => choose(top)}
              prominent
            />
          </motion.article>

          {/* 5. Relevant options */}
          {rest.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2" aria-label="More options">
              {rest.map((item) => (
                <li key={item.id} className="bofyt-result-item rounded-2xl p-3.5">
                  {isProduct ? (
                    <div className="flex items-start gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={`${item.brand ? `${item.brand} ` : ''}${item.name} product image`}
                          className="size-16 shrink-0 rounded-lg object-contain bofyt-media-well"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="min-w-0 truncate text-base text-white">{item.name}</h3>
                          {item.subtitle && <span className="shrink-0 text-xs text-white/45">{item.subtitle.split(' · ')[0]}</span>}
                        </div>
                        <MetaRow item={item} className="mt-1.5" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="min-w-0 truncate text-base text-white">{item.name}</h3>
                        <span className="shrink-0 text-xs text-white/45">{item.subtitle.split(' · ')[0]}</span>
                      </div>
                      <MetaRow item={item} className="mt-1.5" />
                    </>
                  )}
                  <ItemActions
                    item={item}
                    isPlaces={isPlaces}
                    isProduct={isProduct}
                    isCompared={compared.includes(item.id)}
                    isSaved={savedItemIds.includes(savedItemKey(item))}
                    onView={() => setSheet({ type: 'view', item })}
                    onCompare={() => toggleCompare(item)}
                    onSaveItem={() => toggleSavedItem(item)}
                    onThird={() => choose(item)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="bofyt-glass-panel mt-4 rounded-2xl p-4 text-sm text-white/70">
            {isProduct && hasProductFilters ? 'No products match the selected filters.' : model.emptyMessage ?? 'Nothing matches that filter right now.'}{' '}
            <button
              type="button"
              onClick={isProduct ? (hasProductFilters ? () => setProductFilters({}) : onEdit) : () => setRefinement(model.defaultRefinement)}
              className="min-h-11 text-gold-light underline underline-offset-4"
            >
              {isProduct ? (hasProductFilters ? 'Clear filters' : 'Edit search') : 'Show all options'}
            </button>
          </div>

          {isProduct && model.items.length === 0 && closestItems.length > 0 && (
            <section className="mt-6 border-t border-white/10 pt-5" aria-labelledby="closest-matches-heading">
              <p id="closest-matches-heading" className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
                {model.priceConstraint?.maxPrice !== undefined && model.priceConstraint.minPrice === undefined
                  ? 'Closest matches above your budget'
                  : 'Closest matches outside your price range'}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/45">
                These products are outside the requested price range and are not exact matches.
              </p>
              <ul
                className="mt-3 flex flex-col gap-2"
                aria-label={
                  model.priceConstraint?.maxPrice !== undefined && model.priceConstraint.minPrice === undefined
                    ? 'Closest matches above your budget'
                    : 'Closest matches outside your price range'
                }
              >
                {closestItems.map((item) => (
                  <li key={item.id} className="bofyt-result-item rounded-2xl p-3.5">
                    <div className="flex items-start gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={`${item.brand ? `${item.brand} ` : ''}${item.name} product image`}
                          className="size-16 shrink-0 rounded-lg object-contain bofyt-media-well"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="min-w-0 truncate text-base text-white">{item.name}</h3>
                          {item.subtitle && <span className="shrink-0 text-xs text-white/45">{item.subtitle.split(' · ')[0]}</span>}
                        </div>
                        <MetaRow item={item} className="mt-1.5" />
                      </div>
                    </div>
                    <ItemActions
                      item={item}
                      isPlaces={false}
                      isProduct
                      isCompared={compared.includes(item.id)}
                      isSaved={savedItemIds.includes(savedItemKey(item))}
                      onView={() => setSheet({ type: 'view', item })}
                      onCompare={() => toggleCompare(item)}
                      onSaveItem={() => toggleSavedItem(item)}
                      onThird={() => choose(item)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {!isProduct && (
        <>
          {/* 6. Quick refinement */}
          <p id="refine-label" className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/45">
            Refine
          </p>
          <div role="group" aria-labelledby="refine-label" className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {model.refinements.map((option) => {
              const active = option.id === refinement
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRefinement(option.id)}
                  className={cn(
                    'bofyt-control-action min-h-11 shrink-0 rounded-full px-4 text-xs uppercase tracking-[0.14em] active:scale-95',
                    active && 'border-gold bg-gold text-black',
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* 7. Primary next action */}
      <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-white/45">Next action</p>
      <motion.button
        type="button"
        onClick={runNextAction}
        whileTap={{ scale: 0.97 }}
        className="bofyt-primary-action group mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-medium uppercase tracking-[0.16em]"
      >
        {compared.length >= 2 ? `Compare ${compared.length} selected` : model.nextActionLabel}
        <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </motion.button>

      {/* 8. Progress / save to goal */}
      <button
        type="button"
        onClick={saved ? onOpenProgress : onSave}
        className={cn(
          'bofyt-secondary-action mt-2.5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-xs uppercase tracking-[0.16em] active:scale-[0.98]',
          saved && 'border-gold/50 text-gold-light',
        )}
      >
        {saved ? <BookmarkCheck aria-hidden className="size-4" /> : <Bookmark aria-hidden className="size-4" />}
        {saved ? 'Saved · View progress' : 'Save goal to progress'}
      </button>

      <ResultSheet
        state={sheet}
        kind={model.kind}
        compared={compared}
        onToggleCompare={toggleCompare}
        onChoose={choose}
        onClose={closeSheet}
      />
    </motion.section>
  )
}

function filterProductItems(items: ResultItem[], filters: ProductFilterState) {
  return items.filter((item) => {
    if (filters.brand && item.brand !== filters.brand) return false
    if (filters.retailer && item.retailer !== filters.retailer) return false
    if (filters.currency && item.currency !== filters.currency) return false
    if (filters.minRating !== undefined && (item.rating ?? 0) < filters.minRating) return false
    return true
  })
}

function ProductResultControls({
  items,
  priceConstraint,
  comparedCount,
  onOpenCompare,
  filters,
  refinement,
  panel,
  onPanelChange,
  onFilterChange,
  onClearFilters,
  onSort,
}: {
  items: ResultItem[]
  priceConstraint?: ProductPriceConstraint
  comparedCount: number
  onOpenCompare: () => void
  filters: ProductFilterState
  refinement: string
  panel: ProductPanel
  onPanelChange: (panel: ProductPanel) => void
  onFilterChange: (key: ProductFilterKey, value: string | number | undefined) => void
  onClearFilters: () => void
  onSort: (value: string) => void
}) {
  const brands = distinctProductValues(items, (item) => item.brand)
  const retailers = distinctProductValues(items, (item) => item.retailer)
  const currencies = distinctProductValues(items, (item) => item.currency)
  const availableRatings = items
    .map((item) => item.rating)
    .filter((rating): rating is number => rating !== undefined)
  const ratingOptions = [4.5, 4, 3.5, 3].filter((threshold) => availableRatings.some((rating) => rating >= threshold))
  const hasPriceData = Boolean(priceConstraint || items.some((item) => item.price !== undefined))
  const hasClientFilters = Object.values(filters).some((value) => value !== undefined && value !== '')
  const activeFilterCount = (priceConstraint ? 1 : 0) + Object.values(filters).filter((value) => value !== undefined && value !== '').length
  const selectedSort = PRODUCT_SORT_OPTIONS.find((option) => option.id === refinement)?.label ?? 'Relevance'
  const hasSupportedFilters = hasPriceData || brands.length > 0 || retailers.length > 0 || currencies.length > 0 || ratingOptions.length > 0

  const togglePanel = (nextPanel: Exclude<ProductPanel, null>) => {
    onPanelChange(panel === nextPanel ? null : nextPanel)
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2" role="group" aria-label="Product result controls">
        <button
          type="button"
          aria-expanded={panel === 'filters'}
          aria-controls="product-filters-panel"
          onClick={() => togglePanel('filters')}
          className={cn(
            'bofyt-control-action inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs uppercase tracking-[0.16em] active:scale-95',
            panel === 'filters' && 'border-gold bg-gold/15 text-gold-light',
          )}
        >
          <SlidersHorizontal aria-hidden className="size-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-gold text-[10px] font-medium tracking-normal text-black" aria-label={`${activeFilterCount} active filters`}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-expanded={panel === 'sort'}
          aria-controls="product-sort-panel"
          onClick={() => togglePanel('sort')}
          className={cn(
            'bofyt-control-action inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs uppercase tracking-[0.16em] active:scale-95',
            panel === 'sort' && 'border-gold bg-gold/15 text-gold-light',
          )}
        >
          <ArrowDownUp aria-hidden className="size-3.5" />
          Sort
          <span className="sr-only">{selectedSort}</span>
        </button>
        {comparedCount >= 2 && (
          <button
            type="button"
            onClick={onOpenCompare}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-3 text-xs uppercase tracking-[0.12em] text-gold-light transition-colors hover:bg-gold/20 active:scale-95"
          >
            <GitCompareArrows aria-hidden className="size-3.5" />
            Compare {comparedCount}
          </button>
        )}
      </div>

      {panel === 'filters' && (
        <section id="product-filters-panel" aria-labelledby="product-filters-heading" className="bofyt-glass-panel mt-2 rounded-2xl p-3">
          <div className="flex items-center justify-between gap-3">
            <p id="product-filters-heading" className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
              Filter products
            </p>
            {hasClientFilters && (
              <button type="button" onClick={onClearFilters} className="min-h-9 px-1 text-[10px] uppercase tracking-[0.16em] text-white/55 hover:text-gold-light">
                Clear
              </button>
            )}
          </div>
          {hasSupportedFilters ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {hasPriceData && (
                <div className="rounded-xl border border-gold/30 bg-gold/5 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Price</p>
                  <p className="mt-1 text-sm text-gold-light">{formatProductPriceConstraint(priceConstraint) ?? 'All listed prices'}</p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {priceConstraint ? 'Active budget constraint' : 'No budget limit set'}
                  </p>
                </div>
              )}
              {brands.length > 0 && (
                <ProductFilterSelect
                  id="product-brand-filter"
                  label="Brand"
                  value={filters.brand ?? ''}
                  options={brands}
                  onChange={(value) => onFilterChange('brand', value)}
                />
              )}
              {retailers.length > 0 && (
                <ProductFilterSelect
                  id="product-retailer-filter"
                  label="Retailer"
                  value={filters.retailer ?? ''}
                  options={retailers}
                  onChange={(value) => onFilterChange('retailer', value)}
                />
              )}
              {currencies.length > 0 && (
                <ProductFilterSelect
                  id="product-currency-filter"
                  label="Currency"
                  value={filters.currency ?? ''}
                  options={currencies}
                  onChange={(value) => onFilterChange('currency', value)}
                />
              )}
              {ratingOptions.length > 0 && (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Rating</span>
                  <select
                    value={filters.minRating?.toString() ?? ''}
                    onChange={(event) => onFilterChange('minRating', event.target.value ? Number(event.target.value) : undefined)}
                    className="bofyt-auth-input min-h-10 w-full rounded-xl px-3 text-sm outline-none transition-colors"
                  >
                    <option value="">Any rating</option>
                    {ratingOptions.map((rating) => (
                      <option key={rating} value={rating}>
                        {rating.toFixed(1)}+ stars
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-white/50">No additional filters are available for these live results.</p>
          )}
        </section>
      )}

      {panel === 'sort' && (
        <section id="product-sort-panel" aria-labelledby="product-sort-heading" className="bofyt-glass-panel mt-2 rounded-2xl p-3">
          <fieldset>
            <legend id="product-sort-heading" className="text-[10px] uppercase tracking-[0.3em] text-gold-light">
              Sort by
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {PRODUCT_SORT_OPTIONS.map((option) => (
                <label key={option.id} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="product-sort"
                    value={option.id}
                    checked={refinement === option.id}
                    onChange={() => onSort(option.id)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-2 text-center text-xs text-white/75 transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-gold">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      )}
    </div>
  )
}

function ProductFilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: string[]
  onChange: (value: string | undefined) => void
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="bofyt-auth-input min-h-10 w-full rounded-xl px-3 text-sm outline-none transition-colors"
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function distinctProductValues(items: ResultItem[], getValue: (item: ResultItem) => string | undefined) {
  return [...new Set(items.map(getValue).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b))
}

function formatProductPriceConstraint(constraint?: ProductPriceConstraint) {
  if (!constraint) return undefined
  const min = constraint.minPrice === undefined ? undefined : formatProductAmount(constraint.minPrice, constraint.currency)
  const max = constraint.maxPrice === undefined ? undefined : formatProductAmount(constraint.maxPrice, constraint.currency)
  if (min && max) return `${min}–${max}`
  if (max) return `Under ${max}`
  if (min) return `From ${min}`
  return undefined
}

function formatProductAmount(value: number, currency?: string) {
  if (currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value)
    } catch {
      return `${value} ${currency}`
    }
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}

function ItemActions({
  item,
  isPlaces,
  isProduct,
  isCompared,
  isSaved,
  onView,
  onCompare,
  onSaveItem,
  onThird,
  prominent = false,
}: {
  item: ResultItem
  isPlaces: boolean
  isProduct: boolean
  isCompared: boolean
  isSaved: boolean
  onView: () => void
  onCompare: () => void
  onSaveItem: () => void
  onThird: () => void
  prominent?: boolean
}) {
  const base = 'bofyt-control-action inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full text-[11px] uppercase tracking-[0.12em] active:scale-95'
  return (
    <div className={cn('mt-3 gap-2', isProduct ? 'grid grid-cols-2' : 'flex')}>
      <button type="button" onClick={onView} aria-label={`View ${item.name}`} className={cn(base, 'border-white/20 text-white/85 hover:border-gold/60')}>
        <Eye aria-hidden className="size-3.5" />
        View
      </button>
      <button
        type="button"
        onClick={onCompare}
        aria-pressed={isCompared}
        aria-label={`${isCompared ? 'Remove' : 'Add'} ${item.name} ${isCompared ? 'from' : 'to'} compare`}
        className={cn(base, isCompared ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/20 text-white/85 hover:border-gold/60')}
      >
        {isCompared ? <Check aria-hidden className="size-3.5" /> : <GitCompareArrows aria-hidden className="size-3.5" />}
        Compare
      </button>
      {isProduct && (
        <button
          type="button"
          onClick={onSaveItem}
          aria-pressed={isSaved}
          aria-label={`${isSaved ? 'Remove' : 'Save'} ${item.name}`}
          className={cn(base, isSaved ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/20 text-white/85 hover:border-gold/60')}
        >
          {isSaved ? <BookmarkCheck aria-hidden className="size-3.5" /> : <Bookmark aria-hidden className="size-3.5" />}
          {isSaved ? 'Saved' : 'Save'}
        </button>
      )}
      {isProduct && item.productUrl ? (
        <a
          href={item.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${item.name}`}
          className={cn(
            base,
            prominent ? 'border-gold bg-gold text-black' : 'border-gold/50 text-gold-light hover:bg-gold/10',
          )}
        >
          <ExternalLink aria-hidden className="size-3.5" />
          Open product
        </a>
      ) : (
        <button
          type="button"
          onClick={onThird}
          aria-label={isPlaces ? `Directions to ${item.name}` : `Add ${item.name} to plan`}
          className={cn(
            base,
            prominent ? 'border-gold bg-gold text-black' : 'border-gold/50 text-gold-light hover:bg-gold/10',
          )}
        >
          {isPlaces ? <Navigation aria-hidden className="size-3.5" /> : <Plus aria-hidden className="size-3.5" />}
          {isPlaces ? 'Directions' : 'Plan'}
        </button>
      )}
    </div>
  )
}
