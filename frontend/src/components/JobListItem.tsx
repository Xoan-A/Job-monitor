import { memo } from 'react'
import { useApp } from '../context/selectors'
import type { Job } from '../types'
import { matchLabel, remoteLabelFromModality, sourceLabel, timeAgo } from '../lib/format'
import { StatusSelector } from './StatusSelector'
import { Checkbox, Dropdown } from './primitives'
import { IconBookmark, IconBriefcase, IconMapPin, IconStar } from './icons'

interface JobListItemProps {
  job: Job
  selected: boolean
  checked: boolean
  onSelect: () => void
  onToggleCheck: (checked: boolean) => void
}

export const JobListItem = memo(function JobListItem({ job, selected, checked, onSelect, onToggleCheck }: JobListItemProps) {
  const { toggleSaved } = useApp()

  return (
    <li
      className={`job-row ${selected ? 'job-row--selected' : ''} ${job.status === 'new' ? 'job-row--new' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-current={selected}
    >
      <div className="job-row__check" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onChange={(c) => onToggleCheck(c)}
          label={`Select ${job.title}`}
          stopPropagation
        />
      </div>

      <div className="job-row__main">
        <div className="job-row__top">
          {job.status === 'new' && !selected && <span className="unread-dot" aria-label="New" />}
          <h3 className="job-row__title">{job.title}</h3>
          {job.matchScore !== null && <MatchChip score={job.matchScore} job={job} />}
        </div>

        <div className="job-row__company">
          {job.company || 'Confidential company'}
          {job.salary && <span className="job-row__salary">{job.salary}</span>}
        </div>

        <div className="job-row__meta">
          {(job.location || remoteLabelFromModality(job.modality)) && (
            <span className="meta-item">
              <IconMapPin size={12} />
              {[job.location, remoteLabelFromModality(job.modality)].filter(Boolean).join(' · ')}
            </span>
          )}
          {job.employmentType && (
            <span className="meta-item">
              <IconBriefcase size={12} />
              {job.employmentType}
            </span>
          )}
        </div>

        {job.skills.length > 0 && (
          <div className="job-row__tags">
            {job.skills.slice(0, 5).map((s) => (
              <span key={s} className="tag">
                {s}
              </span>
            ))}
            {job.skills.length > 5 && <span className="tag tag--more">+{job.skills.length - 5}</span>}
          </div>
        )}

        <p className="job-row__snippet">{firstSentence(job)}</p>

        <div className="job-row__footer">
          <span className="job-row__time">{timeAgo(job.publishedAt || job.createdAt)}</span>
          <span className="job-row__source">Source: {sourceLabel(job.source)}</span>
        </div>
      </div>

      <div className="job-row__side">
        <StatusSelector job={job} compact />
        <button
          type="button"
          className={`save-btn ${job.saved ? 'save-btn--active' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            void toggleSaved(job.id)
          }}
          aria-pressed={job.saved}
          aria-label={job.saved ? 'Unsave job' : 'Save job'}
          title={job.saved ? 'Saved' : 'Save'}
        >
          <IconBookmark size={14} filled={job.saved} />
          <span>{job.saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </li>
  )
})

function firstSentence(job: Job): string {
  if (!job.description) return ''
  const plain = job.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return plain.length > 140 ? `${plain.slice(0, 137)}...` : plain
}

export function MatchChip({ score, job }: { score: number; job?: Job }) {
  const label = matchLabel(score)
  return (
    <Dropdown
      className="match-chip-dd"
      trigger={({ toggle }) => (
        <button
          type="button"
          className={`match-chip ${score >= 75 ? 'match-chip--strong' : score >= 50 ? 'match-chip--good' : 'match-chip--low'}`}
          onClick={(e) => {
            e.stopPropagation()
            toggle()
          }}
          title="Match details"
        >
          {score}%<IconStar size={10} aria-hidden />
        </button>
      )}
    >
      {() => (
        <div className="match-popover">
          <div className="match-popover__score">{score}%</div>
          <div className="match-popover__label">{label}</div>
          {job?.matchExplanation && (
            <div className="match-popover__explanation">{job.matchExplanation}</div>
          )}
          {job?.matchStrong && job.matchStrong.length > 0 && (
            <div className="match-popover__section">
              <strong>Matched:</strong> {job.matchStrong.slice(0, 5).join(', ')}
              {job.matchStrong.length > 5 && ` +${job.matchStrong.length - 5}`}
            </div>
          )}
          {job?.matchRelated && job.matchRelated.length > 0 && (
            <div className="match-popover__section">
              <strong>Related:</strong> {job.matchRelated.map(r => `${r.source}→${r.target}`).join(', ')}
            </div>
          )}
          {job?.matchGaps && job.matchGaps.length > 0 && (
            <div className="match-popover__section match-popover__gaps">
              <strong>Gaps:</strong> {job.matchGaps.join(', ')}
            </div>
          )}
          <div className="match-popover__components">
            {job?.matchRequiredScore !== null && job?.matchRequiredScore !== undefined && (
              <div className="match-popover__component">
                <span>Required Skills</span>
                <span>{job.matchRequiredScore}%</span>
              </div>
            )}
            {job?.matchPreferredScore !== null && job?.matchPreferredScore !== undefined && (
              <div className="match-popover__component">
                <span>Preferred Skills</span>
                <span>{job.matchPreferredScore}%</span>
              </div>
            )}
            {job?.matchSemanticScore !== null && job?.matchSemanticScore !== undefined && (
              <div className="match-popover__component">
                <span>Semantic</span>
                <span>{job.matchSemanticScore}%</span>
              </div>
            )}
            {job?.matchExperienceScore !== null && job?.matchExperienceScore !== undefined && (
              <div className="match-popover__component">
                <span>Experience</span>
                <span>{job.matchExperienceScore}%</span>
              </div>
            )}
            {job?.matchRoleScore !== null && job?.matchRoleScore !== undefined && (
              <div className="match-popover__component">
                <span>Role Fit</span>
                <span>{job.matchRoleScore}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Dropdown>
  )
}
