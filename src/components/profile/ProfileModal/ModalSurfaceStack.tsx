import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { CommunityDetailSurface } from '../CommunityDetailModal'
import { PhotoSurface } from '../PhotoModal/PhotoSurface'
import { PlaceDetailSurface } from '../PlaceDetailModal/PlaceDetailSurface'
import { ProfileSurface } from '../ProfileSurface'
import type { ProfileTab } from '../ProfileTabs'
import type { ModalSurface } from './ModalSurfaceStack.types'

interface ModalSurfaceViewProps {
  surface: ModalSurface
  /** Unwinds one history level — wired to every surface's back chevron. */
  onBack: () => void
  /** Dismisses the whole dialog. */
  onClose: () => void
  /** Tab handlers for profile surfaces — forwarded to the stack's top entry. */
  onTabChange: (tab: ProfileTab) => void
  onExitTab: () => void
}

/** Renders the top surface of a modal navigation stack. */
function ModalSurfaceView({ surface, onBack, onClose, onTabChange, onExitTab }: ModalSurfaceViewProps) {
  const { address: viewerAddress } = useAuthIdentity()

  switch (surface.kind) {
    case 'photo':
      return <PhotoSurface imageId={surface.imageId} onBack={onBack} onClose={onClose} />
    case 'place':
      return <PlaceDetailSurface place={surface.place} onBack={onBack} onClose={onClose} />
    case 'community':
      return <CommunityDetailSurface communityId={surface.communityId} onBack={onBack} onClose={onClose} />
    case 'profile':
      return (
        <ProfileSurface
          embedded
          address={surface.address}
          isOwnProfile={Boolean(viewerAddress && surface.address === viewerAddress.toLowerCase())}
          activeTab={surface.tab}
          onTabChange={onTabChange}
          hasExplicitTab={surface.hasExplicitTab}
          onExitTab={onExitTab}
          onBack={onBack}
          onClose={onClose}
        />
      )
  }
}

export { ModalSurfaceView }
