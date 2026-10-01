'use client'

import type { ResultItem } from './results'
import type { GoalEntry } from './goals'
import { savedItemDataFromResult, savedItemKey } from './user-data'
import { createClient } from '@/lib/supabase/client'

type MutationResult = { error: string | null }

type SupabaseError = { code?: string; message?: string } | null

function mutationResult(error: SupabaseError): MutationResult {
  return { error: error?.message ?? null }
}

export async function insertGoal(userId: string, entry: GoalEntry): Promise<MutationResult> {
  const { error } = await createClient().from('goals').insert({
    id: entry.id,
    user_id: userId,
    title: entry.goal,
    capability_id: entry.capabilityId ?? null,
    areas: entry.areas,
    status: 'active',
    progress: 0,
  })

  return mutationResult(error)
}

export async function updateGoalProgress(
  userId: string,
  goalId: string,
  progress: number,
  status: 'active' | 'completed',
): Promise<MutationResult> {
  const { error } = await createClient()
    .from('goals')
    .update({ progress, status })
    .eq('id', goalId)
    .eq('user_id', userId)

  return mutationResult(error)
}

export async function insertGoalActivity(userId: string, goalId: string, progress: number): Promise<MutationResult> {
  const { error } = await createClient().from('goal_activity').insert({
    user_id: userId,
    goal_id: goalId,
    data: { type: 'progress', progress },
  })

  return mutationResult(error)
}

export async function upsertFocusAreas(userId: string, focusAreas: string[]): Promise<MutationResult> {
  const { error } = await createClient().from('profiles').upsert(
    {
      user_id: userId,
      focus_areas: focusAreas,
    },
    { onConflict: 'user_id' },
  )

  return mutationResult(error)
}

export async function insertSavedProduct(userId: string, item: ResultItem): Promise<MutationResult> {
  const { error } = await createClient().from('saved_items').insert({
    user_id: userId,
    item_type: 'product',
    item_key: savedItemKey(item),
    item_data: savedItemDataFromResult(item),
  })

  if ((error as SupabaseError)?.code === '23505') return { error: null }
  return mutationResult(error)
}

export async function deleteSavedProduct(userId: string, itemKey: string): Promise<MutationResult> {
  const { error } = await createClient()
    .from('saved_items')
    .delete()
    .eq('user_id', userId)
    .eq('item_type', 'product')
    .eq('item_key', itemKey)

  return mutationResult(error)
}
