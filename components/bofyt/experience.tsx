'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { categoryById, detectCategories, type CategoryId } from '@/lib/bofyt/categories'
import {
  capabilitiesForCategories,
  capabilityById,
  capabilityForCategory,
  type CapabilityId,
} from '@/lib/bofyt/capabilities'
import { activeGoal, goalStore, useGoals } from '@/lib/bofyt/goals'
import { detectGoalIntent } from '@/lib/bofyt/intent'
import { ProductSearchClientError, searchProducts } from '@/lib/products/client'
import type { ProductSearchFeedback } from '@/lib/products/types'
import type { CoreMode } from './ai-core'
import { BottomNav, type NavTarget } from './bottom-nav'
import { BrandHeader } from './brand-header'
import { CapabilityDiscovery } from './capability-discovery'
import { CapabilityOverlay } from './capability-overlay'
import { CategoryCarousel } from './category-carousel'
import { CenterStage } from './center-stage'
import { CoreOverlay } from './core-overlay'
import { CoreAwakening } from './core-awakening'
import { ContinueGoal } from './continue-goal'
import { GoalResult, type GoalResultData, type GoalResultHandlers } from './goal-result'
import { InfoSheet, type SheetKind } from './info-sheet'
import { PlanSheet } from './plan-sheet'
import { Toast, type ToastMessage } from './toast'

type GoalOutcome = GoalResultData
type IntroStage = 'awakening' | 'discovery' | 'complete'

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

