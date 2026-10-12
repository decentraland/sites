import type { ClientPlayerHandle, YouTubePlayerEvents } from './PresentationStage.types'

const API_SRC = 'https://www.youtube.com/iframe_api'
const ENDED = 0
const PLAYING = 1
const BUFFERING = 3

let apiPromise: Promise<void> | null = null

/**
 * Loads the YouTube IFrame API script once.
 *
 * @returns A promise shared by concurrent callers, cleared when the script fails.
 */
const loadYouTubeApi = (): Promise<void> => {
  apiPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = API_SRC
    script.onerror = () => {
      apiPromise = null
      reject(new Error('YouTube IFrame API failed to load'))
    }
    window.onYouTubeIframeAPIReady = () => resolve()
    document.head.appendChild(script)
  })
  return apiPromise
}

/**
 * Creates a chromeless YouTube player in a child element of `container`.
 *
 * @param container - Element React renders; the player replaces a child created here, never the container.
 * @param id - The parsed 11-character video id.
 * @param events - Callbacks for ready, ended, error and autoplay refusal.
 */
const createYouTubePlayer = (container: HTMLElement, id: string, events: YouTubePlayerEvents): ClientPlayerHandle => {
  const { YT } = window
  if (!YT) throw new Error('YouTube IFrame API is not loaded')
  const child = document.createElement('div')
  container.appendChild(child)
  const player = new YT.Player(child, {
    videoId: id,
    width: '100%',
    height: '100%',
    playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, fs: 0, origin: window.location.origin },
    events: {
      onReady: () => events.onReady(),
      onStateChange: ({ data }) => {
        if (data === ENDED) events.onEnded()
      },
      onError: () => events.onError(),
      onAutoplayBlocked: () => events.onAutoplayBlocked()
    }
  })
  return {
    play: () => player.playVideo(),
    pause: () => player.pauseVideo(),
    seekTo: ms => player.seekTo(ms / 1000, true),
    currentTimeMs: () => player.getCurrentTime() * 1000,
    durationMs: () => {
      const seconds = player.getDuration()
      return seconds > 0 ? seconds * 1000 : null
    },
    isPlaying: () => player.getPlayerState() === PLAYING,
    isBusy: () => player.getPlayerState() === BUFFERING,
    setMuted: muted => (muted ? player.mute() : player.unMute()),
    destroy: () => {
      player.destroy()
      child.remove()
    }
  }
}

export { createYouTubePlayer, loadYouTubeApi }
