import { useCallback, useEffect } from 'react'
import { ModalProfileNavigationProvider, ModalSurfaceView, useModalSurfaceStack } from '../../profile/ProfileModal'
import { StyledDialog } from '../DetailModal/DetailModal.styled'
import { EventDetailModalContent } from './EventDetailModalContent'
import { EventDetailModalHero } from './EventDetailModalHero'
import type { EventDetailModalProps } from './EventDetailModal.types'

function EventDetailModal({ open, onClose, data, adminActions, onEdit }: EventDetailModalProps) {
  // Profiles / photos / places / communities opened from inside the modal swap in-place —
  // never stack on top of the event dialog. The surface stack keeps the full history so the
  // back chevron unwinds one level at a time (e.g. event → profile → photo → other profile).
  const { top, variant, openProfile, openPhoto, openPlace, openCommunity, openFriends, pop, reset, setTopProfileTab, exitTopProfileTab } =
    useModalSurfaceStack()

  // Reset the swap history whenever the underlying event changes or the modal closes,
  // so reopening the modal lands back on the event content.
  useEffect(() => {
    if (!open || !data) reset()
  }, [open, data, reset])
  useEffect(() => {
    reset()
  }, [data?.id, reset])

  // Escape unwinds one surface at a time; backdrop click dismisses the dialog.
  const handleDialogClose = useCallback(
    (_event: object, reason?: string) => {
      if (reason === 'escapeKeyDown' && top) {
        pop()
        return
      }
      onClose()
    },
    [top, pop, onClose]
  )

  return (
    <StyledDialog
      open={open && !!data}
      onClose={handleDialogClose}
      aria-labelledby="event-detail-title"
      fullWidth
      maxWidth={false}
      $wide={variant !== undefined}
      $swapVariant={variant}
    >
      {data && (
        <ModalProfileNavigationProvider
          onOpenProfile={openProfile}
          onOpenPhoto={openPhoto}
          onOpenPlace={openPlace}
          onOpenCommunity={openCommunity}
          onOpenFriends={openFriends}
        >
          {top ? (
            <ModalSurfaceView surface={top} onBack={pop} onClose={onClose} onTabChange={setTopProfileTab} onExitTab={exitTopProfileTab} />
          ) : (
            <>
              <EventDetailModalHero data={data} onClose={onClose} onEdit={onEdit} />
              <EventDetailModalContent data={data} adminActions={adminActions} />
            </>
          )}
        </ModalProfileNavigationProvider>
      )}
    </StyledDialog>
  )
}

export { EventDetailModal }
