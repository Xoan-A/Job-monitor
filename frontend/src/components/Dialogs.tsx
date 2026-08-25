import { useApp } from '../context/AppContext'
import type { DataSourceMode } from '../services'

export function Dialogs() {
  const { openDialog, setOpenDialog, dataSourceMode, setDataSourceMode, sourceKind, refreshJobs } = useApp()

  if (!openDialog) return null

  const close = () => setOpenDialog(null)

  return (
    <div className="modal-overlay" onClick={close} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 id="modal-title">{openDialog === 'settings' ? 'Settings' : 'About Job Monitor'}</h2>
          <button type="button" className="icon-btn icon-btn--sm" onClick={close} aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {openDialog === 'settings' ? (
          <div className="modal__body">
            <fieldset className="settings-group">
              <legend>Data source</legend>
              <p className="settings-hint">
                Connect to the scraper API (PostgreSQL-backed) or browse with demo data.
                Current status: {sourceKind === 'api' ? 'connected to API' : sourceKind === 'mock' ? 'demo data' : 'connecting...'}
              </p>
              <div className="settings-options">
                {(['auto', 'api', 'mock'] as DataSourceMode[]).map((mode) => (
                  <label key={mode} className={`settings-option ${dataSourceMode === mode ? 'settings-option--active' : ''}`}>
                    <input
                      type="radio"
                      name="data-source"
                      value={mode}
                      checked={dataSourceMode === mode}
                      onChange={() => {
                        setDataSourceMode(mode)
                        close()
                        setTimeout(refreshJobs, 0)
                      }}
                    />
                    <span>
                      <strong>{mode === 'auto' ? 'Automatic (recommended)' : mode === 'api' ? 'API only' : 'Demo data only'}</strong>
                      <small>
                        {mode === 'auto'
                          ? 'Use the API when reachable, demo data otherwise'
                          : mode === 'api'
                            ? 'Always use the REST API and show errors if unavailable'
                            : 'Use built-in sample data stored in your browser'}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <div className="modal__body about-body">
            <p>
              Job Monitor is a personal job-monitoring tool. It collects listings from public sources
              (currently Buscojobs and Jooble for Uruguay), stores them in PostgreSQL and lets you review,
              organize and track them in one place.
            </p>
            <ul>
              <li>Scraper & API: Python / FastAPI</li>
              <li>Storage: PostgreSQL</li>
              <li>Frontend: React + TypeScript</li>
              <li>Orchestration: n8n</li>
            </ul>
            <p className="about-note">Match scores are simple keyword comparisons configured in the scraper profile — not AI predictions.</p>
          </div>
        )}

        <div className="modal__footer">
          <button type="button" className="btn btn--secondary btn--sm" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts } = useApp()
  if (!toasts.length) return null
  return (
    <div className="toast-stack" aria-live="assertive">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
