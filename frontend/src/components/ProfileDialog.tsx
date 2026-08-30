import { useApp } from '../context/selectors'
import { ResumeUploader } from './ResumeUploader'

export function ProfileDialog() {
  const { setOpenDialog } = useApp()
  const close = () => setOpenDialog(null)

  return (
    <div className="modal-overlay" onClick={close} role="presentation">
      <div className="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 id="modal-title">Upload Resume</h2>
          <button type="button" className="icon-btn icon-btn--sm" onClick={close} aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal__body">
          <p className="settings-hint">
            Upload your resume to enable intelligent job matching. The system will parse your skills, experience, and education to compute match scores.
          </p>
          <ResumeUploader />
          <p className="uploader-note">You can close this dialog at any time — the upload will continue in the background.</p>
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
