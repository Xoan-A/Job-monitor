import type { ReactNode } from 'react'

export function SkillList({ skills }: { skills: string[] }) {
  if (!skills.length) return null
  return (
    <ul className="skill-list">
      {skills.map((s) => (
        <li key={s} className="tag">
          {s}
        </li>
      ))}
    </ul>
  )
}

export function MetadataItem({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="meta-grid__item">
      <dt className="meta-grid__label">{label}</dt>
      <dd className={`meta-grid__value ${mono ? 'meta-grid__value--mono' : ''}`}>{value || 'Not specified'}</dd>
    </div>
  )
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <h2 className="detail-section__title">{title}</h2>
      {children}
    </section>
  )
}
