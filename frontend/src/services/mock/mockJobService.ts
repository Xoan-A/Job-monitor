import type { Facets, Job, JobsPage, SummaryStats } from '../../types'
import { ServiceError, buildApiParams, type JobPatchInput, type JobQuery, type JobService } from '../jobService'
import { buildMockJobs, persistMockState } from './mockData'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let jobs: Job[] = []

function ensureJobs(): Job[] {
  if (!jobs.length) jobs = buildMockJobs()
  return jobs
}

function parseSalary(s: string | null): number | null {
  if (!s) return null
  const m = s.replace(/\./g, '').match(/[\d,]+/)
  if (!m) return null
  const n = parseInt(m[0].replace(/,/g, ''), 10)
  return Number.isNaN(n) ? null : n
}

function matchesFilters(job: Job, q: JobQuery): boolean {
  if (q.q) {
    const needle = q.q.toLowerCase()
    const hay = [job.title, job.company || '', job.description || '', job.skills.join(' '), job.location || '']
      .join(' ')
      .toLowerCase()
    if (!hay.includes(needle)) return false
  }
  if (q.source && job.source !== q.source) return false
  if (q.location && !(job.city?.toLowerCase().includes(q.location.toLowerCase()) || job.location?.toLowerCase().includes(q.location.toLowerCase()))) return false
  if (q.remote) {
    const modality = (job.modality || '').toLowerCase()
    const isRemote = /remot|teletrabajo/.test(modality)
    const isHybrid = /h[ií]brid/.test(modality)
    const isOnsite = /presencial|on.?site/.test(modality)
    if (q.remote === 'remote' && !isRemote) return false
    if (q.remote === 'hybrid' && !isHybrid) return false
    if (q.remote === 'onsite' && !isOnsite) return false
  }
  if (q.employmentType && !(job.employmentType || '').toLowerCase().includes(q.employmentType.toLowerCase())) return false
  if (q.experience && !(job.experienceLevel || '').toLowerCase().includes(q.experience.toLowerCase())) return false
  if (q.company && !(job.company || '').toLowerCase().includes(q.company.toLowerCase())) return false
  if (q.skill && !job.skills.some((s) => s.toLowerCase().includes(q.skill!.toLowerCase()))) return false
  if (q.status && job.status !== q.status) return false
  if (q.saved !== null && q.saved !== undefined && job.saved !== q.saved) return false
  if (q.hasSalary && !job.salary) return false
  if (q.postedWithin) {
    const days = parseInt(q.postedWithin, 10)
    const published = job.publishedAt ? new Date(job.publishedAt).getTime() : 0
    if (!published || Date.now() - published > days * 86400000) return false
  }
  return true
}

function sortJobs(list: Job[], sort: string, q?: string): Job[] {
  const arr = [...list]
  const newest = (a: Job, b: Job) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime()
  switch (sort) {
    case 'oldest':
      return arr.sort((a, b) => new Date(a.publishedAt || a.createdAt || 0).getTime() - new Date(b.publishedAt || b.createdAt || 0).getTime())
    case 'company':
      return arr.sort((a, b) => (a.company || '~').localeCompare(b.company || '~') || newest(b, a))
    case 'salary':
      return arr.sort((a, b) => (parseSalary(b.salary) ?? -1) - (parseSalary(a.salary) ?? -1))
    case 'relevance':
      if (q) {
        const needle = q.toLowerCase()
        return arr.sort(
          (a, b) => Number(b.title.toLowerCase().includes(needle)) - Number(a.title.toLowerCase().includes(needle)) || newest(b, a),
        )
      }
      return arr.sort(newest)
    default:
      return arr.sort(newest)
  }
}

export class MockJobService implements JobService {
  readonly kind = 'mock' as const

  async getJobs(query: JobQuery): Promise<JobsPage> {
    await delay(180 + Math.random() * 220)
    void buildApiParams(query)
    const filtered = sortJobs(ensureJobs().filter((j) => matchesFilters(j, query)), query.sort, query.q)
    const start = (query.page - 1) * query.limit
    return {
      jobs: filtered.slice(start, start + query.limit),
      total: filtered.length,
      page: query.page,
      pageSize: Math.min(query.limit, Math.max(filtered.length - start, 0)),
      totalPages: Math.max(Math.ceil(filtered.length / query.limit), 1),
    }
  }

  async getJob(id: number): Promise<Job> {
    await delay(120)
    const job = ensureJobs().find((j) => j.id === id)
    if (!job) throw new ServiceError(`Job ${id} not found`)
    return job
  }

  async updateJob(id: number, patch: JobPatchInput): Promise<Job> {
    await delay(90)
    const list = ensureJobs()
    const idx = list.findIndex((j) => j.id === id)
    if (idx === -1) throw new ServiceError(`Job ${id} not found`)
    const current = list[idx]
    const next: Job = { ...current }
    if (patch.status !== undefined) next.status = patch.status
    if (patch.saved !== undefined) next.saved = patch.saved
    if (patch.notes !== undefined) next.notes = patch.notes
    if (patch.markReviewed) next.reviewedAt = new Date().toISOString()
    list[idx] = next
    persistMockState(id, { status: next.status, saved: next.saved, notes: next.notes, reviewedAt: next.reviewedAt })
    return next
  }

  async bulkUpdate(ids: number[], patch: Omit<JobPatchInput, 'notes'>): Promise<{ updated: number }> {
    await delay(150)
    let updated = 0
    for (const id of ids) {
      await this.updateJob(id, patch)
      updated++
    }
    return { updated }
  }

  async getFacets(): Promise<Facets> {
    await delay(80)
    const all = ensureJobs()
    const sourceCounts = new Map<string, number>()
    for (const j of all) sourceCounts.set(j.source, (sourceCounts.get(j.source) || 0) + 1)
    return {
      sources: [...sourceCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      locations: [...new Set(all.map((j) => j.city).filter(Boolean))] as string[],
      employmentTypes: [...new Set(all.map((j) => j.employmentType).filter(Boolean))] as string[],
      experienceLevels: [...new Set(all.map((j) => j.experienceLevel).filter(Boolean))] as string[],
    }
  }

  async getSummary(): Promise<SummaryStats> {
    await delay(60)
    const all = ensureJobs()
    const byStatus: Record<string, number> = {}
    for (const j of all) byStatus[j.status] = (byStatus[j.status] || 0) + 1
    const sourceCounts = new Map<string, number>()
    for (const j of all) sourceCounts.set(j.source, (sourceCounts.get(j.source) || 0) + 1)
    return {
      total: all.length,
      saved: all.filter((j) => j.saved).length,
      unread: byStatus['new'] || 0,
      byStatus,
      bySource: [...sourceCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    }
  }
}
