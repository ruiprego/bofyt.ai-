import { isProductSearchQuery } from '../products/parse'
import { categoryById, detectPrimary, type CategoryId } from './categories'

export type GoalIntentKind = 'shopping' | 'travel' | 'fitness' | 'finance' | 'career' | 'category'

export interface GoalIntent {
  kind: GoalIntentKind
  label: string
  categoryId: CategoryId | null
}

type IntentRule = Omit<GoalIntent, 'kind'> & {
  kind: Exclude<GoalIntentKind, 'shopping' | 'category'>
  pattern: RegExp
}

const INTENT_RULES: IntentRule[] = [
  {
    kind: 'career',
    label: 'Career / Jobs',
    categoryId: null,
    pattern: /\b(job|jobs|career|employment|resume|cv|interview|role|position|recruit|hiring|work)\b/i,
  },
  {
    kind: 'travel',
    label: 'Travel',
    categoryId: null,
    pattern: /\b(flight|flights|fly|flying|airport|airline|travel|trip|hotel|hostel|vacation|holiday|destination|itinerary|airbnb|tour)\b/i,
  },
  {
    kind: 'finance',
    label: 'Finance',
    categoryId: 'personal',
    pattern: /\b(save|saving|savings|money|finance|finances|financial|budget|debt|invest|investment|income|expense|expenses|spend|€|\$|£|usd|eur|gbp|chf)\b/i,
  },
  {
    kind: 'fitness',
    label: 'Fitness',
    categoryId: 'personal',
    pattern: /\b(lose\s+\d+\s*(?:kg|kilos?|pounds?|lb)|weight|fitness|workout|gym|run|running|marathon|exercise|muscle|health|sleep|steps?|fit)\b/i,
  },
]

export function detectGoalIntent(text: string): GoalIntent {
  const query = text.trim()
  if (!query) return { kind: 'category', label: 'Goal', categoryId: null }

  if (isProductSearchQuery(query)) {
    return { kind: 'shopping', label: 'Shopping / Product discovery', categoryId: null }
  }

  const rule = INTENT_RULES.find((candidate) => candidate.pattern.test(query))
  if (rule) {
    return { kind: rule.kind, label: rule.label, categoryId: rule.categoryId }
  }

  const categoryId = detectPrimary(query)
  return {
    kind: 'category',
    label: categoryId ? categoryById[categoryId].title : 'Goal',
    categoryId,
  }
}
