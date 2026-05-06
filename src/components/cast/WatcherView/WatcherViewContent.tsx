import { useRemoteParticipants } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { getDisplayName } from '../../../features/cast2/cast2.utils'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { EmptyStreamState } from '../LiveKitEnhancements/EmptyStreamState'
import { LiveStreamCounter } from '../LiveStreamCounter/LiveStreamCounter'
import { ParticipantGrid } from '../ParticipantGrid/ParticipantGrid'
import { ContentWrapper } from './WatcherViewContent.styled'

export function WatcherViewContent() {
  const { t } = useCastTranslation()
  const remoteParticipants = useRemoteParticipants()

  // Check if there are streamers connected
  const hasStreamers = remoteParticipants.some(p => {
    try {
      const metadata = p.metadata ? JSON.parse(p.metadata) : {}
      return metadata.role === 'streamer'
    } catch {
      return false
    }
  })

  // Check if any streamer has active video
  const hasActiveVideo = remoteParticipants.some(p => {
    const hasCamera = Array.from(p.videoTrackPublications.values()).some(
      pub => pub.source === Track.Source.Camera && pub.track && !pub.isMuted
    )
    const hasScreenShare = Array.from(p.videoTrackPublications.values()).some(
      pub => pub.source === Track.Source.ScreenShare && pub.track && !pub.isMuted
    )
    return hasCamera || hasScreenShare
  })

  // If no streamers at all, show watcher empty state
  if (!hasStreamers) {
    return (
      <ContentWrapper>
        <EmptyStreamState type="watcher" message={t('empty_state.watcher_message')} />
      </ContentWrapper>
    )
  }

  // Get streamer participant for name display
  const streamerParticipant = remoteParticipants.find(p => {
    try {
      const metadata = p.metadata ? JSON.parse(p.metadata) : {}
      return metadata.role === 'streamer'
    } catch {
      return false
    }
  })
  console.log('streamerParticipant', streamerParticipant)

  // Always show LiveStreamCounter and grid when there are streamers
  return (
    <ContentWrapper>
      <LiveStreamCounter />
      {hasActiveVideo ? (
        <ParticipantGrid localParticipantVisible={false} />
      ) : (
        <EmptyStreamState
          type="streamer"
          message={t('empty_state.streamer_action')}
          participantName={streamerParticipant ? getDisplayName(streamerParticipant) : undefined}
        />
      )}
    </ContentWrapper>
  )
}
