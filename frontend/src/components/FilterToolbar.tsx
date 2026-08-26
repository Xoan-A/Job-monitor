import { useState } from 'react'
import { useApp } from '../context/selectors'
import { useDebounce } from '../lib/useDebounce'
import { Dropdown, FilterSelect } from './primitives'
import { IconSliders, IconX, IconCheck } from './icons'
import { JOB_STATUSES, STATUS_LABELS, type PostedWithinOption, type RemoteType, type SortOption } from '../types'

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  relevance: 'Relevance',
  company: 'Company',
  salary: 'Salary',
}

const POSTED_OPTIONS: { value: PostedWithinOption; label: string }[] = [
  { value: '1', label: 'Last 24 hours' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Past week' },
  { value: '14', label: 'Past 2 weeks' },
  { value: '30', label: 'Past month' },
  { value: '90', label: 'Past 3 months' },
]

export function FilterToolbar() {
  const {
    filters,
    patchFilter,
    clearFilters,
    facets,
    sort,
    setSort,
    totalJobs,
    jobsLoading,
    activeFilterCount,
  } = useApp()
  const [moreOpen, setMoreOpen] = useState(false)

  const debouncedCompany = useDebounce((v: string) => patchFilter('company', v), 300)
  const debouncedSkill = useDebounce((v: string) => patchFilter('skill', v), 300)

  const moreCount = [filters.company, filters.skill, filters.experience].filter(Boolean).length

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <FilterSelect
          id="filter-source"
          label="Source"
          placeholder="All sources"
          value={filters.source}
          onChange={(v) => patchFilter('source', v)}
          options={(facets?.sources || []).map((s) => ({ value: s.name, label: sourceDisplay(s.name) }))}
        />
        <FilterSelect
          id="filter-location"
          label="Location"
          placeholder="All locations"
          value={filters.location}
          onChange={(v) => patchFilter('location', v)}
          options={(facets?.locations || []).slice(0, 40).map((l) => ({ value: l, label: l }))}
        />
        <FilterSelect
          id="filter-remote"
          label="Remote"
          placeholder="Any arrangement"
          value={filters.remote}
          onChange={(v) => patchFilter('remote', v as RemoteType | '')}
          options={[
            { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'onsite', label: 'On-site' },
          ]}
        />
        <FilterSelect
          id="filter-type"
          label="Type"
          placeholder="Any type"
          value={filters.employmentType}
          onChange={(v) => patchFilter('employmentType', v)}
          options={(facets?.employmentTypes || []).map((t) => ({ value: t, label: t }))}
        />

        <button
          type="button"
          className={`toolbar__more-btn ${moreOpen || moreCount ? 'toolbar__more-btn--active' : ''}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          <IconSliders size={14} />
          More filters
          {moreCount > 0 && <span className="toolbar__more-count">{moreCount}</span>}
        </button>

        <div className="toolbar__spacer" />

        <Dropdown
          align="right"
          trigger={({ toggle }) => (
            <button type="button" className="select-btn select-btn--sort" onClick={toggle}>
              <span className="select-btn__label">Sort</span>
              <span className="select-btn__value">{SORT_LABELS[sort]}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        >
          {(close) => (
            <ul className="dropdown__list" role="listbox">
              {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                <li key={s} role="option" aria-selected={sort === s}>
                  <button
                    type="button"
                    className={`dropdown__item ${sort === s ? 'dropdown__item--selected' : ''}`}
                    onClick={() => {
                      setSort(s)
                      close()
                    }}
                  >
                    <span className="dropdown__item-check">{sort === s && <IconCheck size={12} />}</span>
                    {SORT_LABELS[s]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dropdown>

        {activeFilterCount > 0 && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
            <IconX size={13} />
            Clear filters
          </button>
        )}

        <span className="toolbar__count" aria-live="polite">
          {jobsLoading ? '…' : `${totalJobs} job${totalJobs === 1 ? '' : 's'}`}
        </span>
      </div>

      {moreOpen && (
        <div className="toolbar__more-panel">
          <div className="toolbar__field">
            <label htmlFor="f-company">Company</label>
            <input
              id="f-company"
              type="text"
              className="text-input text-input--sm"
              placeholder="e.g. dLocal"
              defaultValue={filters.company}
              onChange={(e) => debouncedCompany(e.target.value)}
            />
          </div>
          <div className="toolbar__field">
            <label htmlFor="f-skill">Skill / technology</label>
            <input
              id="f-skill"
              type="text"
              className="text-input text-input--sm"
              placeholder="e.g. PostgreSQL"
              defaultValue={filters.skill}
              onChange={(e) => debouncedSkill(e.target.value)}
            />
          </div>
          <div className="toolbar__field">
            <label htmlFor="f-experience">Experience level</label>
            <FilterSelect
              id="f-experience"
              placeholder="Any level"
              value={filters.experience}
              onChange={(v) => patchFilter('experience', v)}
              options={(facets?.experienceLevels || []).map((x) => ({ value: x, label: x }))}
            />
          </div>
          <div className="toolbar__field">
            <label htmlFor="f-posted">Date posted</label>
            <FilterSelect
              id="f-posted"
              placeholder="Any time"
              value={filters.postedWithin}
              onChange={(v) => patchFilter('postedWithin', v as PostedWithinOption)}
              options={POSTED_OPTIONS}
            />
          </div>
          <div className="toolbar__field">
            <label htmlFor="f-status">Status</label>
            <FilterSelect
              id="f-status"
              placeholder="Any status"
              value={filters.status}
              onChange={(v) => patchFilter('status', v as typeof filters.status)}
              options={JOB_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
          </div>
          <div className="toolbar__field">
            <label htmlFor="f-salary">Salary</label>
            <button
              id="f-salary"
              type="button"
              role="checkbox"
              aria-checked={filters.hasSalary}
              className={`jm-toggle ${filters.hasSalary ? 'jm-toggle--on' : ''}`}
              onClick={() => patchFilter('hasSalary', !filters.hasSalary)}
            >
              <span className="jm-toggle__track" aria-hidden>
                <span className="jm-toggle__thumb" />
              </span>
              With salary info
            </button>
          </div>
          <div className="toolbar__field">
            <label htmlFor="f-savedonly">Saved only</label>
            <button
              id="f-savedonly"
              type="button"
              role="checkbox"
              aria-checked={filters.saved === true}
              className={`jm-toggle ${filters.saved === true ? 'jm-toggle--on' : ''}`}
              onClick={() => patchFilter('saved', filters.saved === true ? null : true)}
            >
              <span className="jm-toggle__track" aria-hidden>
                <span className="jm-toggle__thumb" />
              </span>
              Saved jobs only
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function sourceDisplay(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}
