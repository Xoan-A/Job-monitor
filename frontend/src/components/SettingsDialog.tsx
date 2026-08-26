import { useApp } from '../context/selectors'
import type { DataSourceMode } from '../services'

export function SettingsDialog() {
  const { setOpenDialog, dataSourceMode, setDataSourceMode, sourceKind, refreshJobs } = useApp()
  const close = () => setOpenDialog(null)

  return (
    <div className="modal-overlay" onClick={close} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 id="modal-title">Settings</h2>
          <button type="button" className="icon-btn icon-btn--sm" onClick={close} aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
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
        <div className="modal__footer">
          <button type="button" className="btn btn--secondary btn--sm" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
