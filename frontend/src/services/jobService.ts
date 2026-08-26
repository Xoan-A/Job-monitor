import type { Facets, Job, JobsPage, JobFilters, JobStatus, SortOption, SummaryStats } from '../types'

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
    throw new ServiceError('No se pudo conectar con el servidor.', err)
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapApiJob(raw: any): Job {
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
    const raw = await request<any>(`/jobs?${buildApiParams(query).toString()}`)
    return {
      jobs: (raw.jobs || []).map(mapApiJob),
      total: raw.total ?? 0,
      page: raw.page ?? 1,
      pageSize: raw.page_size ?? 0,
      totalPages: raw.total_pages ?? 0,
    }
  }

  async getJob(id: number): Promise<Job> {
    return mapApiJob(await request<any>(`/jobs/${id}`))
  }

  async updateJob(id: number, patch: JobPatchInput): Promise<Job> {
    const body: Record<string, unknown> = {}
    if (patch.status !== undefined) body.user_status = patch.status
    if (patch.saved !== undefined) body.is_saved = patch.saved
    if (patch.notes !== undefined) body.notes = patch.notes
    if (patch.markReviewed) body.mark_reviewed = true
    return mapApiJob(await request<any>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) }))
  }

  async bulkUpdate(ids: number[], patch: Omit<JobPatchInput, 'notes'>): Promise<{ updated: number }> {
    const body: Record<string, unknown> = { ids }
    if (patch.status !== undefined) body.user_status = patch.status
    if (patch.saved !== undefined) body.is_saved = patch.saved
    if (patch.markReviewed) body.mark_reviewed = true
    const res = await request<any>('/jobs/bulk', { method: 'POST', body: JSON.stringify(body) })
    return { updated: res.updated ?? 0 }
  }

  async getFacets(): Promise<Facets> {
    const raw = await request<any>('/jobs/facets')
    return {
      sources: (raw.sources || []).map((s: any) => ({ name: s.source, count: s.count })),
      locations: raw.locations || [],
      employmentTypes: raw.employment_types || [],
      experienceLevels: raw.experience_levels || [],
    }
  }

  async getSummary(): Promise<SummaryStats> {
    const raw = await request<any>('/stats/summary')
    const byStatus: Record<string, number> = {}
    for (const item of raw.by_status || []) byStatus[item.status] = item.count
    return {
      total: raw.total ?? 0,
      saved: raw.saved ?? 0,
      unread: raw.unread ?? 0,
      byStatus,
      bySource: (raw.by_source || []).map((s: any) => ({ name: s.source, count: s.count })),
    }
  }

  async cleanupOldJobs(days: number, source?: string): Promise<{ deleted: number }> {
    const params = new URLSearchParams({ days: String(days) })
    if (source) params.set('source', source)
    const res = await request<any>(`/jobs/cleanup?${params}`, { method: 'DELETE' })
    return { deleted: res.deleted ?? 0 }
  }

  async getPurgeableCount(days: number, source?: string): Promise<{ count: number }> {
    const params = new URLSearchParams({ days: String(days) })
    if (source) params.set('source', source)
    const res = await request<any>(`/jobs/purgeable?${params}`)
    return { count: res.count ?? 0 }
  }
}
