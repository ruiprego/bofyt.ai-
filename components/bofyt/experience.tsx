'use client'

import { useEffect, useRef, useState } from 'react'
import { categoryById, detectCategories, detectPrimary, type CategoryId } from '@/lib/bofyt/categories'
import { activeGoal, goalStore, useGoals } from '@/lib/bofyt/goals'
import type { CoreMode } from './ai-core'
import { BottomNav, type NavTarget } from './bottom-nav'
import { BrandHeader } from './brand-header'
import { CategoryCarousel } from './category-carousel'
import { CategoryWall, wallSideOf } from './category-wall'
import { CenterStage } from './center-stage'
import { CoreOverlay } from './core-overlay'
import { CoreSystem } from './core-system'
import { ContinueGoal } from './continue-goal'
import { GoalResult, type GoalResultHandlers } from './goal-result'
import { InfoSheet, type SheetKind } from './info-sheet'
import { PlanSheet } from './plan-sheet'
import { Toast, type ToastMessage } from './toast'

type GoalOutcome = { id: string; goal: string; areas: CategoryId[] }

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

export function BofytExperience() {
  const inputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const activationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [goal, setGoal] = useState('')
  const [focused, setFocused] = useState(false)
  const [selected, setSelected] = useState<CategoryId | null>(null)
  const [preview, setPreview] = useState<CategoryId | null>(null)
  const [activating, setActivating] = useState(false)
  const [result, setResult] = useState<GoalOutcome | null>(null)
  const [pulseKey, setPulseKey] = useState(0)
  const [sheet, setSheet] = useState<SheetKind | null>(null)
  const [navActive, setNavActive] = useState<NavTarget>('home')
  const [coreOpen, setCoreOpen] = useState(false)
  const [planSource, setPlanSource] = useState<GoalOutcome | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const goals = useGoals()

  const pulse = () => setPulseKey((key) => key + 1)

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (planSource) setPlanSource(null)
      else if (coreOpen) setCoreOpen(false)
      else if (sheet) setSheet(null)
      else setSelected(null)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [sheet, coreOpen, planSource])

  useEffect(
    () => () => {
      if (activationTimer.current) clearTimeout(activationTimer.current)
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

  const toggleCategory = (id: CategoryId) => {
    setResult(null)
    if (selected === id) setSelected(null)
    else selectCategory(id)
  }

  const pickFromGrid = (id: CategoryId) => {
    toggleCategory(id)
    if (!isDesktop()) headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const changeGoal = (value: string) => {
    setGoal(value)
    if (result) setResult(null)
    const detected = detectPrimary(value)
    if (detected && detected !== selected) {
      setPreview(null)
      selectCategory(detected)
    }
  }

  const applyPrompt = (prompt: string) => {
    setGoal(prompt)
    setResult(null)
    pulse()
    focusInput()
  }

  const submitGoal = () => {
    const trimmed = goal.trim()
    if (!trimmed || activating) {
      focusInput()
      pulse()
      return
    }
    const areas = detectCategories(trimmed, selected)
    setActivating(true)
    setResult(null)
    pulse()
    activationTimer.current = setTimeout(() => {
      setActivating(false)
      setSelected(areas[0])
      setResult({ id: crypto.randomUUID(), goal: trimmed, areas })
      setGoal('')
      pulse()
    }, 1400)
  }

  const reset = () => {
    setResult(null)
    setGoal('')
    setSelected(null)
    focusInput()
  }

  const editResult = () => {
    if (!result) return
    setGoal(result.goal)
    setResult(null)
    setTimeout(focusInput, 0)
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
    setNavActive(target)
    if (target === 'home') {
      setSheet(null)
      setCoreOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'explore') {
      setSheet(null)
      document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })
    } else if (target === 'core') {
      setSheet(null)
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
  const highlighted = result?.areas ?? []
  const returning = !result ? activeGoal(goals) : null
  const focusId = preview ?? selected

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-void text-white">
      <AmbientBackdrop />
      <BrandHeader progressCount={goals.length} onOpenSheet={setSheet} />

      <main className="relative z-10 flex flex-col items-center px-4 pb-32 pt-2 lg:px-8 lg:pb-12 lg:pt-2">
        <CenterStage
          inputRef={inputRef}
          headingRef={headingRef}
          goal={goal}
          selected={selected}
          preview={preview}
          system={
            <div className="pointer-events-none absolute inset-0">
              <CoreSystem
                selected={selected}
                preview={preview}
                highlighted={highlighted}
                onSelect={toggleCategory}
                onPreview={setPreview}
              />
              <div className="absolute inset-x-0 inset-y-0 hidden items-center justify-between px-1 xl:flex 2xl:px-5">
                <div className="pointer-events-auto w-[min(31vw,500px)] shrink-0">
                  <CategoryWall
                    side="left"
                    focusId={focusId}
                    highlighted={highlighted}
                    receded={Boolean(focusId && wallSideOf(focusId) !== 'left')}
                    onSelect={toggleCategory}
                    onPreview={setPreview}
                  />
                </div>
                <div className="pointer-events-auto w-[min(31vw,500px)] shrink-0">
                  <CategoryWall
                    side="right"
                    focusId={focusId}
                    highlighted={highlighted}
                    receded={Boolean(focusId && wallSideOf(focusId) !== 'right')}
                    onSelect={toggleCategory}
                    onPreview={setPreview}
                  />
                </div>
              </div>
            </div>
          }
          explore={<CategoryCarousel selected={selected} highlighted={highlighted} onSelect={pickFromGrid} />}
          returning={
            returning ? <ContinueGoal entry={returning} onContinue={() => resumeGoal(returning)} /> : null
          }
          coreMode={coreMode}
          pulseKey={pulseKey}
          result={result}
          resultHandlers={resultHandlers}
          onGoalChange={changeGoal}
          onSubmit={submitGoal}
          onFocusChange={setFocused}
          onActivateCore={() => {
            pulse()
            focusInput()
          }}
          onPickPrompt={applyPrompt}
        />
      </main>

      <CoreOverlay
        open={coreOpen}
        category={selected ? categoryById[selected] : null}
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
        category={selected ? categoryById[selected] : null}
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
