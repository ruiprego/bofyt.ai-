import 'server-only'
import { Resend } from 'resend'
import { CareerError, EMAIL_NOT_CONFIGURED_MESSAGE } from './types'

function senderDomain() {
  return process.env.RESEND_EMAIL_DOMAIN?.trim().replace(/^@/, '') || null
}

export function emailStatus() {
  const domain = senderDomain()
  const configured = Boolean(process.env.RESEND_API_KEY?.trim() && domain)
  return { configured, sender: configured ? `applications@${domain}` : null }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const textToHtml = (body: string) =>
  `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">${body
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 14px">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')}</div>`

const senderName = (name: string) => name.replace(/[<>"\r\n]/g, '').trim().slice(0, 80) || 'BOFYT'

export async function sendCareerEmail(input: {
  to: string
  fromName: string
  replyTo: string
  subject: string
  body: string
  idempotencyKey: string
  attachment?: { filename: string; content: Uint8Array }
}) {
  const status = emailStatus()
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!status.configured || !apiKey || !status.sender) {
    throw new CareerError(EMAIL_NOT_CONFIGURED_MESSAGE, 'CONFIGURATION', 503)
  }

  const resend = new Resend(apiKey)
  const result = await resend.emails
    .send(
    {
      from: `${senderName(input.fromName)} <${status.sender}>`,
      to: [input.to],
      replyTo: input.replyTo,
      subject: input.subject.replace(/[\r\n]+/g, ' '),
      text: input.body,
      html: textToHtml(input.body),
      attachments: input.attachment
        ? [{ filename: input.attachment.filename, content: Buffer.from(input.attachment.content) }]
        : undefined,
    },
    { idempotencyKey: input.idempotencyKey },
    )
    .catch((caught: unknown) => {
      console.error('[career] Resend request failed', caught instanceof Error ? caught.message : caught)
      throw new CareerError('Could not reach the email provider. Nothing was sent — try again.', 'UPSTREAM', 502)
    })

  const { data, error } = result
  if (error || !data?.id) {
    console.error('[career] Resend send failed', error?.name, error?.message)
    throw providerError(error?.name, error?.message)
  }
  return { id: data.id }
}

function providerError(name: string | undefined, message: string | undefined) {
  switch (name) {
    case 'rate_limit_exceeded':
    case 'daily_quota_exceeded':
      return new CareerError('Email sending is rate-limited right now. Nothing was sent — wait a minute and try again.', 'UPSTREAM', 429)
    case 'missing_api_key':
    case 'invalid_api_Key':
    case 'invalid_api_key':
    case 'restricted_api_key':
    case 'invalid_from_address':
      return new CareerError(`${EMAIL_NOT_CONFIGURED_MESSAGE} The sender is not authorised. Nothing was sent.`, 'CONFIGURATION', 503)
    case 'invalid_idempotent_request':
    case 'concurrent_idempotent_requests':
      return new CareerError('This application is already being sent. Check your Applications tab before retrying.', 'INVALID', 409)
    case 'validation_error':
    case 'missing_required_field':
    case 'invalid_parameter':
      return new CareerError(`The email provider rejected the message${message ? `: ${message}` : '.'} Nothing was sent.`, 'INVALID', 422)
    default:
      return new CareerError('The email provider did not confirm delivery. Nothing was recorded — try again.', 'UPSTREAM', 502)
  }
}
