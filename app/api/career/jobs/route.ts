import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchJobs } from '@/lib/career/jobs'
import { careerErrorResponse, readJson } from '@/lib/career/server'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({ query: z.string().trim().min(2, 'Describe the job you are looking for.').max(300) })

export async function POST(request: Request) {
  try {
    const { query } = await readJson(request, bodySchema)
    return NextResponse.json(await searchJobs(query, request.signal))
  } catch (error) {
    return careerErrorResponse(error, 'The live job search could not be reached. Try again.')
  }
}
