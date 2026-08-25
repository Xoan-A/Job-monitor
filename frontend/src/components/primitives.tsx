import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export function useOutsideClick<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [onOutside])
  return ref
}

interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  className?: string
  menuClassName?: string
}

export function Dropdown({ trigger, children, align = 'left', className = '', menuClassName = '' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const toggle = () => setOpen((v) => !v)
  const ref = useOutsideClick<HTMLDivElement>(close)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={`dropdown ${className}`} ref={ref}>
      {trigger({ open, toggle })}
      {open && (
        <div className={`dropdown__menu dropdown__menu--${align} ${menuClassName}`} role="menu">
          {children(close)}
        </div>
      )}
    </div>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  id?: string
  className?: string
}

/** Compact filter select used across the toolbar. */
export function FilterSelect({ value, options, onChange, placeholder, label, id, className = '' }: SelectProps) {
  const active = options.find((o) => o.value === value && o.value !== '')
  return (
    <Dropdown
      className={className}
      trigger={({ open, toggle }) => (
        <button
          type="button"
          id={id}
          className={`select-btn ${active ? 'select-btn--active' : ''} ${open ? 'select-btn--open' : ''}`}
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {label && <span className="select-btn__label">{label}</span>}
          <span className={`select-btn__value ${!active && placeholder ? 'select-btn__value--placeholder' : ''}`}>
            {active ? active.label : placeholder || 'Any'}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    >
      {(close) => (
        <ul className="dropdown__list" role="listbox">
          {placeholder !== undefined && (
            <li role="option" aria-selected={value === ''}>
              <button
                type="button"
                className={`dropdown__item ${value === '' ? 'dropdown__item--selected' : ''}`}
                onClick={() => {
                  onChange('')
                  close()
                }}
              >
                {placeholder}
              </button>
            </li>
          )}
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                className={`dropdown__item ${o.value === value ? 'dropdown__item--selected' : ''}`}
                onClick={() => {
                  onChange(o.value)
                  close()
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dropdown>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean, e: React.MouseEvent) => void
  label: string
  className?: string
  stopPropagation?: boolean
}

export function Checkbox({ checked, onChange, label, className = '', stopPropagation }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={`jm-checkbox ${checked ? 'jm-checkbox--checked' : ''} ${className}`}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation()
        onChange(!checked, e)
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
          <path d="m4 12 6 6L20 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
