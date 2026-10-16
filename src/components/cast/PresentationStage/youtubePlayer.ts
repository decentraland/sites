import type { ClientPlayerEvents, ClientPlayerHandle } from './ClientVideo.types'
import type { YouTubePlayer } from './youtubePlayer.types'

const API_SRC = 'https://www.youtube.com/iframe_api'
const API_TIMEOUT_MS = 10_000
const EMBED_ORIGIN = 'https://www.youtube.com'
const ENDED = 0
const PLAYING = 1
const BUFFERING = 3

let apiPromise: Promise<void> | null = null

/**
 * Loads the YouTube IFrame API script once, keeping any ready callback already on the page.
 *
 * @returns A promise shared by concurrent callers, cleared when the script fails or times out; resolved at once when the API is already loaded.
 */
const loadYouTubeApi = (): Promise<void> => {
  if (window.YT?.Player) return Promise.resolve()
  apiPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = API_SRC
    const timer = setTimeout(() => {
      apiPromise = null
      reject(new Error('YouTube IFrame API timed out'))
    }, API_TIMEOUT_MS)
    script.onerror = () => {
      clearTimeout(timer)
      apiPromise = null
      reject(new Error('YouTube IFrame API failed to load'))
    }
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer)
      previous?.()
      resolve()
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

/** The chromeless embed URL for a video id, with the IFrame API enabled so the player can be driven over postMessage. */
const embedSrc = (id: string): string => {
  const params = new URLSearchParams({
    enablejsapi: '1',
    controls: '0',
    disablekb: '1',
    playsinline: '1',
    rel: '0',
    fs: '0',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    iv_load_policy: '3',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    cc_load_policy: '0',
    origin: window.location.origin
  })
  return `${EMBED_ORIGIN}/embed/${id}?${params.toString()}`
}

/**
 * Creates a chromeless YouTube player in a credentialless iframe inside `container`.
 *
 * @param container - Element React renders; the iframe is appended here and removed on destroy.
 * @param id - The parsed 11-character video id.
 * @param events - Callbacks for ready, ended, error and autoplay refusal.
 * @returns A handle whose `isPlaying()` is true from a `play()` request until the player settles, so a second request is not sent.
 */
const createYouTubePlayer = (container: HTMLElement, id: string, events: ClientPlayerEvents): ClientPlayerHandle => {
  const { YT } = window
  if (!YT) throw new Error('YouTube IFrame API is not loaded')
  const iframe = document.createElement('iframe')
  iframe.setAttribute('credentialless', '')
  iframe.setAttribute('allow', 'autoplay; encrypted-media')
  iframe.setAttribute('frameborder', '0')
  iframe.width = '100%'
  iframe.height = '100%'
  iframe.src = embedSrc(id)
  container.appendChild(iframe)
  let playRequested = false
  const player: YouTubePlayer = new YT.Player(iframe, {
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
      iframe.remove()
    }
  }
}

export { createYouTubePlayer, loadYouTubeApi }
