import { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { LocalAudioTrack, Participant, RemoteAudioTrack } from 'livekit-client'

interface SpeakingIndicatorProps {
  participant?: Participant
  trackRef?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder
}

export type { SpeakingIndicatorProps }
