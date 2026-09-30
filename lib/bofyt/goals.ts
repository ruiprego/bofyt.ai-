'use client'

import { useSyncExternalStore } from 'react'
import { categoryById, type CategoryId } from './categories'
import { buildPlan } from './plan'

export interface GoalEntry {
  id: string
  goal: string
  areas: CategoryId[]
  createdAt: number
  done: number
}

export interface GoalProgress {
  percent: number
  next: string | null
  total: number
}

const STORAGE_KEY = 'bofyt:goals:v1'
const EMPTY: GoalEntry[] = []
const listeners = new Set<() => void>()
let cache: GoalEntry[] | null = null

const isEntry = (value: unknown): value is GoalEntry => {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.goal === 'string' &&
    Array.isArray(entry.areas) &&
    entry.areas.length > 0 &&
    entry.areas.every((id) => typeof id === 'string' && id in categoryById)
  )
}

function read(): GoalEntry[] {
  if (cache) return cache
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    cache = Array.isArray(parsed)
      ? parsed.filter(isEntry).map((entry) => ({
          ...entry,
          createdAt: Number(entry.createdAt) || Date.now(),
          done: Math.max(0, Math.floor(Number(entry.done) || 0)),
        }))
      : []
  } catch {
    cache = []
  }
  return cache
}

function write(next: GoalEntry[]) {
  cache = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage can be unavailable (private mode, quota); progress still works for this session.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return
    cache = null
    listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useGoals() {
  return useSyncExternalStore(subscribe, read, () => EMPTY)
}

export const goalStore = {
  save(entry: Omit<GoalEntry, 'createdAt' | 'done'>) {
    const current = read()
    if (current.some((goal) => goal.id === entry.id)) return
    write([{ ...entry, createdAt: Date.now(), done: 0 }, ...current])
  },
  advance(id: string) {
    write(
      read().map((goal) => (goal.id === id ? { ...goal, done: Math.min(goal.done + 1, planActions(goal).length) } : goal)),
    )
  },
  remove(id: string) {
    write(read().filter((goal) => goal.id !== id))
  },
}

export function planActions(entry: Pick<GoalEntry, 'goal' | 'areas'>) {
  return buildPlan(entry.goal, entry.areas).phases.flatMap((phase) => phase.actions)
}

export function progressOf(entry: GoalEntry): GoalProgress {
  const actions = planActions(entry)
  const done = Math.min(entry.done, actions.length)
  return {
    percent: actions.length ? Math.round((done / actions.length) * 100) : 0,
    next: actions[done] ?? null,
    total: actions.length,
  }
}

export const activeGoal = (goals: GoalEntry[]) => goals.find((goal) => progressOf(goal).next !== null) ?? null
