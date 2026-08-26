import { useApp } from '../context/selectors'
import type { Job } from '../types'
import { Dropdown } from './primitives'
import { IconBookmark, IconBriefcase, IconExternalLink } from './icons'
import { JOB_STATUSES, STATUS_LABELS } from '../types'

export function JobActions({ job }: { job: Job }) {
  const { toggleSaved, changeStatus, mutatingIds } = useApp()
  const busy = mutatingIds.has(job.id)
  const applyUrl = job.applicationUrl || job.url

  return (
    <div className="job-actions">
      <a
        className="btn btn--primary"
        href={applyUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!applyUrl}
        onClick={(e) => {
          if (!applyUrl) e.preventDefault()
          else if (job.status !== 'applied' && job.status !== 'interview') void changeStatus(job.id, 'applied')
        }}
        title={applyUrl ? 'Open application page' : 'No application URL available'}
      >
        <IconBriefcase size={14} />
        Apply
      </a>

      <button
        type="button"
        className={`btn btn--secondary ${job.saved ? 'btn--saved' : ''}`}
        onClick={() => void toggleSaved(job.id)}
        aria-pressed={job.saved}
        disabled={busy}
      >
        <IconBookmark size={14} filled={job.saved} />
        {job.saved ? 'Saved' : 'Save'}
      </button>

      <Dropdown
        trigger={({ toggle }) => (
          <button type="button" className="btn btn--secondary" onClick={toggle}>
            Change status
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      >
        {(close) => (
          <ul className="dropdown__list" role="listbox">
            {JOB_STATUSES.map((s) => (
              <li key={s} role="option" aria-selected={job.status === s}>
                <button
                  type="button"
                  className={`dropdown__item ${job.status === s ? 'dropdown__item--selected' : ''}`}
                  onClick={() => {
                    if (s !== job.status) void changeStatus(job.id, s)
                    close()
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dropdown>

      <a
        className="btn btn--ghost"
        href={job.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={!job.url}
        onClick={(e) => {
          if (!job.url) e.preventDefault()
        }}
      >
        <IconExternalLink size={14} />
        Open original listing
      </a>
    </div>
  )
}
