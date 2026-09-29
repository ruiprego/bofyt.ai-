import { categoryById, type CategoryId } from './categories'
import { detectGoalIntent, type GoalIntentKind } from './intent'
import { toGoalTitle } from './plan'
import type { Product, ProductPriceConstraint } from '@/lib/products/types'

export type ResultKind = 'places' | 'options' | 'products'

export interface ResultItem {
  id: string
  name: string
  subtitle: string
  summary: string
  steps: string[]
  distanceKm?: number
  priceLevel?: number
  rating?: number
  openNow?: boolean
  weeks?: number
  effort?: number
  free?: boolean
  imageUrl?: string
  brand?: string
  price?: number
  currency?: string
  retailer?: string
  reviewCount?: number
  productUrl?: string
  availability?: string
  category?: string
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
  emptyMessage?: string
  closestItems?: ResultItem[]
  priceConstraint?: ProductPriceConstraint
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

const PRODUCT_REFINEMENTS: Refinement[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-low', label: 'Lowest price' },
  { id: 'price-high', label: 'Highest price' },
]

const OPTION_PROFILE = [
  { weeks: 2, effort: 2, rating: 4.7, free: true },
  { weeks: 1, effort: 1, rating: 4.2, free: true },
  { weeks: 4, effort: 3, rating: 4.9, free: false },
  { weeks: 6, effort: 2, rating: 4.4, free: false },
]

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function toProductResultItem(product: Product, areaId: CategoryId): ResultItem {
  return {
    id: product.id,
    name: product.title,
    subtitle: [product.brand, product.category].filter(Boolean).join(' · '),
    summary: product.description ?? '',
    steps: [],
    imageUrl: product.imageUrl,
    brand: product.brand,
    price: product.price,
    currency: product.currency,
    retailer: product.retailer,
    rating: product.rating,
    reviewCount: product.reviewCount,
    productUrl: product.productUrl,
    availability: product.availability,
    category: product.category,
    areaId,
  }
}

function formatConstraintValue(value: number, currency?: string) {
  const amount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : undefined
  return symbol ? `${symbol}${amount}` : currency ? `${amount} ${currency}` : amount
}

function noExactMatchesMessage(constraint?: ProductPriceConstraint) {
  if (!constraint || (constraint.minPrice === undefined && constraint.maxPrice === undefined)) return undefined
  const min = constraint.minPrice === undefined ? undefined : formatConstraintValue(constraint.minPrice, constraint.currency)
  const max = constraint.maxPrice === undefined ? undefined : formatConstraintValue(constraint.maxPrice, constraint.currency)
  if (min && max) return `No exact matches found between ${min} and ${max}`
  if (max) return `No exact matches found under ${max}`
  if (min) return `No exact matches found above ${min}`
  return undefined
}

export function buildResult(
  goal: string,
  areas: CategoryId[],
  products?: Product[],
  closestProducts?: Product[],
  priceConstraint?: ProductPriceConstraint,
): GoalResultModel {
  const intent = detectGoalIntent(goal)

  if (intent.kind === 'shopping' || products !== undefined) {
    const liveProducts = products ?? []
    const items = liveProducts.map((product) => toProductResultItem(product, areas[0]))
    const closestItems = (closestProducts ?? []).map((product) => toProductResultItem(product, areas[0]))
    const noExactMessage = noExactMatchesMessage(priceConstraint)

    return {
      kind: 'products',
      heading: items.length ? 'Live product matches' : noExactMessage ?? 'No live product matches',
      statusLabel: items.length ? `${items.length} live products found` : noExactMessage ?? 'No live products found',
      defaultRefinement: 'relevance',
      refinements: PRODUCT_REFINEMENTS,
      nextActionLabel: items.length ? 'Open top product' : 'Search again',
      items,
      closestItems,
      priceConstraint,
      emptyMessage: noExactMessage ?? 'No live products matched that search. Try a broader product, brand, or price range.',
    }
  }

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

  if (intent.kind !== 'category') {
    return buildIntentResult(goal, intent.kind, areas)
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

type ActionIntentKind = Exclude<GoalIntentKind, 'shopping' | 'category'>

type IntentOptionSeed = {
  name: string
  subtitle: string
  description: string
  step: string
  weeks: number
  effort: number
  free: boolean
}

const INTENT_OPTION_PROFILES: Record<
  ActionIntentKind,
  { heading: string; noun: string; nextActionLabel: string; defaultRefinement: string; items: IntentOptionSeed[] }
> = {
  travel: {
    heading: 'Flight & travel research',
    noun: 'travel paths',
    nextActionLabel: 'Start travel research',
    defaultRefinement: 'fastest',
    items: [
      {
        name: 'Compare flight routes',
        subtitle: 'Travel research',
        description: 'Compare routes, timings, and the full trip cost before booking.',
        step: 'Shortlist the best departure and arrival windows',
        weeks: 1,
        effort: 1,
        free: true,
      },
      {
        name: 'Track the best fare',
        subtitle: 'Price tracking',
        description: 'Set a target price and watch for a better fare before you commit.',
        step: 'Set a price ceiling and flexible date range',
        weeks: 2,
        effort: 1,
        free: true,
      },
      {
        name: 'Build the trip plan',
        subtitle: 'Itinerary',
        description: 'Turn the route into a practical itinerary with stays and next actions.',
        step: 'Map the first three decisions for the trip',
        weeks: 2,
        effort: 2,
        free: true,
      },
    ],
  },
  fitness: {
    heading: 'Fitness path',
    noun: 'fitness paths',
    nextActionLabel: 'Start fitness plan',
    defaultRefinement: 'fastest',
    items: [
      {
        name: 'Training plan',
        subtitle: 'Movement',
        description: 'Build a progressive routine around the result you want to achieve.',
        step: 'Set a safe baseline for your current fitness level',
        weeks: 2,
        effort: 2,
        free: true,
      },
      {
        name: 'Nutrition & recovery',
        subtitle: 'Energy',
        description: 'Support the goal with realistic food, sleep, and recovery choices.',
        step: 'Choose one recovery change you can repeat this week',
        weeks: 1,
        effort: 1,
        free: true,
      },
      {
        name: 'Progress tracking',
        subtitle: 'Measurement',
        description: 'Measure the signals that show whether your plan is working.',
        step: 'Pick one weekly progress metric',
        weeks: 1,
        effort: 1,
        free: true,
      },
    ],
  },
  finance: {
    heading: 'Finance plan',
    noun: 'finance paths',
    nextActionLabel: 'Build savings plan',
    defaultRefinement: 'impact',
    items: [
      {
        name: 'Savings target',
        subtitle: 'Target setting',
        description: 'Translate the amount you named into a clear monthly or weekly target.',
        step: 'Set the deadline and contribution needed',
        weeks: 1,
        effort: 1,
        free: true,
      },
      {
        name: 'Monthly cash flow',
        subtitle: 'Spending plan',
        description: 'Find the spending changes that create room for the goal without guesswork.',
        step: 'Review the last month of income and expenses',
        weeks: 2,
        effort: 2,
        free: true,
      },
      {
        name: 'Progress review',
        subtitle: 'Accountability',
        description: 'Keep the target visible and adjust the plan as your numbers change.',
        step: 'Schedule a short weekly money review',
        weeks: 1,
        effort: 1,
        free: true,
      },
    ],
  },
  career: {
    heading: 'Career search',
    noun: 'career paths',
    nextActionLabel: 'Build career plan',
    defaultRefinement: 'impact',
    items: [
      {
        name: 'Target roles',
        subtitle: 'Job research',
        description: 'Clarify the role, location, and requirements that match the opportunity you want.',
        step: 'Define the role and location filters that matter most',
        weeks: 1,
        effort: 1,
        free: true,
      },
      {
        name: 'Application kit',
        subtitle: 'Positioning',
        description: 'Shape your CV, profile, and proof around the roles you are targeting.',
        step: 'Collect three examples of relevant work',
        weeks: 2,
        effort: 2,
        free: true,
      },
      {
        name: 'Interview preparation',
        subtitle: 'Readiness',
        description: 'Prepare focused stories and practice for the conversations that move you forward.',
        step: 'Draft answers for the five questions you expect',
        weeks: 2,
        effort: 2,
        free: true,
      },
      {
        name: 'Networking',
        subtitle: 'Connections',
        description: 'Create a consistent outreach loop that opens more relevant conversations.',
        step: 'List five people or communities to contact',
        weeks: 3,
        effort: 2,
        free: true,
      },
    ],
  },
}

function buildIntentResult(goal: string, kind: ActionIntentKind, areas: CategoryId[]): GoalResultModel {
  const profile = INTENT_OPTION_PROFILES[kind]
  const goalTitle = toGoalTitle(goal)
  const areaId = areas[0] ?? 'personal'
  const items = profile.items.map((seed) => ({
    id: slug(`${kind}-${seed.name}`),
    name: seed.name,
    subtitle: seed.subtitle,
    summary: `${seed.description} BOFYT shapes it around “${goalTitle}”.`,
    steps: [`Define what success looks like for “${goalTitle}”`, seed.step, 'Review progress with BOFYT each week'],
    weeks: seed.weeks,
    effort: seed.effort,
    free: seed.free,
    areaId,
  }))

  return {
    kind: 'options',
    heading: profile.heading,
    statusLabel: `${items.length} ${profile.noun}`,
    defaultRefinement: profile.defaultRefinement,
    refinements: OPTION_REFINEMENTS,
    nextActionLabel: profile.nextActionLabel,
    items,
  }
}

export function refineItems(items: ResultItem[], refinement: string): ResultItem[] {
  const list = [...items]
  switch (refinement) {
    case 'closest':
      return list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    case 'cheapest':
      return list.sort((a, b) => (a.priceLevel ?? 0) - (b.priceLevel ?? 0) || (b.rating ?? 0) - (a.rating ?? 0))
    case 'rated':
    case 'impact':
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    case 'price-low':
      return list.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY))
    case 'price-high':
      return list.sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY))
    case 'open':
      return list.filter((item) => item.openNow).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    case 'fastest':
      return list.sort((a, b) => (a.weeks ?? 0) - (b.weeks ?? 0))
    case 'easiest':
      return list.sort((a, b) => (a.effort ?? 0) - (b.effort ?? 0) || (b.rating ?? 0) - (a.rating ?? 0))
    case 'free':
      return list.filter((item) => item.free).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    default:
      return list
  }
}

