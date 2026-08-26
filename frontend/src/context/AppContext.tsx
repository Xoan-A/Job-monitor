import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ConfirmOptions } from '../components/Dialogs'
import {
  EMPTY_FILTERS,
  JOB_STATUSES,
  type Facets,
  type Job,
  type JobFilters,
  type JobsPage,
  type NavSection,
  type SortOption,
  type SummaryStats,
} from '../types'
import { PAGE_SIZE, SAVED_SEARCHES } from '../constants/savedSearches'
import {
  getPreferredMode,
  resolveJobService,
  ServiceError,
  setPreferredMode as persistMode,
  type DataSourceMode,
  type JobService,
  type ResolvedSource,
} from '../services'

export interface SectionMeta {
  title: string
  subtitle: string
}

interface Toast {
  id: number
  text: string
  tone: 'error' | 'success'
}

export interface AppState {
  service: JobService | null
  sourceKind: ResolvedSource | 'loading'
  dataSourceMode: DataSourceMode
  setDataSourceMode: (mode: DataSourceMode) => void

  nav: NavSection
  goToSection: (section: NavSection) => void
  filterBySource: (source: string) => void

  filters: JobFilters
  patchFilter: <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => void
  clearFilters: () => void
  activeFilterCount: number
  applySavedSearch: (label: string) => void
  savedSearchCounts: Record<string, number>

  sort: SortOption
  setSort: (s: SortOption) => void

  jobs: Job[]
  totalJobs: number
  jobsLoading: boolean
  jobsLoadingMore: boolean
  jobsError: string | null
  loadMore: () => void
  refreshJobs: () => void

  selectedJobId: number | null
  selectJob: (id: number | null) => void
  detail: { job: Job | null; loading: boolean; error: string | null }
  backToList: () => void

  selection: Set<number>
  toggleSelect: (id: number) => void
  selectAllVisible: () => void
  clearSelection: () => void

  toggleSaved: (id: number) => Promise<void>
  changeStatus: (id: number, status: JobFilters['status']) => Promise<void>
  saveNotes: (id: number, notes: string) => Promise<void>
  markReviewed: (id: number) => Promise<void>
  bulkAction: (action: 'reviewed' | 'save' | 'archive', status?: JobFilters['status']) => Promise<void>
  mutatingIds: Set<number>

  summary: SummaryStats | null
  facets: Facets | null
  refreshStats: () => void
  cleanupOldJobs: (days: number, source?: string) => Promise<number>
  getPurgeableCount: (days: number, source?: string) => Promise<number>

  sidebarCollapsed: boolean
  toggleSidebar: () => void

  openDialog: 'settings' | 'about' | null
  setOpenDialog: (d: 'settings' | 'about' | null) => void

  confirmState: ConfirmOptions | null
  openConfirm: (options: ConfirmOptions) => void
  closeConfirm: () => void

  mobileView: 'list' | 'detail'
  searchInputRef: React.RefObject<HTMLInputElement> | null

  toasts: Toast[]
  pushToast: (text: string, tone?: Toast['tone']) => void
}

export const AppContext = createContext<AppState | null>(null)

