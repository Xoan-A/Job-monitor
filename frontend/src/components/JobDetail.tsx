import { useApp } from '../context/AppContext'
import type { Job } from '../types'
import { looksLikeHtml, remoteLabelFromModality, sanitizeHtml, sourceLabel, timeAgo, formatDate } from '../lib/format'
import { DetailSection, MetadataItem, SkillList } from './SkillList'
import { JobActions } from './JobActions'
import { MatchAnalysis } from './MatchAnalysis'
import { ApplicationTracker, JobHistory } from './ApplicationTracker'
import { NotesEditor } from './NotesEditor'
import { DetailSkeleton, EmptyState, ErrorState } from './states'
import { IconArrowLeft, IconBriefcase, IconExternalLink } from './icons'

export function JobDetail() {
  const { detail, selectedJobId, backToList, mobileView } = useApp()

  if (!selectedJobId) {
    return (
      <div className="job-detail job-detail--empty">
        <EmptyState
          icon={<IconBriefcase size={28} />}
          title="No job selected"
          text="Select a job from the list to read the full description and manage its status."
        />
      </div>
    )
  }

  return (
    <div className={`job-detail ${mobileView === 'detail' ? 'job-detail--mobile-visible' : ''}`}>
      <button type="button" className="btn btn--ghost btn--sm detail-back" onClick={backToList}>
        <IconArrowLeft size={14} /> Back to list
      </button>

      {detail.loading && !detail.job && <DetailSkeleton />}
      {detail.error && !detail.job ? (
        <ErrorState message={detail.error} onRetry={() => backToList()} />
      ) : detail.job ? (
        <JobDetailContent job={detail.job} />
      ) : (
        <DetailSkeleton />
      )}
    </div>
  )
}

function JobDetailContent({ job }: { job: Job }) {
  const companyDisplay = job.company || 'Confidential company'

  return (
    <article className="job-detail__content">
      <header className="job-detail__header">
        <h2 className="job-detail__title">{job.title}</h2>
        <p className="job-detail__company">{companyDisplay}</p>
        <div className="job-detail__facts">
          {job.location && <span>{job.location}</span>}
          {remoteLabelFromModality(job.modality) && <span className="fact-sep">·</span>}
          {remoteLabelFromModality(job.modality) && <span>{remoteLabelFromModality(job.modality)}</span>}
          {(job.publishedAt || job.createdAt) && (
            <>
              <span className="fact-sep">·</span>
              <span>Posted {timeAgo(job.publishedAt || job.createdAt)}</span>
            </>
          )}
        </div>
        <JobActions job={job} />
      </header>

      <DescriptionSection job={job} />

      <DetailSection title="Job information">
        <dl className="meta-grid">
          <MetadataItem label="Location" value={job.location || [job.city, job.department, job.country].filter(Boolean).join(', ')} />
          <MetadataItem label="Work arrangement" value={[remoteLabelFromModality(job.modality), job.modality].find(Boolean)} />
          <MetadataItem label="Employment type" value={job.employmentType} />
          <MetadataItem label="Experience level" value={job.experienceLevel} />
          <MetadataItem label="Salary" value={job.salary || null} mono />
          <MetadataItem label="Published" value={formatDate(job.publishedAt)} />
          <MetadataItem label="Source" value={sourceLabel(job.source)} />
          <MetadataItem label="Company" value={job.company} />
          <MetadataItem label="External job ID" value={job.externalId} mono />
        </dl>
      </DetailSection>

      <JobSkillsSection job={job} />

      {job.company && (
        <DetailSection title="Company">
          <div className="company-box">
            <span className="company-box__name">{job.company}</span>
            {job.isConfidential && <span className="company-box__confidential">Listed as confidential</span>}
          </div>
        </DetailSection>
      )}

      <MatchAnalysis job={job} />

      <ApplicationTracker job={job} />
      <NotesEditor job={job} />
      <JobHistory job={job} />

      <DetailSection title="Source">
        <div className="source-box">
          <span className="tracker__label">Original listing</span>
          <a href={job.url || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => !job.url && e.preventDefault()}>
            View on {sourceLabel(job.source)} <IconExternalLink size={12} aria-hidden />
          </a>
        </div>
      </DetailSection>
    </article>
  )
}

function DescriptionSection({ job }: { job: Job }) {
  if (!job.description) {
    return (
      <DetailSection title="About the role">
        <p className="description description--empty">No description was provided by the source.</p>
      </DetailSection>
    )
  }
  return (
    <DetailSection title="About the role">
      {looksLikeHtml(job.description) ? (
        <div
          className="description description--html"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description as string) }}
        />
      ) : (
        <PlainTextDescription text={job.description} />
      )}
    </DetailSection>
  )
}

function PlainTextDescription({ text }: { text: string }) {
  const blocks: { type: 'p' | 'li'; content: string; items?: string[] }[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const bullet = /^([-*•·])\s+/.exec(trimmed)
    const isBullet = Boolean(bullet)
    const content = bullet ? trimmed.replace(/^([-*•·])\s+/, '') : trimmed
    const last = blocks[blocks.length - 1]
    if (isBullet) {
      if (last?.type === 'li') last.items!.push(content)
      else blocks.push({ type: 'li', content, items: [content] })
    } else {
      blocks.push({ type: 'p', content })
    }
  }
  return (
    <div className="description">
      {blocks.map((b, i) =>
        b.type === 'li' ? (
          <ul key={i} className="description__list">
            {b.items!.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.content}</p>
        ),
      )}
    </div>
  )
}

function JobSkillsSection({ job }: { job: Job }) {
  if (!job.skills.length) return null
  return (
    <DetailSection title="Skills detected in this listing">
      <SkillList skills={job.skills} />
    </DetailSection>
  )
}
