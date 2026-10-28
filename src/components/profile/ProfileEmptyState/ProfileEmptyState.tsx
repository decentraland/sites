import { memo } from 'react'
import type { ProfileEmptyStateProps } from './ProfileEmptyState.types'
import {
  EmptyStateBody,
  EmptyStateBox,
  EmptyStateButton,
  EmptyStateIcon,
  EmptyStateSubtitle,
  EmptyStateTitle
} from './ProfileEmptyState.styled'

/**
 * Shared empty-state panel for the profile tabs (Assets, Communities, Places,
 * Photos). Mirrors the Figma "EmptyMessage" composition: a bordered icon box,
 * a title, an optional subtitle and an optional primary CTA.
 *
 * The CTA is only meaningful on the viewer's own profile, so callers gate it
 * behind their `isOwnProfile` check and pass `action` accordingly.
 */
const ProfileEmptyState = memo(function ProfileEmptyState({ icon, title, subtitle, action }: ProfileEmptyStateProps) {
  return (
    <EmptyStateBox>
      <EmptyStateIcon>{icon}</EmptyStateIcon>
      <EmptyStateBody>
        <EmptyStateTitle>{title}</EmptyStateTitle>
        {subtitle ? <EmptyStateSubtitle>{subtitle}</EmptyStateSubtitle> : null}
        {action ? (
          <EmptyStateButton
            variant="contained"
            color="primary"
            startIcon={action.startIcon}
            endIcon={action.endIcon}
            {...(action.href ? { href: action.href, target: '_blank', rel: 'noopener noreferrer' } : { onClick: action.onClick })}
          >
            {action.label}
          </EmptyStateButton>
        ) : null}
      </EmptyStateBody>
    </EmptyStateBox>
  )
})

export { ProfileEmptyState }
