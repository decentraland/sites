import type { ClientPlayerEvents, ClientPlayerHandle } from './PresentationStage.types'

const API_SRC = 'https://www.youtube.com/iframe_api'
const ENDED = 0
const PLAYING = 1
const BUFFERING = 3

let apiPromise: Promise<void> | null = null

/**
 * Loads the YouTube IFrame API script once, keeping any ready callback already on the page.
 *
 * @returns A promise shared by concurrent callers, cleared when the script fails; resolved at once when the API is already loaded.
 */
const loadYouTubeApi = (): Promise<void> => {
  if (window.YT?.Player) return Promise.resolve()
  apiPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = API_SRC
    script.onerror = () => {
      apiPromise = null
      reject(new Error('YouTube IFrame API failed to load'))
    }
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
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
 * @returns A handle whose `isPlaying()` is true from a `play()` request until the player settles, so a second request is not sent.
 */
const createYouTubePlayer = (container: HTMLElement, id: string, events: ClientPlayerEvents): ClientPlayerHandle => {
  const { YT } = window
  if (!YT) throw new Error('YouTube IFrame API is not loaded')
  const child = document.createElement('div')
  container.appendChild(child)
  let playRequested = false
  const player = new YT.Player(child, {
    videoId: id,
    width: '100%',
    height: '100%',
    playerVars: {
      controls: 0,
      disablekb: 1,
      playsinline: 1,
      rel: 0,
      fs: 0,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      iv_load_policy: 3,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      cc_load_policy: 0,
      origin: window.location.origin
    },
    events: {
      onReady: () => events.onReady(),
      onStateChange: ({ data }) => {
        if (data !== BUFFERING) playRequested = false
        if (data === ENDED) events.onEnded()
      },
      onError: () => events.onError(),
      onAutoplayBlocked: () => {
        playRequested = false
        events.onAutoplayBlocked()
      },
      onApiChange: () => player.setOption('captions', 'track', {})
    }
  })
  return {
    play: () => {
      playRequested = true
      player.playVideo()
    },
    pause: () => {
      playRequested = false
      player.pauseVideo()
    },
    seekTo: ms => player.seekTo(ms / 1000, true),
    currentTimeMs: () => player.getCurrentTime() * 1000,
    durationMs: () => {
      const seconds = player.getDuration()
      return seconds > 0 ? seconds * 1000 : null
    },
    isPlaying: () => playRequested || player.getPlayerState() === PLAYING,
    isBusy: () => player.getPlayerState() === BUFFERING,
    setMuted: value => {
      if (value) player.mute()
      else player.unMute()
    },
    destroy: () => {
      player.destroy()
      child.remove()
    }
  }
}

export { createYouTubePlayer, loadYouTubeApi }
