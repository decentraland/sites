import type { PresentationState } from './contexts/PresentationContext'
import type { ClientPlayerSource } from './cast2.types'

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const DRIVE_PATH = /^\/file\/d\/([A-Za-z0-9_-]{10,128})\/view$/
const VIMEO_HLS_PATH = /^\/external\/\d+\.m3u8$/
const DRIVE_DOWNLOAD_URL = 'https://drive.usercontent.google.com/download'

const parseUrl = (url: string): URL | null => {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/**
 * Maps a canonical client-video URL from the presenter server to a player source.
 *
 * @param url - `slideVideos[i].url` of an entry whose `source` is `'client'`.
 * @returns The player source, or `null` when the URL is not one of the three canonical forms.
 */
const toClientPlayerSource = (url: string): ClientPlayerSource | null => {
  const parsed = parseUrl(url)
  if (!parsed || parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port || parsed.hash) return null
  const { hostname, pathname, searchParams, href } = parsed
  if (hostname === 'www.youtube.com') {
    const id = searchParams.get('v') ?? ''
    return pathname === '/watch' && YOUTUBE_ID.test(id) ? { kind: 'youtube', id } : null
  }
  if (hostname === 'drive.google.com') {
    const id = DRIVE_PATH.exec(pathname)?.[1]
    return id ? { kind: 'file', src: `${DRIVE_DOWNLOAD_URL}?${new URLSearchParams({ id, export: 'download', confirm: 't' })}` } : null
  }
  return hostname === 'player.vimeo.com' && VIMEO_HLS_PATH.test(pathname) ? { kind: 'hls', src: href } : null
}

/**
 * Target playback position for the current state.
 *
 * @param state - The presentation's video state and position anchor.
 * @param now - Current epoch milliseconds.
 * @returns Milliseconds, or `null` when no client video is playing or paused.
 */
const targetPositionMs = (
  state: Pick<PresentationState, 'videoState' | 'videoPositionMs' | 'videoPositionAt'>,
  now: number
): number | null => {
  const { videoState, videoPositionMs, videoPositionAt } = state
  if (videoPositionMs === null || videoPositionAt === null) return null
  if (videoState === 'paused') return videoPositionMs
  return videoState === 'playing' ? Math.max(0, videoPositionMs + now - videoPositionAt) : null
}

export { targetPositionMs, toClientPlayerSource }
