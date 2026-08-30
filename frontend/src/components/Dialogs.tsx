import { useApp } from '../context/selectors'
import { SettingsDialog } from './SettingsDialog'
import { AboutDialog } from './AboutDialog'
import { ProfileDialog } from './ProfileDialog'
import { AddTermModal } from './AddTermModal'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog() {
  const { confirmState, closeConfirm } = useApp()
  if (!confirmState) return null

  const { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm } = confirmState

  return (
    <div className="modal-overlay" onClick={closeConfirm} role="presentation">
      <div className="modal modal--sm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-msg" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 id="confirm-title" className="confirm-title">{title}</h2>
        </div>
        <div className="modal__body">
          <p id="confirm-msg" className="confirm-msg">{message}</p>
        </div>
        <div className="modal__footer">
          <button type="button" className="btn btn--secondary btn--sm" onClick={closeConfirm}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn--sm ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={async () => {
              await onConfirm()
              closeConfirm()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Dialogs() {
  const { openDialog } = useApp()
  if (!openDialog) return null
  if (openDialog === 'settings') return <SettingsDialog />
  if (openDialog === 'profile') return <ProfileDialog />
  if (openDialog === 'addTerm') return <AddTermModal />
  return <AboutDialog />
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
