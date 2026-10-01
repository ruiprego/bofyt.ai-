'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { categoryById, detectCategories, type CategoryId } from '@/lib/bofyt/categories'
import {
  capabilitiesForCategories,
  capabilityById,
  capabilityForCategory,
  type CapabilityId,
  type CapabilitySearchRequest,
} from '@/lib/bofyt/capabilities'
import { activeGoal, planActions, type GoalEntry } from '@/lib/bofyt/goals'
import { detectGoalIntent } from '@/lib/bofyt/intent'
import { deleteSavedProduct, insertGoal, insertGoalActivity, insertSavedProduct, updateGoalProgress, upsertFocusAreas } from '@/lib/bofyt/persistence'
import type { ResultItem } from '@/lib/bofyt/results'
import { accountHrefFor, type BofytReturnState } from '@/lib/bofyt/return-location'
import { ProductSearchClientError, searchProducts } from '@/lib/products/client'
import { createClient } from '@/lib/supabase/client'
import { savedItemKey, type UserProfile } from '@/lib/bofyt/user-data'
import type { ProductSearchFeedback } from '@/lib/products/types'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
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
import type { GoalResultData, GoalResultHandlers } from './goal-result'
import { InfoSheet, type SheetKind } from './info-sheet'
import { PlanSheet } from './plan-sheet'
import { Toast, type ToastMessage } from './toast'

type GoalOutcome = GoalResultData
type IntroStage = 'awakening' | 'discovery' | 'complete'
type CapabilitySearchContext = Pick<CapabilitySearchRequest, 'capabilityId' | 'categoryId'>

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

const contextForCapability = (capabilityId: CapabilityId): CapabilitySearchContext => ({
  capabilityId,
  categoryId: capabilityById[capabilityId].categoryId,
})

