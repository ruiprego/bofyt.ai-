import 'server-only'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import {
  applicationEmailSchema,
  cvDocumentSchema,
  jobAnalysisSchema,
  type CareerProfile,
  type CvDocument,
  type Job,
  type JobAnalysis,
} from './types'

const MODEL = 'openai/gpt-5-mini'

const FACTUAL_RULES = `Strict factual rules:
- Use ONLY facts present in the CANDIDATE PROFILE. Never invent employers, titles, dates, degrees, certifications, metrics, skills, tools, or achievements.
- You may rephrase, reorder, condense, and emphasise existing facts. You may not add new facts.
- If a job requirement is not supported by the profile, do not claim it.`

const profileBlock = (profile: CareerProfile) => `CANDIDATE PROFILE (JSON, the only source of truth):\n${JSON.stringify(profile)}`

const jobBlock = (job: Job) =>
  `JOB POSTING:\nTitle: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}${job.remote ? ' (remote)' : ''}\n` +
  `Highlights:\n${job.highlights.map((item) => `- ${item}`).join('\n')}\nDescription:\n${job.description.slice(0, 8000)}`

const period = (start: string, end: string) => [start, end || (start ? 'Present' : '')].filter(Boolean).join(' – ')

export function baseCvFromProfile(profile: CareerProfile): CvDocument {
  return {
    headline: profile.preferredRoles[0] ?? profile.experience[0]?.title ?? '',
    summary: profile.summary,
    skills: profile.skills,
    experience: profile.experience.map((entry) => ({
      company: entry.company,
      title: entry.title,
      location: entry.location,
      period: period(entry.start, entry.end),
      bullets: entry.highlights,
    })),
    projects: profile.projects.map((project) => ({ name: project.name, url: project.url, description: project.description })),
    education: profile.education.map((entry) => ({ school: entry.school, degree: entry.degree, period: period(entry.start, entry.end) })),
    languages: profile.languages,
  }
}

const extractedCvSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  summary: z.string(),
  aiExperience: z.string().describe('Concrete AI/ML models, tools, products or research mentioned; empty if none'),
  website: z.string(),
  github: z.string(),
  linkedin: z.string(),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  experience: z.array(
    z.object({ company: z.string(), title: z.string(), location: z.string(), start: z.string(), end: z.string(), highlights: z.array(z.string()) }),
  ),
  education: z.array(z.object({ school: z.string(), degree: z.string(), start: z.string(), end: z.string() })),
  projects: z.array(z.object({ name: z.string(), url: z.string(), description: z.string(), stack: z.array(z.string()) })),
})

export type ExtractedCv = z.infer<typeof extractedCvSchema>

export async function extractProfileFromCv(file: { data: Uint8Array | string; mediaType: string; filename: string }): Promise<ExtractedCv> {
  const isText = file.mediaType.startsWith('text/')
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: extractedCvSchema }),
    system:
      'You extract structured career data from a CV. Copy facts exactly as written. Never invent, infer or embellish. ' +
      'Use an empty string or empty list for anything the CV does not state. Keep dates as written (e.g. "2021", "Mar 2022", "Present"). ' +
      'Write the summary only from the CV\'s own profile/summary section, or leave it empty.',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract the candidate profile from this CV.' },
          isText
            ? { type: 'text', text: String(file.data).slice(0, 40000) }
            : { type: 'file', data: file.data as Uint8Array, mediaType: file.mediaType, filename: file.filename },
        ],
      },
    ],
  })
  return output
}

export async function analyzeJob(profile: CareerProfile, job: Job): Promise<JobAnalysis> {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: jobAnalysisSchema }),
    system: `You analyse job postings and compare them against a candidate profile.\n${FACTUAL_RULES}\n- Only list a skill as matching if it appears in the profile.\n- Extract requirements only from the posting text; do not guess.`,
    prompt: `${jobBlock(job)}\n\n${profileBlock(profile)}`,
  })
  return output
}

const keepFactual = (adapted: CvDocument, base: CvDocument): CvDocument => {
  const knownCompanies = new Set(base.experience.map((entry) => entry.company.toLowerCase()))
  const knownProjects = new Set(base.projects.map((entry) => entry.name.toLowerCase()))
  const knownSchools = new Set(base.education.map((entry) => entry.school.toLowerCase()))
  const baseSkills = new Map(base.skills.map((skill) => [skill.toLowerCase(), skill]))
  const skills = adapted.skills.filter((skill) => baseSkills.has(skill.toLowerCase()))

  return {
    ...adapted,
    skills: [...skills, ...base.skills.filter((skill) => !skills.some((kept) => kept.toLowerCase() === skill.toLowerCase()))],
    experience: adapted.experience
      .filter((entry) => knownCompanies.has(entry.company.toLowerCase()))
      .map((entry) => {
        const original = base.experience.find((candidate) => candidate.company.toLowerCase() === entry.company.toLowerCase())
        return { ...entry, title: original?.title ?? entry.title, period: original?.period ?? entry.period, location: original?.location ?? entry.location }
      }),
    projects: adapted.projects.filter((entry) => knownProjects.has(entry.name.toLowerCase())),
    education: base.education.filter((entry) => knownSchools.has(entry.school.toLowerCase())),
    languages: base.languages,
  }
}

