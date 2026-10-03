import { NextResponse } from 'next/server'
import { extractProfileFromCv, type ExtractedCv } from '@/lib/career/ai'
import { careerErrorResponse, loadProfile, requireUser } from '@/lib/career/server'
import { CareerError, careerProfileSchema, emptyProfile, type CareerProfile } from '@/lib/career/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED = new Set(['application/pdf', 'text/plain', 'text/markdown'])

const clean = (value: string) => value.trim()
const dedupe = (items: string[]) => {
  const seen = new Set<string>()
  return items.map(clean).filter((item) => item && !seen.has(item.toLowerCase()) && seen.add(item.toLowerCase()))
}

function mergeProfile(existing: CareerProfile, cv: ExtractedCv, accountEmail: string | null): CareerProfile {
  const pick = (current: string, incoming: string) => clean(current) || clean(incoming)
  const known = (values: string[]) => new Set(values.map((value) => value.trim().toLowerCase()))
  const companies = known(existing.experience.map((entry) => `${entry.company}|${entry.title}`))
  const schools = known(existing.education.map((entry) => `${entry.school}|${entry.degree}`))
  const projects = known(existing.projects.map((entry) => entry.name))

  const merged = {
    ...existing,
    fullName: pick(existing.fullName, cv.fullName),
    email: pick(existing.email, cv.email) || accountEmail || '',
    phone: pick(existing.phone, cv.phone),
    location: pick(existing.location, cv.location),
    summary: pick(existing.summary, cv.summary),
    aiExperience: pick(existing.aiExperience, cv.aiExperience),
    website: pick(existing.website, cv.website),
    github: pick(existing.github, cv.github),
    linkedin: pick(existing.linkedin, cv.linkedin),
    skills: dedupe([...existing.skills, ...cv.skills]),
    languages: dedupe([...existing.languages, ...cv.languages]),
    experience: [
      ...existing.experience,
      ...cv.experience
        .filter((entry) => (entry.company || entry.title) && !companies.has(`${entry.company}|${entry.title}`.trim().toLowerCase()))
        .map((entry) => ({ ...entry, id: crypto.randomUUID(), highlights: dedupe(entry.highlights) })),
    ],
    education: [
      ...existing.education,
      ...cv.education
        .filter((entry) => entry.school && !schools.has(`${entry.school}|${entry.degree}`.trim().toLowerCase()))
        .map((entry) => ({ ...entry, id: crypto.randomUUID() })),
    ],
    projects: [
      ...existing.projects,
      ...cv.projects
        .filter((entry) => entry.name && !projects.has(entry.name.trim().toLowerCase()))
        .map((entry) => ({ ...entry, id: crypto.randomUUID(), stack: dedupe(entry.stack) })),
    ],
  }

  const parsed = careerProfileSchema.safeParse(merged)
  if (parsed.success) return parsed.data
  // An extracted value can exceed a limit or be an unusable email; keep the rest rather than failing the import.
  return careerProfileSchema.parse({ ...merged, email: existing.email || accountEmail || '', experience: merged.experience.slice(0, 20), education: merged.education.slice(0, 10), projects: merged.projects.slice(0, 15), skills: merged.skills.slice(0, 60).map((s) => s.slice(0, 80)), languages: merged.languages.slice(0, 15).map((s) => s.slice(0, 80)) })
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser()
    const form = await request.formData().catch(() => {
      throw new CareerError('Upload the CV as a file.', 'INVALID', 400)
    })
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) throw new CareerError('Choose a CV file to upload.', 'INVALID', 400)
    if (file.size > MAX_BYTES) throw new CareerError('That file is larger than 5 MB. Upload a smaller PDF.', 'INVALID', 413)

    const mediaType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/plain')
    if (!ACCEPTED.has(mediaType)) throw new CareerError('Upload your CV as a PDF or plain text file.', 'INVALID', 415)

    const data = mediaType === 'application/pdf' ? new Uint8Array(await file.arrayBuffer()) : await file.text()
    const extracted = await extractProfileFromCv({ data, mediaType, filename: file.name })
    const existing = (await loadProfile(supabase, user.id)) ?? emptyProfile()
    const profile = mergeProfile(existing, extracted, user.email ?? null)

    return NextResponse.json({ profile })
  } catch (error) {
    return careerErrorResponse(error, 'We could not read that CV. Try a PDF exported from your editor, or fill in the details yourself.')
  }
}
