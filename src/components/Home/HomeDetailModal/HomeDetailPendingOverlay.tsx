// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { PendingCloseButton, PendingDialog, PendingSpinner } from './HomeDetailModal.styled'

interface HomeDetailPendingOverlayProps {
  onClose: () => void
}

// Shown from the first click until the detail is ready, so the card never feels dead while the
// island chunk and the API call are in flight.
function HomeDetailPendingOverlay({ onClose }: HomeDetailPendingOverlayProps) {
  const l = useFormatMessage()

  return (
    <PendingDialog open onClose={onClose} aria-busy="true" aria-label={l('event_detail.close')}>
      <PendingCloseButton aria-label={l('event_detail.close')} onClick={onClose}>
        <CloseIcon />
      </PendingCloseButton>
      <PendingSpinner />
    </PendingDialog>
  )
}

export { HomeDetailPendingOverlay }