// OpenAI strict structured output requires every property to be required, so the
// model gets a schema without `.default()`/`.optional()`; the result is then
// validated against the shared cvDocumentSchema.
const tailoredCvOutputSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({ company: z.string(), title: z.string(), location: z.string(), period: z.string(), bullets: z.array(z.string()) }),
  ),
  projects: z.array(z.object({ name: z.string(), url: z.string(), description: z.string() })),
  education: z.array(z.object({ school: z.string(), degree: z.string(), period: z.string() })),
  languages: z.array(z.string()),
})

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value)

const fitCvLimits = (cv: CvDocument): CvDocument => ({
  ...cv,
  headline: clip(cv.headline, 200),
  summary: clip(cv.summary, 2000),
  skills: cv.skills.slice(0, 40).map((skill) => clip(skill, 80)),
  experience: cv.experience.slice(0, 20).map((entry) => ({ ...entry, bullets: entry.bullets.slice(0, 10).map((bullet) => clip(bullet, 500)) })),
  projects: cv.projects.slice(0, 15).map((project) => ({ ...project, description: clip(project.description, 800) })),
  education: cv.education.slice(0, 10),
  languages: cv.languages.slice(0, 15),
})

export async function adaptCv(profile: CareerProfile, job: Job, analysis: JobAnalysis | null): Promise<CvDocument> {
  const base = baseCvFromProfile(profile)
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: tailoredCvOutputSchema }),
    system: `You tailor a CV to a specific job.\n${FACTUAL_RULES}\n- Rewrite the summary for this role using only profile facts.\n- Order skills by relevance; only include skills from the profile.\n- Order experience and projects by relevance; keep every company name, title and period exactly as in the profile.\n- Rewrite bullets to surface relevant keywords where truthful.\n- Set targetRole and targetCompany from the posting.`,
    prompt: `${jobBlock(job)}\n\n${analysis ? `ANALYSIS:\n${JSON.stringify(analysis)}\n\n` : ''}BASE CV:\n${JSON.stringify(base)}\n\n${profileBlock(profile)}`,
  })
  const tailored = fitCvLimits({ ...keepFactual(output, base), targetRole: clip(job.title, 200), targetCompany: clip(job.company, 200) })
  return cvDocumentSchema.parse(tailored)
}

export async function draftApplicationEmail(profile: CareerProfile, job: Job, cv: CvDocument, analysis: JobAnalysis | null) {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: applicationEmailSchema }),
    system: `You write concise, specific job application emails (120-220 words) from the candidate to the hiring team.\n${FACTUAL_RULES}\n- Reference concrete details of THIS company and role from the posting, and 1-3 truthful, relevant points from the candidate's experience or projects.\n- No generic filler, no placeholders like [Name], no exaggeration.\n- Mention the attached CV. Sign off with the candidate's full name and contact details from the profile.\n- Subject format: "Application — <Job title>" optionally followed by " | <Candidate name>".\n- Plain text body with line breaks, no markdown.`,
    prompt: `${jobBlock(job)}\n\n${analysis ? `ANALYSIS:\n${JSON.stringify(analysis)}\n\n` : ''}TAILORED CV:\n${JSON.stringify(cv)}\n\n${profileBlock(profile)}`,
  })
  return output
}

export async function draftFollowUpEmail(
  profile: CareerProfile,
  application: { company: string; role: string; emailSubject: string; emailBody: string; appliedAt: string },
) {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: applicationEmailSchema }),
    system: `You write a short, polite follow-up (60-120 words) to a job application the candidate already sent.\n${FACTUAL_RULES}\n- Reference the role and the original application date. Reaffirm interest with one truthful point. No pressure, no placeholders.\n- Subject: "Re: <original subject>". Plain text, no markdown. Sign with the candidate's name.`,
    prompt: `ORIGINAL APPLICATION (sent ${application.appliedAt}) to ${application.company} for ${application.role}:\nSubject: ${application.emailSubject}\n${application.emailBody}\n\n${profileBlock(profile)}`,
  })
  return output
}
