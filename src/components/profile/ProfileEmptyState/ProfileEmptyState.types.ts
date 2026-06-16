import type { ReactNode } from 'react'

/**
 * CTA shown under an empty profile tab. Only the viewer's own profile renders an
 * action — member views fall back to a plain message (see each tab). Provide
 * either `href` (external link, opens in a new tab) or `onClick` (in-app action
 * such as the jump-in launcher or a router navigation), not both.
 */
interface ProfileEmptyStateAction {
  label: string
  href?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  startIcon?: ReactNode
  endIcon?: ReactNode
}

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
