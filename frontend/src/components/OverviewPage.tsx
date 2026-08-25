import { useApp } from '../context/AppContext'
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
  } = useApp()

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
          Jobs are collected automatically by the scrapers. Review them here: filter what matters,
          shortlist interesting roles and track your applications.
          {sourceKind === 'mock' && ' Currently showing demo data because the API is not reachable.'}
        </p>
      </section>

      <div className="overview__columns">
        <section className="overview__panel">
          <h3 className="overview__panel-title">Pipeline</h3>
          <ul className="overview__stat-list">
            {JOB_STATUSES.map((s: JobStatus) => (
              <li key={s}>
                <button
                  type="button"
                  className={`overview__stat ${['new', 'shortlisted', 'applied', 'rejected'].includes(s) ? 'overview__stat--linked' : ''}`}
                  onClick={() => ['new', 'shortlisted', 'applied', 'rejected'].includes(s) && goToSection(s === 'new' ? 'new' : s === 'shortlisted' ? 'shortlisted' : s === 'applied' ? 'applied' : 'rejected')}
                  disabled={!summary.byStatus[s]}
                >
                  <span className="overview__stat-label">{STATUS_LABELS[s]}</span>
                  <span className="overview__stat-value">{summary.byStatus[s] || 0}</span>
                </button>
              </li>
            ))}
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
    </div>
  )
}
