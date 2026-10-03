import { isProductSearchQuery } from '../products/parse'
import { categoryById, detectPrimary, type CategoryId } from './categories'

export type GoalIntentKind =
  | 'shopping'
  | 'travel'
  | 'fitness'
  | 'finance'
  | 'career'
  | 'conversion'
  | 'automation'
  | 'category'

export interface GoalIntent {
  kind: GoalIntentKind
  label: string
  categoryId: CategoryId | null
}

type ActionIntentKind = Exclude<GoalIntentKind, 'shopping' | 'category'>

type WeightedTerm = [pattern: RegExp, weight: number]

interface IntentDomain {
  kind: ActionIntentKind
  label: string
  categoryId: CategoryId | null
  /** Terms that carry the goal's meaning on their own. */
  core: WeightedTerm[]
  /** Objects that sharpen a goal only once a core term has established the domain. */
  context?: WeightedTerm[]
}

const MIN_INTENT_SCORE = 1.5

// Listed in tie-break order: on equal scores the earlier domain wins.
const INTENT_DOMAINS: IntentDomain[] = [
  {
    kind: 'career',
    label: 'Career / Jobs',
    categoryId: null,
    core: [
      [/\b(jobs?|careers?|employment|resumes?|cv|interviews?|recruit\w*|hiring|promotion)\b/i, 3],
      [/\b(roles?|positions?)\b/i, 1],
      [/\bwork\b(?!\s+out)/i, 1],
    ],
  },
  {
    kind: 'travel',
    label: 'Travel',
    categoryId: null,
    core: [
      [/\b(flights?|fly|flying|airports?|airlines?|travel\w*|trips?|hotels?|hostels?|vacations?|holidays?|destinations?|itinerar\w*|airbnb|tours?)\b/i, 3],
    ],
  },
  {
    kind: 'finance',
    label: 'Finance',
    categoryId: 'personal',
    core: [
      [/\b(money|financ\w*|budget\w*|debts?|invest\w*|savings?|retire\w*|pension)\b/i, 2],
      [/\bsav(e|ing)\b(?!\s+(?:time|hours?|effort))/i, 2],
      [/\b(income|expenses?|spending|spend|salary|wealth)\b/i, 1.5],
      [/[€$£]\s?\d|\d\s?(?:€|eur|euros?|usd|dollars?|gbp|pounds?)\b|\b(usd|eur|gbp|chf)\b/i, 1],
    ],
  },
  {
    kind: 'fitness',
    label: 'Fitness',
    categoryId: 'personal',
    core: [
      [/\bfit(?:ter|test|ness)?\b/i, 2.5],
      [/\b(?:in|into)\s+(?:better\s+)?shape\b/i, 2.5],
      [/\blose\s+\d+\s*(?:kg|kilos?|pounds?|lbs?)\b/i, 3],
      [/\b(workouts?|work\s+out|exercis\w*|gym|cardio|marathon|muscles?|yoga|pilates|jog\w*|swim\w*|cycling|athlet\w*)\b/i, 2],
      [/\brun(?:ning)?\b(?!\s+(?:a|my|the|our)\s+(?:business|company|shop|store|team|agency|campaigns?|ads?|meetings?))/i, 2],
      [/\b(health\w*|wellbeing|well-being|wellness|weight|stamina|endurance|strength|stronger|mobility)\b/i, 1.5],
      [/\b(sleep\w*|diet|nutrition|active|activity|energy)\b/i, 1.5],
      [/\bsteps\b/i, 0.5],
    ],
  },
  {
    kind: 'conversion',
    label: 'Conversion optimization',
    categoryId: 'marketing',
    core: [
      [/\b(conversions?|convert\w*|cro)\b/i, 3],
      [/\b(a\/b|ab|split)[\s-]+test\w*|\bexperiments?\b/i, 2.5],
      [/\b(funnels?|bounc\w*|drop[-\s]?offs?|cart\s+abandon\w*|abandoned\s+carts?|checkout\s+rate)\b/i, 2.5],
      [/\bload\w*\s+(?:faster|quicker|slow\w*)\b|\b(?:faster|slow)\s+(?:website|site|pages?)\b/i, 1.5],
      [/\b(landing\s+pages?|ux|user\s+experience|usability|page\s+speed|site\s+speed|load(?:ing)?\s+times?|core\s+web\s+vitals)\b/i, 1.5],
      [/\b(analytics|heatmaps?|click[-\s]?through)\b/i, 1.5],
    ],
    context: [
      [/\b(websites?|web\s?site|site|web\s?pages?|online\s+(?:store|shop)|e-?commerce|checkout|sign[-\s]?ups?|leads?|visitors?|traffic)\b/i, 1],
    ],
  },
  {
    kind: 'automation',
    label: 'Business automation',
    categoryId: 'productivity',
    core: [
      [/\b(automat\w*|auto[-\s]?pilot)\b/i, 3],
      [/\b(workflows?|integrations?|integrate|zapier|n8n|make\.com|rpa|no[-\s]?code|low[-\s]?code)\b/i, 2],
      [/\b(manual(?:ly)?|repetitive|repeat\w*|recurring|by\s+hand|data\s+entry|copy[-\s]?paste)\b/i, 1.5],
      [/\b(streamline|hands[-\s]?off|ai\s+agents?|bots?)\b/i, 1.5],
      [/\b(?:connect|sync)\w*\s+(?:my\s+|our\s+|the\s+)?(?:[\w-]+\s+){0,3}(?:tools?|apps?|systems?|software|crm|accounting|spreadsheets?|calendars?|stripe|shopify|quickbooks|xero)\b/i, 2],
    ],
    context: [
      [/\b(invoic\w*|billing|bookkeeping|accounting|payroll|receipts?|payments?|reconcil\w*|quotes?|proposals?)\b/i, 1.5],
      [/\b(reports?|reporting|emails?|crm|onboarding|approvals?|spreadsheets?|scheduling|follow[-\s]?ups?|operations|admin)\b/i, 1],
    ],
  },
]

const sumMatches = (text: string, terms: WeightedTerm[] = []) =>
  terms.reduce((total, [pattern, weight]) => (pattern.test(text) ? total + weight : total), 0)

/** Scores every action domain by the meaning the goal expresses; exported for regression tests. */
export function scoreGoalIntents(text: string): { kind: ActionIntentKind; score: number }[] {
  return INTENT_DOMAINS.map((domain) => {
    const core = sumMatches(text, domain.core)
    return { kind: domain.kind, score: core > 0 ? core + sumMatches(text, domain.context) : 0 }
  })
}

export function detectGoalIntent(text: string): GoalIntent {
  const query = text.trim()
  if (!query) return { kind: 'category', label: 'Goal', categoryId: null }

  if (isProductSearchQuery(query)) {
    return { kind: 'shopping', label: 'Shopping / Product discovery', categoryId: 'search' }
  }

  const best = scoreGoalIntents(query).reduce((top, entry) => (entry.score > top.score ? entry : top))
  if (best.score >= MIN_INTENT_SCORE) {
    const domain = INTENT_DOMAINS.find((candidate) => candidate.kind === best.kind)!
    return { kind: domain.kind, label: domain.label, categoryId: domain.categoryId }
  }

  const categoryId = detectPrimary(query)
  const goalCategoryId = categoryId === 'search' ? null : categoryId
  return {
    kind: 'category',
    label: goalCategoryId ? categoryById[goalCategoryId].title : 'Goal',
    categoryId: goalCategoryId,
  }
}
