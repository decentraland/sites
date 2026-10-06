import { useRemoteParticipants, useRoomContext } from '@livekit/components-react'
import { act, render, renderHook } from '@testing-library/react'
import { useGetPresentationBotTokenMutation, useUploadPresentationFromUrlMutation, useUploadPresentationMutation } from '../cast2.client'
import { getStreamerToken } from '../cast2.utils'
import { decodeCommsPacket, encodeCommsPacket } from '../commsProtocol'
import { PresentationProvider, usePresentation, usePresentationOptional } from './PresentationContext'
import type { PresentationContextValue, PresentationState } from './PresentationContext'

jest.mock('@livekit/components-react', () => ({ useRemoteParticipants: jest.fn(), useRoomContext: jest.fn() }))
jest.mock('../cast2.client', () => ({
  useGetPresentationBotTokenMutation: jest.fn(),
  useUploadPresentationMutation: jest.fn(),
  useUploadPresentationFromUrlMutation: jest.fn()
}))
jest.mock('../cast2.utils', () => ({ ...jest.requireActual('../cast2.utils'), getStreamerToken: jest.fn() }))
const mockShow = jest.fn()
jest.mock('./NotificationContext', () => ({ useNotifications: () => ({ show: mockShow }) }))
jest.mock('../useCastTranslation', () => ({ useCastTranslation: () => ({ t: (key: string) => key }) }))

interface FakeParticipant {
  identity: string
  metadata: string
}
type DataHandler = (payload: Uint8Array, participant?: FakeParticipant) => void
type Invoke = (value: PresentationContextValue) => Promise<void>
type Fields = Record<string, unknown>

const BOT_IDENTITY = 'presentation-bot:room:1'
const DEFAULT_OVERLAY = { x: 0, y: 1, size: 'small' }
const LARGE_OVERLAY = { x: 1, y: 0, size: 'large' }
const HELD_OVERLAY = { x: 0.5, y: 0.5, size: 'small' }
const FAR_OVERLAY = { x: 0.3, y: 0.3, size: 'small' }
const HOLD_START = 1_000_000
const SLIDE = { url: 'https://presenter.test/presentations/deck-1/slides/0f3a.png', width: 1920, height: 1080 }
const SLIDE_VIDEO = { url: 'https://presenter.test/video.mp4', geometry: { x: 480, y: 270, width: 960, height: 540 } }
const OFF_SLIDE_VIDEO = { url: 'https://presenter.test/edge.mp4', geometry: { x: -40, y: -10, width: 0, height: 120 } }
const COMPOSITION = { slide: SLIDE, presenterIdentity: 'stream:p:1', playingVideoIndex: 0 }
const COMPOSED_METADATA = { overlay: LARGE_OVERLAY, slideVideos: [SLIDE_VIDEO], ...COMPOSITION }
const ORPHANED = { slide: SLIDE, presenterIdentity: 'stream:old' }
const OTHER_PARTICIPANT = { identity: 'stream:other', metadata: '' }
const PRESENTATION_INFO = { id: 'deck-2', slideCount: 5, currentSlide: 0, fileType: 'pdf' }
const LEGACY_STATE = {
  id: 'deck-1',
  slideCount: 3,
  currentSlide: 0,
  fileType: 'pdf',
  status: 'active',
  slideVideos: [],
  videoState: 'idle',
  overlay: DEFAULT_OVERLAY,
  slide: null,
  presenterIdentity: null,
  playingVideoIndex: null
}

const makeBot = (extra: Fields = {}): FakeParticipant => ({
  identity: BOT_IDENTITY,
  metadata: JSON.stringify({ role: 'presentation', id: 'deck-1', slideCount: 3, currentSlide: 0, fileType: 'pdf', ...extra })
})
const presentationPacket = (data: Fields) => encodeCommsPacket('presentation', data)
const statePacket = (extra: Fields = {}) =>
  presentationPacket({ type: 'presentation:state', id: 'deck-1', slideCount: 3, currentSlide: 0, fileType: 'pdf', ...extra })
