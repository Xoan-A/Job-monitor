import type { Facets, Job, JobsPage, JobFilters, JobStatus, ResumeInfo, SortOption, SummaryStats } from '../types'

export interface JobQuery extends JobFilters {
  page: number
  limit: number
  sort: SortOption
}

export interface JobPatchInput {
  status?: JobStatus
  saved?: boolean
  notes?: string
  markReviewed?: boolean
}

export interface JobService {
  readonly kind: 'api' | 'mock'
  getJobs(query: JobQuery): Promise<JobsPage>
  getJob(id: number): Promise<Job>
  updateJob(id: number, patch: JobPatchInput): Promise<Job>
  bulkUpdate(ids: number[], patch: Omit<JobPatchInput, 'notes'>): Promise<{ updated: number }>
  getFacets(): Promise<Facets>
  getSummary(): Promise<SummaryStats>
  cleanupOldJobs(days: number, source?: string): Promise<{ deleted: number }>
  getPurgeableCount(days: number, source?: string): Promise<{ count: number }>
  getProfile(): Promise<ResumeInfo | null>
  uploadProfile(file: File): Promise<ResumeInfo>
  deleteProfile(): Promise<void>
  startBatchMatch(): Promise<void>
  matchSingleJob(jobId: number): Promise<Job>
  addSkillTerm(term: string): Promise<{ added: boolean }>
  rerunAllMatches(): Promise<void>
}

export class ServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'ServiceError'
  }
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    })
  } catch (err) {
    throw new ServiceError('Could not connect to the server.', err)
  }
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.detail ? String(body.detail) : ''
    } catch {
    }
    throw new ServiceError(`Request failed (${res.status})${detail ? `: ${detail}` : ''}`)
  }
  return res.json() as Promise<T>
}

interface ApiJob {
  id: number
  source: string
  external_id: string | null
  title: string
  company: string | null
  description: string | null
  location: string | null
  city: string | null
  department: string | null
  country: string | null
  url: string | null
  application_url: string | null
  published_at: string | null
  scraped_at: string | null
  modality: string | null
  job_type: string | null
  salary: string | null
  tags: (string | number)[]
  experience_level: string | null
  is_confidential: boolean
  user_status: string
  is_saved: boolean
  notes: string | null
  reviewed_at: string | null
  created_at: string | null
  updated_at: string | null
  match_score: number | null
  match_strong: string[]
  match_gaps: string[]
  match_related: { source: string; target: string; confidence: number }[]
  match_explanation: string | null
  match_required_score: number | null
  match_preferred_score: number | null
  match_semantic_score: number | null
  match_experience_score: number | null
  match_role_score: number | null
}

interface ApiJobsPageResponse {
  jobs: ApiJob[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

interface ApiFacetItem {
  source?: string
  count: number
}

interface ApiFacetsResponse {
  sources: ApiFacetItem[]
  locations: string[]
  employment_types: string[]
  experience_levels: string[]
}

interface ApiSummaryResponse {
  total: number
  saved: number
  unread: number
  by_status: { status: string; count: number }[]
  by_source: { source: string; count: number }[]
}

function mapApiJob(raw: ApiJob): Job {
  return {
    id: raw.id,
    source: raw.source ?? 'unknown',
    externalId: raw.external_id ?? null,
    title: raw.title ?? '',
    company: raw.company ?? null,
    description: raw.description ?? null,
    location: raw.location ?? null,
    city: raw.city ?? null,
    department: raw.department ?? null,
    country: raw.country ?? null,
    url: raw.url ?? null,
    applicationUrl: raw.application_url ?? raw.url ?? null,
    publishedAt: raw.published_at ?? null,
    scrapedAt: raw.scraped_at ?? null,
    modality: raw.modality ?? null,
    employmentType: raw.job_type ?? null,
    salary: raw.salary ?? null,
    skills: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    experienceLevel: raw.experience_level ?? null,
    isConfidential: Boolean(raw.is_confidential),
    status: (raw.user_status ?? 'new') as JobStatus,
    saved: Boolean(raw.is_saved),
    notes: raw.notes ?? null,
    reviewedAt: raw.reviewed_at ?? null,
    createdAt: raw.created_at ?? null,
    updatedAt: raw.updated_at ?? null,
    matchScore: typeof raw.match_score === 'number' ? raw.match_score : null,
    matchStrong: Array.isArray(raw.match_strong) ? raw.match_strong : [],
    matchGaps: Array.isArray(raw.match_gaps) ? raw.match_gaps : [],
    matchRelated: Array.isArray(raw.match_related) ? raw.match_related : [],
    matchExplanation: raw.match_explanation ?? null,
    matchRequiredScore: typeof raw.match_required_score === 'number' ? raw.match_required_score : null,
    matchPreferredScore: typeof raw.match_preferred_score === 'number' ? raw.match_preferred_score : null,
    matchSemanticScore: typeof raw.match_semantic_score === 'number' ? raw.match_semantic_score : null,
    matchExperienceScore: typeof raw.match_experience_score === 'number' ? raw.match_experience_score : null,
    matchRoleScore: typeof raw.match_role_score === 'number' ? raw.match_role_score : null,
  }
}

export function buildApiParams(q: JobQuery): URLSearchParams {
  const p = new URLSearchParams()
  if (q.q) p.set('q', q.q)
  if (q.source) p.set('source_only', q.source)
  if (q.location) p.set('city', q.location)
  if (q.remote) p.set('remote', q.remote)
  if (q.employmentType) p.set('job_type', q.employmentType)
  if (q.experience) p.set('experience', q.experience)
  if (q.company) p.set('company', q.company)
  if (q.skill) p.set('skill', q.skill)
  if (q.status) p.set('user_status', q.status)
  if (q.saved !== null && q.saved !== undefined) p.set('saved', String(q.saved))
  if (q.postedWithin) p.set('posted_within', q.postedWithin)
  if (q.discoveredWithin) p.set('discovered_within', q.discoveredWithin)
  if (q.hasSalary) p.set('has_salary', 'true')
  p.set('sort', q.sort)
  p.set('page', String(q.page))
  p.set('limit', String(q.limit))
  return p
}

export class ApiJobService implements JobService {
  readonly kind = 'api' as const

  async getJobs(query: JobQuery): Promise<JobsPage> {
    const raw = await request<ApiJobsPageResponse>(`/jobs?${buildApiParams(query).toString()}`)
    return {
      jobs: (raw.jobs || []).map(mapApiJob),
      total: raw.total ?? 0,
      page: raw.page ?? 1,
      pageSize: raw.page_size ?? 0,
      totalPages: raw.total_pages ?? 0,
    }
  }

  async getJob(id: number): Promise<Job> {
    return mapApiJob(await request<ApiJob>(`/jobs/${id}`))
  }

  async updateJob(id: number, patch: JobPatchInput): Promise<Job> {
    const body: Record<string, unknown> = {}
    if (patch.status !== undefined) body.user_status = patch.status
    if (patch.saved !== undefined) body.is_saved = patch.saved
    if (patch.notes !== undefined) body.notes = patch.notes
    if (patch.markReviewed) body.mark_reviewed = true
    return mapApiJob(await request<ApiJob>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }))
  }

