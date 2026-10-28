import React from 'react'
import { useTracks } from '@livekit/components-react'
import { render, screen } from '@testing-library/react'
import { Track } from 'livekit-client'
import { ParticipantGrid } from './ParticipantGrid'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({
  useTracks: jest.fn(),
  useIsSpeaking: () => false,
  useAudioWaveform: () => ({ bars: [] }),
  VideoTrack: () => React.createElement('video', { 'data-testid': 'video-track' })
}))
jest.mock('../../../features/cast2/cast2.utils', () => ({
  isPresentationBot: (participant: { identity: string }) => participant.identity === 'presentation-bot',
  getDisplayName: (participant: { identity: string }) => participant.identity
}))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('../Avatar/Avatar', () => ({
  Avatar: () => React.createElement('div', { 'data-testid': 'avatar' })
}))
jest.mock('../LiveKitEnhancements/SpeakingIndicator', () => ({
  SpeakingIndicator: () => React.createElement('div', { 'data-testid': 'speaking-indicator' })
}))

const mockUseTracks = useTracks as jest.Mock

const trackRef = (identity: string, source: Track.Source) => ({
  participant: { sid: `${identity}-sid`, identity, isLocal: false },
  source,
  publication: { isMuted: false, track: {} }
})

const botTrack = trackRef('presentation-bot', Track.Source.ScreenShare)
const cameraTrack = trackRef('0xabc', Track.Source.Camera)

const slot = <span data-testid="slot" />

describe('ParticipantGrid', () => {
  let videoTracks: ReturnType<typeof trackRef>[]

  beforeEach(() => {
    mockUseTracks.mockImplementation((sources: Track.Source[]) => (sources.includes(Track.Source.Microphone) ? [] : videoTracks))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the presentation bot is the only tile', () => {
    beforeEach(() => {
      videoTracks = [botTrack]
    })

    it('should render the presentation overlay on the bot tile', () => {
      render(<ParticipantGrid presentationOverlay={slot} />)
      expect(screen.getByTestId('slot')).toBeInTheDocument()
    })

    it('should render no overlay when none is given', () => {
      render(<ParticipantGrid />)
      expect(screen.queryByTestId('slot')).not.toBeInTheDocument()
    })
  })

  describe('when the presentation bot video is still initialising', () => {
    beforeEach(() => {
      videoTracks = [{ ...botTrack, publication: { isMuted: false, track: { readyState: 'new' } } }]
    })

    it('should not render the presentation overlay', () => {
      render(<ParticipantGrid presentationOverlay={slot} />)
      expect(screen.queryByTestId('slot')).not.toBeInTheDocument()
    })
  })

  describe('when the presentation bot is expanded next to a camera', () => {
    beforeEach(() => {
      videoTracks = [botTrack, cameraTrack]
    })

    it('should render the presentation overlay once, on the expanded bot tile', () => {
      render(<ParticipantGrid presentationOverlay={slot} />)
      expect(screen.getAllByTestId('slot')).toHaveLength(1)
    })
  })

  describe('when only a camera tile is shown', () => {
    beforeEach(() => {
      videoTracks = [cameraTrack]
    })

    it('should not render the presentation overlay', () => {
      render(<ParticipantGrid presentationOverlay={slot} />)
      expect(screen.queryByTestId('slot')).not.toBeInTheDocument()
    })
  })
})
