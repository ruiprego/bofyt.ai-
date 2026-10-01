import type { User } from '@supabase/supabase-js'
import { BofytExperience } from '@/components/bofyt/experience'
import { goalFromRow, profileFromRow, savedItemKeysFromRows } from '@/lib/bofyt/user-data'
import { parseReturnState } from '@/lib/bofyt/return-location'
import { createClient } from '@/lib/supabase/server'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const initialReturn = parseReturnState(await searchParams)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <BofytExperience
        initialUser={null}
        initialGoals={[]}
        initialProfile={null}
        initialSavedItemKeys={[]}
        initialReturn={initialReturn}
      />
    )
  }

  const [{ data: goalRows }, { data: profileRow }, { data: savedItemRows }] = await Promise.all([
    supabase
      .from('goals')
      .select('id, user_id, title, capability_id, areas, status, progress, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('user_id, display_name, focus_areas, created_at, updated_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('saved_items').select('item_key').eq('user_id', user.id).eq('item_type', 'product'),
  ])

  return (
    <BofytExperience
      initialUser={user as User}
      initialGoals={(goalRows ?? []).flatMap((row) => {
        const goal = goalFromRow(row)
        return goal ? [goal] : []
      })}
      initialProfile={profileFromRow(profileRow)}
      initialSavedItemKeys={savedItemKeysFromRows(savedItemRows)}
      initialReturn={initialReturn}
    />
  )
}