export function BofytExperience() {
  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const activationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchAbort = useRef<AbortController | null>(null)
  const searchRequest = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [goal, setGoal] = useState('')
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState<CategoryId | null>(null)
  const [expandedCapability, setExpandedCapability] = useState<CapabilityId | null>(null)
  const [preview, setPreview] = useState<CategoryId | null>(null)
  const [activating, setActivating] = useState(false)
  const [result, setResult] = useState<GoalOutcome | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [sheet, setSheet] = useState<SheetKind | null>(null)
  const [navActive, setNavActive] = useState<NavTarget>('home')
  const [coreOpen, setCoreOpen] = useState(false)
  const [introStage, setIntroStage] = useState<IntroStage>('awakening')
  const [planSource, setPlanSource] = useState<GoalOutcome | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<GoalOutcome | null>(null)
  const [searchFeedback, setSearchFeedback] = useState<ProductSearchFeedback | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const goals = useGoals()

  const pulse = () => setPulseKey((key) => key + 1)
  const completeIntro = useCallback(() => setIntroStage('complete'), [])
  const completeAwakening = useCallback(() => setIntroStage('discovery'), [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (planSource) setPlanSource(null)
      else if (expandedCapability) {
        setExpandedCapability(null)
        setPreview(null)
      } else if (coreOpen) setCoreOpen(false)
      else if (sheet) setSheet(null)
      else setSelected(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sheet, coreOpen, planSource, expandedCapability])

  useEffect(
    () => () => {
      if (activationTimer.current) clearTimeout(activationTimer.current)
      if (searchAbort.current) searchAbort.current.abort()
      if (toastTimer.current) clearTimeout(toastTimer.current)
    },
    [],
  )

  const notify = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text })
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  const coreMode: CoreMode = activating ? 'activating' : selected || preview ? 'selected' : focused || goal ? 'typing' : 'idle'

  const focusInput = () => {
    if (coreOpen) return
    inputRef.current?.focus({ preventScroll: true })
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const selectCategory = (id: CategoryId) => {
    setSelected(id)
    pulse()
  }

  const closeCapability = () => {
    setExpandedCapability(null)
    setPreview(null)
  }

  const openCapability = (id: CapabilityId) => {
    const capability = capabilityById[id]
    setSelected(capability.categoryId)
    setExpandedCapability(id)
    setCoreOpen(false)
    setSheet(null)
    setPreview(null)
    pulse()
  }

  const toggleCapability = (id: CapabilityId) => {
    setResult(null)
    if (expandedCapability === id) closeCapability()
    else openCapability(id)
  }

  const startFromIntroCapability = (id: CapabilityId) => {
    completeIntro()
    setResult(null)
    setGoal('')
    setNavActive('home')
    openCapability(id)
  }

  const pickFromGrid = (id: CapabilityId) => {
    toggleCapability(id)
    if (!isDesktop()) headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const changeGoal = (value: string) => {
    setGoal(value)
    if (result) setResult(null)

    const intent = detectGoalIntent(value)
    if (intent.kind === 'shopping') {
      setPreview(null)
      return
    }
    if (selected === 'search') setSelected(null)
    if (intent.kind !== 'category') {
      setPreview(null)
      if (intent.categoryId !== selected) setSelected(intent.categoryId)
    } else if (intent.categoryId && intent.categoryId !== selected) {
      setPreview(null)
      selectCategory(intent.categoryId)
    }
  }

  const startPrompt = (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed) return

    const intent = detectGoalIntent(trimmed)
    const targetCategory = selected ?? intent.categoryId
    setResult(null)

    if (targetCategory === 'search' || intent.kind === 'shopping') {
      setSelected('search')
      setGoal('')
      setSearchQuery(trimmed)
      setSearchFeedback(null)
      runProductSearch(trimmed)
    } else {
      submitGoal(trimmed)
    }

    pulse()
  }

  const selectCapabilityPrompt = (capabilityId: CapabilityId, prompt: string) => {
    const id = capabilityById[capabilityId].categoryId
    closeCapability()
    setResult(null)
    setSelected(id)

    if (id === 'search') {
      setSearchFeedback(null)
      setSearchQuery(prompt)
      window.setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 0)
    } else {
      setGoal(prompt)
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0)
    }
    pulse()
  }

  const startCapability = () => {
    if (!expandedCapability) return
    const id = capabilityById[expandedCapability].categoryId
    closeCapability()
    setSelected(id)
    if (id === 'search') {
      window.setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 0)
    } else {
      setCoreOpen(true)
      setNavActive('core')
    }
    pulse()
  }

  const submitGoal = (goalOverride?: string) => {
    const trimmed = (goalOverride ?? goal).trim()
    if (!trimmed || activating) {
      focusInput()
      pulse()
      return
    }

    const intent = detectGoalIntent(trimmed)
    if (intent.kind === 'shopping') {
      setActivating(false)
      setResult(null)
      setGoal('')
      setPreview(null)
      setExpandedCapability(null)
      setSelected('search')
      setCoreOpen(false)
      setSearchQuery(trimmed)
      setSearchFeedback(null)
      runProductSearch(trimmed)
      pulse()
      return
    }

    const preferredArea = intent.categoryId ?? (intent.kind === 'category' && selected !== 'search' ? selected : null)
    const areas = detectCategories(trimmed, preferredArea).filter((id) => id !== 'search')
    const goalAreas: CategoryId[] = areas.length ? areas : ['personal']

    setActivating(true)
    setResult(null)
    pulse()
    activationTimer.current = setTimeout(() => {
      setActivating(false)
      setSelected(intent.categoryId)
      setResult({ id: crypto.randomUUID(), goal: trimmed, areas: goalAreas })
      setGoal('')
      pulse()
    }, 1400)
  }

  function runProductSearch(query: string) {
    const trimmed = query.trim()
    if (!trimmed || searching) return

    searchAbort.current?.abort()
    const controller = new AbortController()
    const requestId = ++searchRequest.current
    searchAbort.current = controller
    setSearchFeedback(null)
    setSearching(true)
    setSearchResult(null)
    pulse()

    void searchProducts(trimmed, controller.signal)
      .then((response) => {
        if (controller.signal.aborted || requestId !== searchRequest.current) return
        searchAbort.current = null
        setSearching(false)
        setSearchResult({
          id: crypto.randomUUID(),
          goal: trimmed,
          areas: ['search'],
          products: response.products,
          closestProducts: response.closestProducts,
          priceConstraint: response.priceConstraint,
        })
        pulse()
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || requestId !== searchRequest.current) return
        searchAbort.current = null
        setSearching(false)
        setSearchFeedback({
          kind: error instanceof ProductSearchClientError && error.code === 'CONFIGURATION' ? 'configuration' : 'error',
          message: error instanceof Error ? error.message : 'The live product search could not be reached. Try again.',
        })
        pulse()
      })
  }

  const submitProductSearch = () => runProductSearch(searchQuery)

  const reset = () => {
    if (activationTimer.current) clearTimeout(activationTimer.current)
    setActivating(false)
    setResult(null)
    setGoal('')
    setSelected(null)
    closeCapability()
    setTimeout(focusInput, 0)
  }

  const editResult = () => {
    if (!result) return
    if (activationTimer.current) clearTimeout(activationTimer.current)
    setActivating(false)
    setGoal(result.goal)
    setResult(null)
    setTimeout(focusInput, 0)
  }

  const resetSearch = () => {
    searchAbort.current?.abort()
    searchAbort.current = null
    searchRequest.current += 1
    setSearching(false)
    setSearchFeedback(null)
    setSearchResult(null)
    setSearchQuery('')
    pulse()
  }

  const editSearch = () => {
    if (!searchResult) return
    searchAbort.current?.abort()
    searchAbort.current = null
    searchRequest.current += 1
    setSearching(false)
    setSearchFeedback(null)
    setSearchQuery(searchResult.goal)
    setSearchResult(null)
    pulse()
  }

  const saveResult = () => {
    if (!result) return
    goalStore.save(result)
    notify('Goal saved to progress')
  }

  const openProgress = () => {
    setSheet('progress')
    setNavActive('progress')
  }

  const startPlan = () => {
    if (planSource) goalStore.save(planSource)
    setPlanSource(null)
    setCoreOpen(false)
    openProgress()
    notify('Plan added to progress')
  }

  const resumeGoal = (entry: { id: string; goal: string; areas: CategoryId[] }) => {
    setSheet(null)
    setNavActive('home')
    setSelected(entry.areas[0] ?? null)
    setResult(entry)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigate = (target: NavTarget) => {
    closeCapability()
    setNavActive(target)
    if (target === 'home') {
      setSheet(null)
      setCoreOpen(false)
      if (selected === 'search') setSelected(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'explore') {
      setSheet(null)
      document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
    } else if (target === 'core') {
      setSheet(null)
      if (selected === 'search') setSelected(null)
      setCoreOpen(true)
      pulse()
    } else {
      setSheet(target)
    }
  }

  const resultHandlers: GoalResultHandlers = {
    saved: Boolean(result && goals.some((entry) => entry.id === result.id)),
    onEdit: editResult,
    onReset: reset,
    onBuildPlan: () => result && setPlanSource(result),
    onSave: saveResult,
    onOpenProgress: openProgress,
    onNotify: notify,
  }

  const searchResultHandlers: GoalResultHandlers = {
    saved: Boolean(searchResult && goals.some((entry) => entry.id === searchResult.id)),
    onEdit: editSearch,
    onReset: resetSearch,
    onBuildPlan: () => searchResult && setPlanSource(searchResult),
    onSave: () => {
      if (!searchResult) return
      goalStore.save(searchResult)
      notify('Search saved to progress')
    },
    onOpenProgress: openProgress,
    onNotify: notify,
  }

  const highlighted = result?.areas ?? []
  const recommendedCapabilities = capabilitiesForCategories(highlighted)
  const selectedCapabilityId = capabilityForCategory(selected)
  const selectedCapability = selectedCapabilityId ? capabilityById[selectedCapabilityId] : null
  const returning = !result ? activeGoal(goals) : null
  const expandedPresentation = expandedCapability ? capabilityById[expandedCapability] : null

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-void text-white">
      {introStage === 'complete' && (
        <div className="relative">
        <AmbientBackdrop />
        <BrandHeader progressCount={goals.length} onOpenSheet={setSheet} />

      <main className="relative z-10 flex flex-col items-center px-4 pb-32 pt-2 lg:px-8 lg:pb-12 lg:pt-2">
        <CenterStage
          inputRef={inputRef}
          headingRef={headingRef}
          goal={goal}
          selected={selected}
          preview={preview}
          system={null}
          explore={              <CategoryCarousel selected={selectedCapabilityId} highlighted={recommendedCapabilities} onSelect={pickFromGrid} />}
          centeredExplore={
            <CategoryCarousel
              layout="core"
              selected={selectedCapabilityId}
              highlighted={recommendedCapabilities}
              onSelect={pickFromGrid}
            />
          }
          returning={
            returning ? <ContinueGoal entry={returning} onContinue={() => resumeGoal(returning)} /> : null
          }
          coreMode={coreMode}
          pulseKey={pulseKey}
          result={result}
          resultHandlers={resultHandlers}
          capability={selectedCapability}
          searchInputRef={searchInputRef}
          searchQuery={searchQuery}
          searchBusy={searching}
          searchResult={searchResult}
          searchResultHandlers={searchResultHandlers}
          searchFeedback={searchFeedback}
          onGoalChange={changeGoal}
          onSubmit={submitGoal}
          onFocusChange={setFocused}
          onActivateCore={() => {
            pulse()
            focusInput()
          }}
          onPickPrompt={startPrompt}
          onSearchChange={setSearchQuery}
          onSearchSubmit={submitProductSearch}
          onRetrySearch={submitProductSearch}
        />
      </main>

      <CapabilityOverlay
      category={expandedPresentation ? categoryById[expandedPresentation.categoryId] : null}
      capability={expandedPresentation}
      displayIndex={expandedPresentation?.index}

        displayTitle={expandedPresentation?.title}
        displayDescription={expandedPresentation?.description}
        onClose={closeCapability}
        onStart={startCapability}
        onSelectModule={(module) => {
          if (expandedCapability) selectCapabilityPrompt(expandedCapability, module.prompt)
        }}
      />

      <CoreOverlay
        open={coreOpen}
        category={selected && selected !== 'search' ? categoryById[selected] : null}
        goal={goal}
        activating={activating}
        pulseKey={pulseKey}
        result={result}
        resultHandlers={resultHandlers}
        onGoalChange={changeGoal}
        onSubmit={submitGoal}
        onPulse={pulse}
        onClose={() => {
          setCoreOpen(false)
          setNavActive('home')
        }}
      />

      <PlanSheet source={planSource} onClose={() => setPlanSource(null)} onStart={startPlan} />

      <BottomNav
        active={coreOpen ? 'core' : (sheet ?? navActive)}
        progressCount={goals.length}
        category={selected && selected !== 'search' ? categoryById[selected] : null}
        hasGoal={Boolean(goal.trim()) || Boolean(result)}
        onNavigate={navigate}
      />

      <InfoSheet
        kind={sheet}
        goals={goals}
        onClose={() => setSheet(null)}
        onAdvance={(id) => {
          goalStore.advance(id)
          notify('Next action completed')
        }}
        onOpenGoal={(entry) => resumeGoal(entry)}
      />
          <Toast message={toast} />
        </div>
      )}
      {introStage === 'awakening' && <CoreAwakening onContinue={completeAwakening} />}
      {introStage === 'discovery' && <CapabilityDiscovery onSelectCapability={startFromIntroCapability} />}
    </div>
  )
}

function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[32%] size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(226,184,101,0.13),transparent_60%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_bottom,rgba(226,184,101,0.1),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.85))]" />
    </div>
  )
}
