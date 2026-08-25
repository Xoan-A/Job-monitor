import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { FilterToolbar } from './FilterToolbar'
import { JobList } from './JobList'
import { JobDetail } from './JobDetail'
import { OverviewPage } from './OverviewPage'
import { Dialogs, Toasts } from './Dialogs'

export function AppShell() {
  const {
    nav,
    selectedJobId,
    selectJob,
    jobs,
    toggleSaved,
    markReviewed,
    searchInputRef,
    mobileView,
  } = useApp()

  // Keyboard shortcuts: / focus search, j/k next/prev, s save, r reviewed
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchInputRef?.current?.focus()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (!['j', 'k', 's', 'r'].includes(e.key)) return
      if (nav === 'overview') return

      e.preventDefault()
      if (e.key === 'j' || e.key === 'k') {
        if (!jobs.length) return
        const idx = selectedJobId === null ? -1 : jobs.findIndex((j) => j.id === selectedJobId)
        let next: number
        if (idx === -1) next = 0
        else next = e.key === 'j' ? Math.min(idx + 1, jobs.length - 1) : Math.max(idx - 1, 0)
        selectJob(jobs[next].id)
        document.querySelector('.job-row--selected')?.scrollIntoView({ block: 'nearest' })
      } else if (selectedJobId !== null) {
        if (e.key === 's') void toggleSaved(selectedJobId)
        if (e.key === 'r') void markReviewed(selectedJobId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [jobs, selectedJobId, nav, selectJob, toggleSaved, markReviewed, searchInputRef])

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        {nav === 'overview' ? (
          <main className="app-content app-content--single">
            <OverviewPage />
          </main>
        ) : (
          <>
            <FilterToolbar />
            <main className={`app-content ${mobileView === 'detail' && selectedJobId ? 'app-content--detail-mobile' : ''}`}>
              <section className="pane pane--list" aria-label="Job list">
                <JobList />
              </section>
              <section className="pane pane--detail" aria-label="Job details" data-visible={mobileView === 'detail'}>
                <JobDetail />
              </section>
            </main>
          </>
        )}
      </div>
      <Dialogs />
      <Toasts />
    </div>
  )
}
