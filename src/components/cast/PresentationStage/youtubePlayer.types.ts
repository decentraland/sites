interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  mute: () => void
  unMute: () => void
  setOption: (module: string, option: string, value: object) => void
  destroy: () => void
}

interface YouTubePlayerOptions {
  events: {
    onReady: () => void
    onStateChange: (event: { data: number }) => void
    onError: () => void
    onAutoplayBlocked: () => void
    onApiChange: () => void
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

export type { YouTubeNamespace, YouTubePlayer, YouTubePlayerOptions }
