import type { JobFilters } from '../types'

export interface SavedSearch {
  label: string
  filters: Partial<JobFilters>
}

export const SAVED_SEARCHES: SavedSearch[] = [
  { label: '.NET / C#', filters: { skill: 'C#' } },
  { label: 'Backend', filters: { q: 'backend' } },
  { label: 'Data', filters: { q: 'data' } },
  { label: 'Remote Uruguay', filters: { remote: 'remote' } },
]

export const PAGE_SIZE = 25
