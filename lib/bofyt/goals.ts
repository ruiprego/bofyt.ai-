import { type CategoryId } from './categories'
import { buildPlan } from './plan'

export interface GoalEntry {
  id: string
  goal: string
  areas: CategoryId[]
  capabilityId?: string
  createdAt: number
  done: number
  status?: 'active' | 'completed' | 'archived'
}

export interface GoalProgress {
  percent: number
  next: string | null
  total: number
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
