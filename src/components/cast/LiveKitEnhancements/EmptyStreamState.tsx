import { TrackReferenceOrPlaceholder, useIsSpeaking, useTracks } from '@livekit/components-react'
import TvIcon from '@mui/icons-material/Tv'
import { LocalAudioTrack, Participant, RemoteAudioTrack, Track } from 'livekit-client'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { Avatar } from '../Avatar/Avatar'
import { SpeakingIndicator } from './SpeakingIndicator'
import { EmptyStreamStateProps } from './EmptyStreamState.types'
import {
  AvatarPulse,
  EmptyContainer,
  EmptyIconWrapper,
  EmptySubtitle,
  EmptyTitle,
  ParticipantNameOverlay,
  SpeakingIndicatorWrapper,
  StreamerEmptyContainer
} from './EmptyStreamState.styled'

const PARTICIPANT_AVATAR_SIZE = 100

// Wrapper component that safely uses useIsSpeaking
function StreamerEmptyWithSpeaking({
  participant,
  participantName,
  audioTrack
}: {
  participant: Participant
  participantName?: string
  audioTrack: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder
}) {
  const isSpeaking = useIsSpeaking(participant)

  return (
    <StreamerEmptyContainer $isSpeaking={isSpeaking}>
      <AvatarPulse>
        <Avatar name={participantName} ethAddress={participant.identity} size={PARTICIPANT_AVATAR_SIZE} />
      </AvatarPulse>
      {participantName && <ParticipantNameOverlay>{participantName}</ParticipantNameOverlay>}
      <SpeakingIndicatorWrapper>
        <SpeakingIndicator participant={participant} trackRef={audioTrack} />
      </SpeakingIndicatorWrapper>
    </StreamerEmptyContainer>
  )
}

export function EmptyStreamState({ type, message, participantName, participant }: EmptyStreamStateProps) {
  const { t } = useCastTranslation()
  const isStreamer = type === 'streamer'

  const defaultMessage = isStreamer ? t('empty_state.streamer_message') : t('empty_state.watcher_message')
  const title = isStreamer ? t('empty_state.streamer_title') : t('empty_state.watcher_title')

  // Get audio track for speaking indicator (only if participant exists)
  const audioTracks = useTracks([{ source: Track.Source.Microphone, withPlaceholder: false }])
  const participantAudioTrack = participant ? audioTracks.find(t => t.participant.identity === participant.identity) : undefined

  // For streamer, show gradient background with avatar
  if (isStreamer) {
    // If we have participant and audio track, use the speaking-aware component
    if (participant && participantAudioTrack) {
      return <StreamerEmptyWithSpeaking participant={participant} participantName={participantName} audioTrack={participantAudioTrack} />
    }

    // Otherwise, show basic empty state
    return (
      <StreamerEmptyContainer>
        <AvatarPulse>
          <Avatar name={participantName} ethAddress={participant?.identity} size={PARTICIPANT_AVATAR_SIZE} />
        </AvatarPulse>
        {participantName && <ParticipantNameOverlay>{participantName}</ParticipantNameOverlay>}
      </StreamerEmptyContainer>
    )
  }

  // For watcher, show the icon and text
  return (
    <EmptyContainer>
      <EmptyIconWrapper>
        <TvIcon />
      </EmptyIconWrapper>

      <EmptyTitle variant="h5">{title}</EmptyTitle>

      <EmptySubtitle variant="body1">{message || defaultMessage}</EmptySubtitle>
    </EmptyContainer>
  )
}
