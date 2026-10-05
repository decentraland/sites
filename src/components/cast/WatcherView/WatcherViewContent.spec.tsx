import React from 'react'
import { useRemoteParticipants } from '@livekit/components-react'
import { render, screen } from '@testing-library/react'
import { Track } from 'livekit-client'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { WatcherViewContent } from './WatcherViewContent'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({ useRemoteParticipants: jest.fn() }))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentationOptional: jest.fn() }))
jest.mock('../../../features/cast2/cast2.utils', () => ({
  ...jest.requireActual('../../../features/cast2/cast2.utils'),
  getDisplayName: (participant: { identity: string }) => participant.identity
}))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('../ParticipantGrid/ParticipantGrid', () => ({
  ParticipantGrid: () => React.createElement('div', { 'data-testid': 'participant-grid' })
}))
jest.mock('../PresentationStage/PresentationStage', () => ({
  PresentationStage: () => React.createElement('div', { 'data-testid': 'presentation-stage' })
}))
jest.mock('../LiveKitEnhancements/EmptyStreamState', () => ({
  EmptyStreamState: ({ message, participantName }: { message: string; participantName?: string }) =>
    React.createElement('div', { 'data-testid': 'empty-stream-state', 'data-participant': participantName }, message)
}))
jest.mock('../LiveStreamCounter/LiveStreamCounter', () => ({
  LiveStreamCounter: () => React.createElement('div', { 'data-testid': 'live-stream-counter' })
}))

const mockUseRemoteParticipants = useRemoteParticipants as jest.Mock
const mockUsePresentationOptional = usePresentationOptional as jest.Mock

type Publication = { source: Track.Source; track?: object; isMuted: boolean }

const participant = (identity: string, metadata: string, publications: Publication[] = []) => ({
  identity,
  metadata,
  videoTrackPublications: new Map(publications.map((publication, index) => [`${identity}-${index}`, publication]))
})

const STREAMER_METADATA = JSON.stringify({ role: 'streamer' })

describe('WatcherViewContent', () => {
  beforeEach(() => {
    mockUseRemoteParticipants.mockReturnValue([])
    mockUsePresentationOptional.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a client-composed presentation is live without any streamer', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue({
        state: { slide: { url: 'https://presenter.test/presentations/p1/slides/ab12.png', width: 1920, height: 1080 } }
      })
      render(<WatcherViewContent />)
    })

    it('should render the presentation stage', () => {
      expect(screen.getByTestId('presentation-stage')).toBeInTheDocument()
    })

    it('should keep the live stream counter', () => {
      expect(screen.getByTestId('live-stream-counter')).toBeInTheDocument()
    })

    it('should not render the watcher empty state', () => {
      expect(screen.queryByTestId('empty-stream-state')).not.toBeInTheDocument()
    })
  })

  describe('when a legacy presentation is live without any streamer', () => {
    beforeEach(() => {
      mockUsePresentationOptional.mockReturnValue({ state: { slide: null } })
      render(<WatcherViewContent />)
    })

    it('should render the watcher empty state', () => {
      expect(screen.getByText('empty_state.watcher_message')).toBeInTheDocument()
    })
  })

  describe('when there is no presentation provider', () => {
    describe('and no streamer is connected', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([participant('0xviewer', '')])
        render(<WatcherViewContent />)
      })

      it('should render the watcher empty state', () => {
        expect(screen.getByText('empty_state.watcher_message')).toBeInTheDocument()
      })

      it('should not render the presentation stage', () => {
        expect(screen.queryByTestId('presentation-stage')).not.toBeInTheDocument()
      })
    })

    describe('and a participant carries unreadable metadata', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([participant('0xbroken', '{not json')])
        render(<WatcherViewContent />)
      })

      it('should not count it as a streamer', () => {
        expect(screen.getByText('empty_state.watcher_message')).toBeInTheDocument()
      })
    })

    describe('and a streamer has an active camera', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([
          participant('0xstreamer', STREAMER_METADATA, [{ source: Track.Source.Camera, track: {}, isMuted: false }])
        ])
        render(<WatcherViewContent />)
      })

      it('should render the participant grid', () => {
        expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
      })
    })

    describe('and a streamer has an active screen share', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([
          participant('0xstreamer', STREAMER_METADATA, [{ source: Track.Source.ScreenShare, track: {}, isMuted: false }])
        ])
        render(<WatcherViewContent />)
      })

      it('should render the participant grid', () => {
        expect(screen.getByTestId('participant-grid')).toBeInTheDocument()
      })
    })

    describe('and the streamer has no live video', () => {
      beforeEach(() => {
        mockUseRemoteParticipants.mockReturnValue([
          participant('0xbroken', '{not json'),
          participant('0xstreamer', STREAMER_METADATA, [{ source: Track.Source.Camera, track: {}, isMuted: true }])
        ])
        render(<WatcherViewContent />)
      })

      it('should render the streamer empty state with the streamer name', () => {
        expect(screen.getByText('empty_state.streamer_action')).toHaveAttribute('data-participant', '0xstreamer')
      })

      it('should not render the participant grid', () => {
        expect(screen.queryByTestId('participant-grid')).not.toBeInTheDocument()
      })
    })
  })
})
