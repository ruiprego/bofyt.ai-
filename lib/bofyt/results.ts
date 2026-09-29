import { categoryById, type CategoryId } from './categories'

export type ResultKind = 'places' | 'options'

export interface ResultItem {
  id: string
  name: string
  subtitle: string
  summary: string
  steps: string[]
  distanceKm?: number
  priceLevel?: number
  rating: number
  openNow?: boolean
  weeks?: number
  effort?: number
  free?: boolean
  areaId: CategoryId
}

export interface Refinement {
  id: string
  label: string
}

export interface GoalResultModel {
  kind: ResultKind
  heading: string
  statusLabel: string
  items: ResultItem[]
  refinements: Refinement[]
  defaultRefinement: string
  nextActionLabel: string
}

type PlaceSeed = Omit<ResultItem, 'id' | 'areaId' | 'steps' | 'summary'> & { summary?: string }

const PLACE_SETS: { match: RegExp; heading: string; noun: string; seeds: PlaceSeed[] }[] = [
  {
    match: /\b(restaurant|food|eat|lunch|dinner|dine|pizza|sushi|burger|takeaway)/i,
    heading: 'Nearby restaurants',
    noun: 'restaurant',
    seeds: [
      { name: 'Trattoria Lume', subtitle: 'Italian · Pasta & pizza', distanceKm: 0.8, priceLevel: 1, rating: 4.6, openNow: true },
      { name: 'Maison Phở', subtitle: 'Vietnamese · Noodle bar', distanceKm: 0.5, priceLevel: 1, rating: 4.4, openNow: true },
      { name: 'Nori Street', subtitle: 'Japanese · Sushi counter', distanceKm: 1.1, priceLevel: 2, rating: 4.5, openNow: true },
      { name: 'Casa Verde', subtitle: 'Spanish · Tapas', distanceKm: 1.4, priceLevel: 1, rating: 4.2, openNow: false },
      { name: 'The Copper Pot', subtitle: 'Modern European', distanceKm: 2.1, priceLevel: 3, rating: 4.8, openNow: true },
    ],
  },
  {
    match: /\b(cafe|café|coffee|brunch|espresso)/i,
    heading: 'Nearby cafés',
    noun: 'café',
    seeds: [
      { name: 'Grind & Gold', subtitle: 'Specialty coffee', distanceKm: 0.3, priceLevel: 2, rating: 4.7, openNow: true },
      { name: 'Little Morning', subtitle: 'Brunch · Pastries', distanceKm: 0.9, priceLevel: 1, rating: 4.3, openNow: true },
      { name: 'Studio Roast', subtitle: 'Roastery · Laptop friendly', distanceKm: 1.2, priceLevel: 2, rating: 4.5, openNow: false },
      { name: 'Corner Kettle', subtitle: 'Tea & coffee', distanceKm: 0.6, priceLevel: 1, rating: 4.1, openNow: true },
    ],
  },
  {
    match: /\b(gym|yoga studio|fitness (studio|centre|center)|climbing)/i,
    heading: 'Nearby gyms',
    noun: 'gym',
    seeds: [
      { name: 'Forge Athletics', subtitle: 'Strength · Open 24/7', distanceKm: 1.0, priceLevel: 2, rating: 4.6, openNow: true },
      { name: 'Pulse Studio', subtitle: 'Classes · Yoga & HIIT', distanceKm: 0.7, priceLevel: 3, rating: 4.8, openNow: true },
      { name: 'City Fit', subtitle: 'Budget gym', distanceKm: 1.6, priceLevel: 1, rating: 4.0, openNow: true },
      { name: 'Summit Walls', subtitle: 'Climbing & bouldering', distanceKm: 2.4, priceLevel: 2, rating: 4.7, openNow: false },
    ],
  },
]

const PLACE_REFINEMENTS: Refinement[] = [
  { id: 'closest', label: 'Closest' },
  { id: 'cheapest', label: 'Cheapest' },
  { id: 'rated', label: 'Best rated' },
  { id: 'open', label: 'Open now' },
]

const OPTION_REFINEMENTS: Refinement[] = [
  { id: 'impact', label: 'Highest impact' },
  { id: 'fastest', label: 'Fastest' },
  { id: 'easiest', label: 'Easiest' },
  { id: 'free', label: 'Free to start' },
]

