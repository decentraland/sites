import type { ReactNode } from 'react'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react'

interface ParticipantGridProps {
  localParticipantVisible?: boolean
  presentationOverlay?: ReactNode
}

interface ParticipantTileProps {
  trackRef: TrackReferenceOrPlaceholder
  isFullscreen?: boolean
  onClick?: () => void
  overlay?: ReactNode
}

export type { ParticipantGridProps, ParticipantTileProps }
