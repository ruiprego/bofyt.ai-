import type { User } from '@supabase/supabase-js'
import { BofytExperience } from '@/components/bofyt/experience'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <BofytExperience initialUser={user as User | null} />
}
