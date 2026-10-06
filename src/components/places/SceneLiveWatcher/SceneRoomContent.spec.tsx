import { render, screen } from '@testing-library/react'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { SceneRoomContent } from './SceneRoomContent'

const mockUseTracks = jest.fn()
const mockUseRemoteParticipants = jest.fn()

jest.mock('@livekit/components-react', () => ({
  useTracks: () => mockUseTracks(),
  useRemoteParticipants: () => mockUseRemoteParticipants()
}))
jest.mock('livekit-client', () => ({
  Track: { Source: { Camera: 'camera', ScreenShare: 'screen_share' } }
}))
jest.mock('../../cast/ParticipantGrid/ParticipantGrid', () => ({
  ParticipantGrid: ({ localParticipantVisible }: { localParticipantVisible: boolean }) => (
    <div data-testid="participant-grid" data-local-visible={String(localParticipantVisible)} />
  )
}))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentationOptional: jest.fn() }))
jest.mock('../../cast/PresentationStage/PresentationStage', () => ({
  PresentationStage: () => <div data-testid="presentation-stage" />
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id?: string | null, values?: Record<string, unknown>) =>
    values && 'count' in values ? `${id}:${String(values.count)}` : id ?? ''
}))
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    dclColors: {
      ...actual.dclColors,
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

const mockUsePresentationOptional = usePresentationOptional as jest.Mock

describe('when rendering the scene room content', () => {
  beforeEach(() => {
    mockUseRemoteParticipants.mockReturnValue([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each([
    ['any remote participant publishes active video', null],
    ['a legacy presentation is live with active video', { state: { slide: null } }]
  ])('and %s', (_, presentation) => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue(presentation)
      mockUseTracks.mockReturnValue([{ publication: { isMuted: false } }])
      render(<SceneRoomContent />)
    })

    it('should render the participant grid without the local participant', () => {
      expect(screen.getByTestId('participant-grid')).toHaveAttribute('data-local-visible', 'false')
    })
  })

  describe('and a client-composed presentation is live without any track', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue({
        state: { slide: { url: 'https://presenter.test/presentations/p1/slides/ab12.png', width: 1920, height: 1080 } }
      })
      mockUseTracks.mockReturnValue([])
      render(<SceneRoomContent />)
    })

    it('should render the presentation stage', () => {
      expect(screen.getByTestId('presentation-stage')).toBeInTheDocument()
    })
  })

  describe('and every published track is muted', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue(null)
      mockUseTracks.mockReturnValue([{ publication: { isMuted: true } }])
      mockUseRemoteParticipants.mockReturnValue([{ identity: '0x1' }, { identity: '0x2' }])
      render(<SceneRoomContent />)
    })

    it('should render the waiting placeholder with the participant count', () => {
      expect(screen.getByText('discover.scene.waiting.title')).toBeInTheDocument()
      expect(screen.getByText('discover.scene.waiting.hint:2')).toBeInTheDocument()
    })
  })
})
