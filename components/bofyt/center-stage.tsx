'use client'

import type { ReactNode, RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { categoryById, type CategoryId } from '@/lib/bofyt/categories'
import { AiCore, type CoreMode } from './ai-core'
import { CoreReply } from './core-reply'
import { GoalInput } from './goal-input'
import { GoalResult, type GoalResultHandlers } from './goal-result'
import { GoalThinking } from './goal-thinking'

export const PLACEHOLDERS: Record<CategoryId, string> = {
  social: 'e.g. I want to grow my Instagram',
  business: 'e.g. Launch my first product',
  marketing: 'e.g. Build an email list of 1,000',
  personal: 'e.g. Run a half marathon',
  productivity: 'e.g. Stop procrastinating',
  creativity: 'e.g. Finish my first book',
  communication: 'e.g. Find an accountability partner',
}

interface CenterStageProps {
  inputRef: RefObject<HTMLInputElement | null>
  headingRef: RefObject<HTMLHeadingElement | null>
  goal: string
  selected: CategoryId | null
  preview: CategoryId | null
  system: ReactNode
  explore: ReactNode
  returning?: ReactNode
  coreMode: CoreMode
  pulseKey: number
  result: { id: string; goal: string; areas: CategoryId[] } | null
  resultHandlers: GoalResultHandlers
  onGoalChange: (value: string) => void
  onSubmit: () => void
  onFocusChange: (focused: boolean) => void
  onActivateCore: () => void
  onPickPrompt: (prompt: string) => void
}

export function CenterStage({
  inputRef,
  headingRef,
  goal,
  selected,
  preview,
  system,
  explore,
  returning,
  coreMode,
  pulseKey,
  result,
  resultHandlers,
  onGoalChange,
  onSubmit,
  onFocusChange,
  onActivateCore,
  onPickPrompt,
}: CenterStageProps) {
  const category = selected ? categoryById[selected] : null
  const contextId = selected ?? preview
  const placeholder = contextId ? PLACEHOLDERS[contextId] : 'e.g. I want to grow my Instagram'

  return (
    <div className="flex w-full flex-col items-center gap-5 text-center lg:gap-6">
      <div className="relative flex w-full items-center justify-center lg:h-[min(54vh,520px)]">
        {system}
        <AiCore
          mode={coreMode}
          energy={Math.min(goal.length / 80, 1)}
          typingTick={goal.length}
          pulseKey={pulseKey}
          onActivate={onActivateCore}
          className="size-[min(52vw,220px)] lg:size-[min(32vh,300px)]"
        />
      </div>

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

      <div className="flex w-full flex-col items-center empty:hidden lg:min-h-32">
        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <GoalResult key={result.id} goal={result.goal} areas={result.areas} {...resultHandlers} />
          ) : coreMode === 'activating' ? (
            <GoalThinking key="thinking" />
          ) : goal.trim() ? (
            <GoalEcho key="echo" goal={goal.trim()} categoryTitle={category?.title} />
          ) : category ? (
            <CoreReply key={`reply-${category.id}`} category={category} onPickPrompt={onPickPrompt} />
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden text-[11px] uppercase tracking-[0.4em] text-white/60 lg:block"
            >
              Or explore the capabilities around the core
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {returning}
      {explore}
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
