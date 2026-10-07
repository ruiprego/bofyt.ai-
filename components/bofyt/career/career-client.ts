export class CareerRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message)
  }
}

export async function careerRequest<T>(url: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  const response = await fetch(url, {
    method: init?.method ?? (init?.body === undefined ? 'GET' : 'POST'),
    headers: init?.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init?.signal,
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const error = payload?.error
    throw new CareerRequestError(error?.message ?? 'Request failed. Try again.', error?.code ?? 'UPSTREAM', response.status)
  }
  return payload as T
}

export const careerFetcher = <T,>(url: string) => careerRequest<T>(url)

export async function downloadCvPdf(cv: unknown) {
  const response = await fetch('/api/career/cv/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cv }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new CareerRequestError(payload?.error?.message ?? 'The PDF could not be generated.', 'UPSTREAM', response.status)
  }
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'CV.pdf'
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const errorMessage = (error: unknown, fallback = 'Something went wrong. Try again.') =>
  error instanceof Error && error.message ? error.message : fallback

export const splitList = (value: string) =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

export const newId = () => crypto.randomUUID()
