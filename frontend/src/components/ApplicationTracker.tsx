import type { Job } from '../types'
import { DetailSection } from './SkillList'
import { formatDate, formatDateTime } from '../lib/format'
import { StatusBadge } from './StatusSelector'

export function ApplicationTracker({ job }: { job: Job }) {
  const applied = job.status === 'applied' || job.status === 'interview'
  return (
    <DetailSection title="Application tracking">
      <div className="tracker">
        <div className="tracker__row">
          <span className="tracker__label">Status</span>
          <StatusBadge job={job} />
        </div>
        <div className="tracker__row">
          <span className="tracker__label">Application date</span>
          <span className="tracker__value">{formatDate(job.reviewedAt && applied ? job.updatedAt : null)}</span>
        </div>
        <div className="tracker__row">
          <span className="tracker__label">Follow-up</span>
          <span className="tracker__value">Not scheduled</span>
        </div>
      </div>
    </DetailSection>
  )
}

export function JobHistory({ job }: { job: Job }) {
  if (!job.createdAt && !job.publishedAt) return null
  return (
    <DetailSection title="History">
      <div className="history">
        <div className="tracker__row">
          <span className="tracker__label">First discovered</span>
          <span className="tracker__value">{formatDateTime(job.createdAt || job.scrapedAt)}</span>
        </div>
        <div className="tracker__row">
          <span className="tracker__label">Last updated</span>
          <span className="tracker__value">{formatDateTime(job.updatedAt)}</span>
        </div>
        {job.scrapedAt && (
          <div className="tracker__row">
            <span className="tracker__label">Last scraped</span>
            <span className="tracker__value">{formatDateTime(job.scrapedAt)}</span>
          </div>
        )}
      </div>
    </DetailSection>
  )
}
