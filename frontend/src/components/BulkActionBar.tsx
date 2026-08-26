import { useApp } from '../context/selectors'
import { Dropdown } from './primitives'
import { JOB_STATUSES, STATUS_LABELS } from '../types'
import { IconCheck, IconX } from './icons'
import type { JobStatus } from '../types'

export function BulkActionBar() {
  const { selection, clearSelection, selectAllVisible, totalJobs, bulkAction } = useApp()

  if (selection.size === 0) return null

  return (
    <div className="bulk-bar" role="toolbar" aria-label="Bulk actions">
      <span className="bulk-bar__count">
        {selection.size} selected{selection.size === totalJobs ? '' : ` of ${totalJobs}`}
      </span>

      <button type="button" className="btn btn--ghost btn--xs" onClick={selectAllVisible}>
        Select all
      </button>

      <span className="bulk-bar__divider" aria-hidden />

      <button type="button" className="btn btn--ghost btn--xs" onClick={() => void bulkAction('reviewed')}>
        <IconCheck size={12} /> Mark as reviewed
      </button>

      <button type="button" className="btn btn--ghost btn--xs" onClick={() => void bulkAction('save')}>
        Save
      </button>

      <Dropdown
        className="bulk-bar__dd"
        trigger={({ toggle }) => (
          <button type="button" className="btn btn--ghost btn--xs" onClick={toggle}>
            Change status
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        menuClassName="dropdown__menu--status"
      >
        {(close) => (
          <ul className="dropdown__list" role="listbox">
            {JOB_STATUSES.filter((s) => s !== 'new').map((s: JobStatus) => (
              <li key={s} role="option">
                <button
                  type="button"
                  className="dropdown__item"
                  onClick={(e) => {
                    e.stopPropagation()
                    void bulkAction('reviewed', s)
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

      <button type="button" className="btn btn--ghost btn--xs" onClick={() => void bulkAction('archive')}>
        Archive
      </button>

      <span className="bulk-bar__spacer" />
      <button type="button" className="icon-btn icon-btn--sm" aria-label="Clear selection" title="Clear selection" onClick={clearSelection}>
        <IconX size={13} />
      </button>
    </div>
  )
}
