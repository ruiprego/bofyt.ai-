import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adaptCv, baseCvFromProfile } from '@/lib/career/ai'
import { careerErrorResponse, readJson, requireProfile, requireUser } from '@/lib/career/server'
import { jobAnalysisSchema, jobSchema } from '@/lib/career/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bodySchema = z.object({ job: jobSchema.optional(), analysis: jobAnalysisSchema.nullish() })

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const { job, analysis } = await readJson(request, bodySchema)
    const profile = await requireProfile(supabase, user.id)
    const cv = job ? await adaptCv(profile, job, analysis ?? null) : baseCvFromProfile(profile)
    return NextResponse.json({ cv })
  } catch (error) {
    return careerErrorResponse(error, 'The CV could not be generated. Try again.')
  }
}
