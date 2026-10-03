import { NextResponse } from 'next/server'
import { careerErrorResponse, loadProfile, readJson, requireUser } from '@/lib/career/server'
import { CareerError, careerProfileSchema } from '@/lib/career/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase, user } = await requireUser()
    const profile = await loadProfile(supabase, user.id)
    return NextResponse.json({ profile })
  } catch (error) {
    return careerErrorResponse(error)
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const profile = await readJson(request, careerProfileSchema)
    const { error } = await supabase
      .from('career_profiles')
      .upsert({ user_id: user.id, data: profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) throw new CareerError('Your career profile could not be saved.', 'UPSTREAM', 502)
    return NextResponse.json({ profile })
  } catch (error) {
    return careerErrorResponse(error)
  }
}
