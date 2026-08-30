import { useState } from 'react'
import { useApp } from '../context/selectors'

export function AddTermModal() {
  const { setOpenDialog, service, pushToast } = useApp()
  const close = () => setOpenDialog(null)
  const [term, setTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = term.trim()
    if (!trimmed || !service) return
    setSubmitting(true)
    try {
      const result = await service.addSkillTerm(trimmed)
      if (result.added) {
        pushToast(`"${trimmed}" added to skill dictionary`, 'success')
        setTerm('')
        close()
      } else {
        pushToast(`"${trimmed}" is already in the dictionary`)
      }
    } catch {
      pushToast('Failed to add term')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={close} role="presentation">
      <div className="modal modal--sm" role="dialog" aria-modal="true" aria-labelledby="add-term-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 id="add-term-title">Add Skill Term</h2>
          <button type="button" className="icon-btn icon-btn--sm" onClick={close} aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <p className="settings-hint">
              Add a new technology or skill term to the matching dictionary. This helps the system recognize skills it may have missed in job postings.
            </p>
            <div className="add-term-field">
              <label htmlFor="add-term-input">Term</label>
              <input
                id="add-term-input"
                type="text"
                className="text-input"
                placeholder="e.g. SvelteKit"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--secondary btn--sm" onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={!term.trim() || submitting}
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
