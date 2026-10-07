import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendCareerEmail } from '@/lib/career/email'
import { cvFileName, renderCvPdf } from '@/lib/career/pdf'
import {
  APPLICATION_COLUMNS,
  careerErrorResponse,
  readJson,
  requireProfile,
  requireUser,
  toApplicationRecord,
} from '@/lib/career/server'
import { applicationEmailSchema, CareerError, cvDocumentSchema, jobSchema } from '@/lib/career/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const { supabase, user } = await requireUser()
    const { data, error } = await supabase
      .from('job_applications')
      .select(APPLICATION_COLUMNS)
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false })
      .limit(100)
    if (error) throw new CareerError('Your applications could not be loaded.', 'UPSTREAM', 502)
    return NextResponse.json({ applications: (data ?? []).map(toApplicationRecord) })
  } catch (error) {
    return careerErrorResponse(error)
  }
}

const sendSchema = applicationEmailSchema.extend({
  draftId: z.string().uuid(),
  confirmed: z.literal(true, { message: 'Explicit confirmation is required before sending.' }),
  recipient: z.string().trim().email('Enter a valid recipient email.').max(200),
  job: jobSchema,
  cv: cvDocumentSchema,
})

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const input = await readJson(request, sendSchema)
    const profile = await requireProfile(supabase, user.id)

    const { data: duplicate, error: duplicateError } = await supabase
      .from('job_applications')
      .select('id')
      .eq('user_id', user.id)
      .ilike('recipient', input.recipient)
      .eq('company', input.job.company)
      .eq('role', input.job.title)
      .limit(1)
      .maybeSingle()
    if (duplicateError) throw new CareerError('Could not check your existing applications. Nothing was sent — try again.', 'UPSTREAM', 502)
    if (duplicate) {
      throw new CareerError(
        `You already applied to ${input.job.company} for this role at ${input.recipient}. Send a follow-up from the Applications tab instead.`,
        'INVALID',
        409,
      )
    }

    const pdf = await renderCvPdf(input.cv, profile)

    const sent = await sendCareerEmail({
      to: input.recipient,
      fromName: profile.fullName,
      replyTo: profile.email,
      subject: input.subject,
      body: input.body,
      idempotencyKey: `job-application/${input.draftId}`,
      attachment: { filename: cvFileName(profile.fullName), content: pdf },
    })

    // Resend returns the original message id for a replayed idempotency key; reuse that tracker row.
    const { data: existing } = await supabase
      .from('job_applications')
      .select(APPLICATION_COLUMNS)
      .eq('user_id', user.id)
      .eq('provider_message_id', sent.id)
      .maybeSingle()
    if (existing) return NextResponse.json({ sent: true, messageId: sent.id, application: toApplicationRecord(existing) })

    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        user_id: user.id,
        company: input.job.company,
        role: input.job.title,
        job_url: input.job.applyUrl ?? null,
        recipient: input.recipient,
        job_data: input.job,
        cv_data: input.cv,
        email_subject: input.subject,
        email_body: input.body,
        provider_message_id: sent.id,
      })
      .select(APPLICATION_COLUMNS)
      .single()

    if (error || !data) {
      return NextResponse.json({
        sent: true,
        messageId: sent.id,
        application: null,
        warning: 'The email was sent, but the tracker record could not be saved.',
      })
    }
    return NextResponse.json({ sent: true, messageId: sent.id, application: toApplicationRecord(data) })
  } catch (error) {
    return careerErrorResponse(error, 'The application could not be sent. Nothing was delivered.')
  }
}
