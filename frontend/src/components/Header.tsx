import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Dropdown } from './primitives'
import { IconBell, IconSearch, IconSettings, IconInfo, IconX, IconUser } from './icons'
import { sourceLabel } from '../lib/format'

function SearchBar() {
  const { filters, patchFilter, searchInputRef } = useApp()
  const [value, setValue] = useState(filters.q)
  const debounceRef = useRef<number | undefined>(undefined)

  // keep local input in sync when filters are reset elsewhere (clear filters, section change)
  useEffect(() => {
    setValue(filters.q)
  }, [filters.q])

  function onChange(v: string) {
    setValue(v)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => patchFilter('q', v), 300)
  }

  return (
    <div className="search-bar">
      <IconSearch size={15} className="search-bar__icon" />
      <input
        ref={searchInputRef}
        type="search"
        value={value}
        placeholder="Search jobs, companies, skills..."
        aria-label="Search jobs"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('')
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
      {value && (
        <button type="button" className="search-bar__clear" aria-label="Clear search" onClick={() => onChange('')}>
          <IconX size={13} />
        </button>
      )}
      <kbd className="search-bar__kbd" aria-hidden>/</kbd>
    </div>
  )
}

export function Header() {
  const { nav, filters, summary, facets, sourceKind, goToSection, setOpenDialog, refreshJobs } = useApp()

  const titles: Record<string, string> = {
    overview: 'Overview',
    all: 'All Jobs',
    new: 'New Jobs',
    saved: 'Saved Jobs',
    shortlisted: 'Shortlisted',
    applied: 'Applied',
    rejected: 'Rejected',
  }

  const contextLine = (() => {
    if (!summary) return 'Loading...'
    const scope = nav === 'saved' ? summary.saved : summary.total
    if (filters.source) return `${scope} jobs collected from ${facets?.sources.length || 1} sources · filtered by ${sourceLabel(filters.source)}`
    return `${scope} jobs collected from ${facets?.sources.length || '?'} sources`
  })()

  return (
    <header className="header">
      <div className="header__titles">
        <h1 className="header__title">{titles[nav] || 'All Jobs'}</h1>
        <p className="header__subtitle">{contextLine}</p>
      </div>

      <div className="header__actions">
        <SearchBar />

        <Dropdown
          align="right"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              className={`icon-btn ${open ? 'icon-btn--active' : ''}`}
              onClick={toggle}
              aria-label="Notifications"
              title="New in the last 24 hours"
            >
              <IconBell size={16} />
              {summary && summary.byStatus['new'] > 0 && <span className="icon-btn__badge" />}
            </button>
          )}
          menuClassName="dropdown__menu--notifications"
        >
          {(close) => (
            <div>
              <div className="dropdown__section-title">Recently discovered</div>
              {summary && summary.byStatus['new'] > 0 ? (
                <>
                  <p className="notifications__text">
                    {summary.byStatus['new']} jobs are waiting for review
                    {summary.bySource.map((s) => ` · ${sourceLabel(s.name)} (${s.count})`).join('')}
                  </p>
                  <button
                    type="button"
                    className="btn btn--secondary btn--block btn--sm"
                    onClick={() => {
                      goToSection('new')
                      close()
                    }}
                  >
                    Review new jobs
                  </button>
                </>
              ) : (
                <p className="notifications__text">No new jobs right now.</p>
              )}
            </div>
          )}
        </Dropdown>

        <Dropdown
          align="right"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              className={`avatar-btn ${open ? 'avatar-btn--active' : ''}`}
              onClick={toggle}
              aria-label="Account menu"
            >
              <IconUser size={15} />
            </button>
          )}
        >
          {(close) => (
            <div className="profile-menu">
              <div className="profile-menu__identity">
                <span className="profile-menu__name">Local user</span>
                <span className={`data-source-pill data-source-pill--${sourceKind}`}>
                  {sourceKind === 'api' ? 'Live API data' : sourceKind === 'mock' ? 'Demo data' : 'Connecting...'}
                </span>
              </div>
              <button
                type="button"
                className="dropdown__item"
                onClick={() => {
                  setOpenDialog('settings')
                  close()
                }}
              >
                <IconSettings size={14} /> Settings
              </button>
              <button
                type="button"
                className="dropdown__item"
                onClick={() => {
                  setOpenDialog('about')
                  close()
                }}
              >
                <IconInfo size={14} /> About Job Monitor
              </button>
              <button
                type="button"
                className="dropdown__item"
                onClick={() => {
                  refreshJobs()
                  close()
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh data
              </button>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  )
}
