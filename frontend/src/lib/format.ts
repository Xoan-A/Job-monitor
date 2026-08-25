import type { JobStatus } from '../types'

export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ''
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const DATETIME_FMT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string | null): string {
  if (!iso) return 'Not available'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Not available'
  return DATE_FMT.format(d)
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return 'Not available'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Not available'
  return DATETIME_FMT.format(d)
}

/** Very light sanitizer for description HTML coming from external sources. */
export function sanitizeHtml(html: string): string {
  let clean = html
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '')
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '')
  clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
  clean = clean.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  clean = clean.replace(/javascript:/gi, '')
  return clean
}

export function looksLikeHtml(text: string): boolean {
  return /<\/?(p|div|br|ul|ol|li|h[1-6]|strong|em|b|i|a|table|span)\b/i.test(text)
}

/** Render plain-text descriptions: blank-line paragraphs, "- "/"• " bullets preserved. */
export function renderDescriptionBlocks(text: string): { type: 'p' | 'li'; text: string }[] {
  const blocks: { type: 'p' | 'li'; text: string }[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const bullet = /^([-*•·])\s+/.exec(trimmed)
    blocks.push({ type: bullet ? 'li' : 'p', text: bullet ? trimmed.replace(/^([-*•·])\s+/, '') : trimmed })
  }
  return blocks
}

export function matchLabel(score: number | null): string | null {
  if (score === null) return null
  if (score >= 75) return 'Strong match'
  if (score >= 50) return 'Good match'
  return 'Low match'
}

export function sourceLabel(source: string): string {
  switch (source.toLowerCase()) {
    case 'buscojobs':
      return 'Buscojobs'
    case 'jooble':
      return 'Jooble'
    default:
      return source.charAt(0).toUpperCase() + source.slice(1)
  }
}

export function remoteLabelFromModality(modality: string | null): string | null {
  if (!modality) return null
  const m = modality.toLowerCase()
  if (/remot|teletrabajo/.test(m)) return 'Remote'
  if (/h[ií]brid/.test(m)) return 'Hybrid'
  if (/presencial|on.?site/.test(m)) return 'On-site'
  return modality
}

export function statusTone(status: JobStatus): 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' {
  switch (status) {
    case 'new':
      return 'accent'
    case 'reviewing':
      return 'warning'
    case 'shortlisted':
      return 'success'
    case 'applied':
      return 'success'
    case 'interview':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'archived':
      return 'muted'
  }
}
