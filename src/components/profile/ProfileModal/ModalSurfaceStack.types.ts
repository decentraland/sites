import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import type { ProfileTab } from '../ProfileTabs'

/** One entry in a modal's in-place navigation history (rule: never stack a dialog on a dialog). */
type ModalSurface =
  | { kind: 'profile'; address: string; tab: ProfileTab; hasExplicitTab: boolean }
  | { kind: 'photo'; imageId: string }
  | { kind: 'place'; place: ProfilePlace }
  | { kind: 'community'; communityId: string }

type ModalSurfaceVariant = 'profile' | 'photo' | 'place' | 'community'

interface ModalSurfaceStack {
  /** Current visible surface, or `null` when the modal shows its root content. */
  top: ModalSurface | null
  /** Paper variant of the current surface (`undefined` on root). */
  variant: ModalSurfaceVariant | undefined
  openProfile: (address: string) => void
  openPhoto: (imageId: string) => void
  openPlace: (place: ProfilePlace) => void
  openCommunity: (communityId: string) => void
  /** Goes back exactly one surface (photo → profile → … → root). */
  pop: () => void
  /** Clears the whole history (modal closed / root content changed). */
  reset: () => void
  /** Updates the tab state of the top entry when it is a profile. */
  setTopProfileTab: (tab: ProfileTab) => void
  /** Returns the top profile entry to its mobile navigation root (clears the tab choice). */
  exitTopProfileTab: () => void
}

export type { ModalSurface, ModalSurfaceStack, ModalSurfaceVariant }
