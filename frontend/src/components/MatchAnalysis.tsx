import { useState } from 'react'
import type { Job } from '../types'
import { useApp } from '../context/selectors'
import { DetailSection } from './SkillList'
import { IconCheck, IconX, IconRefresh, IconFileText } from './icons'

export function MatchAnalysis({ job }: { job: Job }) {
  const { service, setOpenDialog, pushToast, selectJob } = useApp()
  const [rerunning, setRerunning] = useState(false)

  const hasScore = job.matchScore !== null
  const hasStrong = job.matchStrong.length > 0
  const hasGaps = job.matchGaps.length > 0
  const hasRelated = job.matchRelated.length > 0
  const hasExplanation = Boolean(job.matchExplanation)

  const handleRerun = async () => {
    if (!service || rerunning) return
    setRerunning(true)
    try {
      await service.matchSingleJob(job.id)
      await selectJob(job.id)
      pushToast('Match recalculated', 'success')
    } catch {
      pushToast('Failed to recalculate match')
    } finally {
      setRerunning(false)
    }
  }

  if (!hasScore && !hasStrong && !hasGaps && !hasRelated && !hasExplanation) return null

  return (
    <DetailSection title="Why this matches">
      <div className="match-analysis">
        <div className="match-analysis__actions">
          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={() => setOpenDialog('profile')}
          >
            <IconFileText size={12} /> Upload resume
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={handleRerun}
            disabled={rerunning}
          >
            <IconRefresh size={12} /> {rerunning ? 'Recalculating...' : 'Recalculate'}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--xs"
            onClick={() => setOpenDialog('addTerm')}
          >
            + Add term
          </button>
        </div>
        {hasScore && (
          <div className={`match-score match-score--${scoreTone(job.matchScore)}`}>
            <span className="match-score__number">{job.matchScore}%</span>
            <span className="match-score__caption">{scoreLabel(job.matchScore)}</span>
          </div>
        )}

        {hasExplanation && (
          <p className="match-analysis__explanation">{job.matchExplanation}</p>
        )}

        {(job.matchRequiredScore !== null || job.matchPreferredScore !== null || job.matchSemanticScore !== null || job.matchExperienceScore !== null || job.matchRoleScore !== null) && (
          <div className="match-analysis__components">
            {job.matchRequiredScore !== null && <ComponentBar label="Required Skills" score={job.matchRequiredScore} weight="40%" />}
            {job.matchPreferredScore !== null && <ComponentBar label="Preferred Skills" score={job.matchPreferredScore} weight="15%" />}
            {job.matchSemanticScore !== null && <ComponentBar label="Semantic" score={job.matchSemanticScore} weight="20%" />}
            {job.matchExperienceScore !== null && <ComponentBar label="Experience" score={job.matchExperienceScore} weight="15%" />}
            {job.matchRoleScore !== null && <ComponentBar label="Role Fit" score={job.matchRoleScore} weight="10%" />}
          </div>
        )}

        {hasStrong && (
          <div className="match-analysis__group">
            <h4 className="match-analysis__heading">Strong matches</h4>
            <ul className="match-list">
              {job.matchStrong.map((s) => (
                <li key={s} className="match-list__item match-list__item--strong">
                  <IconCheck size={12} /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasRelated && (
          <div className="match-analysis__group">
            <h4 className="match-analysis__heading">Related technology matches</h4>
            <ul className="match-list">
              {job.matchRelated.map((r, i) => (
                <li key={i} className="match-list__item match-list__item--related">
                  <IconCheck size={12} /> {r.source} → {r.target} ({Math.round(r.confidence * 100)}%)
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasGaps && (
          <div className="match-analysis__group">
            <h4 className="match-analysis__heading">Potential gaps</h4>
            <ul className="match-list">
              {job.matchGaps.map((s) => (
                <li key={s} className="match-list__item match-list__item--gap">
                  <IconX size={12} /> {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="match-analysis__note">
          Weighted analysis combining skill matching, semantic similarity, experience level, and role fit.
        </p>
      </div>
    </DetailSection>
  )
}

function ComponentBar({ label, score, weight }: { label: string; score: number; weight: string }) {
  return (
    <div className="match-component">
      <div className="match-component__header">
        <span className="match-component__label">{label}</span>
        <span className="match-component__score">{score}%</span>
      </div>
      <div className="match-component__bar">
        <div
          className={`match-component__fill ${score >= 70 ? 'match-component__fill--good' : score >= 40 ? 'match-component__fill--mid' : 'match-component__fill--low'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="match-component__weight">weight: {weight}</span>
    </div>
  )
}

function scoreTone(score: number | null): 'strong' | 'good' | 'low' {
  if ((score ?? 0) >= 70) return 'strong'
  if ((score ?? 0) >= 40) return 'good'
  return 'low'
}

function scoreLabel(score: number | null): string {
  if (score === null) return ''
  if (score >= 85) return 'Excellent match'
  if (score >= 70) return 'Strong match'
  if (score >= 50) return 'Moderate match'
  if (score >= 30) return 'Weak match'
  return 'Low match'
}
