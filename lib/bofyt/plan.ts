import { categoryById, type CategoryId } from './categories'

const INTENT_PREFIX =
  /^(i\s+(really\s+)?(want|would like|'d like|need|wish|hope|plan)\s+(to\s+)?|i'm\s+trying\s+to\s+|help\s+me\s+(to\s+)?|my\s+goal\s+is\s+(to\s+)?|how\s+(do|can)\s+i\s+)/i

export function toGoalTitle(text: string) {
  const stripped = text.trim().replace(INTENT_PREFIX, '').replace(/[.!?]+$/, '').trim()
  const base = stripped || text.trim()
  const title = base.charAt(0).toUpperCase() + base.slice(1)
  return title.length > 56 ? `${title.slice(0, 54).trimEnd()}…` : title
}

export interface FocusArea {
  label: string
  areaId: CategoryId
}

export function suggestedPaths(areas: CategoryId[]): FocusArea[] {
  const [primary, secondary] = areas
  const paths = categoryById[primary].paths.map((label) => ({ label, areaId: primary }))
  if (!secondary) return paths
  return [...paths.slice(0, 3), { label: categoryById[secondary].title, areaId: secondary }]
}

export interface PlanPhase {
  window: string
  stage: string
  title: string
  description: string
  actions: string[]
}

export interface Plan {
  title: string
  focus: FocusArea[]
  phases: PlanPhase[]
}

const STAGES = [
  { window: 'Weeks 1–2', stage: 'Foundation' },
  { window: 'Weeks 3–6', stage: 'Build' },
  { window: 'Weeks 7–10', stage: 'Accelerate' },
]

export function buildPlan(goal: string, areas: CategoryId[]): Plan {
  const primary = categoryById[areas[0]]
  const supporting = areas.slice(1).map((id) => categoryById[id])

  const phases: PlanPhase[] = STAGES.map((stage, index) => {
    const module = primary.modules[index]
    const support = supporting[index]
    const actions = [
      index === 0 ? `Set a clear baseline for ${module.name.toLowerCase()}` : `Commit to one weekly ${module.name.toLowerCase()} milestone`,
      index === 0 ? 'Pick one daily action under 20 minutes' : 'Review progress every Sunday with the AI Core',
    ]
    if (support) actions.push(`Support it with ${support.title}: ${support.modules[index].description.toLowerCase()}`)
    return { ...stage, title: module.name, description: module.description, actions }
  })

  phases.push({
    window: 'Week 12',
    stage: 'Review',
    title: 'AI Core check-in',
    description: 'Measure the result and set your next level',
    actions: ['Compare against your baseline', 'Let BOFYT recalibrate the next 12 weeks'],
  })

  return { title: toGoalTitle(goal), focus: suggestedPaths(areas), phases }
}