const REASONS: Record<string, string> = {
  relevance: 'Returned by the live product provider',
  'price-low': 'Lowest listed price',
  'price-high': 'Highest listed price',
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
  if (item.productUrl) {
    const details: string[] = []
    if (item.price !== undefined) details.push(formatPrice(item.price, item.currency))
    if (item.retailer) details.push(item.retailer)
    if (item.rating !== undefined) details.push(`★ ${item.rating.toFixed(1)}`)
    if (item.reviewCount !== undefined) details.push(`${new Intl.NumberFormat().format(item.reviewCount)} reviews`)
    if (item.availability) details.push(item.availability)
    return details
  }

  if (item.distanceKm !== undefined) {
    const details = [`${item.distanceKm} km`, '€'.repeat(item.priceLevel ?? 1)]
    if (item.rating !== undefined) details.push(`★ ${item.rating.toFixed(1)}`)
    details.push(item.openNow ? 'Open now' : 'Closed')
    return details
  }

  const details = [`${item.weeks} wk${item.weeks === 1 ? '' : 's'}`, EFFORT[(item.effort ?? 1) - 1]]
  if (item.rating !== undefined) details.push(`★ ${item.rating.toFixed(1)}`)
  details.push(item.free ? 'Free' : 'Premium')
  return details
}

function formatPrice(price: number, currency?: string) {
  try {
    return currency
      ? new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(price)
      : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(price)
  } catch {
    return currency ? `${price} ${currency}` : String(price)
  }
}

export const directionsUrl = (item: ResultItem) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.name} near me`)}`
