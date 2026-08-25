import type { ReactNode } from 'react'
import { IconAlert, IconRefresh } from './icons'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  text?: string
  action?: { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, text, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="state-block" role="status">
      {icon && <div className="state-block__icon">{icon}</div>}
      <h3 className="state-block__title">{title}</h3>
      {text && <p className="state-block__text">{text}</p>}
      {(action || secondaryAction) && (
        <div className="state-block__actions">
          {action && (
            <button type="button" className="btn btn--primary btn--sm" onClick={action.onClick}>
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-block state-block--error" role="alert">
      <div className="state-block__icon">
        <IconAlert size={26} />
      </div>
      <h3 className="state-block__title">Unable to load jobs</h3>
      <p className="state-block__text">{message || 'Check your connection and try again.'}</p>
      {onRetry && (
        <div className="state-block__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={onRetry}>
            <IconRefresh size={13} /> Retry
          </button>
        </div>
      )}
    </div>
  )
}

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <ul className="skeleton-list" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="skeleton-row">
          <div className="skeleton skeleton--checkbox" />
          <div className="skeleton-row__main">
            <div className="skeleton skeleton--title" style={{ width: `${55 + ((i * 13) % 30)}%` }} />
            <div className="skeleton skeleton--line" style={{ width: `${35 + ((i * 7) % 25)}%` }} />
            <div className="skeleton skeleton--line skeleton--line-sm" style={{ width: `${45 + ((i * 11) % 20)}%` }} />
            <div className="skeleton-row__tags">
              <div className="skeleton skeleton--tag" />
              <div className="skeleton skeleton--tag" />
              <div className="skeleton skeleton--tag" />
            </div>
            <div className="skeleton skeleton--line skeleton--line-xs" style={{ width: '40%' }} />
          </div>
          <div className="skeleton-row__side">
            <div className="skeleton skeleton--tag" />
            <div className="skeleton skeleton--tag" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DetailSkeleton() {
  return (
    <div className="detail-skeleton" aria-hidden>
      <div className="detail-skeleton__header">
        <div className="skeleton skeleton--title-lg" style={{ width: '55%' }} />
        <div className="skeleton skeleton--line" style={{ width: '32%' }} />
        <div className="skeleton skeleton--line skeleton--line-sm" style={{ width: '45%' }} />
        <div className="detail-skeleton__actions">
          <div className="skeleton skeleton--btn" />
          <div className="skeleton skeleton--btn" />
          <div className="skeleton skeleton--btn" />
        </div>
      </div>
      <div className="detail-skeleton__body">
        {[92, 100, 96, 88, 100, 74].map((w, i) => (
          <div key={i} className="skeleton skeleton--paragraph" style={{ width: `${w}%` }} />
        ))}
        <div className="detail-skeleton__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton skeleton--line-xs" style={{ width: 60 }} />
              <div className="skeleton skeleton--line" style={{ width: '80%' }} />
            </div>
          ))}
        </div>
        {[90, 100, 85].map((w, i) => (
          <div key={`b${i}`} className="skeleton skeleton--paragraph" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}
