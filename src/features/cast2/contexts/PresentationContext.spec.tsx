import { useRemoteParticipants, useRoomContext } from '@livekit/components-react'
import { act, render } from '@testing-library/react'
import { useGetPresentationBotTokenMutation, useUploadPresentationFromUrlMutation, useUploadPresentationMutation } from '../cast2.client'
import { isPresentationBot } from '../cast2.utils'
import { decodeCommsPacket, encodeCommsPacket } from '../commsProtocol'
import { type PresentationContextValue, PresentationProvider, usePresentation } from './PresentationContext'

jest.mock('@livekit/components-react', () => ({ useRemoteParticipants: jest.fn(), useRoomContext: jest.fn() }))
jest.mock('../cast2.client', () => ({
  useGetPresentationBotTokenMutation: jest.fn(),
  useUploadPresentationMutation: jest.fn(),
  useUploadPresentationFromUrlMutation: jest.fn()
}))
jest.mock('../cast2.utils', () => ({
  ...jest.requireActual('../cast2.utils'),
  isPresentationBot: jest.fn(),
  getStreamerToken: () => 'streaming-key'
}))
jest.mock('./NotificationContext', () => ({
  useNotifications: () => ({ show: jest.fn(), dismiss: jest.fn(), notifications: [] })
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

const SLIDE = { url: 'https://presenter.test/presentations/deck-1/slides/0f3a.png', width: 1920, height: 1080 }
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
        render(controllerTree())
        deliver(statePacket({ slide: SLIDE, presenterIdentity: 'stream:other' }), bot)
      })

      it('should not send a presenter claim', () => {
        expect(claimCount()).toBe(0)
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
})
