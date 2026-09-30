import React from 'react'
import { useConnectionState, useLocalParticipant } from '@livekit/components-react'
import { act, render, screen } from '@testing-library/react'
import { ConnectionState } from 'livekit-client'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { useLocalVideoTracks } from '../../../hooks/useLocalVideoTracks'
import { StreamerViewContent } from './StreamerViewContent'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({ useConnectionState: jest.fn(), useLocalParticipant: jest.fn() }))
jest.mock('../../../hooks/useLocalVideoTracks', () => ({ useLocalVideoTracks: jest.fn() }))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentationOptional: jest.fn() }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('../ParticipantGrid/ParticipantGrid', () => ({
  ParticipantGrid: ({ presentationOverlay }: { presentationOverlay?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'participant-grid' }, presentationOverlay)
}))
jest.mock('../PresentationStage/PresentationStage', () => ({
  PresentationStage: ({ overlay }: { overlay?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'presentation-stage' }, overlay)
}))
jest.mock('../CameraOverlayHandle/CameraOverlayHandle', () => ({
  CameraOverlayHandle: () => React.createElement('div', { 'data-testid': 'camera-overlay-handle' })
}))
jest.mock('../LiveKitEnhancements/EmptyStreamState', () => ({
  EmptyStreamState: ({ message }: { message: string }) => React.createElement('div', { 'data-testid': 'empty-stream-state' }, message)
}))
jest.mock('../LiveStreamCounter/LiveStreamCounter', () => ({
  LiveStreamCounter: () => React.createElement('div', { 'data-testid': 'live-stream-counter' })
}))

const mockUseConnectionState = useConnectionState as jest.Mock
const mockUseLocalParticipant = useLocalParticipant as jest.Mock
const mockUseLocalVideoTracks = useLocalVideoTracks as jest.Mock
const mockUsePresentationOptional = usePresentationOptional as jest.Mock

const renderPastInitGrace = () => {
  const view = render(<StreamerViewContent />)
  act(() => {
    jest.advanceTimersByTime(2000)
  })
  return view
}

describe('StreamerViewContent', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUseConnectionState.mockReturnValue(ConnectionState.Connected)
    mockUseLocalParticipant.mockReturnValue({ localParticipant: { identity: '0xabc' } })
    mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: false })
    mockUsePresentationOptional.mockReturnValue(null)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when the camera is off and there is no presentation', () => {
    beforeEach(() => {
      renderPastInitGrace()
    })

    it('should render the empty stream state', () => {
      expect(screen.getByText('empty_state.streamer_action')).toBeInTheDocument()
    })

    it('should not render the participant grid', () => {
      expect(screen.queryByTestId('participant-grid')).not.toBeInTheDocument()
    })
  })

  describe('when the camera is off and a presentation is active', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue({ isPresentationActive: true, state: { slide: null, presenterIdentity: null } })
      renderPastInitGrace()
    })

    it('should render the participant grid', () => {
      expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
    })

    it('should not render the empty stream state', () => {
      expect(screen.queryByTestId('empty-stream-state')).not.toBeInTheDocument()
    })

    it('should not pass the camera overlay handle to the grid', () => {
      expect(screen.queryByTestId('camera-overlay-handle')).not.toBeInTheDocument()
    })
  })

  describe('when the camera is on and a presentation is active', () => {
    beforeEach(() => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
      mockUsePresentationOptional.mockReturnValue({ isPresentationActive: true, state: { slide: null, presenterIdentity: null } })
      renderPastInitGrace()
    })

    it('should pass the camera overlay handle to the grid', () => {
      expect(screen.getByTestId('participant-grid')).toContainElement(screen.getByTestId('camera-overlay-handle'))
    })
  })

  describe('when the presentation is client-composed', () => {
    let presenterIdentity: string | null

    beforeEach(() => {
      presenterIdentity = '0xabc'
      mockUsePresentationOptional.mockImplementation(() => ({
        isPresentationActive: true,
        state: { slide: { url: 'https://presenter.test/presentations/p1/slides/ab12.png', width: 1920, height: 1080 }, presenterIdentity }
      }))
    })

    describe('and the local participant presents with the camera on', () => {
      beforeEach(() => {
        mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
        renderPastInitGrace()
      })

      it('should render the camera overlay handle on the presentation stage', () => {
        expect(screen.getByTestId('presentation-stage')).toContainElement(screen.getByTestId('camera-overlay-handle'))
      })

      it('should not render the participant grid', () => {
        expect(screen.queryByTestId('participant-grid')).not.toBeInTheDocument()
      })
    })

    describe('and another participant presents', () => {
      beforeEach(() => {
        presenterIdentity = '0xdef'
        mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
        renderPastInitGrace()
      })

      it('should render the presentation stage without the camera overlay handle', () => {
        expect(screen.getByTestId('presentation-stage')).toBeInTheDocument()
        expect(screen.queryByTestId('camera-overlay-handle')).not.toBeInTheDocument()
      })
    })

    describe('and the local camera is off', () => {
      beforeEach(() => {
        renderPastInitGrace()
      })

      it('should render the presentation stage without the camera overlay handle', () => {
        expect(screen.getByTestId('presentation-stage')).toBeInTheDocument()
        expect(screen.queryByTestId('camera-overlay-handle')).not.toBeInTheDocument()
      })

      it('should not render the empty stream state', () => {
        expect(screen.queryByTestId('empty-stream-state')).not.toBeInTheDocument()
      })
    })
  })

  describe('when a legacy presentation is active', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue({ isPresentationActive: true, state: { slide: null, presenterIdentity: '0xabc' } })
      renderPastInitGrace()
    })

    it('should not render the presentation stage', () => {
      expect(screen.queryByTestId('presentation-stage')).not.toBeInTheDocument()
    })
  })

  describe('when the camera is on', () => {
    beforeEach(() => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
      renderPastInitGrace()
    })

    it('should render the participant grid', () => {
      expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
    })

    it('should not pass the camera overlay handle without a presentation', () => {
      expect(screen.queryByTestId('camera-overlay-handle')).not.toBeInTheDocument()
    })
  })

  describe('when the room is still connecting', () => {
    beforeEach(() => {
      mockUseConnectionState.mockReturnValue(ConnectionState.Connecting)
      render(<StreamerViewContent />)
    })

    it('should render the initialising state', () => {
      expect(screen.getByText('empty_state.camera_initializing')).toBeInTheDocument()
    })
  })

  describe('when the connection drops after initialising', () => {
    beforeEach(() => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
      const view = render(<StreamerViewContent />)
      mockUseConnectionState.mockReturnValue(ConnectionState.Disconnected)
      view.rerender(<StreamerViewContent />)
    })

    it('should keep the participant grid while the camera is live', () => {
      expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
    })
  })
})
