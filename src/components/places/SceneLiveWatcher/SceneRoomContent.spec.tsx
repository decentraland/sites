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

// Run the real SceneLiveWatcher.styled.ts through the shared styled shim
// instead of the emotion engine (decentraland-ui2 ships ESM Jest can't
// transform).
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    ...actual,
    Typography: actual.Box,
    dclColors: {
      base: { primary: '#ff2d55', primaryDark1: '#e6284c' },
      neutral: { softWhite: '#fcfcfc', gray3: '#a09ba8', gray5: '#ecebed', softBlack1: '#161518', white: '#ffffff' },
      blackTransparent: { backdrop: 'rgba(0,0,0,0.6)', blurry: 'rgba(0,0,0,0.4)' },
      whiteTransparent: { blurry: 'rgba(255,255,255,0.2)', subtle: 'rgba(255,255,255,0.1)' }
    }
  }
})

const mockUsePresentationOptional = usePresentationOptional as jest.Mock

describe('SceneRoomContent', () => {
  beforeEach(() => {
    mockUseTracks.mockReturnValue([])
    mockUseRemoteParticipants.mockReturnValue([])
    mockUsePresentationOptional.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when any remote participant publishes active video', () => {
    beforeEach(() => {
      mockUseTracks.mockReturnValue([{ publication: { isMuted: false } }])
    })

    it('should render the participant grid without the local participant', () => {
      render(<SceneRoomContent />)

      expect(screen.getByTestId('participant-grid')).toHaveAttribute('data-local-visible', 'false')
    })
  })

  describe('when a client-composed presentation is live without any track', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue({
        state: { slide: { url: 'https://presenter.test/presentations/p1/slides/ab12.png', width: 1920, height: 1080 } }
      })
    })

    it('should render the presentation stage instead of the waiting placeholder', () => {
      render(<SceneRoomContent />)

      expect(screen.getByTestId('presentation-stage')).toBeInTheDocument()
      expect(screen.queryByText('discover.scene.waiting.title')).not.toBeInTheDocument()
    })
  })

  describe('when a legacy presentation is live with active video', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue({ state: { slide: null } })
      mockUseTracks.mockReturnValue([{ publication: { isMuted: false } }])
    })

    it('should render the participant grid', () => {
      render(<SceneRoomContent />)

      expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
    })
  })

  describe('when every published track is muted', () => {
    beforeEach(() => {
      mockUseTracks.mockReturnValue([{ publication: { isMuted: true } }])
      mockUseRemoteParticipants.mockReturnValue([{ identity: '0x1' }, { identity: '0x2' }])
    })

    it('should render the waiting placeholder with the participant count', () => {
      render(<SceneRoomContent />)

      expect(screen.getByText('discover.scene.waiting.title')).toBeInTheDocument()
      expect(screen.getByText('discover.scene.waiting.hint:2')).toBeInTheDocument()
      expect(screen.queryByTestId('participant-grid')).not.toBeInTheDocument()
    })
  })
})
