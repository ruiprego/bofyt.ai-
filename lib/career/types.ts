import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max).default('')
const list = (max: number, itemMax = 200) => z.array(z.string().trim().min(1).max(itemMax)).max(max).default([])

export const experienceSchema = z.object({
  id: z.string().max(64),
  company: text(160),
  title: text(160),
  location: text(160),
  start: text(40),
  end: text(40),
  highlights: list(12, 400),
})

export const educationSchema = z.object({
  id: z.string().max(64),
  school: text(200),
  degree: text(200),
  start: text(40),
  end: text(40),
})

export const projectSchema = z.object({
  id: z.string().max(64),
  name: text(160),
  url: text(400),
  description: text(1200),
  stack: list(20, 60),
})

export const careerProfileSchema = z.object({
  fullName: text(160),
  email: z.union([z.literal(''), z.string().trim().email().max(200)]).default(''),
  phone: text(60),
  location: text(160),
  summary: text(2000),
  experience: z.array(experienceSchema).max(20).default([]),
  education: z.array(educationSchema).max(10).default([]),
  skills: list(60, 80),
  languages: list(15, 80),
  projects: z.array(projectSchema).max(15).default([]),
  aiExperience: text(2000),
  website: text(400),
  github: text(400),
  linkedin: text(400),
  preferredRoles: list(10, 120),
  preferredLocations: list(10, 120),
  remotePreference: z.enum(['remote', 'hybrid', 'onsite', 'any']).default('any'),
})

export type CareerProfile = z.infer<typeof careerProfileSchema>
export type ExperienceEntry = z.infer<typeof experienceSchema>
export type EducationEntry = z.infer<typeof educationSchema>
export type ProjectEntry = z.infer<typeof projectSchema>

export const emptyProfile = (): CareerProfile => careerProfileSchema.parse({})

export function isProfileReady(profile: CareerProfile | null | undefined) {
  return Boolean(profile?.fullName && profile.email && (profile.summary || profile.experience.length || profile.skills.length))
}

export const jobSchema = z.object({
  id: z.string().max(400),
  title: z.string().max(300),
  company: z.string().max(200),
  location: z.string().max(200).default(''),
  remote: z.boolean().default(false),
  description: z.string().max(12000).default(''),
  highlights: z.array(z.string().max(600)).max(30).default([]),
  salary: z.string().max(120).optional(),
  postedAt: z.string().max(80).optional(),
  employmentType: z.string().max(80).optional(),
  source: z.string().max(120).default(''),
  applyUrl: z.string().url().max(2000).optional(),
  applyOptions: z
    .array(z.object({ title: z.string().max(120), url: z.string().url().max(2000) }))
    .max(10)
    .default([]),
})

export type Job = z.infer<typeof jobSchema>

export const jobAnalysisSchema = z.object({
  requiredSkills: z.array(z.string()).describe('Skills the posting explicitly requires'),
  preferredSkills: z.array(z.string()).describe('Nice-to-have skills explicitly mentioned'),
  experienceRequirements: z.array(z.string()).describe('Years / seniority / domain experience requirements'),
  techStack: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()).describe('Important keywords from the posting'),
  matchingSkills: z.array(z.string()).describe('Requirements that are present in the candidate profile, verbatim from the profile'),
  relevantProjects: z.array(z.string()).describe('Names of profile projects relevant to the job'),
  relevantExperience: z.array(z.string()).describe('"Title at Company" entries from the profile relevant to the job'),
  missingRequirements: z.array(z.string()).describe('Requirements not present in the profile'),
  needsClarification: z.array(z.string()).describe('Requirements that are ambiguous given the profile'),
})

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>

export const cvDocumentSchema = z.object({
  headline: z.string().max(200),
  summary: z.string().max(2000),
  skills: z.array(z.string().max(80)).max(40),
  experience: z
    .array(
      z.object({
        company: z.string().max(160),
        title: z.string().max(160),
        location: z.string().max(160).default(''),
        period: z.string().max(80).default(''),
        bullets: z.array(z.string().max(500)).max(10),
      }),
    )
    .max(20),
  projects: z
    .array(
      z.object({
        name: z.string().max(160),
        url: z.string().max(400).default(''),
        description: z.string().max(800),
      }),
    )
    .max(15),
  education: z
    .array(z.object({ school: z.string().max(200), degree: z.string().max(200), period: z.string().max(80).default('') }))
    .max(10),
  languages: z.array(z.string().max(80)).max(15),
  targetRole: z.string().max(200).optional(),
  targetCompany: z.string().max(200).optional(),
})

export type CvDocument = z.infer<typeof cvDocumentSchema>

export const applicationEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
})

export type ApplicationEmail = z.infer<typeof applicationEmailSchema>

export const APPLICATION_STATUSES = ['applied', 'follow_up', 'interview', 'offer', 'rejected', 'withdrawn'] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  follow_up: 'Follow-up',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export interface ApplicationRecord {
  id: string
  company: string
  role: string
  jobUrl: string | null
  recipient: string
  job: Job | null
  cv: CvDocument | null
  emailSubject: string
  emailBody: string
  status: ApplicationStatus
  providerMessageId: string | null
  appliedAt: string
  followUpSentAt: string | null
}

export interface CareerStatus {
  signedIn: boolean
  email: { configured: boolean; sender: string | null }
  jobs: { configured: boolean }
  ai: { configured: boolean }
}

export class CareerError extends Error {
  constructor(
    message: string,
    public code: 'CONFIGURATION' | 'UNAUTHORIZED' | 'INVALID' | 'UPSTREAM' | 'NOT_FOUND',
    public status = 400,
  ) {
    super(message)
  }
}

export const EMAIL_NOT_CONFIGURED_MESSAGE = 'Email sending is not configured yet.'
export const JOBS_NOT_CONFIGURED_MESSAGE = 'Live job search is not configured yet.'
