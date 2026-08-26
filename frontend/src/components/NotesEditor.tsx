import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/selectors'
import type { Job } from '../types'
import { DetailSection } from './SkillList'

export function NotesEditor({ job }: { job: Job }) {
  const { saveNotes } = useApp()
  const [value, setValue] = useState(job.notes || '')
  const [state, setState] = useState<'idle' | 'dirty' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<number | undefined>(undefined)
  const lastSavedRef = useRef(job.notes || '')

  useEffect(() => {
    setValue(job.notes || '')
    lastSavedRef.current = job.notes || ''
    setState('idle')
  }, [job.id, job.notes])

  async function persist(notes: string) {
    setState('saving')
    try {
      await saveNotes(job.id, notes)
      lastSavedRef.current = notes
      setState('saved')
      window.setTimeout(() => setState((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch {
      setState('dirty')
    }
  }

  function onChange(v: string) {
    setValue(v)
    setState('dirty')
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => void persist(v), 900)
  }

  function onBlur() {
    window.clearTimeout(timerRef.current)
    if (value !== lastSavedRef.current) void persist(value)
  }

  return (
    <DetailSection title="Notes">
      <div className="notes-editor">
        <textarea
          className="notes-editor__textarea"
          placeholder="Add a personal note about this job..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          rows={4}
          aria-label="Job notes"
        />
        <div className={`notes-editor__status notes-editor__status--${state}`} aria-live="polite">
          {state === 'saving' && 'Saving...'}
          {state === 'saved' && 'Saved'}
        </div>
      </div>
    </DetailSection>
  )
}