const OPTION_PROFILE = [
  { weeks: 2, effort: 2, rating: 4.7, free: true },
  { weeks: 1, effort: 1, rating: 4.2, free: true },
  { weeks: 4, effort: 3, rating: 4.9, free: false },
  { weeks: 6, effort: 2, rating: 4.4, free: false },
]

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export function buildResult(goal: string, areas: CategoryId[]): GoalResultModel {
  const placeSet = PLACE_SETS.find((set) => set.match.test(goal))

  if (placeSet) {
    const defaultRefinement = /cheap|budget|afford|inexpensive/i.test(goal)
      ? 'cheapest'
      : /\bbest|top|good\b/i.test(goal)
        ? 'rated'
        : 'closest'
    return {
      kind: 'places',
      heading: placeSet.heading,
      statusLabel: `${placeSet.seeds.length} places found within 2.5 km`,
      defaultRefinement,
      refinements: PLACE_REFINEMENTS,
      nextActionLabel: 'Compare these options',
      items: placeSet.seeds.map((seed) => ({
        ...seed,
        id: slug(seed.name),
        areaId: areas[0],
        summary:
          seed.summary ??
          `${seed.subtitle}. ${seed.openNow ? 'Open now' : 'Opens later today'}, ${seed.distanceKm} km from you and rated ${seed.rating} by locals.`,
        steps: [
          `Check today’s menu and opening hours`,
          `Walk there in about ${Math.max(3, Math.round((seed.distanceKm ?? 1) * 12))} minutes`,
          `Rate your visit so BOFYT learns what you like`,
        ],
      })),
    }
  }

  const [primaryId, secondaryId] = areas
  const primary = categoryById[primaryId]
  const offset = Number(primary.index) % OPTION_PROFILE.length
  const modules = primary.modules.map((module) => ({ module, areaId: primaryId }))
  if (secondaryId) modules.splice(3, 1, { module: categoryById[secondaryId].modules[0], areaId: secondaryId })

  const items = modules.map(({ module, areaId }, index) => {
    const profile = OPTION_PROFILE[(index + offset) % OPTION_PROFILE.length]
    return {
      id: slug(`${areaId}-${module.name}`),
      name: module.name,
      subtitle: categoryById[areaId].shortTitle,
      summary: `${module.description}. BOFYT sets this up around your goal and tracks it with you.`,
      steps: [
        `Set a baseline for ${module.name.toLowerCase()}`,
        `${module.description} — one small action a day`,
        'Review results with the AI Core every week',
      ],
      rating: profile.rating,
      weeks: profile.weeks,
      effort: profile.effort,
      free: profile.free,
      areaId,
    }
  })

  return {
    kind: 'options',
    heading: `${primary.title} options`,
    statusLabel: `${items.length} ways to reach this goal`,
    defaultRefinement: /fast|quick|asap|soon/i.test(goal) ? 'fastest' : 'impact',
    refinements: OPTION_REFINEMENTS,
    nextActionLabel: 'Build my plan',
    items,
  }
}

export function refineItems(items: ResultItem[], refinement: string): ResultItem[] {
  const list = [...items]
  switch (refinement) {
    case 'closest':
      return list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    case 'cheapest':
      return list.sort((a, b) => (a.priceLevel ?? 0) - (b.priceLevel ?? 0) || b.rating - a.rating)
    case 'rated':
    case 'impact':
      return list.sort((a, b) => b.rating - a.rating)
    case 'open':
      return list.filter((item) => item.openNow).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    case 'fastest':
      return list.sort((a, b) => (a.weeks ?? 0) - (b.weeks ?? 0))
    case 'easiest':
      return list.sort((a, b) => (a.effort ?? 0) - (b.effort ?? 0) || b.rating - a.rating)
    case 'free':
      return list.filter((item) => item.free).sort((a, b) => b.rating - a.rating)
    default:
      return list
  }
}

const REASONS: Record<string, string> = {
  closest: 'Closest match to you right now',
  cheapest: 'Lowest price with a strong rating',
  rated: 'Highest rated option nearby',
  open: 'Open now and close by',
  impact: 'Biggest impact on your goal',
  fastest: 'Quickest path to a first result',
  easiest: 'Lowest effort to get started',
  free: 'Best option you can start for free',
}

export const reasonFor = (refinement: string) => REASONS[refinement] ?? 'Best match for your goal'

const EFFORT = ['Low effort', 'Medium effort', 'High effort']

export function metaFor(item: ResultItem): string[] {
  if (item.distanceKm !== undefined) {
    return [
      `${item.distanceKm} km`,
      '€'.repeat(item.priceLevel ?? 1),
      `★ ${item.rating.toFixed(1)}`,
      item.openNow ? 'Open now' : 'Closed',
    ]
  }
  return [
    `${item.weeks} wk${item.weeks === 1 ? '' : 's'}`,
    EFFORT[(item.effort ?? 1) - 1],
    `★ ${item.rating.toFixed(1)}`,
    item.free ? 'Free' : 'Premium',
  ]
}

export const directionsUrl = (item: ResultItem) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} near me`)}`
