import { useEffect, useRef } from 'react'
import { useApp } from '../context/selectors'
import { JobListItem } from './JobListItem'
import { BulkActionBar } from './BulkActionBar'
import { EmptyState, ErrorState, ListSkeleton } from './states'
import { IconBookmark, IconInbox, IconSearch } from './icons'
import { filtersAreEmpty } from '../types'

export function JobList() {
  const {
    jobs,
    totalJobs,
    jobsLoading,
    jobsLoadingMore,
    jobsError,
    loadMore,
    refreshJobs,
    selectedJobId,
    selectJob,
    selection,
    toggleSelect,
    filters,
    clearFilters,
    goToSection,
    nav,
  } = useApp()

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Infinite scroll: auto-load when the sentinel becomes visible.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  if (jobsError) {
    return (
      <div className="job-list">
        <ErrorState message={jobsError} onRetry={refreshJobs} />
      </div>
    )
  }

  if (jobsLoading) {
    return (
      <div className="job-list" aria-busy="true">
        <ListSkeleton rows={8} />
      </div>
    )
  }

  if (!jobs.length) {
    return (
      <div className="job-list">
        {nav === 'saved' ? (
          <EmptyState
            icon={<IconBookmark size={28} />}
            title="No saved jobs yet"
            text="Save jobs while reviewing to build your shortlist."
            action={{ label: 'Browse jobs', onClick: () => goToSection('all') }}
          />
        ) : !filtersAreEmpty(filters) || !['all', 'overview'].includes(nav) ? (
          <EmptyState
            icon={<IconSearch size={28} />}
            title="No jobs match your filters"
            text="Try removing one or more filters."
            action={{ label: 'Clear filters', onClick: () => clearFilters() }}
          />
        ) : (
          <EmptyState
            icon={<IconInbox size={28} />}
            title="No jobs collected yet"
            text="Jobs found by the scraper will appear in this list."
            action={{ label: 'Refresh', onClick: refreshJobs }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="job-list">
      <ul className="job-list__rows">
        {jobs.map((job) => (
          <JobListItem
            key={`${job.id}`}
            job={job}
            selected={selectedJobId === job.id}
            checked={selection.has(job.id)}
            onSelect={() => selectJob(job.id)}
            onToggleCheck={() => toggleSelect(job.id)}
          />
        ))}
      </ul>

      {jobs.length < totalJobs && (
        <div className="job-list__more" ref={sentinelRef}>
          {jobsLoadingMore ? (
            <span className="job-list__more-label">Loading more...</span>
          ) : (
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadMore()}>
              Load more ({totalJobs - jobs.length} remaining)
            </button>
          )}
        </div>
      )}

      <BulkActionBar />
    </div>
  )
}