const STOPPED_PACKET = presentationPacket({ type: 'presentation:stopped' })
const errorPacket = (extra: Fields = {}) =>
  presentationPacket({ type: 'presentation:error', code: 'video-timeout', message: 'Video timed out', ...extra })
const NO_VIDEOS = { slideVideos: [] }
const afterValidVideo = (video: unknown) => ({ slideVideos: [SLIDE_VIDEO, video] })
const resolved = (value: unknown) => ({ unwrap: () => Promise.resolve(value) })
const startFromFile: Invoke = value => value.startPresentation(new File(['deck'], 'deck.pdf'))
const startFromUrl: Invoke = value => value.startPresentationFromUrl('https://docs.test/deck.pdf')

let current: PresentationContextValue

const Probe = () => {
  current = usePresentation()
  return null
}

const tree = (canControl = false) => (
  <PresentationProvider canControl={canControl || undefined}>
    <Probe />
  </PresentationProvider>
)

describe('PresentationProvider', () => {
  let bot: FakeParticipant
  let dataHandler: DataHandler | undefined
  let publishData: jest.Mock
  let localParticipant: { identity: string; publishData: jest.Mock }
  let room: { localParticipant?: typeof localParticipant; on: jest.Mock; off: jest.Mock }
  let getPresentationBotToken: jest.Mock
  let uploadPresentation: jest.Mock
  let uploadPresentationFromUrl: jest.Mock
  let view: ReturnType<typeof render>

  const participants = (list: FakeParticipant[]) => (useRemoteParticipants as jest.Mock).mockReturnValue([...list])
  const renderProvider = (canControl = false) => {
    view = render(tree(canControl))
  }
  const rerender = (canControl = false) => view.rerender(tree(canControl))
  const deliver = (payload: Uint8Array, sender: FakeParticipant | null = bot) => act(() => dataHandler?.(payload, sender ?? undefined))
  const run = (invoke: Invoke) =>
    act(async () => {
      await invoke(current)
    })
  const sentCommands = () => publishData.mock.calls.map(([payload]: [Uint8Array]) => decodeCommsPacket(payload)?.data as Fields)
  const claimCount = () => sentCommands().filter(command => command.type === 'presentation:presenter:claim').length

  beforeEach(() => {
    bot = makeBot()
    dataHandler = undefined
    publishData = jest.fn().mockResolvedValue(undefined)
    localParticipant = { identity: 'stream:p:1', publishData }
    room = {
      localParticipant,
      on: jest.fn((_event: string, handler: DataHandler) => {
        dataHandler = handler
      }),
      off: jest.fn()
    }
    getPresentationBotToken = jest.fn().mockReturnValue(resolved({ token: 'bot-token', url: 'wss://example.test' }))
    uploadPresentation = jest.fn().mockReturnValue(resolved(PRESENTATION_INFO))
    uploadPresentationFromUrl = jest.fn().mockReturnValue(resolved(PRESENTATION_INFO))
    ;(useRoomContext as jest.Mock).mockReturnValue(room)
    ;(getStreamerToken as jest.Mock).mockReturnValue('streaming-key')
    ;(useGetPresentationBotTokenMutation as jest.Mock).mockReturnValue([getPresentationBotToken])
    ;(useUploadPresentationMutation as jest.Mock).mockReturnValue([uploadPresentation])
    ;(useUploadPresentationFromUrlMutation as jest.Mock).mockReturnValue([uploadPresentationFromUrl])
    participants([bot])
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('when there is no presentation bot', () => {
    beforeEach(() => {
      participants([])
      renderProvider()
    })

    it('should expose an idle presentation with the default overlay', () => {
      expect(current).toMatchObject({ isPresentationActive: false, state: { status: 'idle', overlay: DEFAULT_OVERLAY } })
    })
  })

  describe.each<[string, Fields, Fields]>([
    ['composition fields', COMPOSED_METADATA, COMPOSED_METADATA],
    ['a malformed overlay', { overlay: { x: 'a' } }, { status: 'active', overlay: DEFAULT_OVERLAY }],
    ['a failed video', { videoState: 'error', slideVideos: [SLIDE_VIDEO] }, { videoState: 'idle', slideVideos: [SLIDE_VIDEO] }]
  ])('when the bot metadata carries %s', (_label, extra, expected) => {
    beforeEach(() => {
      participants([makeBot(extra)])
      renderProvider()
    })

    it('should expose the normalized presentation state', () => {
      expect(current.state).toMatchObject(expected)
    })
  })

  describe('when the bot metadata has no presentation id', () => {
    beforeEach(() => {
      participants([makeBot({ id: undefined })])
      renderProvider()
    })

    it('should ask the bot for its state', () => {
      expect(sentCommands()).toEqual([{ type: 'presentation:get-state' }])
    })

    it('should follow the bot', () => {
      expect(current.presentationParticipantIdentity).toBe(BOT_IDENTITY)
    })
  })

  describe('when a presentation bot sends packets before its metadata arrives', () => {
    beforeEach(() => {
      bot = { identity: BOT_IDENTITY, metadata: '' }
      participants([bot])
      renderProvider()
      deliver(statePacket({ currentSlide: 2 }))
    })

    it('should apply the packet', () => {
      expect(current.state.currentSlide).toBe(2)
    })
  })

  describe('when a streamer identity claims the presentation role in its metadata', () => {
    beforeEach(() => {
      participants([{ ...makeBot(COMPOSITION), identity: 'stream:x:1' }])
      renderProvider()
    })

    it('should not treat it as the presentation bot', () => {
      expect(current.presentationParticipantIdentity).toBeNull()
    })
  })

  describe.each<[string, Fields, Fields]>([
    ['no v2 field', {}, LEGACY_STATE],
    ['a valid overlay', { overlay: FAR_OVERLAY }, { overlay: FAR_OVERLAY }],
    ['a malformed overlay', { overlay: { x: 'a' } }, { overlay: DEFAULT_OVERLAY }],
    ['composition fields', COMPOSITION, COMPOSITION],
    ['non-numeric slide counters', { slideCount: '3', currentSlide: '1' }, { slideCount: 0, currentSlide: 0 }],
    ['no file type', { fileType: undefined, currentSlide: 2 }, { fileType: null, currentSlide: 2 }],
    ['a slide with an empty url', { currentSlide: 2, slide: { ...SLIDE, url: '' } }, { currentSlide: 2, slide: null }],
    ['a slide with a zero width', { slide: { ...SLIDE, width: 0 } }, { slide: null }],
    ['a slide that is not an object', { slide: 'slide.png' }, { slide: null }],
    ['a negative playing video index', { playingVideoIndex: -1 }, { playingVideoIndex: null }],
    ['a fractional playing video index', { playingVideoIndex: 1.5 }, { playingVideoIndex: null }],
    ['a string playing video index', { playingVideoIndex: '0' }, { playingVideoIndex: null }],
    ['a numeric presenter identity', { presenterIdentity: 42 }, { presenterIdentity: null }],
    ['valid slide videos', { slideVideos: [SLIDE_VIDEO] }, { slideVideos: [SLIDE_VIDEO] }],
    ['a video placed partly off the slide', afterValidVideo(OFF_SLIDE_VIDEO), afterValidVideo(OFF_SLIDE_VIDEO)],
    ['slide videos that are a string', { slideVideos: 'x' }, NO_VIDEOS],
    ['a valid video then a null', afterValidVideo(null), NO_VIDEOS],
    ['a valid video then one with no url', afterValidVideo({}), NO_VIDEOS],
    ['a valid video then one with a null geometry', afterValidVideo({ url: 'u', geometry: null }), NO_VIDEOS],
    ['a valid video then one with a string geometry', afterValidVideo({ url: 'u', geometry: 'g' }), NO_VIDEOS],
    [
      'a valid video then one with a non-numeric width',
      afterValidVideo({ url: 'u', geometry: { ...SLIDE_VIDEO.geometry, width: '9' } }),
      NO_VIDEOS
    ],
    ['the error video state', { videoState: 'error' }, { videoState: 'idle' }],
    ['an unknown video state', { videoState: 'bogus' }, { videoState: 'idle' }],
    ['a numeric video state', { videoState: 42 }, { videoState: 'idle' }]
  ])('when the followed bot sends a presentation:state packet with %s', (_label, extra, expected) => {
    beforeEach(() => {
      participants([makeBot({ overlay: LARGE_OVERLAY })])
      renderProvider()
      deliver(statePacket(extra))
    })

    it('should expose the normalized presentation state', () => {
      expect(current.state).toMatchObject(expected)
    })
  })

  describe.each<[string, Uint8Array, string | null]>([
    ['a presentation:state from another bot', statePacket({ currentSlide: 2 }), 'presentation-bot:room:2'],
    ['a presentation:stopped from another bot', STOPPED_PACKET, 'presentation-bot:room:2'],
    ['a presentation:stopped on another topic', encodeCommsPacket('chat', { type: 'presentation:stopped' }), BOT_IDENTITY],
    ['a presentation:stopped without a sender', STOPPED_PACKET, null],
    ['a presentation packet whose payload is not an object', encodeCommsPacket('presentation', 'stopped'), BOT_IDENTITY]
  ])('when the room receives %s', (_label, packet, senderIdentity) => {
    beforeEach(() => {
      participants([{ identity: 'presentation-bot:room:2', metadata: '' }, bot])
      renderProvider()
      deliver(packet, senderIdentity ? { identity: senderIdentity, metadata: '' } : null)
    })

    it('should keep the presentation of the followed bot', () => {
      expect(current.state).toMatchObject({ status: 'active', currentSlide: 0 })
    })
  })

  describe('when the followed bot sends presentation:stopped', () => {
    beforeEach(() => {
      renderProvider()
      deliver(STOPPED_PACKET)
    })

    it('should reset the presentation', () => {
      expect(current).toMatchObject({ isPresentationActive: false, state: { id: null, status: 'idle', slideCount: 0 } })
    })
  })

  describe('when the bot leaves while the presentation is active', () => {
    beforeEach(() => {
      renderProvider()
      participants([])
      rerender()
    })

    it('should reset the presentation', () => {
      expect(current.state).toMatchObject({ id: null, status: 'idle' })
    })
  })

  describe('when there is no room', () => {
    beforeEach(() => {
      ;(useRoomContext as jest.Mock).mockReturnValue(undefined)
      renderProvider()
    })

    it('should still apply the bot metadata', () => {
      expect(current.state.id).toBe('deck-1')
    })

    it('should not subscribe to room data', () => {
      expect(dataHandler).toBeUndefined()
    })
  })

  describe('when the followed bot sends a presentation:error', () => {
    beforeEach(() => {
      renderProvider()
    })

    describe.each<[string, Fields, Fields]>([
      [
        'a retryable code naming a video',
        { videoIndex: 2, videoUrl: 'https://presenter.test/video.mp4' },
        { message: 'Video timed out', code: 'video-timeout', action: { label: 'notifications.retry', onClick: expect.any(Function) } }
      ],
      ['a code that is not retryable', { code: 'video-not-found', videoIndex: 2 }, { message: 'Video timed out', code: 'video-not-found' }],
      ['a retryable code naming no video', {}, { message: 'Video timed out', code: 'video-timeout' }]
    ])('and it carries %s', (_label, extra, expected) => {
      beforeEach(() => {
        deliver(errorPacket(extra))
      })

      it('should show a video playback failure', () => {
        expect(mockShow).toHaveBeenCalledWith('VideoPlaybackFailed', { action: undefined, ...expected })
      })
    })

    describe('and the retry action of a retryable failure is clicked', () => {
      beforeEach(async () => {
        deliver(errorPacket({ videoIndex: 2 }))
        const [, { action }] = mockShow.mock.calls[0] as [string, { action: { onClick: () => void } }]
        await act(async () => action.onClick())
      })

      it('should ask the bot to play that video again', () => {
        expect(sentCommands()).toEqual([{ type: 'presentation:video:play', videoIndex: 2 }])
      })
    })

    describe.each<[string, Fields]>([
      ['a numeric code', { code: 42 }],
      ['a numeric message', { message: 42 }],
      ['a string video index', { videoIndex: '2' }],
      ['a numeric video url', { videoUrl: 42 }]
    ])('and it carries %s', (_label, extra) => {
      beforeEach(() => {
        deliver(errorPacket(extra))
      })

      it('should not show a notification', () => {
        expect(mockShow).not.toHaveBeenCalled()
      })
    })
  })

  describe.each<[string, Invoke, Fields]>([
    ['navigateSlide', value => value.navigateSlide('next'), { type: 'presentation:navigate', action: 'next' }],
    ['goToSlide', value => value.goToSlide(2), { type: 'presentation:navigate', action: 'goto', slideIndex: 2 }],
    ['playVideo', value => value.playVideo(1), { type: 'presentation:video:play', videoIndex: 1 }],
    ['pauseVideo', value => value.pauseVideo(), { type: 'presentation:video:pause' }],
    ['stopVideo', value => value.stopVideo(), { type: 'presentation:video:stop' }],
    ['setOverlay', value => value.setOverlay({ size: 'large' }), { type: 'presentation:overlay:update', size: 'large' }],
    ['stopPresentation', value => value.stopPresentation(), { type: 'presentation:stop' }]
  ])('when %s is called', (_name, invoke, expected) => {
    describe('and a presentation is active', () => {
      beforeEach(async () => {
        renderProvider()
        await run(invoke)
      })

      it('should publish the command to the presentation topic', () => {
        expect(sentCommands()).toEqual([expected])
      })
    })

    describe('and there is no presentation', () => {
      beforeEach(async () => {
        participants([])
        renderProvider()
        await run(invoke)
      })

      it('should not publish anything', () => {
        expect(publishData).not.toHaveBeenCalled()
      })
    })

    describe('and the room has no local participant', () => {
      beforeEach(async () => {
        room.localParticipant = undefined
        renderProvider()
        await run(invoke)
      })

      it('should not publish anything', () => {
        expect(publishData).not.toHaveBeenCalled()
      })
    })
  })

  describe('when setOverlay is waiting for its command to be published', () => {
    beforeEach(() => {
      publishData.mockReturnValueOnce(new Promise(() => undefined))
      renderProvider()
      act(() => {
        void current.setOverlay({ size: 'large' })
      })
    })

    it('should update the overlay right away', () => {
      expect(current.state.overlay.size).toBe('large')
    })
  })

  describe('when a local overlay change is held', () => {
    let now: number

    beforeEach(async () => {
      now = HOLD_START
      jest.spyOn(Date, 'now').mockImplementation(() => now)
      participants([makeBot(COMPOSITION)])
      renderProvider()
      await run(value => value.setOverlay({ x: 0.5, y: 0.5 }))
    })

    describe('and a differing presentation:state packet arrives within the hold', () => {
      beforeEach(() => {
        now = HOLD_START + 500
        deliver(statePacket({ overlay: FAR_OVERLAY }))
      })

      it('should keep the local overlay', () => {
        expect(current.state.overlay).toEqual(HELD_OVERLAY)
      })

      describe('and then a matching packet arrives followed by a stale one', () => {
        beforeEach(() => {
          now = HOLD_START + 700
          deliver(statePacket({ overlay: HELD_OVERLAY }))
          now = HOLD_START + 800
          deliver(statePacket({ overlay: FAR_OVERLAY }))
        })

        it('should keep ignoring the stale overlay', () => {
          expect(current.state.overlay).toEqual(HELD_OVERLAY)
        })
      })
    })

    describe('and a differing presentation:state packet arrives after the hold', () => {
      beforeEach(() => {
        now = HOLD_START + 1001
        deliver(statePacket({ overlay: FAR_OVERLAY }))
      })

      it('should apply the incoming overlay', () => {
        expect(current.state.overlay).toEqual(FAR_OVERLAY)
      })
    })

    describe('and the bot metadata re-emits a differing overlay within the hold', () => {
      let previous: PresentationState

      beforeEach(() => {
        previous = current.state
        now = HOLD_START + 500
        participants([makeBot({ ...COMPOSITION, overlay: FAR_OVERLAY })])
        rerender()
      })

      it('should keep the same state object', () => {
        expect(current.state).toBe(previous)
      })
    })
  })

  describe.each<[string, FakeParticipant[], Fields, boolean, number]>([
    ['a presenter who left the room', [], ORPHANED, true, 1],
    ['no presenter', [], { slide: SLIDE, presenterIdentity: null }, true, 1],
    ['a presenter who is a remote participant', [OTHER_PARTICIPANT], { slide: SLIDE, presenterIdentity: 'stream:other' }, true, 0],
    ['the local participant as presenter', [], { slide: SLIDE, presenterIdentity: 'stream:p:1' }, true, 0],
    ['no slide', [], { presenterIdentity: null }, true, 0],
    ['a presenter who left the room to a client that cannot control', [], ORPHANED, false, 0]
  ])('when the followed bot reports %s', (_label, others, extra, canControl, expected) => {
    beforeEach(() => {
      participants([bot, ...others])
      renderProvider(canControl)
      deliver(statePacket(extra))
    })

    it(`should send ${expected} presenter claims`, () => {
      expect(claimCount()).toBe(expected)
    })
  })

  describe.each([
    ['the same absent presenter', 'stream:old', 1],
    ['the local identity', 'stream:p:1', 1],
    ['another absent identity', 'stream:absent', 2]
  ])('when a controlling client has claimed for an absent presenter and the bot then reports %s', (_label, presenterIdentity, expected) => {
    beforeEach(() => {
      renderProvider(true)
      deliver(statePacket(ORPHANED))
      rerender(true)
      deliver(statePacket({ slide: SLIDE, presenterIdentity }))
    })

    it(`should have sent ${expected} presenter claims in total`, () => {
      expect(claimCount()).toBe(expected)
    })
  })

  describe('when the remote presenter of a controlling client leaves the room', () => {
    beforeEach(() => {
      participants([bot, OTHER_PARTICIPANT])
      renderProvider(true)
      deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:other' }))
      participants([bot])
      rerender(true)
    })

    it('should send exactly one presenter claim', () => {
      expect(claimCount()).toBe(1)
    })
  })

  describe('when a presenter claim fails to send', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    describe('and the provider re-renders with the same orphaned presenter', () => {
      beforeEach(async () => {
        publishData.mockRejectedValueOnce(new Error('data channel closed'))
        renderProvider(true)
        deliver(statePacket(ORPHANED))
        await act(async () => {})
        participants([bot])
        rerender(true)
      })

      it('should send the claim again', () => {
        expect(claimCount()).toBe(2)
      })
    })

    describe('and the server had already re-pointed it at another absent identity', () => {
      let rejectFirstClaim: (error: Error) => void

      beforeEach(async () => {
        publishData.mockReturnValueOnce(
          new Promise<void>((_resolve, reject) => {
            rejectFirstClaim = reject
          })
        )
        renderProvider(true)
        deliver(statePacket(ORPHANED))
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:absent' }))
        await act(async () => rejectFirstClaim(new Error('data channel closed')))
        participants([bot])
        rerender(true)
      })

      it('should not claim the current identity again', () => {
        expect(claimCount()).toBe(2)
      })
    })
  })

  describe('when a presentation upload is requested', () => {
    beforeEach(() => {
      participants([])
    })

    describe.each<[string, Invoke]>([
      ['a file', startFromFile],
      ['a URL', startFromUrl]
    ])('and it uploads %s', (_label, invoke) => {
      beforeEach(async () => {
        renderProvider()
        await run(invoke)
      })

      it('should send the local participant identity as the presenter identity', () => {
        expect([...uploadPresentation.mock.calls, ...uploadPresentationFromUrl.mock.calls]).toEqual([
          [expect.objectContaining({ presenterIdentity: 'stream:p:1' })]
        ])
      })

      it('should start the uploaded presentation with every v2 field unset', () => {
        expect(current.state).toMatchObject({
          id: 'deck-2',
          status: 'starting',
          overlay: DEFAULT_OVERLAY,
          slide: null,
          presenterIdentity: null,
          playingVideoIndex: null
        })
      })
    })

    describe('and the local participant has no identity yet', () => {
      beforeEach(async () => {
        localParticipant.identity = ''
        renderProvider()
        await run(startFromFile)
      })

      it('should omit the presenter identity', () => {
        expect(uploadPresentation.mock.calls[0][0].presenterIdentity).toBeUndefined()
      })
    })

    describe('and another upload is already running', () => {
      beforeEach(async () => {
        let resolveToken: (token: unknown) => void = () => undefined
        getPresentationBotToken.mockReturnValueOnce({
          unwrap: () =>
            new Promise(resolve => {
              resolveToken = resolve
            })
        })
        renderProvider()
        let first: Promise<void> = Promise.resolve()
        act(() => {
          first = startFromFile(current)
        })
        await run(startFromUrl)
        await act(async () => {
          resolveToken({ token: 'bot-token', url: 'wss://example.test' })
          await first
        })
      })

      it('should run only the first upload', () => {
        expect({ tokens: getPresentationBotToken.mock.calls.length, urlUploads: uploadPresentationFromUrl.mock.calls.length }).toEqual({
          tokens: 1,
          urlUploads: 0
        })
      })
    })

    describe('and there is no stored streaming key', () => {
      beforeEach(async () => {
        ;(getStreamerToken as jest.Mock).mockReturnValueOnce(null)
        renderProvider()
        await run(startFromFile)
      })

      it('should show a persistent download failure', () => {
        expect(mockShow).toHaveBeenCalledWith('PresentationDownloadFailed', { message: 'No streaming key available', persistent: true })
      })

      it('should go back to idle', () => {
        expect(current.state.status).toBe('idle')
      })
    })

    describe.each<[string, Invoke, string]>([
      ['a file upload', startFromFile, 'Failed to start presentation'],
      ['a URL upload', startFromUrl, 'Failed to start presentation from URL']
    ])('and %s rejects with a non-Error value', (_label, invoke, expectedMessage) => {
      beforeEach(async () => {
        uploadPresentation.mockReturnValueOnce({ unwrap: () => Promise.reject({ status: 500 }) })
        uploadPresentationFromUrl.mockReturnValueOnce({ unwrap: () => Promise.reject({ status: 500 }) })
        renderProvider()
        await run(invoke)
      })

      it('should show a persistent download failure with the generic label', () => {
        expect(mockShow).toHaveBeenCalledWith('PresentationDownloadFailed', { message: expectedMessage, persistent: true })
      })
    })

    describe('and the bot reports an active presentation before it finishes', () => {
      beforeEach(async () => {
        let resolveUpload: (info: unknown) => void = () => undefined
        uploadPresentation.mockReturnValueOnce({
          unwrap: () =>
            new Promise(resolve => {
              resolveUpload = resolve
            })
        })
        participants([makeBot({ id: undefined })])
        renderProvider()
        let pending: Promise<void> = Promise.resolve()
        await act(async () => {
          pending = startFromFile(current)
        })
        deliver(statePacket())
        await act(async () => {
          resolveUpload(PRESENTATION_INFO)
          await pending
        })
      })

      it('should keep the active state reported by the bot', () => {
        expect(current.state).toMatchObject({ id: 'deck-1', status: 'active' })
      })
    })
  })
})

describe('when usePresentation is used outside a PresentationProvider', () => {
  let thrown: unknown

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      renderHook(() => usePresentation())
    } catch (error) {
      thrown = error
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should throw a provider error', () => {
    expect(thrown).toEqual(new Error('usePresentation must be used within PresentationProvider'))
  })
})

describe('when usePresentationOptional is used outside a PresentationProvider', () => {
  let value: PresentationContextValue | null

  beforeEach(() => {
    value = renderHook(() => usePresentationOptional()).result.current
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return null', () => {
    expect(value).toBeNull()
  })
})
