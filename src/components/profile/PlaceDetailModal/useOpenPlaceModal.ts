import { useCallback, useState } from 'react'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useModalPlaceNavigation } from '../ProfileModal/ModalProfileNavigation'

interface UseOpenPlaceModalResult {
  /** The place currently displayed in a standalone modal. `null` when the host context owns the state. */
  openPlace: ProfilePlace | null
  /** Open the given place. Delegates to the surrounding modal host when there is one (no modal-on-modal stacking). */
  open: (place: ProfilePlace) => void
  /** Close the standalone modal. */
  close: () => void
}

function useOpenPlaceModal(): UseOpenPlaceModalResult {
  const delegateOpenPlace = useModalPlaceNavigation()
  const [openPlace, setOpenPlace] = useState<ProfilePlace | null>(null)

  const open = useCallback(
    (place: ProfilePlace) => {
      if (!place) return
      if (delegateOpenPlace) {
        delegateOpenPlace(place)
        return
      }
      setOpenPlace(place)
    },
    [delegateOpenPlace]
  )

  const close = useCallback(() => setOpenPlace(null), [])

  return { openPlace, open, close }
}

export { useOpenPlaceModal }
