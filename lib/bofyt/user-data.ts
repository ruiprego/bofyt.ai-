import { categoryById, type CategoryId } from './categories'
import type { GoalEntry } from './goals'
import type { ResultItem } from './results'

export interface UserProfile {
  userId: string
  displayName: string | null
  focusAreas: CategoryId[]
  createdAt: string
  updatedAt: string
}

const isCategoryId = (value: unknown): value is CategoryId => typeof value === 'string' && value in categoryById

const stringValue = (value: unknown) => (typeof value === 'string' ? value : null)

const timestampValue = (value: unknown) => (typeof value === 'string' ? value : new Date(0).toISOString())

export function profileFromRow(value: unknown): UserProfile | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (typeof row.user_id !== 'string') return null

  const focusAreas = Array.isArray(row.focus_areas)
    ? row.focus_areas.filter((area): area is CategoryId => isCategoryId(area) && area !== 'search')
    : []

  return {
    userId: row.user_id,
    displayName: stringValue(row.display_name)?.trim() || null,
    focusAreas,
    createdAt: timestampValue(row.created_at),
    updatedAt: timestampValue(row.updated_at),
  }
}

export function goalFromRow(value: unknown): GoalEntry | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.user_id !== 'string') return null

  const areas = Array.isArray(row.areas) ? row.areas.filter(isCategoryId) : []
  if (areas.length === 0) return null

  const createdAt = typeof row.created_at === 'string' ? Date.parse(row.created_at) : Number(row.created_at)
  const progress = Number(row.progress)

  return {
    id: row.id,
    goal: row.title,
    areas,
    capabilityId: typeof row.capability_id === 'string' ? row.capability_id : undefined,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    done: Number.isFinite(progress) ? Math.max(0, Math.floor(progress)) : 0,
    status: row.status === 'completed' || row.status === 'archived' ? row.status : 'active',
  }
}

export function savedItemKey(item: Pick<ResultItem, 'id' | 'productUrl'>) {
  return item.productUrl || item.id
}

export function savedItemKeysFromRows(rows: unknown[] | null | undefined) {
  return (rows ?? []).flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const itemKey = (value as Record<string, unknown>).item_key
    return typeof itemKey === 'string' ? [itemKey] : []
  })
}

export function savedItemDataFromResult(item: ResultItem): Record<string, unknown> {
  return {
    id: item.id,
    title: item.name,
    description: item.summary,
    imageUrl: item.imageUrl,
    brand: item.brand,
    price: item.price,
    currency: item.currency,
    retailer: item.retailer,
    rating: item.rating,
    reviewCount: item.reviewCount,
    productUrl: item.productUrl,
    availability: item.availability,
    category: item.category,
  }
}
