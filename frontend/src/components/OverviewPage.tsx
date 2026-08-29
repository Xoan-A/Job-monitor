import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/selectors'
import { EmptyState } from './states'
import { JOB_STATUSES, STATUS_LABELS, type JobStatus } from '../types'
import { sourceLabel, timeAgo, remoteLabelFromModality } from '../lib/format'
import { IconInbox } from './icons'

export function OverviewPage() {
  const {
    summary,
    facets,
    goToSection,
    jobs,
    selectJob,
    jobsLoading,
    sourceKind,
    cleanupOldJobs,
    getPurgeableCount,
    openConfirm,
  } = useApp()

  const [purgeInput, setPurgeInput] = useState('45')
  const [purging, setPurging] = useState(false)
  const [purgeableCount, setPurgeableCount] = useState<number | null>(null)

  const parsedDays = Math.max(0, Number(purgeInput) || 0)
  const debouncedDaysRef = useRef(parsedDays)
  const [debouncedDays, setDebouncedDays] = useState(parsedDays)

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedDaysRef.current = parsedDays
      setDebouncedDays(parsedDays)
    }, 300)
    return () => clearTimeout(timer)
  }, [parsedDays])

  useEffect(() => {
    let cancelled = false
    getPurgeableCount(debouncedDays).then((count) => {
      if (!cancelled) setPurgeableCount(count)
    })
    return () => { cancelled = true }
  }, [debouncedDays, getPurgeableCount])

  if (!summary) {
    return (
      <div className="overview" aria-busy="true">
        <p className="overview__loading">Loading workspace data...</p>
      </div>
    )
  }

  return (
    <div className="overview">
      <section className="overview__intro">
        <h2>Workspace overview</h2>
        <p>
          Jobs are collected automatically. Review them here: filter what matters,
          shortlist interesting roles and track your applications.
          {sourceKind === 'mock' && ' Currently showing demo data because the API is not reachable.'}
        </p>
      </section>

      <div className="overview__columns">
        <section className="overview__panel">
          <h3 className="overview__panel-title">Pipeline</h3>
          <ul className="overview__stat-list">
            {JOB_STATUSES.map((s: JobStatus) => {
              const value = s === 'new' ? summary.unread : summary.byStatus[s] || 0
              const linked = ['new', 'shortlisted', 'applied', 'rejected'].includes(s)
              return (
                <li key={s}>
                  <button
                    type="button"
                    className={`overview__stat ${linked ? 'overview__stat--linked' : ''}`}
                    onClick={() =>
                      linked &&
                      goToSection(s === 'new' ? 'new' : s === 'shortlisted' ? 'shortlisted' : s === 'applied' ? 'applied' : 'rejected')
                    }
                    disabled={!value}
                  >
                    <span className="overview__stat-label">
                      {s === 'new' ? 'New (last 48 h)' : STATUS_LABELS[s]}
                    </span>
                    <span className="overview__stat-value">{value}</span>
                  </button>
                </li>
              )
            })}
            <li>
              <div className="overview__stat">
                <span className="overview__stat-label">Saved</span>
                <span className="overview__stat-value">{summary.saved}</span>
              </div>
            </li>
          </ul>
        </section>

        <section className="overview__panel">
          <h3 className="overview__panel-title">Sources</h3>
          <ul className="overview__stat-list">
            {(facets?.sources || []).map((s) => (
              <li key={s.name}>
                <button type="button" className="overview__stat overview__stat--linked" onClick={() => goToSection('all')}>
                  <span className="overview__stat-label">{sourceLabel(s.name)}</span>
                  <span className="overview__stat-value">{s.count}</span>
                </button>
              </li>
            ))}
            {!facets?.sources.length && <li className="overview__muted">No sources yet.</li>}
          </ul>
        </section>

        <section className="overview__panel overview__panel--wide">
          <h3 className="overview__panel-title">Latest additions</h3>
          {jobsLoading ? (
            <p className="overview__muted">Loading...</p>
          ) : !jobs.length ? (
            <EmptyState icon={<IconInbox size={24} />} title="No jobs yet" text="Run a scrape to collect listings." />
          ) : (
            <ul className="overview__recent">
              {jobs.slice(0, 8).map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    className="overview__recent-row"
                    onClick={() => {
                      goToSection('all')
                      selectJob(job.id)
                    }}
                  >
                    <span className="overview__recent-main">
                      <span className="overview__recent-title">{job.title}</span>
                      <span className="overview__recent-sub">
                        {job.company || 'Confidential company'} · {job.location || remoteLabelFromModality(job.modality) || '—'}
                      </span>
                    </span>
                    <span className="overview__recent-side">
                      <span className="overview__recent-source">{sourceLabel(job.source)}</span>
                      <span className="overview__recent-time">{timeAgo(job.publishedAt || job.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="overview__purge">
        <div className="overview__purge-header">
          <h3>Purge old jobs</h3>
          <span className="overview__purge-count">
            {purgeableCount !== null && (
              purgeableCount === 0 ? 'Nothing to purge' : parsedDays === 0 ? `${purgeableCount} total` : `${purgeableCount} removable`
            )}
          </span>
        </div>
        <p className="overview__muted">Remove jobs in "New" or "Reviewing" status older than a number of days based on their published date. Jobs with other statuses are never pruned.</p>
        <div className="overview__purge-row">
          <label className="overview__purge-label">
            Keep last
            <input
              type="number"
              min={0}
              value={purgeInput}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') {
                  setPurgeInput('')
                  return
                }
                const n = Number(v)
                if (!Number.isNaN(n) && n >= 0) {
                  setPurgeInput(v)
                }
              }}
              onBlur={() => {
                if (purgeInput === '' || Number(purgeInput) < 0) {
                  setPurgeInput('0')
                }
              }}
              className="overview__purge-input"
            />
            days
          </label>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            disabled={purging || purgeableCount === 0}
            onClick={() => {
              openConfirm({
                title: 'Purge old jobs',
                message: parsedDays === 0
                  ? `All ${purgeableCount} job${purgeableCount !== 1 ? 's' : ''} in "New" or "Reviewing" status will be permanently deleted.`
                  : `${purgeableCount} job${purgeableCount !== 1 ? 's' : ''} in "New" or "Reviewing" status older than ${parsedDays} days will be permanently deleted.`,
                confirmLabel: 'Purge',
                danger: true,
                onConfirm: async () => {
                  setPurging(true)
                  await cleanupOldJobs(parsedDays)
                  setPurgeableCount(0)
                  setPurging(false)
                },
              })
            }}
          >
            {purging ? 'Purging...' : 'Purge'}
          </button>
        </div>
      </section>
    </div>
  )
}
