export type CategoryId =
  | 'social'
  | 'business'
  | 'marketing'
  | 'personal'
  | 'productivity'
  | 'creativity'
  | 'communication'
  | 'search'

export interface CategoryModule {
  name: string
  description: string
  prompt: string
}

export interface Category {
  id: CategoryId
  index: string
  title: string
  shortTitle: string
  phrase: string
  description: string
  response: string
  tags: string[]
  paths: string[]
  modules: CategoryModule[]
  keywords: string[]
  featured?: boolean
  secondary?: boolean
}

export const categories: Category[] = [
  {
    id: 'social',
    index: '01',
    title: 'Social Media Management',
    shortTitle: 'Social',
    phrase: 'on social media',
    description: 'Create, manage and grow your social presence with AI.',
    response: 'Which platform, and what audience? I will build the content engine that grows it.',
    tags: ['Content', 'Scheduling', 'Growth'],
    paths: ['Content strategy', 'Social media management', 'Audience growth', 'Automation'],
    modules: [
      { name: 'Content Planning', description: 'A calendar that never runs dry', prompt: 'I want a 30-day content plan for my Instagram.' },
      { name: 'Scheduling', description: 'Post at the right moment', prompt: 'I want to schedule my posts across every platform.' },
      { name: 'Analytics', description: 'Know what actually works', prompt: 'I want to understand which of my posts perform best.' },
      { name: 'Audience Growth', description: 'Reach and followers', prompt: 'I want to grow to 10,000 followers in 6 months.' },
      { name: 'AI Content', description: 'Hooks, captions and scripts', prompt: 'I want AI to help write my captions and video scripts.' },
      { name: 'Automation', description: 'Replies, reposts and reports', prompt: 'I want to automate replies and weekly social reports.' },
    ],
    keywords: ['social', 'instagram', 'insta', 'tiktok', 'youtube', 'followers', 'content', 'post', 'audience', 'influencer', 'linkedin', 'viral', 'creator', 'reels'],
    featured: true,
  },
  {
    id: 'business',
    index: '02',
    title: 'Business',
    shortTitle: 'Business',
    phrase: 'in business',
    description: 'Turn an idea into a business that grows and scales.',
    response: 'Idea, launch or scale? Tell me where you are and I will plan the next milestone.',
    tags: ['Strategy', 'Planning', 'Scaling'],
    paths: ['Business strategy', 'Launch roadmap', 'First customers', 'Scaling systems'],
    modules: [
      { name: 'Strategy', description: 'Market, offer and pricing', prompt: 'I want a clear strategy and offer for my new business.' },
      { name: 'Planning', description: 'A roadmap you can execute', prompt: 'I want a 90-day plan to launch my business.' },
      { name: 'Customers', description: 'Your first paying clients', prompt: 'I want to get my first 100 paying customers.' },
      { name: 'Scaling', description: 'Grow without burning out', prompt: 'I want my business to reach €10,000 in monthly revenue.' },
    ],
    keywords: ['business', 'startup', 'company', 'customer', 'client', 'revenue', 'sales', 'launch', 'entrepreneur', 'shop', 'agency', 'side hustle', 'profit', 'product', 'store', 'ecommerce', 'e-commerce', 'sell'],
  },
  {
    id: 'marketing',
    index: '03',
    title: 'Marketing',
    shortTitle: 'Marketing',
    phrase: 'in marketing',
    description: 'Reach the right people with campaigns that convert.',
    response: 'Who do you want to reach? I will shape the message and the channels that land it.',
    tags: ['Campaigns', 'Brand', 'Conversion'],
    paths: ['Positioning', 'Campaign planning', 'Email & ads', 'Conversion tracking'],
    modules: [
      { name: 'Positioning', description: 'A message people remember', prompt: 'I want a clear brand message that sets me apart.' },
      { name: 'Campaigns', description: 'Launches that get noticed', prompt: 'I want to plan a marketing campaign for my launch.' },
      { name: 'Email', description: 'A list that converts', prompt: 'I want to build an email list of 1,000 subscribers.' },
      { name: 'Ads', description: 'Spend that pays back', prompt: 'I want to run ads that bring in profitable customers.' },
    ],
    keywords: ['marketing', 'market', 'brand', 'campaign', 'ads', 'advert', 'seo', 'email', 'newsletter', 'funnel', 'leads', 'conver', 'promot'],
  },
  {
    id: 'personal',
    index: '04',
    title: 'Personal Goals',
    shortTitle: 'Personal',
    phrase: 'for yourself',
    description: 'Health, habits, money or mindset. Goals that are yours.',
    response: 'Who do you want to become? I will turn it into daily steps that compound.',
    tags: ['Habits', 'Health', 'Mindset'],
    paths: ['Clear milestones', 'Daily habits', 'Health & energy', 'Progress tracking'],
    modules: [
      { name: 'Habits', description: 'Small actions, compounding', prompt: 'I want to build a morning routine I stick to.' },
      { name: 'Health', description: 'Energy, fitness and sleep', prompt: 'I want to get fit and have more energy every day.' },
      { name: 'Finances', description: 'Save and spend with intent', prompt: 'I want to save €500 every month.' },
      { name: 'Mindset', description: 'Confidence and discipline', prompt: 'I want to become more confident and disciplined.' },
    ],
    keywords: ['habit', 'health', 'fit', 'gym', 'weight', 'run', 'marathon', 'sleep', 'save', 'saving', 'money', 'confiden', 'mindset', 'myself', 'learn', 'read', 'travel', 'happ', 'discipline'],
  },
  {
    id: 'productivity',
    index: '05',
    title: 'Productivity',
    shortTitle: 'Productivity',
    phrase: 'with your time',
    description: 'Focus on what matters and get more done in less time.',
    response: 'What keeps slipping? I will build a system that protects your focus.',
    tags: ['Focus', 'Planning', 'Routines'],
    paths: ['Priority planning', 'Deep focus blocks', 'Routines', 'Weekly reviews'],
    modules: [
      { name: 'Planning', description: 'Priorities for every week', prompt: 'I want a simple weekly system to plan my priorities.' },
      { name: 'Focus', description: 'Deep work, fewer distractions', prompt: 'I want to stop procrastinating and focus deeply.' },
      { name: 'Routines', description: 'Days that run themselves', prompt: 'I want a daily routine that makes me more productive.' },
      { name: 'Reviews', description: 'Learn from every week', prompt: 'I want a weekly review to track what I get done.' },
    ],
    keywords: ['productiv', 'procrastinat', 'focus', 'time', 'organi', 'schedule', 'deadline', 'task', 'todo', 'calendar', 'efficien', 'routine', 'distract'],
  },
  {
    id: 'creativity',
    index: '06',
    title: 'Creativity',
    shortTitle: 'Creativity',
    phrase: 'creatively',
    description: 'Develop ideas and finish the creative work you start.',
    response: 'What do you want to make? I will help you go from idea to finished work.',
    tags: ['Ideas', 'Projects', 'Skills'],
    paths: ['Idea generation', 'Project roadmap', 'Creative skills', 'Sharing your work'],
    modules: [
      { name: 'Ideas', description: 'Never start from a blank page', prompt: 'I want a steady stream of ideas for my creative work.' },
      { name: 'Projects', description: 'Finish what you start', prompt: 'I want to finish writing my first book this year.' },
      { name: 'Skills', description: 'Practice with direction', prompt: 'I want to get better at design with daily practice.' },
      { name: 'Portfolio', description: 'Show your work', prompt: 'I want to build a portfolio that shows my best work.' },
    ],
    keywords: ['creativ', 'write', 'writing', 'book', 'novel', 'design', 'draw', 'paint', 'music', 'song', 'photo', 'film', 'art', 'portfolio', 'idea'],
  },
  {
    id: 'communication',
    index: '07',
    title: 'Communication',
    shortTitle: 'Communication',
    phrase: 'together',
    description: 'Connect, message and collaborate with people on BOFYT.',
    response: 'Goals move faster with people. I will connect you with partners who share yours.',
    tags: ['Collaboration', 'Messaging', 'Sharing goals'],
    paths: ['Accountability partner', 'Shared goals', 'Messaging', 'Group progress'],
    modules: [
      { name: 'Collaboration', description: 'Work on goals together', prompt: 'I want to work on a goal together with a friend.' },
      { name: 'Messaging', description: 'Stay in touch in one place', prompt: 'I want to message my accountability partner every week.' },
      { name: 'Sharing goals', description: 'Let people cheer you on', prompt: 'I want to share my goals with people who support me.' },
      { name: 'Connecting', description: 'Meet people with your goals', prompt: 'I want to connect with people working on the same goal.' },
    ],
    keywords: ['communicat', 'speak', 'present', 'network', 'collaborat', 'team', 'partner', 'message', 'connect', 'people', 'friend', 'together', 'share', 'community'],
    secondary: true,
  },
  {
    id: 'search',
    index: '08',
    title: 'Search',
    shortTitle: 'Search',
    phrase: 'what you need',
    description: 'Discover products, information, places and options with BOFYT.',
    response: 'What are you looking for? I will help you discover the right products, information, places and options.',
    tags: ['Discover', 'Products', 'Information'],
    paths: ['Product discovery', 'Information search', 'Places', 'Options comparison'],
    modules: [
      { name: 'Discover', description: 'Start with a broad search', prompt: 'Find the best products and options for what I need.' },
      { name: 'Products', description: 'Find products that fit', prompt: 'Find products for me.' },
      { name: 'Information', description: 'Search for useful answers', prompt: 'Find information about products I am considering.' },
      { name: 'Places', description: 'Explore places and local options', prompt: 'Find products and places near me.' },
      { name: 'Options', description: 'Compare the choices', prompt: 'Show me the best product options.' },
    ],
    keywords: ['search', 'find', 'discover', 'information', 'info', 'place', 'places', 'option', 'options', 'product', 'products', 'compare', 'looking'],
    secondary: true,
  },
]

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Short keywords match whole words; longer ones match as prefixes.
const matchers = Object.fromEntries(
  categories.map((category) => [
    category.id,
    category.keywords.map((keyword) =>
      keyword.length <= 3 ? new RegExp(`\\b${escape(keyword)}\\b`) : new RegExp(`\\b${escape(keyword)}`),
    ),
  ]),
) as Record<CategoryId, RegExp[]>

function score(text: string) {
  const normalized = text.toLowerCase()
  const scores = new Map<CategoryId, number>()
  for (const category of categories) {
    const weight = category.id === 'personal' ? 0.6 : 1
    const hits = matchers[category.id].filter((pattern) => pattern.test(normalized)).length
    if (hits > 0) scores.set(category.id, hits * weight)
  }
  return scores
}

export function detectPrimary(text: string): CategoryId | null {
  if (text.trim().length < 4) return null
  const ranked = [...score(text).entries()].sort((a, b) => b[1] - a[1])
  return ranked[0]?.[0] ?? null
}

export function detectCategories(text: string, preferred?: CategoryId | null): CategoryId[] {
  const scores = score(text)
  if (preferred) scores.set(preferred, (scores.get(preferred) ?? 0) + 10)
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  return ranked.length ? ranked.slice(0, 3) : ['personal']
}
