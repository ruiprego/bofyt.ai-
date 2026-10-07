import { NextResponse } from 'next/server'
import { emailStatus } from '@/lib/career/email'
import { isJobSearchConfigured } from '@/lib/career/jobs'
import type { CareerStatus } from '@/lib/career/types'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const status: CareerStatus = {
    signedIn: Boolean(data.user),
    account: data.user
      ? {
          email: data.user.email ?? null,
          name: (data.user.user_metadata?.full_name as string | undefined) ?? (data.user.user_metadata?.name as string | undefined) ?? null,
        }
      : undefined,
    email: emailStatus(),
    jobs: { configured: isJobSearchConfigured() },
    ai: { configured: true },
  }
  return NextResponse.json(status)
}
