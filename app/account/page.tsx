import { AccountView } from '@/components/bofyt/account-view'
import { profileFromRow } from '@/lib/bofyt/user-data'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/account')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('user_id, display_name, focus_areas, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return <AccountView user={user} profile={profileFromRow(profileRow)} />
}
