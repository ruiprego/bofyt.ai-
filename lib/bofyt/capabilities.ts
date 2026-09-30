import type { CategoryId, CategoryModule } from './categories'

export type CapabilityId = 'grow' | 'build' | 'reach' | 'optimize' | 'automate' | 'discover'

export interface RecommendedBook {
  title: string
  author: string
  reason: string
}

export interface EvidenceLevel {
  label: string
  description: string
}

export interface Capability {
  id: CapabilityId
  index: string
  title: string
  shortTitle: string
  description: string
  response: string
  tags: string[]
  paths: string[]
  modules: CategoryModule[]
  books: RecommendedBook[]
  evidenceLevels?: EvidenceLevel[]
  categoryId: CategoryId
  recommendationCategoryIds: CategoryId[]
  imageSrc: string
}

export const CAPABILITY_COLUMNS: Capability[] = [
  {
    id: 'grow',
    index: '01',
    title: 'Grow',
    shortTitle: 'Grow',
    description: 'Become more capable through goals, habits, learning and awareness.',
    response: 'Choose who you are becoming. BOFYT turns that direction into grounded practices, while keeping different evidence levels clearly labeled.',
    tags: ['Personal goals', 'Development', 'Awareness', 'Direction'],
    paths: ['Personal goals', 'Habits & mindset', 'Health & inner rhythm', 'Skills & relationships'],
    modules: [
      { name: 'Personal Goals', description: 'A clear direction with milestones that matter', prompt: 'I want to turn an important personal goal into a realistic plan.' },
      { name: 'Habits', description: 'Small actions that become part of your day', prompt: 'I want to build habits that support the person I am becoming.' },
      { name: 'Mindset', description: 'Reflective practices for confidence and resilience', prompt: 'I want to develop a more capable and resilient mindset.' },
      { name: 'Learning & Knowledge', description: 'A learning path that compounds over time', prompt: 'I want a learning plan for a subject I care about.' },
      { name: 'Skills', description: 'Practice with feedback and a useful outcome', prompt: 'I want to build a skill with a focused practice plan.' },
      { name: 'Career & Life Direction', description: 'Make choices that fit the life you want', prompt: 'I want clarity on my career and life direction.' },
      { name: 'Fitness & Movement', description: 'Movement, strength and energy you can sustain', prompt: 'I want a sustainable fitness and movement plan.' },
      { name: 'Sleep & Circadian Rhythm', description: 'Pineal gland, melatonin, light exposure, sleep/wake cycles and natural practices, clearly labeled by evidence level', prompt: 'I want to improve my sleep and explore pineal and inner-rhythm perspectives with evidence levels clearly separated.' },
      { name: 'Senses & Awareness', description: 'Explore vision, hearing, smell, taste, touch, balance, interoception, multisensory awareness and sensory training', prompt: 'I want to explore senses and awareness through grounded sensory training.' },
      { name: 'Body Awareness', description: 'Notice signals, tension and energy without overclaiming', prompt: 'I want to develop better body awareness in everyday life.' },
      { name: 'Relationships & Communication', description: 'Build stronger connections and clearer conversations', prompt: 'I want to improve my relationships and communication.' },
      { name: 'Personal Projects', description: 'Move a meaningful challenge from idea to done', prompt: 'I want to plan a personal challenge or project.' },
      { name: 'Recommended Books', description: 'Useful reading matched to the goal in front of you', prompt: 'Recommend books that can help me grow in this area.' },
    ],
    books: [
      { title: 'Atomic Habits', author: 'James Clear', reason: 'A practical starting point for designing repeatable behavior.' },
      { title: 'How to Change', author: 'Katy Milkman', reason: 'A research-informed look at making change easier to start and sustain.' },
      { title: 'The Scout Mindset', author: 'Julia Galef', reason: 'Useful for thinking clearly when identity and decisions get tangled.' },
    ],
    evidenceLevels: [
      { label: 'Science-backed', description: 'Supported by established research or clinical guidance where available.' },
      { label: 'Natural', description: 'Low-risk lifestyle and environmental practices, with limits stated plainly.' },
      { label: 'Traditional', description: 'Practices from cultural traditions, presented as tradition rather than scientific fact.' },
      { label: 'Holistic', description: 'Whole-person perspectives that connect context, behavior and experience.' },
      { label: 'Experimental', description: 'Early or speculative ideas that need caution, curiosity and verification.' },
    ],
    categoryId: 'personal',
    recommendationCategoryIds: ['personal', 'creativity', 'communication'],
    imageSrc: '/panels/personal.webp',
  },
  {
    id: 'build',
    index: '02',
    title: 'Build',
    shortTitle: 'Build',
    description: 'Create a business, product, service or project people can use.',
    response: 'Start with the idea and the constraint. BOFYT will help shape the offer, the roadmap and the next proof point.',
    tags: ['Business', 'Products', 'Strategy', 'Execution'],
    paths: ['Business model', 'Product development', 'First customers', 'Team & systems'],
    modules: [
      { name: 'Business', description: 'Turn an opportunity into a focused business', prompt: 'I want to shape a clear plan for my business.' },
      { name: 'Startups', description: 'Find the riskiest assumption and test it first', prompt: 'I want to validate a startup idea before I build too much.' },
      { name: 'Side Projects', description: 'Make progress without losing the rest of your life', prompt: 'I want a realistic plan for my side project.' },
      { name: 'Products', description: 'Define, build and improve something useful', prompt: 'I want to plan and build a product people need.' },
      { name: 'Services', description: 'Package expertise into a clear offer', prompt: 'I want to turn my skills into a service offer.' },
      { name: 'Entrepreneurship', description: 'Make the next founder decision with less noise', prompt: 'I want to build the skills and operating rhythm of an entrepreneur.' },
      { name: 'Strategy', description: 'Choose where to play and what to ignore', prompt: 'I want a focused strategy for my business.' },
      { name: 'Branding', description: 'Make the promise recognizable and credible', prompt: 'I want to develop a memorable brand for my business.' },
      { name: 'Product Development', description: 'Move from requirements to useful releases', prompt: 'I want a product development roadmap.' },
      { name: 'Business Models', description: 'Connect value, pricing and sustainable revenue', prompt: 'I want to compare business models for my idea.' },
      { name: 'Team Building', description: 'Create ownership, roles and ways of working', prompt: 'I want to build a small team that works well together.' },
      { name: 'Recommended Books', description: 'Reading that helps with the decision in front of you', prompt: 'Recommend books for building my business or product.' },
      { name: 'Tools & Resources', description: 'A focused stack for the work you need to do', prompt: 'Recommend tools and resources for building this project.' },
    ],
    books: [
      { title: 'The Mom Test', author: 'Rob Fitzpatrick', reason: 'A concise guide to learning from customers without leading them.' },
      { title: 'Good Strategy Bad Strategy', author: 'Richard Rumelt', reason: 'A clear framework for turning diagnosis into coherent action.' },
      { title: 'Inspired', author: 'Marty Cagan', reason: 'A practical product perspective for building things people value.' },
    ],
    categoryId: 'business',
    recommendationCategoryIds: ['business', 'creativity'],
    imageSrc: '/panels/business.webp',
  },
  {
    id: 'reach',
    index: '03',
    title: 'Reach',
    shortTitle: 'Reach',
    description: 'Put your ideas, brand or work in front of the right people.',
    response: 'Clarify who you want to reach and why they should care. BOFYT connects the message, channel and feedback loop.',
    tags: ['Audience', 'Content', 'Brand', 'Communication'],
    paths: ['Positioning', 'Content engine', 'Audience growth', 'Sales & community'],
    modules: [
      { name: 'Social Media', description: 'Choose platforms that fit your audience and energy', prompt: 'I want a social media strategy for my work or brand.' },
      { name: 'Content', description: 'Build a useful body of work consistently', prompt: 'I want a content plan that helps me reach the right people.' },
      { name: 'Personal Brand', description: 'Make your expertise easier to recognize', prompt: 'I want to build a personal brand around my strengths.' },
      { name: 'Marketing', description: 'Connect a clear message to a real need', prompt: 'I want a marketing plan for my offer.' },
      { name: 'Audience Growth', description: 'Turn attention into an intentional relationship', prompt: 'I want to grow an audience without chasing empty metrics.' },
      { name: 'Communication', description: 'Say the important thing with more clarity', prompt: 'I want to become a clearer communicator.' },
      { name: 'Community', description: 'Create a place where people return and contribute', prompt: 'I want to build a community around my work.' },
      { name: 'Sales', description: 'Help the right people make a confident decision', prompt: 'I want a practical sales process for my offer.' },
      { name: 'Creator Strategy', description: 'Plan formats, cadence and creative leverage', prompt: 'I want a creator strategy I can sustain.' },
      { name: 'Digital Presence', description: 'Make your online home work harder for you', prompt: 'I want to improve my digital presence.' },
      { name: 'Recommended Books', description: 'Reading for message, audience and influence', prompt: 'Recommend books for reaching more people with my work.' },
      { name: 'Tools & Resources', description: 'Choose a stack that supports publishing and learning', prompt: 'Recommend tools and resources for reaching my audience.' },
    ],
    books: [
      { title: 'Obviously Awesome', author: 'April Dunford', reason: 'A practical positioning process for making value easier to understand.' },
      { title: 'Show Your Work!', author: 'Austin Kleon', reason: 'A lightweight approach to sharing creative work in public.' },
      { title: 'Made to Stick', author: 'Chip Heath and Dan Heath', reason: 'Useful principles for communicating ideas people remember.' },
    ],
    categoryId: 'marketing',
    recommendationCategoryIds: ['marketing', 'social', 'communication'],
    imageSrc: '/panels/marketing.webp',
  },
  {
    id: 'optimize',
    index: '04',
    title: 'Optimize',
    shortTitle: 'Optimize',
    description: 'Make better decisions and use your time, money and energy well.',
    response: 'See the trade-offs before you commit. BOFYT turns the resources you have into choices you can explain and repeat.',
    tags: ['Decisions', 'Finance', 'Time', 'Value'],
    paths: ['Money clarity', 'Time & focus', 'Cost vs value', 'Lifestyle design'],
    modules: [
      { name: 'Personal Finance', description: 'Build a calmer view of your money', prompt: 'I want a practical personal finance plan.' },
      { name: 'Budgeting', description: 'Give every euro, dollar or pound a job', prompt: 'I want a budget that reflects the life I want.' },
      { name: 'Saving', description: 'Create a buffer and a target you can follow', prompt: 'I want a realistic plan to save more money.' },
      { name: 'Investing Education', description: 'Learn the basics without pretending certainty', prompt: 'I want to learn investing fundamentals responsibly.' },
      { name: 'Price Comparison', description: 'Compare the real cost, not only the sticker price', prompt: 'I want to compare options by total cost and value.' },
      { name: 'Decision Making', description: 'Use criteria instead of impulse or noise', prompt: 'I want a decision framework for an important choice.' },
      { name: 'Time Management', description: 'Protect attention for the work that matters', prompt: 'I want a time management system I can actually keep.' },
      { name: 'Productivity', description: 'Make progress with less friction', prompt: 'I want to improve my productivity without burning out.' },
      { name: 'Lifestyle Optimization', description: 'Tune routines around your actual priorities', prompt: 'I want to optimize my lifestyle around energy and priorities.' },
      { name: 'Cost vs Value', description: 'Understand what is worth paying for', prompt: 'I want to evaluate the cost versus value of my options.' },
      { name: 'Recommended Books', description: 'Reading for clearer decisions and better systems', prompt: 'Recommend books for optimizing my time, money and decisions.' },
      { name: 'Tools & Resources', description: 'Useful calculators, systems and references', prompt: 'Recommend tools and resources for optimizing my decisions.' },
    ],
    books: [
      { title: 'Your Money or Your Life', author: 'Vicki Robin and Joe Dominguez', reason: 'A values-led way to think about money, work and enough.' },
      { title: 'Four Thousand Weeks', author: 'Oliver Burkeman', reason: 'A grounded reminder that time management is also a choice about limits.' },
      { title: 'Thinking in Bets', author: 'Annie Duke', reason: 'A practical lens for decisions made with incomplete information.' },
    ],
    categoryId: 'productivity',
    recommendationCategoryIds: ['productivity', 'personal'],
    imageSrc: '/panels/productivity.webp',
  },
  {
    id: 'automate',
    index: '05',
    title: 'Automate',
    shortTitle: 'Automate',
    description: 'Use AI, technology and systems to do more with less repetition.',
    response: 'Start with the repeated work, the handoff or the decision that drains you. BOFYT helps choose the simplest system that can carry it.',
    tags: ['AI', 'Systems', 'Workflows', 'Leverage'],
    paths: ['AI tools', 'Workflow design', 'Agents & integrations', 'Personal systems'],
    modules: [
      { name: 'AI', description: 'Use models where they genuinely add leverage', prompt: 'I want to find useful ways to apply AI to my work.' },
      { name: 'Automation', description: 'Remove repeatable work from the critical path', prompt: 'I want to automate a repetitive process.' },
      { name: 'Workflows', description: 'Design inputs, decisions and handoffs', prompt: 'I want to map and improve an important workflow.' },
      { name: 'Agents', description: 'Give bounded tasks to reliable AI systems', prompt: 'I want to design an AI agent for a specific job.' },
      { name: 'No-code / Low-code', description: 'Connect tools without unnecessary engineering', prompt: 'I want a no-code or low-code way to solve this problem.' },
      { name: 'Business Automation', description: 'Make operations easier to repeat and review', prompt: 'I want to automate a business process safely.' },
      { name: 'Personal Automation', description: 'Let your tools handle small recurring tasks', prompt: 'I want to automate parts of my personal routine.' },
      { name: 'Productivity Systems', description: 'Build a system that keeps work moving', prompt: 'I want a productivity system with useful automation.' },
      { name: 'AI Tools', description: 'Compare tools by the job they actually do', prompt: 'I want to find the right AI tools for my use case.' },
      { name: 'Integrations', description: 'Connect the systems you already rely on', prompt: 'I want to plan integrations between my tools.' },
      { name: 'Recommended Books', description: 'Reading for systems, technology and leverage', prompt: 'Recommend books for learning automation and AI systems.' },
      { name: 'Tools & Resources', description: 'A practical stack with clear boundaries', prompt: 'Recommend tools and resources for automating this work.' },
    ],
    books: [
      { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', reason: 'A deeper foundation for reasoning about reliable systems and data flows.' },
      { title: 'Working Backwards', author: 'Colin Bryar and Bill Carr', reason: 'Useful operating principles for turning customer needs into systems.' },
      { title: 'The Goal', author: 'Eliyahu M. Goldratt', reason: 'A memorable introduction to finding constraints in a complex workflow.' },
    ],
    categoryId: 'creativity',
    recommendationCategoryIds: ['creativity', 'productivity', 'business'],
    imageSrc: '/panels/ai.webp',
  },
  {
    id: 'discover',
    index: '06',
    title: 'Discover',
    shortTitle: 'Discover',
    description: 'Find products, brands, services, opportunities and experiences in the real world.',
    response: 'Tell BOFYT what you are looking for, your constraints and what good looks like. Product searches stay connected to live results.',
    tags: ['Products', 'Places', 'Opportunities', 'Comparison'],
    paths: ['Product discovery', 'Price comparison', 'Local options', 'Real-world opportunities'],
    modules: [
      { name: 'Products', description: 'Find live options that fit your constraints', prompt: 'Find products that fit what I need and my budget.' },
      { name: 'Brands', description: 'Explore brands by values, quality and fit', prompt: 'Help me discover brands that fit my needs.' },
      { name: 'Services', description: 'Find providers and compare what they offer', prompt: 'Help me find and compare services for my needs.' },
      { name: 'Jobs', description: 'Explore roles, skills and next applications', prompt: 'Help me discover jobs that fit my strengths.' },
      { name: 'Housing', description: 'Compare places, constraints and trade-offs', prompt: 'Help me discover housing options that fit my criteria.' },
      { name: 'Travel', description: 'Build a trip around the experience you want', prompt: 'Help me discover a travel plan that fits my budget.' },
      { name: 'Experiences', description: 'Find something worth doing next', prompt: 'Help me discover experiences I would enjoy.' },
      { name: 'Local Opportunities', description: 'Look closer to home for useful options', prompt: 'Help me discover useful local opportunities.' },
      { name: 'Comparisons', description: 'See the meaningful differences between choices', prompt: 'Help me compare the best options for my needs.' },
      { name: 'Price Discovery', description: 'Understand what a fair price looks like', prompt: 'Help me discover fair prices for what I want to buy.' },
      { name: 'Recommended Books', description: 'Reading that helps you explore a topic', prompt: 'Recommend books to help me explore this topic.' },
      { name: 'Useful Resources', description: 'Start with trustworthy places to learn more', prompt: 'Find useful resources for the thing I am exploring.' },
    ],
    books: [
      { title: 'The Scout Mindset', author: 'Julia Galef', reason: 'A useful companion for exploring options without defending a first answer.' },
      { title: 'The Design of Everyday Things', author: 'Don Norman', reason: 'A sharper way to notice how products and services fit real people.' },
      { title: 'Range', author: 'David Epstein', reason: 'A case for broad exploration before narrowing into a direction.' },
    ],
    categoryId: 'search',
    recommendationCategoryIds: ['search'],
    imageSrc: '/panels/search.png',
  },
]

export const capabilityById = Object.fromEntries(CAPABILITY_COLUMNS.map((capability) => [capability.id, capability])) as Record<CapabilityId, Capability>

const categoryToCapability: Record<CategoryId, CapabilityId> = {
  social: 'reach',
  business: 'build',
  marketing: 'reach',
  personal: 'grow',
  productivity: 'optimize',
  creativity: 'automate',
  communication: 'reach',
  search: 'discover',
}

export function capabilityForCategory(categoryId: CategoryId | null): CapabilityId | null {
  return categoryId ? categoryToCapability[categoryId] : null
}

export function capabilitiesForCategories(categoryIds: CategoryId[]): CapabilityId[] {
  return CAPABILITY_COLUMNS.filter((capability) => capability.recommendationCategoryIds.some((id) => categoryIds.includes(id)))
    .slice(0, 3)
    .map((capability) => capability.id)
}
