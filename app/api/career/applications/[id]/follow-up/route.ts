import { NextResponse } from 'next/server'
import { z } from 'zod'
import { draftFollowUpEmail } from '@/lib/career/ai'
import { sendCareerEmail } from '@/lib/career/email'
import {
  APPLICATION_COLUMNS,
  careerErrorResponse,
  readJson,
  requireProfile,
  requireUser,
  toApplicationRecord,
} from '@/lib/career/server'
import { applicationEmailSchema, CareerError } from '@/lib/career/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const bodySchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('draft') }),
  applicationEmailSchema.extend({
    mode: z.literal('send'),
    confirmed: z.literal(true, { message: 'Explicit confirmation is required before sending.' }),
  }),
])

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!z.string().uuid().safeParse(id).success) throw new CareerError('Unknown application.', 'NOT_FOUND', 404)
    const { supabase, user } = await requireUser()
    const input = await readJson(request, bodySchema)

    const { data: row, error } = await supabase
      .from('job_applications')
      .select(APPLICATION_COLUMNS)
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw new CareerError('The application could not be loaded.', 'UPSTREAM', 502)
    if (!row) throw new CareerError('Unknown application.', 'NOT_FOUND', 404)

    const application = toApplicationRecord(row)
    const profile = await requireProfile(supabase, user.id)

    if (input.mode === 'draft') {
      return NextResponse.json({ email: await draftFollowUpEmail(profile, application) })
    }

    const sent = await sendCareerEmail({
      to: application.recipient,
      fromName: profile.fullName,
      replyTo: profile.email,
      subject: input.subject,
      body: input.body,
      idempotencyKey: `job-follow-up/${application.id}/${application.followUpSentAt ?? 'first'}`,
    })

    const { data: updated } = await supabase
      .from('job_applications')
      .update({ status: 'follow_up', follow_up_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(APPLICATION_COLUMNS)
      .maybeSingle()

    return NextResponse.json({ sent: true, messageId: sent.id, application: updated ? toApplicationRecord(updated) : application })
  } catch (error) {
    return careerErrorResponse(error, 'The follow-up could not be completed. Nothing was delivered.')
  }
}
