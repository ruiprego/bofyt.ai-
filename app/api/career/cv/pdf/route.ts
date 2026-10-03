import { z } from 'zod'
import { cvFileName, renderCvPdf } from '@/lib/career/pdf'
import { careerErrorResponse, readJson, requireProfile, requireUser } from '@/lib/career/server'
import { cvDocumentSchema } from '@/lib/career/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const { cv } = await readJson(request, z.object({ cv: cvDocumentSchema }))
    const profile = await requireProfile(supabase, user.id)
    const bytes = await renderCvPdf(cv, profile)
    return new Response(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cvFileName(profile.fullName)}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return careerErrorResponse(error, 'The PDF could not be generated. Try again.')
  }
}
