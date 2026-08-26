import { useApp } from '../context/selectors'

export function AboutDialog() {
  const { setOpenDialog } = useApp()
  const close = () => setOpenDialog(null)

  return (
    <div className="modal-overlay" onClick={close} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 id="modal-title">About Job Monitor</h2>
          <button type="button" className="icon-btn icon-btn--sm" onClick={close} aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal__body about-body">
          <p>
            Job Monitor is a personal job-monitoring tool. It collects listings from public sources
            (Buscojobs, Jooble and Get on Board), stores them in PostgreSQL and lets you review,
            organize and track them in one place.
          </p>
          <ul>
            <li><strong>Sources:</strong> Buscojobs (Uruguay), Jooble (Uruguay), Get on Board (LATAM)</li>
            <li><strong>Stack:</strong> Python / FastAPI + PostgreSQL + React / TypeScript + n8n</li>
            <li><strong>Features:</strong> Keyword match scoring, status tracking, notes, bulk actions</li>
          </ul>
          <p className="about-note">Match scores are simple keyword comparisons configured in the scraper profile — not AI predictions.</p>
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
