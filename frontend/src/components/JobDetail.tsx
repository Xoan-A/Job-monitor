import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/selectors'
import type { Job } from '../types'
import { decodeEntities, looksLikeHtml, remoteLabelFromModality, sanitizeHtml, sourceLabel, timeAgo, formatDate } from '../lib/format'
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

const COLLAPSE_THRESHOLD = 900 // chars; longer descriptions start collapsed
const SNIPPET_THRESHOLD = 600 // chars; shorter descriptions are likely snippets

function DescriptionSection({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false)
  const [measured, setMeasured] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [tooTall, setTooTall] = useState(false)

  useEffect(() => {
    setExpanded(false)
    setMeasured(false)
  }, [job.id])

  useEffect(() => {
    if (measured) return
    const el = contentRef.current
    if (!el) return
    setTooTall(el.scrollHeight > 380 || (job.description?.length ?? 0) > COLLAPSE_THRESHOLD)
    setMeasured(true)
  }, [measured, job.description, job.id])

  const descLen = job.description?.length ?? 0
  const isSnippet = descLen > 0 && descLen < SNIPPET_THRESHOLD

  if (!job.description) {
    return (
      <DetailSection title="About the role">
        <SourceLinkBanner job={job} />
        <p className="description description--empty">No description was provided by the source.</p>
      </DetailSection>
    )
  }

  const isHtml = looksLikeHtml(job.description)
  const collapsed = !expanded && tooTall && measured

  return (
    <DetailSection title="About the role">
      {isSnippet && <SourceLinkBanner job={job} />}
      <div className={`description-wrap ${collapsed ? 'description-wrap--collapsed' : ''}`}>
        {isHtml ? (
          <div
            ref={contentRef}
            className="description description--html"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description as string) }}
          />
        ) : (
          <div ref={contentRef} className="description">
            <PlainTextDescription text={job.description} />
          </div>
        )}
        {collapsed && <div className="description-wrap__fade" aria-hidden />}
      </div>
      {tooTall && measured && (
        <button type="button" className="btn btn--ghost btn--sm description-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : 'Show full description'}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
            style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }}
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </DetailSection>
  )
}

function SourceLinkBanner({ job }: { job: Job }) {
  const sourceUrl = job.applicationUrl || job.url
  if (!sourceUrl) return null
  return (
    <div className="source-link-banner">
      <IconExternalLink size={14} className="source-link-banner__icon" />
      <span className="source-link-banner__text">
        This is a preview from {sourceLabel(job.source)}. The full listing with requirements and benefits is available on the original site.
      </span>
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--xs source-link-banner__cta">
        Open full listing <IconExternalLink size={10} aria-hidden />
      </a>
    </div>
  )
}

function PlainTextDescription({ text }: { text: string }) {
  const blocks: { type: 'p' | 'li'; content: string; items?: string[] }[] = []
  for (const line of text.replace(/^\s+/, '').split(/\r?\n/)) {
    const trimmed = decodeEntities(line).trim()
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
