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
    email: emailStatus(),
    jobs: { configured: isJobSearchConfigured() },
    ai: { configured: true },
  }
  return NextResponse.json(status)
}
