export const JOB_STATUSES = [
  'new',
  'reviewing',
  'shortlisted',
  'applied',
  'interview',
  'rejected',
  'archived',
] as const

export type JobStatus = (typeof JOB_STATUSES)[number]

export const STATUS_LABELS: Record<JobStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  archived: 'Archived',
}

export type RemoteType = 'remote' | 'hybrid' | 'onsite'

export interface Job {
  id: number
  source: string
  externalId: string | null
  title: string
  company: string | null
  description: string | null
  location: string | null
  city: string | null
  department: string | null
  country: string | null
  url: string | null
  applicationUrl: string | null
  publishedAt: string | null
  scrapedAt: string | null
  modality: string | null
  employmentType: string | null
  salary: string | null
  skills: string[]
  experienceLevel: string | null
  isConfidential: boolean
  status: JobStatus
  saved: boolean
  notes: string | null
  reviewedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  matchScore: number | null
  matchStrong: string[]
  matchGaps: string[]
  matchRelated: { source: string; target: string; confidence: number }[]
  matchExplanation: string | null
  matchRequiredScore: number | null
  matchPreferredScore: number | null
  matchSemanticScore: number | null
  matchExperienceScore: number | null
  matchRoleScore: number | null
}

export type SortOption = 'newest' | 'oldest' | 'company' | 'relevance' | 'salary' | 'match'
export type PostedWithinOption = '' | '1' | '2' | '3' | '7' | '14' | '30' | '90'

export interface JobFilters {
  q: string
  source: string
  location: string
  remote: RemoteType | ''
  employmentType: string
  experience: string
  postedWithin: PostedWithinOption
  discoveredWithin: PostedWithinOption
  hasSalary: boolean
  company: string
  skill: string
  status: JobStatus | ''
  saved: boolean | null
}

export const EMPTY_FILTERS: JobFilters = {
  q: '',
  source: '',
  location: '',
  remote: '',
  employmentType: '',
  experience: '',
  postedWithin: '',
  discoveredWithin: '',
  hasSalary: false,
  company: '',
  skill: '',
  status: '',
  saved: null,
}

export function filtersAreEmpty(f: JobFilters): boolean {
  return (
    !f.q &&
    !f.source &&
    !f.location &&
    !f.remote &&
    !f.employmentType &&
    !f.experience &&
    !f.postedWithin &&
    !f.discoveredWithin &&
    !f.hasSalary &&
    !f.company &&
    !f.skill &&
    !f.status &&
    f.saved === null
  )
}

export function countActiveFilters(f: JobFilters): number {
  let n = 0
  if (f.q) n++
  if (f.source) n++
  if (f.location) n++
  if (f.remote) n++
  if (f.employmentType) n++
  if (f.experience) n++
  if (f.postedWithin) n++
  if (f.discoveredWithin) n++
  if (f.hasSalary) n++
  if (f.company) n++
  if (f.skill) n++
  if (f.status) n++
  if (f.saved !== null) n++
  return n
}

export interface JobsPage {
  jobs: Job[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Facets {
  sources: { name: string; count: number }[]
  locations: string[]
  employmentTypes: string[]
  experienceLevels: string[]
}

export interface SummaryStats {
  total: number
  saved: number
  unread: number
  byStatus: Record<string, number>
  bySource: { name: string; count: number }[]
}

export type NavSection =
  | 'overview'
  | 'all'
  | 'new'
  | 'saved'
  | 'shortlisted'
  | 'applied'
  | 'rejected'

export interface ResumeInfo {
  id: number
  version: number
  skills: string[]
  roles: string[]
  experience_level: string | null
  years_experience: number | null
  education: { degree: string; field: string; raw: string }[]
  languages: { language: string; level: string | null }[]
  updated_at: string | null
}
