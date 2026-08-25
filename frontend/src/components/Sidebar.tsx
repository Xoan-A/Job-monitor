import { useApp } from '../context/AppContext'
import { SAVED_SEARCHES } from '../constants/savedSearches'
import { sourceLabel } from '../lib/format'
import type { NavSection } from '../types'
import { IconBriefcase, IconInbox, IconLayers, IconSettings, IconInfo, IconPanelLeft, IconBookmark, IconStar, IconFileText, IconX } from './icons'

const NAV_MAIN: { key: NavSection; label: string; icon: (p: { size?: number }) => JSX.Element; badge?: 'unread' | 'saved' }[] = [
  { key: 'overview', label: 'Overview', icon: IconLayers },
  { key: 'all', label: 'All Jobs', icon: IconInbox },
  { key: 'new', label: 'New', icon: IconStar, badge: 'unread' },
  { key: 'saved', label: 'Saved', icon: IconBookmark, badge: 'saved' },
  { key: 'shortlisted', label: 'Shortlisted', icon: IconBriefcase },
  { key: 'applied', label: 'Applied', icon: IconFileText },
  { key: 'rejected', label: 'Rejected', icon: IconX },
]

export function Sidebar() {
  const {
    nav,
    goToSection,
    filterBySource,
    summary,
    facets,
    savedSearchCounts,
    applySavedSearch,
    sidebarCollapsed,
    toggleSidebar,
    setOpenDialog,
  } = useApp()

  const badgeFor = (badge?: 'unread' | 'saved'): number | null => {
    if (!summary) return null
    if (badge === 'unread') return summary.unread || null
    if (badge === 'saved') return summary.saved || null
    return null
  }

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <button
          type="button"
          className="sidebar__brand"
          onClick={() => goToSection('overview')}
          title="Job Monitor"
        >
          <span className="sidebar__brand-mark" aria-hidden>
            JM
          </span>
          <span className="sidebar__brand-text">Job Monitor</span>
        </button>
        <button
          type="button"
          className="icon-btn sidebar__collapse-btn"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <IconPanelLeft size={15} />
        </button>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        <ul className="sidebar__group">
          {NAV_MAIN.map((item) => {
            const count = badgeFor(item.badge)
            return (
              <li key={item.key}>
                <button
                  type="button"
                  className={`sidebar__item ${nav === item.key ? 'sidebar__item--active' : ''}`}
                  onClick={() => goToSection(item.key)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon size={15} />
                  {!sidebarCollapsed && <span className="sidebar__item-label">{item.label}</span>}
                  {!sidebarCollapsed && count !== null && <span className="sidebar__count">{count}</span>}
                </button>
              </li>
            )
          })}
        </ul>

        {!sidebarCollapsed && (
          <>
            <div className="sidebar__divider" role="separator" />

            <div className="sidebar__group-title">Sources</div>
            <ul className="sidebar__group">
              <li>
                <button
                  type="button"
                  className={`sidebar__item`}
                  onClick={() => goToSection('all')}
                >
                  <IconInbox size={15} />
                  <span className="sidebar__item-label">All Sources</span>
                  {summary && <span className="sidebar__count">{summary.total}</span>}
                </button>
              </li>
              {(facets?.sources || []).map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    className="sidebar__item sidebar__item--sub"
                    onClick={() => filterBySource(s.name)}
                    title={`Filter by ${sourceLabel(s.name)}`}
                  >
                    <span className="sidebar__dot" aria-hidden />
                    <span className="sidebar__item-label">{sourceLabel(s.name)}</span>
                    <span className="sidebar__count">{s.count}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="sidebar__divider" role="separator" />

            <div className="sidebar__group-title">Saved searches</div>
            <ul className="sidebar__group">
              {SAVED_SEARCHES.map((ss) => (
                <li key={ss.label}>
                  <button
                    type="button"
                    className="sidebar__item sidebar__item--sub"
                    onClick={() => applySavedSearch(ss.label)}
                    title={`Run saved search "${ss.label}"`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <circle cx="11" cy="11" r="7" strokeLinecap="round" />
                      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                    </svg>
                    <span className="sidebar__item-label">{ss.label}</span>
                    {savedSearchCounts[ss.label] !== undefined && (
                      <span className="sidebar__count">{savedSearchCounts[ss.label]}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__item"
          onClick={() => setOpenDialog('settings')}
          title={sidebarCollapsed ? 'Settings' : undefined}
        >
          <IconSettings size={15} />
          {!sidebarCollapsed && <span className="sidebar__item-label">Settings</span>}
        </button>
        <button
          type="button"
          className="sidebar__item"
          onClick={() => setOpenDialog('about')}
          title={sidebarCollapsed ? 'About' : undefined}
        >
          <IconInfo size={15} />
          {!sidebarCollapsed && <span className="sidebar__item-label">About</span>}
        </button>
      </div>
    </aside>
  )
}
