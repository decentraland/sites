import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import SlideshowIcon from '@mui/icons-material/Slideshow'
import StopIcon from '@mui/icons-material/Stop'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { ShareMenu, ShareMenuItem } from './StreamingControls.styled'

interface ShareMenuDropdownProps {
  isPresentationActive: boolean
  onShareScreen: () => void
  onSharePresentation: () => void
  onStopPresentation: () => void
}

export function ShareMenuDropdown({
  isPresentationActive,
  onShareScreen,
  onSharePresentation,
  onStopPresentation
}: ShareMenuDropdownProps) {
  const { t } = useCastTranslation()
  return (
    <ShareMenu data-dropdown-menu>
      {isPresentationActive ? (
        <ShareMenuItem onClick={onStopPresentation}>
          <StopIcon />
          {t('streaming_controls.stop_presentation')}
        </ShareMenuItem>
      ) : (
        <>
          <ShareMenuItem onClick={onShareScreen}>
            <ScreenShareIcon />
            {t('streaming_controls.share_screen')}
          </ShareMenuItem>
          <ShareMenuItem onClick={onSharePresentation}>
            <SlideshowIcon />
            {t('streaming_controls.share_presentation')}
          </ShareMenuItem>
        </>
      )}
    </ShareMenu>
  )
}
