import type { ReactNode } from 'react'
import { DownloadModal } from 'decentraland-ui2'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { ProfileEmptyState } from './ProfileEmptyState'
import { JumpInBadgeIcon } from './ProfileEmptyState.icons'

interface JumpInEmptyStateProps {
  icon: ReactNode
  title: string
  subtitle?: string
  ctaLabel: string
}

/**
 * Empty state whose CTA sends the user in-world through the shared "Jump In"
 * flow — launch the desktop app, falling back to the download modal — mirroring
 * the navbar. Used by the Communities and Photos tabs.
 */
function JumpInEmptyState({ icon, title, subtitle, ctaLabel }: JumpInEmptyStateProps) {
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()
  return (
    <>
      <ProfileEmptyState
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={{ label: ctaLabel, onClick: handleClick, endIcon: <JumpInBadgeIcon /> }}
      />
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </>
  )
}

export { JumpInEmptyState }
