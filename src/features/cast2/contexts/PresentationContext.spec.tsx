import { useRemoteParticipants, useRoomContext } from '@livekit/components-react'
import { act, render, renderHook } from '@testing-library/react'
import { useGetPresentationBotTokenMutation, useUploadPresentationFromUrlMutation, useUploadPresentationMutation } from '../cast2.client'
import { getStreamerToken, isPresentationBot } from '../cast2.utils'
import { decodeCommsPacket, encodeCommsPacket } from '../commsProtocol'
import { type PresentationContextValue, PresentationProvider, usePresentation, usePresentationOptional } from './PresentationContext'

jest.mock('@livekit/components-react', () => ({ useRemoteParticipants: jest.fn(), useRoomContext: jest.fn() }))
jest.mock('../cast2.client', () => ({
  useGetPresentationBotTokenMutation: jest.fn(),
  useUploadPresentationMutation: jest.fn(),
  useUploadPresentationFromUrlMutation: jest.fn()
}))
jest.mock('../cast2.utils', () => ({
  ...jest.requireActual('../cast2.utils'),
  isPresentationBot: jest.fn(),
  getStreamerToken: jest.fn()
}))
const mockShow = jest.fn()
jest.mock('./NotificationContext', () => ({
  useNotifications: () => ({ show: mockShow, dismiss: jest.fn(), notifications: [] })
}))
jest.mock('../useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

type DataHandler = (payload: Uint8Array, participant?: unknown) => void

interface FakeParticipant {
  identity: string
  metadata: string
}

const DEFAULT_OVERLAY = { x: 0, y: 1, size: 'small' }
const HOLD_START = 1_000_000

const mockUseRemoteParticipants = useRemoteParticipants as jest.Mock
const mockUseRoomContext = useRoomContext as jest.Mock
const mockIsPresentationBot = isPresentationBot as jest.Mock
const mockGetStreamerToken = getStreamerToken as jest.Mock

const makeBot = (extra: Record<string, unknown> = {}): FakeParticipant => ({
  identity: 'presentation-bot:room:1',
  metadata: JSON.stringify({ role: 'presentation', id: 'deck-1', slideCount: 3, currentSlide: 0, fileType: 'pdf', ...extra })
})

const statePacket = (extra: Record<string, unknown> = {}) =>
  encodeCommsPacket('presentation', {
    type: 'presentation:state',
    id: 'deck-1',
    slideCount: 3,
    currentSlide: 0,
    fileType: 'pdf',
    ...extra
  })

let current: PresentationContextValue
let dataHandler: DataHandler | undefined
let publishData: jest.Mock
let now: number

const Probe = () => {
  current = usePresentation()
  return null
}

const tree = () => (
  <PresentationProvider>
    <Probe />
  </PresentationProvider>
)

const controllerTree = () => (
  <PresentationProvider canControl>
    <Probe />
  </PresentationProvider>
)

const renderProvider = () => render(tree())

const deliver = (payload: Uint8Array, participant: FakeParticipant) => {
  act(() => {
    dataHandler?.(payload, participant)
  })
}

const makeRoom = (identity: string) => ({
  localParticipant: { identity, publishData },
  on: jest.fn((_event: string, handler: DataHandler) => {
    dataHandler = handler
  }),
  off: jest.fn()
})

const claimCount = (): number =>
  publishData.mock.calls.filter(([payload]: [Uint8Array]) => {
    const data = decodeCommsPacket(payload)?.data as { type?: string } | undefined
    return data?.type === 'presentation:presenter:claim'
  }).length

const sentCommands = (): unknown[] => publishData.mock.calls.map(([payload]: [Uint8Array]) => decodeCommsPacket(payload)?.data)

const errorPacket = (extra: Record<string, unknown> = {}) =>
  encodeCommsPacket('presentation', { type: 'presentation:error', code: 'video-timeout', message: 'Video timed out', ...extra })

const SLIDE = { url: 'https://presenter.test/presentations/deck-1/slides/0f3a.png', width: 1920, height: 1080 }
const SLIDE_VIDEO = { url: 'https://presenter.test/video.mp4', geometry: { x: 480, y: 270, width: 960, height: 540 } }
const PRESENTATION_INFO = { id: 'deck-2', slideCount: 5, currentSlide: 0, fileType: 'pdf' }

describe('PresentationProvider', () => {
  let bot: FakeParticipant

  beforeEach(() => {
    now = HOLD_START
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    bot = makeBot()
    dataHandler = undefined
    publishData = jest.fn().mockResolvedValue(undefined)
    const room = {
      localParticipant: { identity: 'stream:p:1', publishData },
      on: jest.fn((_event: string, handler: DataHandler) => {
        dataHandler = handler
      }),
      off: jest.fn()
    }
    mockUseRoomContext.mockReturnValue(room)
    mockUseRemoteParticipants.mockReturnValue([])
    mockIsPresentationBot.mockImplementation((participant: FakeParticipant) => participant.identity.startsWith('presentation-bot:'))
    mockGetStreamerToken.mockReturnValue('streaming-key')
    ;(useGetPresentationBotTokenMutation as jest.Mock).mockReturnValue([jest.fn()])
    ;(useUploadPresentationMutation as jest.Mock).mockReturnValue([jest.fn()])
    ;(useUploadPresentationFromUrlMutation as jest.Mock).mockReturnValue([jest.fn()])
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('when it first renders', () => {
    beforeEach(() => {
      renderProvider()
    })

    it('should expose the default overlay', () => {
      expect(current.state.overlay).toEqual(DEFAULT_OVERLAY)
    })
  })

  describe('when the bot metadata carries a valid overlay', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ overlay: { x: 1, y: 0, size: 'large' } })])
      renderProvider()
    })

    it('should expose that overlay', () => {
      expect(current.state.overlay).toEqual({ x: 1, y: 0, size: 'large' })
    })
  })

  describe('when the bot metadata carries a malformed overlay', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ overlay: { x: 'a' } })])
      renderProvider()
    })

    it('should still activate the presentation', () => {
      expect(current.isPresentationActive).toBe(true)
    })

    it('should fall back to the default overlay', () => {
      expect(current.state.overlay).toEqual(DEFAULT_OVERLAY)
    })
  })

  describe('when a presentation:state packet carries a valid overlay', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ overlay: { x: 1, y: 1, size: 'large' } }), bot)
    })

    it('should update the overlay', () => {
      expect(current.state.overlay).toEqual({ x: 1, y: 1, size: 'large' })
    })
  })

  describe('when a presentation:state packet has no overlay', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ overlay: { x: 1, y: 0, size: 'large' } })])
      renderProvider()
      deliver(statePacket(), bot)
    })

    it('should fall back to the default overlay', () => {
      expect(current.state.overlay).toEqual(DEFAULT_OVERLAY)
    })
  })

  describe('when setOverlay is called with an active presentation', () => {
    let resolvePublish: () => void
    let pending: Promise<void>

    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      publishData.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolvePublish = resolve
          })
      )
      act(() => {
        pending = current.setOverlay({ size: 'large' })
      })
    })

    afterEach(async () => {
      await act(async () => {
        resolvePublish()
        await pending
      })
    })

    it('should publish one overlay update command', () => {
      expect(publishData).toHaveBeenCalledTimes(1)
      expect(decodeCommsPacket(publishData.mock.calls[0][0])).toEqual({
        topic: 'presentation',
        data: { type: 'presentation:overlay:update', size: 'large' }
      })
    })

    it('should update the overlay before the command resolves', () => {
      expect(current.state.overlay.size).toBe('large')
    })
  })

  describe('when setOverlay is called without a presentation', () => {
    beforeEach(async () => {
      renderProvider()
      await act(async () => {
        await current.setOverlay({ size: 'large' })
      })
    })

    it('should not publish anything', () => {
      expect(publishData).not.toHaveBeenCalled()
    })
  })

  describe('when a local overlay change is held', () => {
    let view: ReturnType<typeof renderProvider>

    beforeEach(async () => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      view = renderProvider()
      await act(async () => {
        await current.setOverlay({ x: 0.5, y: 0.5 })
      })
    })

    describe('and a differing presentation:state packet arrives within the hold', () => {
      beforeEach(() => {
        now = HOLD_START + 500
        deliver(statePacket({ overlay: { x: 0.3, y: 0.3, size: 'small' } }), bot)
      })

      it('should keep the local overlay', () => {
        expect(current.state.overlay).toEqual({ x: 0.5, y: 0.5, size: 'small' })
      })

      describe('and then a matching packet arrives followed by a stale one', () => {
        beforeEach(() => {
          now = HOLD_START + 700
          deliver(statePacket({ overlay: { x: 0.5, y: 0.5, size: 'small' } }), bot)
          now = HOLD_START + 800
          deliver(statePacket({ overlay: { x: 0.3, y: 0.3, size: 'small' } }), bot)
        })

        it('should apply the matching packet and keep ignoring the stale one', () => {
          expect(current.state.overlay).toEqual({ x: 0.5, y: 0.5, size: 'small' })
        })
      })
    })

    describe('and a differing presentation:state packet arrives after the hold', () => {
      beforeEach(() => {
        now = HOLD_START + 1001
        deliver(statePacket({ overlay: { x: 0.3, y: 0.3, size: 'small' } }), bot)
      })

      it('should apply the incoming overlay', () => {
        expect(current.state.overlay).toEqual({ x: 0.3, y: 0.3, size: 'small' })
      })
    })

    describe('and differing bot metadata arrives within the hold', () => {
      beforeEach(() => {
        now = HOLD_START + 500
        mockUseRemoteParticipants.mockReturnValue([makeBot({ overlay: { x: 0.3, y: 0.3, size: 'small' } })])
        view.rerender(tree())
      })

      it('should keep the local overlay', () => {
        expect(current.state.overlay).toEqual({ x: 0.5, y: 0.5, size: 'small' })
      })
    })
  })

  describe('when a presentation upload succeeds', () => {
    beforeEach(async () => {
      ;(useGetPresentationBotTokenMutation as jest.Mock).mockReturnValue([
        () => ({ unwrap: () => Promise.resolve({ token: 'bot-token', url: 'wss://example.test' }) })
      ])
      ;(useUploadPresentationMutation as jest.Mock).mockReturnValue([
        () => ({ unwrap: () => Promise.resolve({ id: 'deck-2', slideCount: 5, currentSlide: 0, fileType: 'pdf' }) })
      ])
      renderProvider()
      await act(async () => {
        await current.startPresentation(new File(['deck'], 'deck.pdf'))
      })
    })

    it('should start with the default overlay', () => {
      expect(current.state).toEqual(expect.objectContaining({ status: 'starting', overlay: DEFAULT_OVERLAY }))
    })
  })

  describe('when the bot metadata carries the v2 composition fields', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ slide: SLIDE, presenterIdentity: 'stream:p:1', playingVideoIndex: 0 })])
      renderProvider()
    })

    it('should expose the slide, the presenter identity and the playing video index', () => {
      const { slide, presenterIdentity, playingVideoIndex } = current.state
      expect({ slide, presenterIdentity, playingVideoIndex }).toEqual({
        slide: SLIDE,
        presenterIdentity: 'stream:p:1',
        playingVideoIndex: 0
      })
    })
  })

  describe('when a presentation:state packet carries the v2 composition fields', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:p:1', playingVideoIndex: 0 }), bot)
    })

    it('should expose the slide, the presenter identity and the playing video index', () => {
      const { slide, presenterIdentity, playingVideoIndex } = current.state
      expect({ slide, presenterIdentity, playingVideoIndex }).toEqual({
        slide: SLIDE,
        presenterIdentity: 'stream:p:1',
        playingVideoIndex: 0
      })
    })
  })

  describe('when a presentation:state packet carries a slide with an empty url', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ currentSlide: 2, slide: { ...SLIDE, url: '' } }), bot)
    })

    it('should drop the slide', () => {
      expect(current.state.slide).toBeNull()
    })

    it('should still apply the rest of the packet', () => {
      expect(current.state.currentSlide).toBe(2)
    })
  })

  describe('when a presentation:state packet carries a slide with a zero width', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ slide: { ...SLIDE, width: 0 } }), bot)
    })

    it('should drop the slide', () => {
      expect(current.state.slide).toBeNull()
    })
  })

  describe('when a presentation:state packet carries a slide that is not an object', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ slide: 'slide.png' }), bot)
    })

    it('should drop the slide', () => {
      expect(current.state.slide).toBeNull()
    })
  })

  describe.each([-1, 1.5, '0'])('when a presentation:state packet carries the playing video index %p', index => {
    let playingVideoIndex: unknown

    beforeEach(() => {
      playingVideoIndex = index
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ playingVideoIndex }), bot)
    })

    it('should expose no playing video index', () => {
      expect(current.state.playingVideoIndex).toBeNull()
    })
  })

  describe('when a presentation:state packet carries a numeric presenter identity', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ presenterIdentity: 42 }), bot)
    })

    it('should expose no presenter identity', () => {
      expect(current.state.presenterIdentity).toBeNull()
    })
  })

  describe('when a presentation:state packet carries valid slide videos', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ slideVideos: [SLIDE_VIDEO] }), bot)
    })

    it('should expose the slide videos', () => {
      expect(current.state.slideVideos).toEqual([SLIDE_VIDEO])
    })
  })

  describe.each<[string, unknown]>([
    ['a list of non-video values', [null, {}, 'x']],
    ['a string', 'x'],
    ['a valid video followed by one with no url', [SLIDE_VIDEO, {}]],
    ['a valid video followed by one with a null geometry', [SLIDE_VIDEO, { url: 'u', geometry: null }]],
    ['a valid video followed by one with a string geometry', [SLIDE_VIDEO, { url: 'u', geometry: 'g' }]],
    [
      'a valid video followed by one with a non-numeric width',
      [SLIDE_VIDEO, { url: 'u', geometry: { ...SLIDE_VIDEO.geometry, width: '960' } }]
    ]
  ])('when a presentation:state packet carries slide videos that are %s', (_label, value) => {
    let slideVideos: unknown

    beforeEach(() => {
      slideVideos = value
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ slideVideos }), bot)
    })

    it('should expose no slide videos', () => {
      expect(current.state.slideVideos).toEqual([])
    })
  })

  describe('when the bot metadata carries valid slide videos', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ slideVideos: [SLIDE_VIDEO] })])
      renderProvider()
    })

    it('should expose the slide videos', () => {
      expect(current.state.slideVideos).toEqual([SLIDE_VIDEO])
    })
  })

  describe('when the bot metadata carries a valid slide video followed by a malformed one', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ slideVideos: [SLIDE_VIDEO, { url: 'u' }] })])
      renderProvider()
    })

    it('should expose no slide videos', () => {
      expect(current.state.slideVideos).toEqual([])
    })
  })

  describe('when the bot metadata reports a failed video', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ videoState: 'error', slideVideos: [SLIDE_VIDEO] })])
      renderProvider()
    })

    it('should keep the slide videos so the play control stays available', () => {
      expect(current.state.slideVideos).toEqual([SLIDE_VIDEO])
    })

    it('should expose the video as idle', () => {
      expect(current.state.videoState).toBe('idle')
    })
  })

  describe.each(['error', 'bogus', 42])('when a presentation:state packet carries the video state %p', value => {
    let videoState: unknown

    beforeEach(() => {
      videoState = value
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ videoState }), bot)
    })

    it('should expose the video as idle', () => {
      expect(current.state.videoState).toBe('idle')
    })
  })

  describe('when a presentation:state packet carries a video placed partly off the slide', () => {
    let offSlideVideo: typeof SLIDE_VIDEO

    beforeEach(() => {
      offSlideVideo = { url: 'https://presenter.test/edge.mp4', geometry: { x: -40, y: -10, width: 0, height: 120 } }
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ slideVideos: [SLIDE_VIDEO, offSlideVideo] }), bot)
    })

    it('should keep every slide video so the playing index still points at the right one', () => {
      expect(current.state.slideVideos).toEqual([SLIDE_VIDEO, offSlideVideo])
    })
  })

  describe('when a presentation:state packet has no file type', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket({ fileType: undefined, currentSlide: 2 }), bot)
    })

    it('should apply the packet', () => {
      expect(current.state.currentSlide).toBe(2)
    })

    it('should expose no file type', () => {
      expect(current.state.fileType).toBeNull()
    })
  })

  describe('when a presentation bot sends packets before its metadata arrives', () => {
    let pendingBot: FakeParticipant

    beforeEach(() => {
      pendingBot = { identity: 'presentation-bot:room:1', metadata: '' }
      mockUseRemoteParticipants.mockReturnValue([pendingBot])
      renderProvider()
      deliver(statePacket({ currentSlide: 2 }), pendingBot)
    })

    it('should apply the packet', () => {
      expect(current.state.currentSlide).toBe(2)
    })
  })

  describe('when a second presentation bot sends packets', () => {
    let otherBot: FakeParticipant

    beforeEach(() => {
      otherBot = { identity: 'presentation-bot:room:2', metadata: '' }
      mockUseRemoteParticipants.mockReturnValue([bot, otherBot])
      renderProvider()
    })

    describe('and the packet is a presentation:state', () => {
      beforeEach(() => {
        deliver(statePacket({ currentSlide: 2 }), otherBot)
      })

      it('should ignore it', () => {
        expect(current.state.currentSlide).toBe(0)
      })
    })

    describe('and the packet is a presentation:stopped', () => {
      beforeEach(() => {
        deliver(encodeCommsPacket('presentation', { type: 'presentation:stopped' }), otherBot)
      })

      it('should keep the presentation active', () => {
        expect(current.state.status).toBe('active')
      })
    })
  })

  describe('when a presentation:state packet comes from a legacy server', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(statePacket(), bot)
    })

    it('should expose the legacy state with every v2 field unset', () => {
      expect(current.state).toEqual({
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
      })
    })
  })

  describe('when the bot metadata is re-emitted during a local overlay hold', () => {
    let fields: Record<string, unknown>
    let previous: PresentationContextValue['state']

    const reEmitDuringHold = async () => {
      mockUseRemoteParticipants.mockReturnValue([makeBot(fields)])
      const view = renderProvider()
      await act(async () => {
        await current.setOverlay({ x: 0.5, y: 0.5 })
      })
      previous = current.state
      now = HOLD_START + 500
      mockUseRemoteParticipants.mockReturnValue([makeBot({ ...fields, overlay: { x: 0.3, y: 0.3, size: 'small' } })])
      view.rerender(tree())
    }

    describe('and it carries identical v2 composition fields', () => {
      beforeEach(async () => {
        fields = { slide: SLIDE, presenterIdentity: 'stream:p:1', playingVideoIndex: 0 }
        await reEmitDuringHold()
      })

      it('should keep the same state object', () => {
        expect(current.state).toBe(previous)
      })
    })

    describe('and it carries no v2 composition fields', () => {
      beforeEach(async () => {
        fields = {}
        await reEmitDuringHold()
      })

      it('should keep the same state object', () => {
        expect(current.state).toBe(previous)
      })
    })
  })

  describe('when a streamer identity claims the presentation role in its metadata', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([
        {
          identity: 'stream:x:1',
          metadata: JSON.stringify({
            role: 'presentation',
            id: 'deck-1',
            slideCount: 3,
            currentSlide: 0,
            fileType: 'pdf',
            slide: SLIDE,
            presenterIdentity: 'stream:x:1'
          })
        }
      ])
      renderProvider()
    })

    it('should not treat it as the presentation bot', () => {
      expect(current.presentationParticipantIdentity).toBeNull()
    })
  })

  describe('when a presentation upload runs', () => {
    let uploadPresentation: jest.Mock
    let uploadPresentationFromUrl: jest.Mock

    beforeEach(() => {
      uploadPresentation = jest.fn(() => ({ unwrap: () => Promise.resolve(PRESENTATION_INFO) }))
      uploadPresentationFromUrl = jest.fn(() => ({ unwrap: () => Promise.resolve(PRESENTATION_INFO) }))
      ;(useGetPresentationBotTokenMutation as jest.Mock).mockReturnValue([
        () => ({ unwrap: () => Promise.resolve({ token: 'bot-token', url: 'wss://example.test' }) })
      ])
      ;(useUploadPresentationMutation as jest.Mock).mockReturnValue([uploadPresentation])
      ;(useUploadPresentationFromUrlMutation as jest.Mock).mockReturnValue([uploadPresentationFromUrl])
    })

    describe('and it uploads a file', () => {
      beforeEach(async () => {
        renderProvider()
        await act(async () => {
          await current.startPresentation(new File(['deck'], 'deck.pdf'))
        })
      })

      it('should send the local participant identity as the presenter identity', () => {
        expect(uploadPresentation).toHaveBeenCalledWith(expect.objectContaining({ presenterIdentity: 'stream:p:1' }))
      })

      it('should start with every v2 field unset', () => {
        const { slide, presenterIdentity, playingVideoIndex } = current.state
        expect({ slide, presenterIdentity, playingVideoIndex }).toEqual({ slide: null, presenterIdentity: null, playingVideoIndex: null })
      })
    })

    describe('and it uploads from a URL', () => {
      beforeEach(async () => {
        renderProvider()
        await act(async () => {
          await current.startPresentationFromUrl('https://docs.test/deck.pdf')
        })
      })

      it('should send the local participant identity as the presenter identity', () => {
        expect(uploadPresentationFromUrl).toHaveBeenCalledWith(expect.objectContaining({ presenterIdentity: 'stream:p:1' }))
      })
    })

    describe('and the local participant has no identity yet', () => {
      beforeEach(async () => {
        mockUseRoomContext.mockReturnValue(makeRoom(''))
        renderProvider()
        await act(async () => {
          await current.startPresentation(new File(['deck'], 'deck.pdf'))
        })
      })

      it('should omit the presenter identity', () => {
        expect(uploadPresentation.mock.calls[0][0].presenterIdentity).toBeUndefined()
      })
    })
  })

  describe('when a presenter client sees an orphaned presenterIdentity', () => {
    let view: ReturnType<typeof renderProvider>

    beforeEach(() => {
      mockUseRoomContext.mockReturnValue(makeRoom('stream:new'))
    })

    describe('and the presenter identity left the room', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([bot])
        view = render(controllerTree())
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:old' }), bot)
      })

      it('should send exactly one presenter claim', () => {
        expect(claimCount()).toBe(1)
      })

      describe('and the provider re-renders and the same packet repeats', () => {
        beforeEach(() => {
          view.rerender(controllerTree())
          deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:old' }), bot)
        })

        it('should not send another claim', () => {
          expect(claimCount()).toBe(1)
        })
      })

      describe('and the server re-points it at the local identity', () => {
        beforeEach(() => {
          deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:new' }), bot)
        })

        it('should not send another claim', () => {
          expect(claimCount()).toBe(1)
        })
      })

      describe('and the server re-points it at another absent identity', () => {
        beforeEach(() => {
          deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:other' }), bot)
        })

        it('should send a second claim', () => {
          expect(claimCount()).toBe(2)
        })
      })
    })

    describe('and the presenter identity is null', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([bot])
        render(controllerTree())
        deliver(statePacket({ slide: SLIDE, presenterIdentity: null }), bot)
      })

      it('should send one presenter claim', () => {
        expect(claimCount()).toBe(1)
      })
    })

    describe('and the presenter identity is a remote participant', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([bot, { identity: 'stream:other', metadata: '' }])
        view = render(controllerTree())
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:other' }), bot)
      })

      it('should not send a presenter claim', () => {
        expect(claimCount()).toBe(0)
      })

      describe('and that participant then leaves the room', () => {
        beforeEach(() => {
          mockUseRemoteParticipants.mockReturnValue([bot])
          view.rerender(controllerTree())
        })

        it('should send exactly one presenter claim', () => {
          expect(claimCount()).toBe(1)
        })
      })
    })

    describe('and the claim fails to send', () => {
      beforeEach(async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        publishData.mockRejectedValueOnce(new Error('data channel closed'))
        mockUseRemoteParticipants.mockReturnValue([bot])
        view = render(controllerTree())
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:old' }), bot)
        await act(async () => {})
      })

      describe('and the provider re-renders with the same orphaned presenter identity', () => {
        beforeEach(() => {
          mockUseRemoteParticipants.mockReturnValue([bot])
          view.rerender(controllerTree())
        })

        it('should send the claim again', () => {
          expect(claimCount()).toBe(2)
        })
      })
    })

    describe('and a claim fails after the server re-pointed it at another absent identity', () => {
      let rejectFirstClaim: (error: Error) => void

      beforeEach(async () => {
        jest.spyOn(console, 'warn').mockImplementation(() => undefined)
        publishData.mockImplementationOnce(
          () =>
            new Promise<void>((_resolve, reject) => {
              rejectFirstClaim = reject
            })
        )
        mockUseRemoteParticipants.mockReturnValue([bot])
        view = render(controllerTree())
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:old' }), bot)
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:other' }), bot)
        await act(async () => {
          rejectFirstClaim(new Error('data channel closed'))
        })
        mockUseRemoteParticipants.mockReturnValue([bot])
        view.rerender(controllerTree())
      })

      it('should not claim the current identity again', () => {
        expect(claimCount()).toBe(2)
      })
    })

    describe('and the presenter identity is the local participant', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([bot])
        render(controllerTree())
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:new' }), bot)
      })

      it('should not send a presenter claim', () => {
        expect(claimCount()).toBe(0)
      })
    })

    describe('and the state has no slide', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([bot])
        render(controllerTree())
        deliver(statePacket({ presenterIdentity: null }), bot)
      })

      it('should not send a presenter claim', () => {
        expect(claimCount()).toBe(0)
      })
    })

    describe('and the provider is rendered without canControl', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([bot])
        renderProvider()
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:old' }), bot)
      })

      it('should not send a presenter claim', () => {
        expect(claimCount()).toBe(0)
      })
    })
  })

  describe.each<[string, (value: PresentationContextValue) => Promise<void>, Record<string, unknown>]>([
    ['navigateSlide', value => value.navigateSlide('next'), { type: 'presentation:navigate', action: 'next' }],
    ['goToSlide', value => value.goToSlide(2), { type: 'presentation:navigate', action: 'goto', slideIndex: 2 }],
    ['playVideo', value => value.playVideo(1), { type: 'presentation:video:play', videoIndex: 1 }],
    ['pauseVideo', value => value.pauseVideo(), { type: 'presentation:video:pause' }],
    ['stopVideo', value => value.stopVideo(), { type: 'presentation:video:stop' }],
    ['stopPresentation', value => value.stopPresentation(), { type: 'presentation:stop' }]
  ])('when %s is called', (_name, invoke, expected) => {
    describe('and a presentation is active', () => {
      beforeEach(async () => {
        mockUseRemoteParticipants.mockReturnValue([bot])
        renderProvider()
        await act(async () => {
          await invoke(current)
        })
      })

      it('should publish the command to the presentation topic', () => {
        expect(sentCommands()).toEqual([expected])
      })
    })

    describe('and there is no presentation', () => {
      beforeEach(async () => {
        renderProvider()
        await act(async () => {
          await invoke(current)
        })
      })

      it('should not publish anything', () => {
        expect(publishData).not.toHaveBeenCalled()
      })
    })

    describe('and the room has no local participant', () => {
      beforeEach(async () => {
        mockUseRoomContext.mockReturnValue({ localParticipant: undefined, on: jest.fn(), off: jest.fn() })
        mockUseRemoteParticipants.mockReturnValue([bot])
        renderProvider()
        await act(async () => {
          await invoke(current)
        })
      })

      it('should not publish anything', () => {
        expect(publishData).not.toHaveBeenCalled()
      })
    })
  })

  describe('when there is no room', () => {
    beforeEach(() => {
      mockUseRoomContext.mockReturnValue(undefined)
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
    })

    it('should still apply the bot metadata', () => {
      expect(current.state.id).toBe('deck-1')
    })

    it('should not subscribe to room data', () => {
      expect(dataHandler).toBeUndefined()
    })
  })

  describe('when the followed bot sends presentation:stopped', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(encodeCommsPacket('presentation', { type: 'presentation:stopped' }), bot)
    })

    it('should reset the presentation state', () => {
      expect(current.state).toEqual(expect.objectContaining({ id: null, status: 'idle', slideCount: 0 }))
    })

    it('should report the presentation as inactive', () => {
      expect(current.isPresentationActive).toBe(false)
    })
  })

  describe('when a packet arrives on another topic', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      deliver(encodeCommsPacket('chat', { type: 'presentation:stopped' }), bot)
    })

    it('should ignore it', () => {
      expect(current.state.status).toBe('active')
    })
  })

  describe('when a packet arrives without a participant', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
      act(() => {
        dataHandler?.(encodeCommsPacket('presentation', { type: 'presentation:stopped' }))
      })
    })

    it('should ignore it', () => {
      expect(current.state.status).toBe('active')
    })
  })

  describe('when the followed bot sends a presentation:error', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      renderProvider()
    })

    describe('and the code is retryable and it names a video', () => {
      beforeEach(() => {
        deliver(errorPacket({ videoIndex: 2, videoUrl: 'https://presenter.test/video.mp4' }), bot)
      })

      it('should show a video playback failure with a retry action', () => {
        expect(mockShow).toHaveBeenCalledWith('VideoPlaybackFailed', {
          message: 'Video timed out',
          code: 'video-timeout',
          action: { label: 'notifications.retry', onClick: expect.any(Function) }
        })
      })

      describe('and the retry action is clicked', () => {
        beforeEach(async () => {
          const [, { action }] = mockShow.mock.calls[0] as [string, { action: { onClick: () => void } }]
          await act(async () => {
            action.onClick()
          })
        })

        it('should ask the bot to play that video again', () => {
          expect(sentCommands()).toEqual([{ type: 'presentation:video:play', videoIndex: 2 }])
        })
      })
    })

    describe('and the code is not retryable', () => {
      beforeEach(() => {
        deliver(errorPacket({ code: 'video-not-found', message: 'Video not found', videoIndex: 2 }), bot)
      })

      it('should show a video playback failure without an action', () => {
        expect(mockShow).toHaveBeenCalledWith('VideoPlaybackFailed', {
          message: 'Video not found',
          code: 'video-not-found',
          action: undefined
        })
      })
    })

    describe('and the code is retryable but it names no video', () => {
      beforeEach(() => {
        deliver(errorPacket(), bot)
      })

      it('should show a video playback failure without an action', () => {
        expect(mockShow).toHaveBeenCalledWith('VideoPlaybackFailed', {
          message: 'Video timed out',
          code: 'video-timeout',
          action: undefined
        })
      })
    })

    describe.each<[string, Record<string, unknown>]>([
      ['a numeric code', { code: 42 }],
      ['a numeric message', { message: 42 }],
      ['a string video index', { videoIndex: '2' }],
      ['a numeric video url', { videoUrl: 42 }]
    ])('and it carries %s', (_label, extra) => {
      beforeEach(() => {
        deliver(errorPacket(extra), bot)
      })

      it('should not show a notification', () => {
        expect(mockShow).not.toHaveBeenCalled()
      })
    })
  })

  describe('when the bot metadata has no presentation id', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([makeBot({ id: undefined })])
      renderProvider()
    })

    it('should ask the bot for its state', () => {
      expect(sentCommands()).toEqual([{ type: 'presentation:get-state' }])
    })

    it('should follow the bot', () => {
      expect(current.presentationParticipantIdentity).toBe('presentation-bot:room:1')
    })
  })

  describe('when the bot leaves while the presentation is active', () => {
    beforeEach(() => {
      mockUseRemoteParticipants.mockReturnValue([bot])
      const view = renderProvider()
      mockUseRemoteParticipants.mockReturnValue([])
      view.rerender(tree())
    })

    it('should reset the presentation state', () => {
      expect(current.state).toEqual(expect.objectContaining({ id: null, status: 'idle' }))
    })
  })

  describe('when a presentation upload is requested', () => {
    let getPresentationBotToken: jest.Mock
    let uploadPresentation: jest.Mock
    let uploadPresentationFromUrl: jest.Mock

    beforeEach(() => {
      getPresentationBotToken = jest.fn(() => ({ unwrap: () => Promise.resolve({ token: 'bot-token', url: 'wss://example.test' }) }))
      uploadPresentation = jest.fn(() => ({ unwrap: () => Promise.resolve(PRESENTATION_INFO) }))
      uploadPresentationFromUrl = jest.fn(() => ({ unwrap: () => Promise.resolve(PRESENTATION_INFO) }))
      ;(useGetPresentationBotTokenMutation as jest.Mock).mockReturnValue([getPresentationBotToken])
      ;(useUploadPresentationMutation as jest.Mock).mockReturnValue([uploadPresentation])
      ;(useUploadPresentationFromUrlMutation as jest.Mock).mockReturnValue([uploadPresentationFromUrl])
    })

    describe('and another upload is already running', () => {
      let resolveToken: (token: { token: string; url: string }) => void

      beforeEach(async () => {
        getPresentationBotToken.mockImplementation(() => ({
          unwrap: () =>
            new Promise(resolve => {
              resolveToken = resolve
            })
        }))
        renderProvider()
        let first: Promise<void> = Promise.resolve()
        act(() => {
          first = current.startPresentation(new File(['deck'], 'deck.pdf'))
        })
        await act(async () => {
          await current.startPresentationFromUrl('https://docs.test/deck.pdf')
        })
        await act(async () => {
          resolveToken({ token: 'bot-token', url: 'wss://example.test' })
          await first
        })
      })

      it('should request a single bot token', () => {
        expect(getPresentationBotToken).toHaveBeenCalledTimes(1)
      })

      it('should not run the second upload', () => {
        expect(uploadPresentationFromUrl).not.toHaveBeenCalled()
      })
    })

    describe('and there is no stored streaming key', () => {
      beforeEach(async () => {
        mockGetStreamerToken.mockReturnValue(null)
        renderProvider()
        await act(async () => {
          await current.startPresentation(new File(['deck'], 'deck.pdf'))
        })
      })

      it('should show a persistent download failure', () => {
        expect(mockShow).toHaveBeenCalledWith('PresentationDownloadFailed', { message: 'No streaming key available', persistent: true })
      })

      it('should not request a bot token', () => {
        expect(getPresentationBotToken).not.toHaveBeenCalled()
      })

      it('should go back to idle', () => {
        expect(current.state.status).toBe('idle')
      })
    })

    describe.each<[string, (value: PresentationContextValue) => Promise<void>, string]>([
      ['a file upload', value => value.startPresentation(new File(['deck'], 'deck.pdf')), 'Failed to start presentation'],
      ['a URL upload', value => value.startPresentationFromUrl('https://docs.test/deck.pdf'), 'Failed to start presentation from URL']
    ])('and %s rejects with a non-Error value', (_label, invoke, expectedMessage) => {
      beforeEach(async () => {
        uploadPresentation.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        uploadPresentationFromUrl.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        renderProvider()
        await act(async () => {
          await invoke(current)
        })
      })

      it('should show a persistent download failure with the generic label', () => {
        expect(mockShow).toHaveBeenCalledWith('PresentationDownloadFailed', { message: expectedMessage, persistent: true })
      })
    })

    describe('and the bot reports an active presentation before it finishes', () => {
      beforeEach(async () => {
        let resolveUpload: (info: typeof PRESENTATION_INFO) => void = () => undefined
        uploadPresentation.mockReturnValue({
          unwrap: () =>
            new Promise(resolve => {
              resolveUpload = resolve
            })
        })
        mockUseRemoteParticipants.mockReturnValue([makeBot({ id: undefined })])
        renderProvider()
        let pending: Promise<void> = Promise.resolve()
        await act(async () => {
          pending = current.startPresentation(new File(['deck'], 'deck.pdf'))
        })
        deliver(statePacket(), bot)
        await act(async () => {
          resolveUpload(PRESENTATION_INFO)
          await pending
        })
      })

      it('should keep the active state reported by the bot', () => {
        expect(current.state).toEqual(expect.objectContaining({ id: 'deck-1', status: 'active' }))
      })
    })
  })
})

describe('when usePresentation is used outside a PresentationProvider', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('should throw', () => {
    expect(() => renderHook(() => usePresentation())).toThrow('usePresentation must be used within PresentationProvider')
  })
})

describe('when usePresentationOptional is used outside a PresentationProvider', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should return null', () => {
    expect(renderHook(() => usePresentationOptional()).result.current).toBeNull()
  })
})
