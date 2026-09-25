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
  identity: 'presentation-bot',
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

const renderProvider = () => render(tree())

const deliver = (payload: Uint8Array, participant: FakeParticipant) => {
  act(() => {
    dataHandler?.(payload, participant)
  })
}

describe('PresentationProvider', () => {
  let bot: FakeParticipant

  beforeEach(() => {
    now = HOLD_START
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    bot = makeBot()
    dataHandler = undefined
    publishData = jest.fn().mockResolvedValue(undefined)
    const room = {
      localParticipant: { publishData },
      on: jest.fn((_event: string, handler: DataHandler) => {
        dataHandler = handler
      }),
      off: jest.fn()
    }
    mockUseRoomContext.mockReturnValue(room)
    mockUseRemoteParticipants.mockReturnValue([])
    mockIsPresentationBot.mockImplementation((participant: FakeParticipant) => participant.identity === 'presentation-bot')
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
})
