import { useCallback, useState } from 'react'
import { useModalPhotoNavigation } from './ModalProfileNavigation'

interface UseOpenPhotoModalResult {
  /** Tracks the standalone photo currently open. `null` when no modal is mounted (or when delegated to a host modal). */
  openImageId: string | null
  /** Open the given photo id. Delegates to the surrounding modal host when there is one (so we never stack a modal on top of another). */
  open: (imageId: string) => void
  /** Close the standalone modal. */
  close: () => void
}

/**
 * Mirror of `useOpenProfileModal` for photos. When invoked inside a
 * `ModalProfileNavigationProvider` whose host supplied `onOpenPhoto`, the click
 * is forwarded so the host can swap its own content (e.g. the ProfileModal
 * showing the photo with a back-to-profile button). Otherwise the caller owns
 * the open-state for a standalone `PhotoModal`.
 */
function useOpenPhotoModal(): UseOpenPhotoModalResult {
  const delegateOpenPhoto = useModalPhotoNavigation()
  const [openImageId, setOpenImageId] = useState<string | null>(null)

  const open = useCallback(
    (imageId: string) => {
      if (!imageId) return
      if (delegateOpenPhoto) {
        delegateOpenPhoto(imageId)
        return
      }
      setOpenImageId(imageId)
    },
    [delegateOpenPhoto]
  )

  const close = useCallback(() => setOpenImageId(null), [])

  return { openImageId, open, close }
}

export { useOpenPhotoModal }