export function BofytExperience({
  initialUser,
  initialGoals,
  initialProfile,
  initialSavedItemKeys,
  initialReturn = null,
}: {
  initialUser: User | null
  initialGoals: GoalEntry[]
  initialProfile: UserProfile | null
  initialSavedItemKeys: string[]
  initialReturn?: BofytReturnState | null
}) {
  const returnCapability = initialReturn?.kind === 'capability' ? initialReturn.capability : null
  const returnCapabilityContext =
    initialReturn?.kind === 'capability' && !initialReturn.overlay ? contextForCapability(initialReturn.capability) : null
  const returnSelected =
    initialReturn?.kind === 'category'
      ? initialReturn.category
      : returnCapability
        ? capabilityById[returnCapability].categoryId
        : null

  const inputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const activationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const capabilityEntryRef = useRef(false)
  const searchAbort = useRef<AbortController | null>(null)
  const searchRequest = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userIdRef = useRef<string | null>(initialUser?.id ?? null)

  const [goal, setGoal] = useState('')
  const [goalCapabilityContext, setGoalCapabilityContext] = useState<CapabilitySearchContext | null>(
    returnCapabilityContext && returnCapabilityContext.categoryId !== 'search' ? returnCapabilityContext : null,
  )
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState<CategoryId | null>(returnSelected)
  const [expandedCapability, setExpandedCapability] = useState<CapabilityId | null>(
    initialReturn?.kind === 'capability' && initialReturn.overlay ? initialReturn.capability : null,
  )
  const [preview, setPreview] = useState<CategoryId | null>(null)
  const [activating, setActivating] = useState(false)
  const [result, setResult] = useState<GoalOutcome | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [sheet, setSheet] = useState<SheetKind | null>(null)
  const [navActive, setNavActive] = useState<NavTarget>('home')
  const [coreOpen, setCoreOpen] = useState(false)
  const [introStage, setIntroStage] = useState<IntroStage>(initialReturn ? 'complete' : 'awakening')
  const [planSource, setPlanSource] = useState<GoalOutcome | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<GoalOutcome | null>(null)
  const [searchCapabilityContext, setSearchCapabilityContext] = useState<CapabilitySearchContext | null>(
    returnCapabilityContext?.categoryId === 'search' ? returnCapabilityContext : null,
  )
  const [searchFeedback, setSearchFeedback] = useState<ProductSearchFeedback | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [user, setUser] = useState<User | null>(initialUser)
  const [goals, setGoals] = useState<GoalEntry[]>(initialGoals)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [savedItemIds, setSavedItemIds] = useState<string[]>(initialSavedItemKeys)

  useEffect(() => {
    const supabase = createClient()
    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      const nextUser = session?.user ?? null
      if (nextUser?.id !== userIdRef.current) {
        userIdRef.current = nextUser?.id ?? null
        setGoals([])
        setProfile(null)
        setSavedItemIds([])
      }
      setUser(nextUser)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Strip the restore params so a later reload still plays the normal entry experience.
    if (initialReturn) window.history.replaceState(window.history.state, '', '/')
  }, [initialReturn])

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

  const dismissKeyboard = () => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) activeElement.blur()
  }

  const clearSearchExperience = () => {
    searchAbort.current?.abort()
    searchAbort.current = null
    searchRequest.current += 1
    setSearching(false)
    setSearchQuery('')
    setSearchResult(null)
    setSearchCapabilityContext(null)
    setSearchFeedback(null)
  }

  const clearTransientExperience = () => {
    if (activationTimer.current) clearTimeout(activationTimer.current)
    activationTimer.current = null
    setActivating(false)
    setResult(null)
    setGoal('')
    setGoalCapabilityContext(null)
    setPreview(null)
    setFocused(false)
    clearSearchExperience()
  }

  const coreMode: CoreMode = activating ? 'activating' : selected || preview ? 'selected' : focused || goal ? 'typing' : 'idle'

  const focusInput = () => {
    if (coreOpen) return
    inputRef.current?.focus({ preventScroll: true })
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const selectCategory = (id: CategoryId, options: { preserveGoal?: boolean } = {}) => {
    if (selected !== id) {
      clearSearchExperience()

      if (!options.preserveGoal) {
        if (activationTimer.current) clearTimeout(activationTimer.current)
        activationTimer.current = null
        setActivating(false)
        setResult(null)
        setGoal('')
        setGoalCapabilityContext(null)
        setFocused(false)
      }
    }

    setSelected(id)
    pulse()
  }

  const closeCapability = () => {
    setExpandedCapability(null)
    setPreview(null)
  }

  const openCapability = (id: CapabilityId) => {
    capabilityEntryRef.current = false
    const capability = capabilityById[id]
    clearTransientExperience()
    setSelected(capability.categoryId)
    setExpandedCapability(id)
    setCoreOpen(false)
    setSheet(null)
    setNavActive('home')
    pulse()
  }

  const toggleCapability = (id: CapabilityId) => {
    if (expandedCapability === id) closeCapability()
    else openCapability(id)
  }

  const startFromIntroCapability = (id: CapabilityId) => {
    completeIntro()
    setNavActive('home')
    openCapability(id)
  }

  const enterCapabilityExperience = (id: CapabilityId) => {
    const context = contextForCapability(id)
    clearTransientExperience()
    closeCapability()
    setSelected(context.categoryId)
    setSheet(null)
    setCoreOpen(false)
    setNavActive('home')
    if (context.categoryId === 'search') setSearchCapabilityContext(context)
    else setGoalCapabilityContext(context)
    pulse()
    return true
  }

  const enterExpandedCapability = (id: CapabilityId) => enterCapabilityExperience(id)

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
    if (goalCapabilityContext) {
      setPreview(null)
      return
    }
    if (selected === 'search') setSelected(null)
    if (intent.kind !== 'category') {
      setPreview(null)
      if (intent.categoryId !== selected) setSelected(intent.categoryId)
    } else if (intent.categoryId && intent.categoryId !== selected) {
      setPreview(null)
      selectCategory(intent.categoryId, { preserveGoal: true })
    }
  }

  const startPrompt = (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed) return

    const intent = detectGoalIntent(trimmed)
    const targetCategory = selected ?? intent.categoryId
    const productContext = targetCategory === 'search' ? searchCapabilityContext : goalCapabilityContext
    setResult(null)

    if (intent.kind === 'shopping') {
      setSelected('search')
      setGoal('')
      setGoalCapabilityContext(null)
      setSearchQuery(trimmed)
      setSearchFeedback(null)
      runProductSearch(trimmed, productContext)
    } else {
      submitGoal(trimmed, goalCapabilityContext)
    }

    pulse()
  }

  const selectCapabilityPrompt = (capabilityId: CapabilityId, prompt: string) => {
    const context = contextForCapability(capabilityId)
    const intent = detectGoalIntent(prompt)
    const inferredCategory =
      context.categoryId === 'search' && intent.kind !== 'shopping'
        ? intent.categoryId ?? detectCategories(prompt).find((id) => id !== 'search') ?? 'personal'
        : context.categoryId

    clearTransientExperience()
    closeCapability()
    setResult(null)
    setSelected(inferredCategory)
    setCoreOpen(false)
    setNavActive('home')

    if (context.categoryId === 'search' && intent.kind === 'shopping') {
      setGoalCapabilityContext(null)
      setSearchCapabilityContext(context)
      setSearchQuery(prompt)
      window.setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 0)
    } else {
      setSearchCapabilityContext(null)
      setGoalCapabilityContext(context)
      setGoal(prompt)
      window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0)
    }
    pulse()
  }

  const startCapability = () => {
    if (!expandedCapability) return
    if (expandedCapability === 'reach') {
      enterCapabilityExperience(expandedCapability)
      return
    }
    if (capabilityEntryRef.current) return

    capabilityEntryRef.current = true
    const context = contextForCapability(expandedCapability)
    clearTransientExperience()
    closeCapability()
    setSelected(context.categoryId)
    setSheet(null)
    if (context.categoryId === 'search') {
      setGoalCapabilityContext(null)
      setSearchCapabilityContext(context)
      window.setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 0)
    } else {
      setSearchCapabilityContext(null)
      setGoalCapabilityContext(context)
      setCoreOpen(true)
      setNavActive('core')
    }
    pulse()
  }

  const submitGoal = (goalOverride?: string, contextOverride?: CapabilitySearchContext | null) => {
    const context = contextOverride === undefined ? goalCapabilityContext : contextOverride
    const trimmed = (goalOverride ?? goal).trim()
    if (!trimmed || activationTimer.current) {
      focusInput()
      pulse()
      return
    }

    dismissKeyboard()
    const intent = detectGoalIntent(trimmed)
    if (intent.kind === 'shopping') {
      setActivating(false)
      setGoalCapabilityContext(null)
      setResult(null)
      setGoal('')
      setPreview(null)
      setExpandedCapability(null)
      setSelected('search')
      setCoreOpen(false)
      setSearchQuery(trimmed)
      setSearchFeedback(null)
      runProductSearch(trimmed, context)
      pulse()
      return
    }

    if (selected === 'search' || context?.categoryId === 'search') clearSearchExperience()

    const preferredArea = context?.categoryId && context.categoryId !== 'search'
      ? context.categoryId
      : intent.categoryId ?? (intent.kind === 'category' && selected !== 'search' ? selected : null)
    const areas = detectCategories(trimmed, preferredArea).filter((id) => id !== 'search')
    const fallbackArea = context?.categoryId && context.categoryId !== 'search' ? context.categoryId : 'personal'
    const goalAreas: CategoryId[] = areas.length ? areas : [fallbackArea]

    setGoalCapabilityContext(context)
    setSearchCapabilityContext(null)
    setActivating(true)
    setResult(null)
    pulse()
    activationTimer.current = setTimeout(() => {
      activationTimer.current = null
      setActivating(false)
      setSelected(goalAreas[0] ?? intent.categoryId ?? null)
      setResult({ id: crypto.randomUUID(), goal: trimmed, areas: goalAreas, capabilityId: context?.capabilityId })
      setGoal('')
      pulse()
    }, 1400)
  }

  function runProductSearch(query: string, contextOverride?: CapabilitySearchContext | null) {
    const context = contextOverride === undefined ? searchCapabilityContext : contextOverride
    const trimmed = query.trim()
    if (!trimmed) return

    dismissKeyboard()
    searchAbort.current?.abort()
    const controller = new AbortController()
    const requestId = ++searchRequest.current
    searchAbort.current = controller
    setSearchQuery(trimmed)
    setSearchCapabilityContext(context)
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
          capabilityId: context?.capabilityId,
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

  const submitProductSearch = (queryOverride?: string) => runProductSearch(queryOverride ?? searchQuery)

  const submitCapabilitySearch = (request: CapabilitySearchRequest) => {
    const context: CapabilitySearchContext = {
      capabilityId: request.capabilityId,
      categoryId: request.categoryId,
    }

    clearTransientExperience()
    dismissKeyboard()
    closeCapability()
    setSelected(request.categoryId)
    setNavActive('home')
    setCoreOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setSearchCapabilityContext(null)
    setGoalCapabilityContext(context)
    setSearchResult(null)
    setGoal(request.query)
    submitGoal(request.query, context)

    pulse()
  }

  const reset = () => {
    clearTransientExperience()
    setSelected(null)
    closeCapability()
    setCoreOpen(false)
    setNavActive('home')
    window.setTimeout(focusInput, 0)
  }

  const editResult = () => {
    if (!result) return
    if (activationTimer.current) clearTimeout(activationTimer.current)
    activationTimer.current = null
    setActivating(false)
    setGoalCapabilityContext(result.capabilityId ? contextForCapability(result.capabilityId) : null)
    setGoal(result.goal)
    setResult(null)
    window.setTimeout(focusInput, 0)
  }

  const resetSearch = () => {
    const context = searchCapabilityContext
    searchAbort.current?.abort()
    searchAbort.current = null
    searchRequest.current += 1
    setSearching(false)
    setSearchFeedback(null)
    setSearchResult(null)
    setSearchCapabilityContext(context)
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

  const saveGoal = (entry: GoalOutcome, successMessage: string) => {
    if (goals.some((savedGoal) => savedGoal.id === entry.id)) {
      notify(successMessage)
      return
    }

    const persistedEntry: GoalEntry = {
      id: entry.id,
      goal: entry.goal,
      areas: entry.areas,
      capabilityId: entry.capabilityId,
      createdAt: Date.now(),
      done: 0,
      status: 'active',
    }
    const previousProfile = profile
    const nextFocusAreas = Array.from(
      new Set([...(profile?.focusAreas ?? []), ...entry.areas.filter((area) => area !== 'search')]),
    )

    setGoals((current) => [persistedEntry, ...current])
    if (user) {
      const now = new Date().toISOString()
      setProfile({
        userId: user.id,
        displayName: profile?.displayName ?? null,
        focusAreas: nextFocusAreas,
        createdAt: profile?.createdAt ?? now,
        updatedAt: now,
      })
    }
    notify(successMessage)

    if (!user) return

    void (async () => {
      const goalSync = await insertGoal(user.id, persistedEntry)
      if (goalSync.error) {
        setGoals((current) => current.filter((savedGoal) => savedGoal.id !== persistedEntry.id))
        setProfile(previousProfile)
        notify('Unable to sync this goal. Please try again.')
        return
      }

      const profileSync = await upsertFocusAreas(user.id, nextFocusAreas)
      if (profileSync.error) notify('Goal saved, but your focus profile could not sync.')
    })()
  }

  const toggleSavedItem = (item: ResultItem) => {
    const itemKey = savedItemKey(item)
    const wasSaved = savedItemIds.includes(itemKey)
    setSavedItemIds((current) => (wasSaved ? current.filter((id) => id !== itemKey) : [...current, itemKey]))
    notify(wasSaved ? `Removed ${item.name} from saved products` : `${item.name} saved`)

    if (!user || !item.productUrl) return

    void (async () => {
      const sync = wasSaved ? await deleteSavedProduct(user.id, itemKey) : await insertSavedProduct(user.id, item)
      if (!sync.error) return

      setSavedItemIds((current) =>
        wasSaved ? Array.from(new Set([...current, itemKey])) : current.filter((id) => id !== itemKey),
      )
      notify('Unable to sync this saved product. Please try again.')
    })()
  }

  const advanceGoal = (id: string) => {
    const entry = goals.find((goalEntry) => goalEntry.id === id)
    if (!entry) return

    const actions = planActions(entry)
    const nextDone = Math.min(entry.done + 1, actions.length)
    if (nextDone === entry.done) return
    const nextStatus = nextDone >= actions.length ? 'completed' : 'active'
    const updatedEntry = { ...entry, done: nextDone, status: nextStatus as GoalEntry['status'] }

    setGoals((current) => current.map((goalEntry) => (goalEntry.id === id ? updatedEntry : goalEntry)))
    notify('Next action completed')

    if (!user) return

    void (async () => {
      const goalSync = await updateGoalProgress(user.id, id, nextDone, nextStatus)
      if (goalSync.error) {
        setGoals((current) => current.map((goalEntry) => (goalEntry.id === id ? entry : goalEntry)))
        notify('Unable to sync progress. Please try again.')
        return
      }

      const activitySync = await insertGoalActivity(user.id, id, nextDone)
      if (activitySync.error) notify('Progress saved, but the activity record could not sync.')
    })()
  }

  const saveResult = () => {
    if (!result) return
    saveGoal(result, 'Goal saved to progress')
  }

  const openProgress = () => {
    setSheet('progress')
    setNavActive('progress')
  }

  const startPlan = () => {
    if (planSource) saveGoal(planSource, 'Plan added to progress')
    setPlanSource(null)
    setCoreOpen(false)
    openProgress()
  }

  const resumeGoal = (entry: { id: string; goal: string; areas: CategoryId[] }) => {
    clearTransientExperience()
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
      clearTransientExperience()
      setSheet(null)
      setCoreOpen(false)
      setSelected(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'explore') {
      clearTransientExperience()
      setSheet(null)
      setCoreOpen(false)
      setSelected(null)
      document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
    } else if (target === 'core') {
      clearTransientExperience()
      setSheet(null)
      setSelected(null)
      setCoreOpen(true)
      pulse()
    } else {
      setSheet(target)
    }
  }

  const resultHandlers: GoalResultHandlers = {
    saved: Boolean(result && goals.some((entry) => entry.id === result.id)),
    savedItemIds,
    onEdit: editResult,
    onReset: reset,
    onBuildPlan: () => result && setPlanSource(result),
    onSave: saveResult,
    onToggleSavedItem: toggleSavedItem,
    onOpenProgress: openProgress,
    onNotify: notify,
  }

  const searchResultHandlers: GoalResultHandlers = {
    saved: Boolean(searchResult && goals.some((entry) => entry.id === searchResult.id)),
    savedItemIds,
    onEdit: editSearch,
    onReset: resetSearch,
    onBuildPlan: () => searchResult && setPlanSource(searchResult),
    onSave: () => {
      if (!searchResult) return
      saveGoal(searchResult, 'Search saved to progress')
    },
    onToggleSavedItem: toggleSavedItem,
    onOpenProgress: openProgress,
    onNotify: notify,
  }

  const highlighted = result?.areas ?? []
  const recommendedCapabilities = capabilitiesForCategories(highlighted)
  const selectedCapabilityId = capabilityForCategory(selected)
  const selectedCapability = selectedCapabilityId ? capabilityById[selectedCapabilityId] : null
  const returning = !result ? activeGoal(goals) : null
  const expandedPresentation = expandedCapability ? capabilityById[expandedCapability] : null
  const enteredCapability = (goalCapabilityContext ?? searchCapabilityContext)?.capabilityId ?? null
  const currentReturnState: BofytReturnState = expandedCapability
    ? { kind: 'capability', capability: expandedCapability, overlay: true }
    : enteredCapability
      ? { kind: 'capability', capability: enteredCapability, overlay: false }
      : selected
        ? { kind: 'category', category: selected }
        : { kind: 'home' }

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
              onEnter={enterExpandedCapability}
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
          searchAutoFocus={!expandedCapability}
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
        onEnter={() => {
          if (expandedCapability) enterCapabilityExperience(expandedCapability)
        }}
        onSelectModule={(module) => {
          if (expandedCapability) selectCapabilityPrompt(expandedCapability, module.prompt)
        }}
        onCapabilitySearch={submitCapabilitySearch}
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
        capability={selectedCapability}
        hasGoal={Boolean(goal.trim()) || Boolean(result)}
        onNavigate={navigate}
      />

      <InfoSheet
        kind={sheet}
        goals={goals}
        profile={profile}
        user={user}
        accountHref={accountHrefFor(currentReturnState)}
        onSignedOut={() => {
          userIdRef.current = null
          setUser(null)
          setGoals([])
          setProfile(null)
          setSavedItemIds([])
          setSheet(null)
          notify('Signed out')
        }}
        onClose={() => setSheet(null)}
        onAdvance={advanceGoal}
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
