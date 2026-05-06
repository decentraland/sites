/* eslint-disable @typescript-eslint/naming-convention */
import { useMemo } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import MicOffIcon from '@mui/icons-material/MicOff'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { IconWrapper, OverlayContainer, StatusBadge } from './StreamerStatusOverlay.styled'

export function StreamerStatusOverlay() {
  const { t } = useCastTranslation()
  const { localParticipant } = useLocalParticipant()

  const isMicMuted = !localParticipant?.isMicrophoneEnabled

  const hasVideoTrack = useMemo(
    () => localParticipant?.videoTrackPublications && localParticipant.videoTrackPublications.size > 0,
    [localParticipant?.videoTrackPublications]
  )

  // Only show muted badge if user is actually streaming video but muted
  // Note: Speaking indicator is shown in ParticipantTile, not here, to avoid duplication
  return (
    <OverlayContainer>
      {hasVideoTrack && isMicMuted && (
        <StatusBadge $isActive={true} $type="muted">
          <IconWrapper>
            <MicOffIcon />
          </IconWrapper>
          {t('status.muted')}
        </StatusBadge>
      )}
    </OverlayContainer>
  )
}
