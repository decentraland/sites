import { useRemoteParticipants, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ParticipantGrid } from '../../cast/ParticipantGrid/ParticipantGrid'
import { PresentationStage } from '../../cast/PresentationStage/PresentationStage'
import { Placeholder, PlaceholderHint, PlaceholderTitle } from './SceneLiveWatcher.styled'

/** Renders every remote participant with an active camera or screen share, or a waiting placeholder with the participant count. */
function SceneRoomContent() {
  const t = useFormatMessage()
  const participants = useRemoteParticipants()
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { updateOnlyOn: [] })
  const hasActiveVideo = tracks.some(track => track.publication && !track.publication.isMuted)
  const presentation = usePresentationOptional()

  if (presentation?.state.slide) {
    return <PresentationStage />
  }

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
