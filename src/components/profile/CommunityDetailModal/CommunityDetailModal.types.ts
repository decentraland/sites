interface CommunityDetailSurfaceProps {
  communityId: string
  onClose: () => void
  /** Back chevron in the header — when embedded inside another modal. */
  onBack?: () => void
}

interface CommunityDetailModalProps {
  communityId: string | null
  onClose: () => void
}

export type { CommunityDetailModalProps, CommunityDetailSurfaceProps }