function sectionToFilters(section: NavSection): Partial<JobFilters> {
  switch (section) {
    case 'new':
      // "New" = discovered in the last 48 hours and still untouched
      return { status: 'new', discoveredWithin: '2', saved: null }
    case 'saved':
      return { saved: true, status: '' }
    case 'shortlisted':
      return { status: 'shortlisted', saved: null }
    case 'applied':
      return { status: 'applied', saved: null }
    case 'rejected':
      return { status: 'rejected', saved: null }
    default:
      return {}
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof ServiceError) return err.message
  return 'Something went wrong. Please try again.'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [service, setService] = useState<JobService | null>(null)
  const [sourceKind, setSourceKind] = useState<ResolvedSource | 'loading'>('loading')
  const [dataSourceMode, setDataSourceModeState] = useState<DataSourceMode>(() => getPreferredMode())

  const [nav, setNav] = useState<NavSection>('all')
  const [filters, setFilters] = useState<JobFilters>({ ...EMPTY_FILTERS })
  const [sort, setSortState] = useState<SortOption>('newest')

  const [jobs, setJobs] = useState<Job[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobsLoadingMore, setJobsLoadingMore] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const pageRef = useRef(1)
  const requestIdRef = useRef(0)

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  const [detail, setDetail] = useState<{ job: Job | null; loading: boolean; error: string | null }>({
    job: null,
    loading: false,
    error: null,
  })
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [mutatingIds, setMutatingIds] = useState<Set<number>>(new Set())

  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [facets, setFacets] = useState<Facets | null>(null)
  const [savedSearchCounts, setSavedSearchCounts] = useState<Record<string, number>>({})

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), [])
  const [openDialog, setOpenDialog] = useState<'settings' | 'about' | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)

  const openConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options)
  }, [])

  const closeConfirm = useCallback(() => {
    setConfirmState(null)
  }, [])
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdRef = useRef(0)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let cancelled = false
    setSourceKind('loading')
    resolveJobService(dataSourceMode)
      .then(({ service: svc, resolved }) => {
        if (cancelled) return
        setService(svc)
        setSourceKind(resolved)
      })
      .catch(() => {
        if (cancelled) return
        // API mode explicitly requested but unreachable: keep service null so the
        // UI shows the error state with a retry action.
        setService(null)
        setSourceKind('api')
        setJobsError('Unable to reach the Job Monitor API. Start the backend or switch to demo data in Settings.')
      })
    return () => {
      cancelled = true
    }
  }, [dataSourceMode])

  const setDataSourceMode = useCallback((mode: DataSourceMode) => {
    persistMode(mode)
    setDataSourceModeState(mode)
  }, [])

  const pushToast = useCallback((text: string, tone: Toast['tone'] = 'error') => {
    const id = ++toastIdRef.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }, [])

  const refreshStats = useCallback(() => {
    if (!service) return
    service
      .getSummary()
      .then(setSummary)
      .catch(() => undefined)
    service
      .getFacets()
      .then(setFacets)
      .catch(() => undefined)
    SAVED_SEARCHES.forEach((ss) => {
      const q = { ...EMPTY_FILTERS, ...ss.filters, page: 1, limit: 1, sort: 'newest' as SortOption }
      service
        .getJobs(q)
        .then((page) => setSavedSearchCounts((prev) => ({ ...prev, [ss.label]: page.total })))
        .catch(() => undefined)
    })
  }, [service])

  useEffect(() => {
    if (service) refreshStats()
  }, [service, refreshStats])

  const fetchJobs = useCallback(
    async (page: number, append: boolean) => {
      if (!service) return
      const requestId = ++requestIdRef.current
      if (append) setJobsLoadingMore(true)
      else {
        setJobsLoading(true)
        setJobsError(null)
      }
      try {
        const effective: JobFilters = { ...filters, ...sectionToFilters(nav) }
        const query = { ...effective, page, limit: PAGE_SIZE, sort }
        const res: JobsPage = await service.getJobs(query)
        if (requestId !== requestIdRef.current) return
        setJobs((prev) => (append ? [...prev, ...res.jobs] : res.jobs))
        setTotalJobs(res.total)
        pageRef.current = page
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setJobsError(errorMessage(err))
        if (!append) setJobs([])
      } finally {
        if (requestId === requestIdRef.current) {
          setJobsLoading(false)
          setJobsLoadingMore(false)
        }
      }
    },
    [service, filters, nav, sort],
  )

  useEffect(() => {
    fetchJobs(1, false)
    setSelection(new Set())
  }, [fetchJobs])

  const loadMore = useCallback(() => {
    if (jobsLoading || jobsLoadingMore || !jobs.length) return
    if (jobs.length >= totalJobs) return
    fetchJobs(pageRef.current + 1, true)
  }, [fetchJobs, jobs.length, totalJobs, jobsLoading, jobsLoadingMore])

  const refreshJobs = useCallback(() => {
    fetchJobs(1, false)
    refreshStats()
  }, [fetchJobs, refreshStats])

  const patchFilter = useCallback(<K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ ...EMPTY_FILTERS, ...(nav !== 'all' ? sectionToFilters(nav) : {}) })
  }, [nav])

  const goToSection = useCallback((section: NavSection) => {
    setNav(section)
    setSelectedJobId(null)
    setMobileView('list')
    setFilters({ ...EMPTY_FILTERS, ...sectionToFilters(section) })
  }, [])

  const filterBySource = useCallback((source: string) => {
    setNav('all')
    setSelectedJobId(null)
    setMobileView('list')
    setFilters((prev) => ({ ...prev, source }))
  }, [])

  const applySavedSearch = useCallback(
    (label: string) => {
      const ss = SAVED_SEARCHES.find((s) => s.label === label)
      if (!ss) return
      setNav('all')
      setSelectedJobId(null)
      setMobileView('list')
      setFilters({ ...EMPTY_FILTERS, ...ss.filters })
    },
    [],
  )

  const selectJob = useCallback(
    (id: number | null) => {
      setSelectedJobId(id)
      setMobileView(id === null ? 'list' : 'detail')
      if (id === null) {
        setDetail({ job: null, loading: false, error: null })
        return
      }
      const cached = jobs.find((j) => j.id === id)
      setDetail({ job: cached ?? null, loading: true, error: null })
      if (!service) return
      service
        .getJob(id)
        .then((job) => setDetail({ job, loading: false, error: null }))
        .catch((err) => setDetail({ job: cached ?? null, loading: false, error: errorMessage(err) }))
    },
    [service, jobs],
  )

  const backToList = useCallback(() => {
    setSelectedJobId(null)
    setMobileView('list')
  }, [])

  const applyLocalPatch = useCallback((id: number, patch: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
    setDetail((d) => (d.job && d.job.id === id ? { ...d, job: { ...d.job, ...patch } } : d))
  }, [])

  const findJob = useCallback(
    (id: number): Job | undefined => {
      const inList = jobs.find((j) => j.id === id)
      if (inList) return inList
      if (detail.job && detail.job.id === id) return detail.job
      return undefined
    },
    [jobs, detail.job],
  )

  const runMutation = useCallback(
    async (id: number, patch: Parameters<JobService['updateJob']>[1], optimistic: Partial<Job>) => {
      if (!service) return
      const snapshot = findJob(id)
      setMutatingIds((prev) => new Set(prev).add(id))
      applyLocalPatch(id, optimistic)
      try {
        const updated = await service.updateJob(id, patch)
        applyLocalPatch(id, updated)
        refreshStats()
      } catch (err) {
        if (snapshot) {
          const restore = {
            status: snapshot.status,
            saved: snapshot.saved,
            notes: snapshot.notes,
            reviewedAt: snapshot.reviewedAt,
          }
          applyLocalPatch(id, restore)
        }
        pushToast(errorMessage(err))
      } finally {
        setMutatingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [service, findJob, applyLocalPatch, refreshStats, pushToast],
  )

  const toggleSaved = useCallback(
    async (id: number) => {
      const job = findJob(id)
      if (!job) return
      await runMutation(id, { saved: !job.saved }, { saved: !job.saved })
    },
    [findJob, runMutation],
  )

  const changeStatus = useCallback(
    async (id: number, status: JobFilters['status']) => {
      if (!status) return
      await runMutation(id, { status, markReviewed: status !== 'new' }, { status })
    },
    [runMutation],
  )

  const saveNotes = useCallback(
    async (id: number, notes: string) => {
      if (!service) return
      setMutatingIds((prev) => new Set(prev).add(id))
      try {
        await service.updateJob(id, { notes })
      } catch (err) {
        pushToast(errorMessage(err))
      } finally {
        setMutatingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [service, pushToast],
  )

  const markReviewed = useCallback(
    async (id: number) => {
      const job = findJob(id)
      const nextStatus: Job['status'] = job && job.status !== 'new' ? job.status : 'reviewing'
      await runMutation(
        id,
        { markReviewed: true, status: nextStatus },
        { reviewedAt: new Date().toISOString(), status: nextStatus },
      )
    },
    [findJob, runMutation],
  )

  const bulkAction = useCallback(
    async (action: 'reviewed' | 'save' | 'archive', status?: JobFilters['status']) => {
      if (!service || selection.size === 0) return
      const ids = [...selection]
      try {
        if (action === 'save') {
          await service.bulkUpdate(ids, { saved: true })
        } else {
          const target = action === 'archive' ? ('archived' as const) : ((status as Job['status']) || 'reviewing')
          await service.bulkUpdate(ids, { markReviewed: true, status: JOB_STATUSES.includes(target) ? target : 'reviewing' })
        }
        setSelection(new Set())
        refreshJobs()
      } catch (err) {
        pushToast(errorMessage(err))
        refreshJobs()
      }
    },
    [selection, service, refreshJobs, pushToast],
  )

  const selectAllVisible = useCallback(() => {
    setSelection(new Set(jobs.map((j) => j.id)))
  }, [jobs])

  const toggleSelect = useCallback((id: number) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelection(new Set()), [])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.q) n++
    if (filters.source) n++
    if (filters.location) n++
    if (filters.remote) n++
    if (filters.employmentType) n++
    if (filters.experience) n++
    if (filters.postedWithin) n++
    if (filters.hasSalary) n++
    if (filters.company) n++
    if (filters.skill) n++
    return n
  }, [filters])

  const cleanupOldJobs = useCallback(
    async (days: number, source?: string) => {
      if (!service) return 0
      try {
        const result = await service.cleanupOldJobs(days, source)
        pushToast(`Purged ${result.deleted} old jobs`)
        refreshJobs()
        refreshStats()
        return result.deleted
      } catch (err) {
        pushToast(errorMessage(err))
        return 0
      }
    },
    [service, pushToast, refreshJobs, refreshStats],
  )

  const getPurgeableCount = useCallback(
    async (days: number, source?: string) => {
      if (!service) return 0
      try {
        const result = await service.getPurgeableCount(days, source)
        return result.count
      } catch {
        return 0
      }
    },
    [service],
  )

  const value: AppState = useMemo(() => ({
    service,
    sourceKind,
    dataSourceMode,
    setDataSourceMode,
      nav,
      goToSection,
      filterBySource,
      filters,
      patchFilter,
    clearFilters,
    activeFilterCount,
    applySavedSearch,
    savedSearchCounts,
    sort,
    setSort: setSortState,
    jobs,
    totalJobs,
    jobsLoading,
    jobsLoadingMore,
    jobsError,
    loadMore,
    refreshJobs,
    selectedJobId,
    selectJob,
    detail,
    backToList,
    selection,
    toggleSelect,
    selectAllVisible,
    clearSelection,
    toggleSaved,
    changeStatus,
    saveNotes,
    markReviewed,
    bulkAction,
    mutatingIds,
    summary,
    facets,
    refreshStats,
    cleanupOldJobs,
    getPurgeableCount,
    sidebarCollapsed,
    toggleSidebar,
    openDialog,
    setOpenDialog,
    confirmState,
    openConfirm,
    closeConfirm,
    mobileView,
    searchInputRef,
    toasts,
    pushToast,
  }), [
    service, sourceKind, dataSourceMode, setDataSourceMode,
    nav, goToSection, filterBySource, filters, patchFilter,
    clearFilters, activeFilterCount, applySavedSearch, savedSearchCounts,
    sort, setSortState, jobs, totalJobs, jobsLoading, jobsLoadingMore, jobsError,
    loadMore, refreshJobs, selectedJobId, selectJob, detail, backToList,
    selection, toggleSelect, selectAllVisible, clearSelection,
    toggleSaved, changeStatus, saveNotes, markReviewed, bulkAction, mutatingIds,
    summary, facets, refreshStats, cleanupOldJobs, getPurgeableCount,
    sidebarCollapsed, toggleSidebar, openDialog, setOpenDialog, confirmState, openConfirm, closeConfirm,
    mobileView, searchInputRef, toasts, pushToast,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}


