import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeJob } from '@/lib/career/ai'
import { careerErrorResponse, readJson, requireProfile, requireUser } from '@/lib/career/server'
import { jobSchema } from '@/lib/career/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const { job } = await readJson(request, z.object({ job: jobSchema }))
    const profile = await requireProfile(supabase, user.id)
    return NextResponse.json({ analysis: await analyzeJob(profile, job) })
  } catch (error) {
    return careerErrorResponse(error, 'The job analysis could not be generated. Try again.')
  }
}
