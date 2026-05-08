import { useEffect, useState } from 'react'
import { useConnectionState, useLocalParticipant } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { useLocalVideoTracks } from '../../../hooks/useLocalVideoTracks'
import { EmptyStreamState } from '../LiveKitEnhancements/EmptyStreamState'
import { LiveStreamCounter } from '../LiveStreamCounter/LiveStreamCounter'
import { ParticipantGrid } from '../ParticipantGrid/ParticipantGrid'
import { ContentWrapper } from './StreamerViewContent.styled'

export function StreamerViewContent() {
  const { t } = useCastTranslation()
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()
  const { hasLocalCamera, hasLocalScreenShare } = useLocalVideoTracks()
  const [isInitializing, setIsInitializing] = useState(true)

  const isConnected = connectionState === ConnectionState.Connected
  const isConnecting = connectionState === ConnectionState.Connecting
  const isDisconnected = connectionState === ConnectionState.Disconnected
  const hasAnyVideo = hasLocalCamera || hasLocalScreenShare

  // Track initialization state - wait a bit for tracks to initialize
  useEffect(() => {
    if (!isConnected) {
      setIsInitializing(true)
      return
    }

    // If we're connected and have tracks, we're done initializing
    if (hasLocalCamera || hasLocalScreenShare) {
      setIsInitializing(false)
      return
    }

    // Give the camera/mic a moment to initialize after connection
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 2000) // 2 seconds grace period for tracks to initialize

    return () => clearTimeout(timer)
  }, [isConnected, hasLocalCamera, hasLocalScreenShare])

  // Show initializing state while connecting or camera is starting up
  // (prevents showing "disconnected" message during initial connection)
  if ((isConnecting || isDisconnected || (isConnected && isInitializing)) && !hasAnyVideo && isInitializing) {
    return (
      <ContentWrapper>
        <EmptyStreamState type="streamer" message={t('empty_state.camera_initializing')} />
      </ContentWrapper>
    )
  }

  // If disconnected (but not during initialization), show reconnection message
  if (isDisconnected && !isInitializing) {
    return (
      <ContentWrapper>
        <EmptyStreamState type="watcher" message={t('empty_state.streamer_disconnected')} />
      </ContentWrapper>
    )
  }

  // Always show the LiveStreamCounter when connected as streamer
  return (
    <ContentWrapper>
      <LiveStreamCounter />
      {hasAnyVideo ? (
        <ParticipantGrid localParticipantVisible={true} />
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
