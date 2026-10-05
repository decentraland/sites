import { useEffect, useState } from 'react'
import { useConnectionState, useLocalParticipant } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { useLocalVideoTracks } from '../../../hooks/useLocalVideoTracks'
import { CameraOverlayHandle } from '../CameraOverlayHandle/CameraOverlayHandle'
import { EmptyStreamState } from '../LiveKitEnhancements/EmptyStreamState'
import { LiveStreamCounter } from '../LiveStreamCounter/LiveStreamCounter'
import { ParticipantGrid } from '../ParticipantGrid/ParticipantGrid'
import { PresentationStage } from '../PresentationStage/PresentationStage'
import { ContentWrapper } from './StreamerViewContent.styled'

const TRACK_INIT_GRACE_MS = 2000

export function StreamerViewContent() {
  const { t } = useCastTranslation()
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()
  const { hasLocalCamera, hasLocalScreenShare } = useLocalVideoTracks()
  const presentation = usePresentationOptional()
  const [isInitializing, setIsInitializing] = useState(true)

  const isConnected = connectionState === ConnectionState.Connected
  const isConnecting = connectionState === ConnectionState.Connecting
  const isDisconnected = connectionState === ConnectionState.Disconnected
  const hasAnyVideo = hasLocalCamera || hasLocalScreenShare
  const isClientComposed = Boolean(presentation?.state.slide)

  useEffect(() => {
    if (!isConnected) {
      setIsInitializing(true)
      return
    }

    if (hasLocalCamera || hasLocalScreenShare) {
      setIsInitializing(false)
      return
    }

    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, TRACK_INIT_GRACE_MS)

    return () => clearTimeout(timer)
  }, [isConnected, hasLocalCamera, hasLocalScreenShare])

  if ((isConnecting || isDisconnected || (isConnected && isInitializing)) && !hasAnyVideo && isInitializing) {
    return (
      <ContentWrapper>
        <EmptyStreamState type="streamer" message={t('empty_state.camera_initializing')} />
      </ContentWrapper>
    )
  }

  if (isDisconnected && !isInitializing) {
    return (
      <ContentWrapper>
        <EmptyStreamState type="watcher" message={t('empty_state.streamer_disconnected')} />
      </ContentWrapper>
    )
  }

  if (isClientComposed) {
    const isLocalPresenter = presentation?.state.presenterIdentity === localParticipant.identity
    return (
      <ContentWrapper>
        <LiveStreamCounter />
        <PresentationStage overlay={hasLocalCamera && isLocalPresenter ? <CameraOverlayHandle /> : undefined} />
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper>
      <LiveStreamCounter />
      {hasAnyVideo || presentation?.isPresentationActive ? (
        <ParticipantGrid
          localParticipantVisible={true}
          presentationOverlay={presentation?.isPresentationActive && hasLocalCamera ? <CameraOverlayHandle /> : undefined}
        />
      ) : (
        <EmptyStreamState
          type="streamer"
          message={t('empty_state.streamer_action')}
          participantName={localParticipant?.identity}
          participant={localParticipant}
        />
      )}
    </ContentWrapper>
  )
}
