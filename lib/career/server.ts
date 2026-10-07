import 'server-only'
import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  CareerError,
  careerProfileSchema,
  cvDocumentSchema,
  jobSchema,
  type ApplicationRecord,
  type ApplicationStatus,
  type CareerProfile,
} from './types'

export async function requireUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new CareerError('Sign in to use your career profile and applications.', 'UNAUTHORIZED', 401)
  return { supabase, user: data.user }
}

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function loadProfile(supabase: Supabase, userId: string): Promise<CareerProfile | null> {
  const { data, error } = await supabase.from('career_profiles').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw new CareerError('Your career profile could not be loaded.', 'UPSTREAM', 502)
  if (!data) return null
  const parsed = careerProfileSchema.safeParse(data.data)
  return parsed.success ? parsed.data : null
}

export async function requireProfile(supabase: Supabase, userId: string) {
  const profile = await loadProfile(supabase, userId)
  if (!profile?.fullName || !profile.email) {
    throw new CareerError('Complete your Career Profile (name and email at minimum) first.', 'INVALID', 409)
  }
  return profile
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const payload = await request.json().catch(() => {
    throw new CareerError('Send the request as JSON.', 'INVALID', 400)
  })
  const parsed = schema.safeParse(payload)
  if (!parsed.success) throw new CareerError(parsed.error.issues[0]?.message ?? 'Invalid request.', 'INVALID', 400)
  return parsed.data
}

export function careerErrorResponse(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (error instanceof CareerError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status })
  }
  console.error('[career]', error instanceof Error ? error.message : error)
  return NextResponse.json({ error: { code: 'UPSTREAM', message: fallback } }, { status: 502 })
}

interface ApplicationRow {
  id: string
  company: string
  role: string
  job_url: string | null
  recipient: string
  job_data: unknown
  cv_data: unknown
  email_subject: string
  email_body: string
  status: ApplicationStatus
  provider_message_id: string | null
  applied_at: string
  follow_up_sent_at: string | null
}

export const APPLICATION_COLUMNS =
  'id, company, role, job_url, recipient, job_data, cv_data, email_subject, email_body, status, provider_message_id, applied_at, follow_up_sent_at'

export function toApplicationRecord(row: ApplicationRow): ApplicationRecord {
  const job = jobSchema.safeParse(row.job_data)
  const cv = cvDocumentSchema.safeParse(row.cv_data)
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    jobUrl: row.job_url,
    recipient: row.recipient,
    job: job.success ? job.data : null,
    cv: cv.success ? cv.data : null,
    emailSubject: row.email_subject,
    emailBody: row.email_body,
    status: row.status,
    providerMessageId: row.provider_message_id,
    appliedAt: row.applied_at,
    followUpSentAt: row.follow_up_sent_at,
  }
}
