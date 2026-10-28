import { targetPositionMs, toClientPlayerSource } from './cast2.clientVideo'
import type { PresentationState } from './contexts/PresentationContext'
import type { ClientPlayerSource } from './cast2.types'

type PositionState = Pick<PresentationState, 'videoState' | 'videoPositionMs' | 'videoPositionAt'>

const YOUTUBE_ID = 'dQw4w9WgXcQ'
const YOUTUBE_URL = `https://www.youtube.com/watch?v=${YOUTUBE_ID}`
const DRIVE_ID = '1AbCdEfGhIjKlMnOpQr_StUv-WxYz'
const DRIVE_URL = `https://drive.google.com/file/d/${DRIVE_ID}/view`
const PRESENTER_SERVER_URL = 'https://cast-presenter.example.com'
const DRIVE_SRC = `${PRESENTER_SERVER_URL}/api/drive-video?fileId=${DRIVE_ID}`
const VIMEO_URL = 'https://player.vimeo.com/external/123456789.m3u8?s=0a1b2c&logging=false'
const NOW = 1_760_270_410_000
const ANCHOR_AT = 1_760_270_400_000

describe.each<[string, string, ClientPlayerSource | null]>([
  ['a canonical YouTube URL', YOUTUBE_URL, { kind: 'youtube', id: YOUTUBE_ID }],
  ['a YouTube URL with extra query parameters', `${YOUTUBE_URL}&x=1`, { kind: 'youtube', id: YOUTUBE_ID }],
  ['a canonical Google Drive URL', DRIVE_URL, { kind: 'file', src: DRIVE_SRC }],
  ['a canonical Vimeo HLS URL', VIMEO_URL, { kind: 'hls', src: VIMEO_URL }],
  ['a YouTube URL over http', `http://www.youtube.com/watch?v=${YOUTUBE_ID}`, null],
  ['a YouTube URL without www', `https://youtube.com/watch?v=${YOUTUBE_ID}`, null],
  ['a youtu.be short link', `https://youtu.be/${YOUTUBE_ID}`, null],
  ['a YouTube embed URL', `https://www.youtube.com/embed/${YOUTUBE_ID}`, null],
  ['a YouTube watch URL without a video id', 'https://www.youtube.com/watch', null],
  ['a YouTube id of 10 characters', 'https://www.youtube.com/watch?v=dQw4w9WgXc', null],
  ['a YouTube id of 12 characters', 'https://www.youtube.com/watch?v=dQw4w9WgXcQQ', null],
  ['a Google Drive URL without /view', `https://drive.google.com/file/d/${DRIVE_ID}`, null],
  ['a Google Drive id with a dot', 'https://drive.google.com/file/d/1AbCdEfGh.IjKlMnOp/view', null],
  ['a Vimeo player page', 'https://player.vimeo.com/video/1', null],
  ['a Vimeo page link', 'https://vimeo.com/1', null],
  ['a YouTube URL nested in the query of another host', `https://evil.com/?u=${YOUTUBE_URL}`, null],
  ['a host that extends the YouTube host', `https://www.youtube.com.evil.com/watch?v=${YOUTUBE_ID}`, null],
  ['a URL with a username', `https://user@www.youtube.com/watch?v=${YOUTUBE_ID}`, null],
  ['a URL with only a password', `https://:secret@www.youtube.com/watch?v=${YOUTUBE_ID}`, null],
  ['a URL with a non-default port', `https://www.youtube.com:8443/watch?v=${YOUTUBE_ID}`, null],
  ['a URL with a hash', `${YOUTUBE_URL}#t=10`, null],
  ['a value that is not a URL', 'not a url', null]
])('when mapping %s to a client player source', (_label, url, expected) => {
  let source: ClientPlayerSource | null

  beforeEach(() => {
    source = toClientPlayerSource(url, PRESENTER_SERVER_URL)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it(`should return ${JSON.stringify(expected)}`, () => {
    expect(source).toEqual(expected)
  })
})

describe.each<[string, PositionState, number | null]>([
  ['a playing video', { videoState: 'playing', videoPositionMs: 12_500, videoPositionAt: ANCHOR_AT }, 22_500],
  ['a paused video', { videoState: 'paused', videoPositionMs: 12_500, videoPositionAt: ANCHOR_AT }, 12_500],
  ['an idle video', { videoState: 'idle', videoPositionMs: 12_500, videoPositionAt: ANCHOR_AT }, null],
  ['a playing video without a position', { videoState: 'playing', videoPositionMs: null, videoPositionAt: ANCHOR_AT }, null],
  ['a playing video without an anchor time', { videoState: 'playing', videoPositionMs: 12_500, videoPositionAt: null }, null],
  ['a playing video anchored in the future', { videoState: 'playing', videoPositionMs: 1_000, videoPositionAt: NOW + 5_000 }, 0]
])('when computing the target position of %s', (_label, state, expected) => {
  let position: number | null

  beforeEach(() => {
    position = targetPositionMs(state, NOW)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it(`should return ${expected}`, () => {
    expect(position).toBe(expected)
  })
})
