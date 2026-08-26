import { useContext, useMemo } from 'react'
import { AppContext } from './AppContext'
import type { AppState } from './AppContext'

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useJobs() {
  const ctx = useApp()
  return useMemo(() => ({
    jobs: ctx.jobs,
    totalJobs: ctx.totalJobs,
    jobsLoading: ctx.jobsLoading,
    jobsLoadingMore: ctx.jobsLoadingMore,
    jobsError: ctx.jobsError,
    loadMore: ctx.loadMore,
    refreshJobs: ctx.refreshJobs,
  }), [ctx.jobs, ctx.totalJobs, ctx.jobsLoading, ctx.jobsLoadingMore, ctx.jobsError, ctx.loadMore, ctx.refreshJobs])
}

export function useFilters() {
  const ctx = useApp()
  return useMemo(() => ({
    filters: ctx.filters,
    patchFilter: ctx.patchFilter,
    clearFilters: ctx.clearFilters,
    activeFilterCount: ctx.activeFilterCount,
    sort: ctx.sort,
    setSort: ctx.setSort,
  }), [ctx.filters, ctx.patchFilter, ctx.clearFilters, ctx.activeFilterCount, ctx.sort, ctx.setSort])
}

export function useUI() {
  const ctx = useApp()
  return useMemo(() => ({
    sidebarCollapsed: ctx.sidebarCollapsed,
    toggleSidebar: ctx.toggleSidebar,
    mobileView: ctx.mobileView,
    toasts: ctx.toasts,
    pushToast: ctx.pushToast,
    openDialog: ctx.openDialog,
    setOpenDialog: ctx.setOpenDialog,
    confirmState: ctx.confirmState,
    openConfirm: ctx.openConfirm,
    closeConfirm: ctx.closeConfirm,
    searchInputRef: ctx.searchInputRef,
  }), [ctx.sidebarCollapsed, ctx.toggleSidebar, ctx.mobileView, ctx.toasts, ctx.pushToast, ctx.openDialog, ctx.setOpenDialog, ctx.confirmState, ctx.openConfirm, ctx.closeConfirm, ctx.searchInputRef])
}

export function useSelection() {
  const ctx = useApp()
  return useMemo(() => ({
    selection: ctx.selection,
    toggleSelect: ctx.toggleSelect,
    selectAllVisible: ctx.selectAllVisible,
    clearSelection: ctx.clearSelection,
    mutatingIds: ctx.mutatingIds,
    bulkAction: ctx.bulkAction,
  }), [ctx.selection, ctx.toggleSelect, ctx.selectAllVisible, ctx.clearSelection, ctx.mutatingIds, ctx.bulkAction])
}
