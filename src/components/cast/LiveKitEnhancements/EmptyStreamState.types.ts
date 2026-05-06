import { Participant } from 'livekit-client'

interface EmptyStreamStateProps {
  type: 'streamer' | 'watcher'
  message?: string
  participantName?: string
  participant?: Participant
}

export type { EmptyStreamStateProps }
