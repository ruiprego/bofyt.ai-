import { AccountView } from '@/components/bofyt/account-view'
import { safeReturnPath } from '@/lib/bofyt/return-location'
import { profileFromRow } from '@/lib/bofyt/user-data'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>
}) {
  const { from } = await searchParams
  const returnPath = safeReturnPath(typeof from === 'string' ? from : null)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/account?from=${encodeURIComponent(returnPath)}`)}`)
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('user_id, display_name, focus_areas, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return <AccountView user={user} profile={profileFromRow(profileRow)} returnPath={returnPath} />
}
