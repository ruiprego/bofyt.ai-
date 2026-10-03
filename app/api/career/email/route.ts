import { NextResponse } from 'next/server'
import { z } from 'zod'
import { draftApplicationEmail } from '@/lib/career/ai'
import { careerErrorResponse, readJson, requireProfile, requireUser } from '@/lib/career/server'
import { cvDocumentSchema, jobAnalysisSchema, jobSchema } from '@/lib/career/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bodySchema = z.object({ job: jobSchema, cv: cvDocumentSchema, analysis: jobAnalysisSchema.nullish() })

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const { job, cv, analysis } = await readJson(request, bodySchema)
    const profile = await requireProfile(supabase, user.id)
    return NextResponse.json({ email: await draftApplicationEmail(profile, job, cv, analysis ?? null) })
  } catch (error) {
    return careerErrorResponse(error, 'The application email could not be drafted. Try again.')
  }
}
