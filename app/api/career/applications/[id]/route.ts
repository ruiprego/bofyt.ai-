import { NextResponse } from 'next/server'
import { z } from 'zod'
import { APPLICATION_COLUMNS, careerErrorResponse, readJson, requireUser, toApplicationRecord } from '@/lib/career/server'
import { APPLICATION_STATUSES, CareerError } from '@/lib/career/types'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!z.string().uuid().safeParse(id).success) throw new CareerError('Unknown application.', 'NOT_FOUND', 404)
    const { supabase, user } = await requireUser()
    const { status } = await readJson(request, z.object({ status: z.enum(APPLICATION_STATUSES) }))
    const { data, error } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(APPLICATION_COLUMNS)
      .maybeSingle()
    if (error) throw new CareerError('The status could not be updated.', 'UPSTREAM', 502)
    if (!data) throw new CareerError('Unknown application.', 'NOT_FOUND', 404)
    return NextResponse.json({ application: toApplicationRecord(data) })
  } catch (error) {
    return careerErrorResponse(error)
  }
}