  async bulkUpdate(ids: number[], patch: Omit<JobPatchInput, 'notes'>): Promise<{ updated: number }> {
    const body: Record<string, unknown> = { ids }
    if (patch.status !== undefined) body.user_status = patch.status
    if (patch.saved !== undefined) body.is_saved = patch.saved
    if (patch.markReviewed) body.mark_reviewed = true
    const res = await request<{ updated: number }>('/jobs/bulk', { method: 'POST', body: JSON.stringify(body) })
    return { updated: res.updated ?? 0 }
  }

  async getFacets(): Promise<Facets> {
    const raw = await request<ApiFacetsResponse>('/jobs/facets')
    return {
      sources: (raw.sources || []).map((s) => ({ name: s.source ?? 'unknown', count: s.count })),
      locations: raw.locations || [],
      employmentTypes: raw.employment_types || [],
      experienceLevels: raw.experience_levels || [],
    }
  }

  async getSummary(): Promise<SummaryStats> {
    const raw = await request<ApiSummaryResponse>('/stats/summary')
    const byStatus: Record<string, number> = {}
    for (const item of raw.by_status || []) byStatus[item.status] = item.count
    return {
      total: raw.total ?? 0,
      saved: raw.saved ?? 0,
      unread: raw.unread ?? 0,
      byStatus,
      bySource: (raw.by_source || []).map((s) => ({ name: s.source, count: s.count })),
    }
  }

  async cleanupOldJobs(days: number, source?: string): Promise<{ deleted: number }> {
    const params = new URLSearchParams({ days: String(days) })
    if (source) params.set('source', source)
    const res = await request<{ deleted: number }>(`/jobs/cleanup?${params}`, { method: 'DELETE' })
    return { deleted: res.deleted ?? 0 }
  }

  async getPurgeableCount(days: number, source?: string): Promise<{ count: number }> {
    const params = new URLSearchParams({ days: String(days) })
    if (source) params.set('source', source)
    const res = await request<{ count: number }>(`/jobs/purgeable?${params}`)
    return { count: res.count ?? 0 }
  }

  async getProfile(): Promise<ResumeInfo | null> {
    try {
      return await request<ResumeInfo>('/profile')
    } catch (err) {
      if (err instanceof ServiceError && err.message.includes('404')) return null
      throw err
    }
  }

  async uploadProfile(file: File): Promise<ResumeInfo> {
    const formData = new FormData()
    formData.append('file', file)
    const base = import.meta.env.VITE_API_BASE || '/api'
    const res = await fetch(`${base}/profile/upload`, { method: 'POST', body: formData })
    if (!res.ok) {
      let detail = ''
      try { const body = await res.json(); detail = body?.detail || '' } catch {}
      throw new ServiceError(`Upload failed (${res.status})${detail ? `: ${detail}` : ''}`)
    }
    const data = await res.json()
    return {
      id: data.profile_id ?? data.id ?? 0,
      version: data.version ?? 1,
      skills: data.skills ?? [],
      roles: data.roles ?? [],
      experience_level: data.experience_level ?? null,
      years_experience: data.years_experience ?? null,
      education: data.education ?? [],
      languages: data.languages ?? [],
      updated_at: data.updated_at ?? null,
    }
  }

  async deleteProfile(): Promise<void> {
    await request<{ status: string }>('/profile/delete', { method: 'POST' })
  }

  async startBatchMatch(): Promise<void> {
    await request<{ status: string }>('/match/batch', { method: 'POST' })
  }

  async matchSingleJob(jobId: number): Promise<Job> {
    return mapApiJob(await request<ApiJob>(`/match/${jobId}`, { method: 'POST' }))
  }

  async addSkillTerm(term: string): Promise<{ added: boolean }> {
    return request<{ added: boolean }>('/skills', {
      method: 'POST',
      body: JSON.stringify({ term }),
    })
  }

  async rerunAllMatches(): Promise<void> {
    await request<{ status: string }>('/match/batch', { method: 'POST' })
  }
}
