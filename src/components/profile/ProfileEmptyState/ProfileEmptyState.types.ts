import type { MouseEvent, ReactNode } from 'react'

interface ProfileEmptyStateActionBase {
  label: string
  startIcon?: ReactNode
  endIcon?: ReactNode
}

/**
 * CTA shown under an empty profile tab. Only the viewer's own profile renders an
 * action — member views fall back to a plain message (see each tab). The CTA is
 * either an external link (`href`, opens in a new tab) or an in-app handler
 * (`onClick`, e.g. the jump-in launcher or a router navigation) — never both;
 * the discriminated union enforces that at compile time.
 */
type ProfileEmptyStateAction = ProfileEmptyStateActionBase &
  ({ href: string; onClick?: never } | { href?: never; onClick: (event: MouseEvent<HTMLButtonElement>) => void })

/**
 * Figma "EmptyMessage" (Profile Account, node 322:49163): a centered icon box,
 * title, optional subtitle and an optional primary CTA. Shared by the Assets,
 * Communities, Places and Photos tabs.
 */
interface ProfileEmptyStateProps {
  /** Glyph rendered inside the 100×100 rounded icon box. */
  icon: ReactNode
  title: string
  subtitle?: string
  action?: ProfileEmptyStateAction
}

export type { ProfileEmptyStateAction, ProfileEmptyStateProps }
