import {
  Activity,
  AtSign,
  Briefcase,
  CalendarDays,
  Clock,
  Megaphone,
  MessagesSquare,
  Palette,
  Search,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryId } from '@/lib/bofyt/categories'

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  social: AtSign,
  business: Briefcase,
  marketing: Megaphone,
  personal: Target,
  productivity: Timer,
  creativity: Palette,
  communication: MessagesSquare,
  search: Search,
}

export const SOCIAL_MODULE_ICONS: Record<string, LucideIcon> = {
  'Content Planning': CalendarDays,
  Scheduling: Clock,
  Analytics: Activity,
  'Audience Growth': TrendingUp,
  'AI Content': Sparkles,
  Automation: Workflow,
}
