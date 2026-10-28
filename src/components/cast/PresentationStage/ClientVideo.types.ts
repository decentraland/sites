import type { SlideVideoInfo } from '../../../features/cast2/cast2.types'

interface ClientVideoProps {
  video: SlideVideoInfo
  muted: boolean
}

interface ClientPlayerHandle {
  play: () => void
  pause: () => void
  seekTo: (ms: number) => void
  currentTimeMs: () => number
  durationMs: () => number | null
  isPlaying: () => boolean
  isBusy: () => boolean
  setMuted: (muted: boolean) => void
  destroy: () => void
}

interface ClientPlayerEvents {
  onReady: () => void
  onEnded: () => void
  onError: () => void
  onAutoplayBlocked: () => void
}

export type { ClientPlayerEvents, ClientPlayerHandle, ClientVideoProps }
