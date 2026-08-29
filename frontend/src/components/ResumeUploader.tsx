import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/selectors'
import type { ResumeInfo } from '../types'
import { IconFileText, IconX } from './icons'

export function ResumeUploader() {
  const { service, pushToast } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<ResumeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!service) return
    setLoading(true)
    service.getProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [service])

  const handleFile = useCallback(async (file: File) => {
    if (!service) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      pushToast('Only PDF files are supported', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      pushToast('File too large (max 10 MB)', 'error')
      return
    }
    setUploading(true)
    try {
      const result = await service.uploadProfile(file)
      setProfile(result)
      pushToast('Resume uploaded and parsed successfully', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      pushToast(msg, 'error')
    } finally {
      setUploading(false)
    }
  }, [service, pushToast])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  const handleDelete = useCallback(async () => {
    if (!service) return
    try {
      await service.deleteProfile()
      setProfile(null)
      pushToast('Profile deleted', 'success')
    } catch {
      pushToast('Failed to delete profile', 'error')
    }
  }, [service, pushToast])

  if (loading) {
    return <div className="uploader-loading">Loading profile...</div>
  }

  if (profile) {
    return (
      <div className="uploader-profile">
        <div className="uploader-profile__header">
          <div className="uploader-profile__icon">
            <IconFileText size={18} />
          </div>
          <div className="uploader-profile__info">
            <div className="uploader-profile__title">Resume uploaded</div>
            <div className="uploader-profile__meta">
              Version {profile.version}
              {profile.updated_at && <> · {new Date(profile.updated_at).toLocaleDateString()}</>}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={handleDelete}
            title="Delete profile"
            aria-label="Delete profile"
          >
            <IconX size={14} />
          </button>
        </div>

        <div className="uploader-profile__details">
          {profile.skills.length > 0 && (
            <div className="uploader-profile__field">
              <strong>Skills ({profile.skills.length})</strong>
              <span>{profile.skills.slice(0, 8).join(', ')}{profile.skills.length > 8 ? '...' : ''}</span>
            </div>
          )}
          {profile.roles.length > 0 && (
            <div className="uploader-profile__field">
              <strong>Roles</strong>
              <span>{profile.roles.join(', ')}</span>
            </div>
          )}
          {profile.experience_level && (
            <div className="uploader-profile__field">
              <strong>Level</strong>
              <span>{profile.experience_level}{profile.years_experience != null ? ` (${profile.years_experience} years)` : ''}</span>
            </div>
          )}
          {profile.languages.length > 0 && (
            <div className="uploader-profile__field">
              <strong>Languages</strong>
              <span>{profile.languages.map(l => l.level ? `${l.language} (${l.level})` : l.language).join(', ')}</span>
            </div>
          )}
        </div>

        <div className="uploader-profile__actions">
          <button
            type="button"
            className="btn btn--secondary btn--xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Replace
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={onInputChange}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`uploader-dropzone ${dragging ? 'uploader-dropzone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="sr-only"
        onChange={onInputChange}
      />
      <div className="uploader-dropzone__icon">
        <IconFileText size={24} />
      </div>
      <div className="uploader-dropzone__text">
        {uploading ? 'Uploading...' : 'Drop your resume here or click to browse'}
      </div>
      <div className="uploader-dropzone__hint">PDF only, max 10 MB</div>
    </div>
  )
}
