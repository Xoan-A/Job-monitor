import { useApp } from '../context/selectors'
import { Dropdown } from './primitives'
import { JOB_STATUSES, STATUS_LABELS, type Job, type JobStatus } from '../types'
import { statusTone } from '../lib/format'

interface StatusSelectorProps {
  job: Job
  compact?: boolean
}

export function StatusBadge({ job }: { job: Job }) {
  const tone = statusTone(job.status)
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__dot" aria-hidden />
      {STATUS_LABELS[job.status]}
    </span>
  )
}

export function StatusSelector({ job, compact }: StatusSelectorProps) {
  const { changeStatus, mutatingIds } = useApp()
  const busy = mutatingIds.has(job.id)

  return (
    <Dropdown
      className={compact ? 'status-dd status-dd--compact' : 'status-dd'}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className={`status-trigger ${open ? 'status-trigger--open' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Change status (current: ${STATUS_LABELS[job.status]})`}
          disabled={busy}
          title="Change status"
        >
          <span className={`status-dot status-dot--${statusTone(job.status)}`} aria-hidden />
          {!compact && <span>{STATUS_LABELS[job.status]}</span>}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      menuClassName="dropdown__menu--status"
    >
      {(close) => (
        <ul className="dropdown__list" role="listbox">
          {JOB_STATUSES.map((s: JobStatus) => (
            <li key={s} role="option" aria-selected={job.status === s}>
              <button
                type="button"
                className={`dropdown__item ${job.status === s ? 'dropdown__item--selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (s !== job.status) void changeStatus(job.id, s)
                  close()
                }}
              >
                <span className={`status-dot status-dot--${statusTone(s)}`} aria-hidden />
                {STATUS_LABELS[s]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dropdown>
  )
}
