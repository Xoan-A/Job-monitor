import type { Job } from '../types'
import { DetailSection } from './SkillList'
import { IconCheck, IconX } from './icons'

export function MatchAnalysis({ job }: { job: Job }) {
  const hasAnalysis = job.matchScore !== null && (job.matchStrong.length > 0 || job.matchGaps.length > 0)
  if (!hasAnalysis) return null

  return (
    <DetailSection title="Why this matches">
      <div className="match-analysis">
        <div className={`match-score match-score--${scoreTone(job.matchScore)}`}>
          <span className="match-score__number">{job.matchScore}%</span>
          <span className="match-score__caption">keyword match</span>
        </div>

        {job.matchStrong.length > 0 && (
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

        {job.matchGaps.length > 0 && (
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
          Deterministic comparison of the skills configured in your profile against this listing's title,
          tags and description.
        </p>
      </div>
    </DetailSection>
  )
}

function scoreTone(score: number | null): 'strong' | 'good' | 'low' {
  if ((score ?? 0) >= 75) return 'strong'
  if ((score ?? 0) >= 50) return 'good'
  return 'low'
}
