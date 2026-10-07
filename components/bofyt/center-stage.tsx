'use client'

import type { ReactNode, RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { categoryById, type CategoryId } from '@/lib/bofyt/categories'
import type { Capability } from '@/lib/bofyt/capabilities'
import { cn } from '@/lib/utils'
import type { ProductSearchFeedback } from '@/lib/products/types'
import { AiCore, type CoreMode } from './ai-core'
import { CoreReply } from './core-reply'
import { GoalInput } from './goal-input'
import { GoalResult, type GoalResultData, type GoalResultHandlers } from './goal-result'
import { ProductSearch } from './product-search'
import { GoalThinking } from './goal-thinking'

export const PLACEHOLDERS: Record<CategoryId, string> = {
  social: 'e.g. I want to grow my Instagram',
  business: 'e.g. Launch my first product',
  marketing: 'e.g. Build an email list of 1,000',
  personal: 'e.g. Run a half marathon',
  productivity: 'e.g. Stop procrastinating',
  creativity: 'e.g. Finish my first book',
  communication: 'e.g. Find an accountability partner',
  search: 'e.g. Find black running shoes under €50',
}

interface CenterStageProps {
  inputRef: RefObject<HTMLInputElement | null>
  headingRef: RefObject<HTMLHeadingElement | null>
  goal: string
  selected: CategoryId | null
  preview: CategoryId | null
  system: ReactNode
  explore: ReactNode
  centeredExplore: ReactNode
  returning?: ReactNode
  coreMode: CoreMode
  pulseKey: number
  result: GoalResultData | null
  resultHandlers: GoalResultHandlers
  capability: Capability | null
  searchAutoFocus: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  searchQuery: string
  searchBusy: boolean
  searchResult: GoalResultData | null
  searchResultHandlers: GoalResultHandlers
  searchFeedback: ProductSearchFeedback | null
  onGoalChange: (value: string) => void
  onSubmit: (value?: string) => void
  onFocusChange: (focused: boolean) => void
  onActivateCore: () => void
  onPickPrompt: (prompt: string) => void
  onSearchChange: (value: string) => void
  onSearchSubmit: (query?: string) => void
  onRetrySearch: () => void
}

export function CenterStage({
  inputRef,
  headingRef,
  goal,
  selected,
  preview,
  system,
  explore,
  centeredExplore,
  returning,
  coreMode,
  pulseKey,
  result,
  resultHandlers,
  capability,
  searchAutoFocus,
  searchInputRef,
  searchQuery,
  searchBusy,
  searchResult,
  searchResultHandlers,
  searchFeedback,
  onGoalChange,
  onSubmit,
  onFocusChange,
  onActivateCore,
  onPickPrompt,
  onSearchChange,
  onSearchSubmit,
  onRetrySearch,
}: CenterStageProps) {
  const category = selected ? categoryById[selected] : null
  const contextId = selected ?? preview
  const placeholder = contextId ? PLACEHOLDERS[contextId] : 'e.g. I want to grow my Instagram'
  const isSearch = selected === 'search'

  return (
    <div className="flex w-full flex-col items-center text-center">
      <section
        aria-label={isSearch ? 'Product discovery' : 'BOFYT goal planner'}
        className={cn(
          'relative flex w-full flex-col items-center gap-5 lg:gap-6',
          !isSearch && !result && 'lg:min-h-[42rem]',
        )}
      >
        <div
          className={cn(
            'relative flex w-full items-center justify-center',
            isSearch ? 'lg:min-h-[min(54vh,520px)]' : 'lg:min-h-[min(40vh,300px)]',
          )}
        >
          {system}
          {isSearch ? (
            <ProductSearch
              open={isSearch}
              autoFocus={searchAutoFocus}
              inputRef={searchInputRef}
              headingRef={headingRef}
              query={searchQuery}
              busy={searchBusy}
              result={searchResult}
              resultHandlers={searchResultHandlers}
              feedback={searchFeedback}
              suggestions={capability?.modules.slice(0, 3) ?? []}
              onPickPrompt={onPickPrompt}
              onQueryChange={onSearchChange}
              onSubmit={onSearchSubmit}
              onRetry={onRetrySearch}
            />
          ) : (
            <AiCore
              mode={coreMode}
              energy={Math.min(goal.length / 80, 1)}
              typingTick={goal.length}
              pulseKey={pulseKey}
              onActivate={onActivateCore}
              className="size-[min(52vw,220px)] lg:size-[min(28vw,280px)]"
            />
          )}
        </div>

        {!isSearch && <>
          <h1
            ref={headingRef}
            className="scroll-mt-6 font-display text-[clamp(2.1rem,3.4vw,3.9rem)] font-normal leading-[1.05] tracking-tight text-balance"
          >
            <span className="block text-white">What do you want</span>
            <span className="block">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key="goal-question"
                  className="inline-block text-gold-metal"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  to achieve?
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="-mt-3 max-w-sm text-pretty text-xs leading-relaxed text-white/50">
            BOFYT AI figures out what needs to happen next.
          </p>

          {!result && (
            <GoalInput
              inputRef={inputRef}
              value={goal}
              placeholder={placeholder}
              busy={coreMode === 'activating'}
              linkKey={selected}
              onChange={onGoalChange}
              onSubmit={onSubmit}
              onFocusChange={onFocusChange}
            />
          )}

          {!result && (
            <section
              aria-label="Independent capability entry points"
              className="w-full border-t border-tech-cyan/15 pt-6 min-[960px]:absolute min-[960px]:inset-0 min-[960px]:z-0 min-[960px]:border-t-0 min-[960px]:pt-0"
            >
              {centeredExplore}
            </section>
          )}

          <div className="flex w-full flex-col items-center empty:hidden lg:min-h-32">
            <AnimatePresence mode="wait" initial={false}>
              {result ? (
                <GoalResult
                  key={result.id}
                  goal={result.goal}
                  areas={result.areas}
                  products={result.products}
                  closestProducts={result.closestProducts}
                  priceConstraint={result.priceConstraint}
                  {...resultHandlers}
                />
              ) : coreMode === 'activating' ? (
                <GoalThinking key="thinking" />
              ) : goal.trim() ? (
                <GoalEcho key="echo" goal={goal.trim()} categoryTitle={category?.title} />
              ) : category ? (
                  <CoreReply key={`reply-${category.id}`} category={category} capability={capability} onPickPrompt={onPickPrompt} />

              ) : null}
            </AnimatePresence>
          </div>
        </>}

        {result && !isSearch && (
          <section
            aria-label="Independent capability entry points"
            className="w-full border-t border-tech-cyan/15 pt-6 lg:pt-8"
          >
            {explore}
          </section>
        )}

        {!isSearch && returning}
      </section>

      {isSearch && (
        <section
          className="mt-12 w-full max-w-6xl border-t border-tech-cyan/15 pt-10 lg:mt-16 lg:pt-12"
          aria-label="Independent capability entry points"
        >
          {explore}
        </section>
      )}
    </div>
  )
}

function GoalEcho({ goal, categoryTitle }: { goal: string; categoryTitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      className="-mt-2 flex w-full max-w-xl flex-col items-center gap-1.5"
    >
      <span aria-hidden className="h-4 w-px bg-gradient-to-b from-gold/60 to-transparent" />
      <p className="flex max-w-full items-center gap-2 text-xs text-white/70">
        <span className="shrink-0 rounded-full border border-gold/50 bg-gold/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gold-light">
          {categoryTitle ?? 'Goal'}
        </span>
        <span className="truncate">Press enter and BOFYT AI maps your path</span>
      </p>
    </motion.div>
  )
}
