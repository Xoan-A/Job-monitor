import { ApiJobService, ServiceError, type JobService } from './jobService'
import { MockJobService } from './mock/mockJobService'

export type DataSourceMode = 'auto' | 'api' | 'mock'
export type ResolvedSource = 'api' | 'mock'

const MODE_KEY = 'jm_data_source'

export function getPreferredMode(): DataSourceMode {
  const v = localStorage.getItem(MODE_KEY)
  return v === 'api' || v === 'mock' || v === 'auto' ? v : 'auto'
}

export function setPreferredMode(mode: DataSourceMode) {
  localStorage.setItem(MODE_KEY, mode)
}

/**
 * Resolve the active job service.
 * - `api`  : always use the REST API (fails visibly if unreachable)
 * - `mock` : always use in-memory demo data
 * - `auto` : probe the API once; fall back to demo data if unavailable
 */
export async function resolveJobService(mode: DataSourceMode): Promise<{ service: JobService; resolved: ResolvedSource; apiError?: string }> {
  if (mode === 'api') {
    try {
      await probeApi()
      return { service: new ApiJobService(), resolved: 'api' }
    } catch (err) {
      const message = err instanceof ServiceError ? err.message : String(err)
      console.warn('[JobMonitor] API mode requested but API is unreachable:', message)
      throw err
    }
  }
  if (mode === 'mock') {
    return { service: new MockJobService(), resolved: 'mock' }
  }
  try {
    await probeApi()
    return { service: new ApiJobService(), resolved: 'api' }
  } catch {
    return { service: new MockJobService(), resolved: 'mock', apiError: 'API not reachable' }
  }
}

async function probeApi(): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const base = import.meta.env.VITE_API_BASE || '/api'
    const res = await fetch(`${base}/health`, { signal: controller.signal })
    if (!res.ok) throw new ServiceError(`Health check failed (${res.status})`)
  } finally {
    clearTimeout(timeout)
  }
}

export { ApiJobService, MockJobService, ServiceError }
export type { JobService }
