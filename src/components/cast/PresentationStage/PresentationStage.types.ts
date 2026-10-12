import type { ReactNode } from 'react'

interface PresentationStageProps {
  overlay?: ReactNode
  muted?: boolean
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
  onAutoplayBlocked: (attemptWasMuted: boolean) => void
}

interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  mute: () => void
  unMute: () => void
  destroy: () => void
}

interface YouTubePlayerOptions {
  videoId: string
  width: string
  height: string
  playerVars: Record<string, string | number>
  events: {
    onReady: () => void
    onStateChange: (event: { data: number }) => void
    onError: () => void
    onAutoplayBlocked: () => void
  }
}

interface YouTubeNamespace {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    YT?: YouTubeNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

export type { ClientPlayerEvents, ClientPlayerHandle, PresentationStageProps, YouTubePlayer, YouTubePlayerOptions }
