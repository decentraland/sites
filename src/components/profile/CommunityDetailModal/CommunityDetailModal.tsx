import { CommunityDetailSurface } from './CommunityDetailSurface'
import type { CommunityDetailModalProps } from './CommunityDetailModal.types'
import { CommunityDialog } from './CommunityDetailModal.styled'

function CommunityDetailModal({ communityId, onClose }: CommunityDetailModalProps) {
  return (
    <CommunityDialog open={communityId !== null} onClose={onClose} maxWidth={false} fullWidth>
      {communityId ? <CommunityDetailSurface communityId={communityId} onClose={onClose} /> : null}
    </CommunityDialog>
  )
}

export { CommunityDetailModal }
