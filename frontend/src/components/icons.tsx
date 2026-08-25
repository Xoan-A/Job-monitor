import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 16, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const IconBell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M10.3 20a2 2 0 0 0 3.4 0" />
  </svg>
)

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)

export const IconBookmark = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6 4h12v17l-6-4.5L6 21z" />
  </svg>
)

export const IconBriefcase = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
  </svg>
)

export const IconBuilding = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="1" />
    <path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M12 21v-3" />
  </svg>
)

export const IconMapPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4m8-4v4M3 10h18" />
  </svg>
)

export const IconExternalLink = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 4h5v5M20 4l-8 8" />
    <path d="M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
)

export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5m6-6-6 6 6 6" />
  </svg>
)

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4 12 6 6L20 6" />
  </svg>
)

export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const IconSliders = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8h10m4 0h2M4 16h4m4 0h8" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="10" cy="16" r="2" />
  </svg>
)

export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.5-2-1.5c.06-.4.1-.8.1-1.2Z" />
  </svg>
)

export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5m0-8v.01" />
  </svg>
)

export const IconPanelLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
)

export const IconInbox = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z" />
  </svg>
)

export const IconLayers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
)

export const IconStar = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8Z" />
  </svg>
)

export const IconTag = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 10v4m0 3v.01" />
  </svg>
)

export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" />
  </svg>
)

export const IconDollar = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2v20M17 6.5C16 5 14 4.5 12 4.5s-4 1-4 3 2 2.7 4 3.2 4.4 1.2 4.4 3.6-2.1 3.4-4.4 3.4-4.2-.8-5-2.2" />
  </svg>
)

export const IconFileText = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 2h8l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
    <path d="M14 2v5h5M9 12h6m-6 4h6" />
  </svg>
)
