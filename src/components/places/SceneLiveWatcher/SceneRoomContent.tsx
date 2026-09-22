import { useRemoteParticipants, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ParticipantGrid } from '../../cast/ParticipantGrid/ParticipantGrid'
import { Placeholder, PlaceholderHint, PlaceholderTitle } from './SceneLiveWatcher.styled'

// Permissive content renderer for the /get-scene-adapter path. Unlike
// WatcherViewContent (which filters on `metadata.role === 'streamer'`, set
// only by cast2 web streamers), this component shows any remote participant
// with an active Camera or ScreenShare track — the OBS publisher, the kernel
// scene client, anything. Falls back to a "waiting" placeholder showing the
// current participant count when nobody has video.
function SceneRoomContent() {
  const t = useFormatMessage()
  const participants = useRemoteParticipants()
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { updateOnlyOn: [] })
  const hasActiveVideo = tracks.some(track => track.publication && !track.publication.isMuted)

  if (hasActiveVideo) {
    return <ParticipantGrid localParticipantVisible={false} />
  }

  return (
    <Placeholder>
      <PlaceholderTitle>{t('discover.scene.waiting.title')}</PlaceholderTitle>
      <PlaceholderHint>{t('discover.scene.waiting.hint', { count: participants.length })}</PlaceholderHint>
    </Placeholder>
  )
}

export { SceneRoomContent }
