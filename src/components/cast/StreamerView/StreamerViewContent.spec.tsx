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
  ParticipantGrid: () => React.createElement('div', { 'data-testid': 'participant-grid' })
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
      mockUsePresentationOptional.mockReturnValue({ isPresentationActive: true })
      renderPastInitGrace()
    })

    it('should render the participant grid', () => {
      expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
    })

    it('should not render the empty stream state', () => {
      expect(screen.queryByTestId('empty-stream-state')).not.toBeInTheDocument()
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
