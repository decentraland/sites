import React from 'react'
import { useTracks } from '@livekit/components-react'
import { fireEvent, render, screen } from '@testing-library/react'
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
  ...jest.requireActual('../../../features/cast2/cast2.utils'),
  isPresentationBot: (participant: { identity: string }) => participant.identity.startsWith('presentation-bot:'),
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

const botTrack = trackRef('presentation-bot:room:1', Track.Source.ScreenShare)
const cameraTrack = trackRef('0xabc', Track.Source.Camera)

const namedBotTrack = (trackName: string) => ({ ...botTrack, publication: { isMuted: false, track: {}, trackName } })

const slot = <span data-testid="slot" />

const cameras = (count: number) => Array.from({ length: count }, (_, index) => trackRef(`cam-${index + 1}`, Track.Source.Camera))

const localCamera = { ...trackRef('me', Track.Source.Camera), participant: { sid: 'me-sid', identity: 'me', isLocal: true } }

const visibleNames = () => screen.queryAllByText(/^(cam-\d+|me)$/).map(element => element.textContent)

describe('ParticipantGrid', () => {
  let videoTracks: ReturnType<typeof trackRef>[]
  let audioTracks: ReturnType<typeof trackRef>[]

  beforeEach(() => {
    audioTracks = []
    mockUseTracks.mockImplementation((sources: Track.Source[]) => (sources.includes(Track.Source.Microphone) ? audioTracks : videoTracks))
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

  describe('when the bot publishes its client-composition video track', () => {
    beforeEach(() => {
      videoTracks = [namedBotTrack('presentation-video')]
    })

    it('should render no tile for it', () => {
      render(<ParticipantGrid />)
      expect(screen.queryByTestId('video-track')).not.toBeInTheDocument()
    })
  })

  describe('when the bot publishes its legacy composited track', () => {
    beforeEach(() => {
      videoTracks = [namedBotTrack('presentation')]
    })

    it('should render its tile', () => {
      render(<ParticipantGrid />)
      expect(screen.getByTestId('video-track')).toBeInTheDocument()
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

  describe('when there are no video tracks', () => {
    beforeEach(() => {
      videoTracks = []
    })

    it('should render the no video streams empty state', () => {
      render(<ParticipantGrid />)
      expect(screen.getByText('empty_state.no_video_streams')).toBeInTheDocument()
    })
  })

  describe('when the local participant is hidden', () => {
    describe('and a remote camera is also shown', () => {
      beforeEach(() => {
        videoTracks = [localCamera, ...cameras(1)]
      })

      it('should render only the remote camera tile', () => {
        render(<ParticipantGrid localParticipantVisible={false} />)
        expect(visibleNames()).toEqual(['cam-1'])
      })
    })

    describe('and the local camera is the only track', () => {
      beforeEach(() => {
        videoTracks = [localCamera]
      })

      it('should render the waiting for participants empty state', () => {
        render(<ParticipantGrid localParticipantVisible={false} />)
        expect(screen.getByText('empty_state.waiting_participants')).toBeInTheDocument()
      })
    })
  })

  describe('when two cameras are shown', () => {
    beforeEach(() => {
      videoTracks = cameras(2)
      render(<ParticipantGrid />)
    })

    describe('and the second tile is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByText('cam-2'))
      })

      it('should expand it ahead of the floating tile', () => {
        expect(visibleNames()).toEqual(['cam-2', 'cam-1'])
      })

      describe('and the floating tile is clicked', () => {
        beforeEach(() => {
          fireEvent.click(screen.getByText('cam-1'))
        })

        it('should expand the floating tile instead', () => {
          expect(visibleNames()).toEqual(['cam-1', 'cam-2'])
        })
      })
    })
  })

  describe('when four cameras are shown', () => {
    beforeEach(() => {
      videoTracks = cameras(4)
      render(<ParticipantGrid />)
    })

    describe('and a tile is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByText('cam-3'))
      })

      it('should render the expanded tile and a single thumbnail', () => {
        expect(visibleNames()).toEqual(['cam-3', 'cam-1'])
      })

      it('should summarise the remaining thumbnails in an overflow card', () => {
        expect(screen.getByText('+2')).toBeInTheDocument()
        expect(screen.getAllByTestId('avatar')).toHaveLength(2)
      })

      describe('and the thumbnail is clicked', () => {
        beforeEach(() => {
          fireEvent.click(screen.getByText('cam-1'))
        })

        it('should expand the thumbnail instead', () => {
          expect(visibleNames()).toEqual(['cam-1', 'cam-2'])
        })
      })

      describe('and the expanded tile is clicked again', () => {
        beforeEach(() => {
          fireEvent.click(screen.getByText('cam-3'))
        })

        it('should collapse back to the full grid', () => {
          expect(visibleNames()).toEqual(['cam-1', 'cam-2', 'cam-3', 'cam-4'])
        })

        it('should not render an overflow card', () => {
          expect(screen.queryByText('+2')).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('when ten cameras are shown', () => {
    beforeEach(() => {
      videoTracks = cameras(10)
      render(<ParticipantGrid />)
    })

    it('should render the first eight tiles', () => {
      expect(visibleNames()).toEqual(['cam-1', 'cam-2', 'cam-3', 'cam-4', 'cam-5', 'cam-6', 'cam-7', 'cam-8'])
    })

    it('should summarise the rest in an overflow card', () => {
      expect(screen.getByText('+2')).toBeInTheDocument()
      expect(screen.getAllByTestId('avatar')).toHaveLength(2)
    })

    describe('and the overflow card is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByText('+2'))
      })

      it('should render every tile', () => {
        expect(visibleNames()).toHaveLength(10)
      })

      it('should no longer render the overflow card', () => {
        expect(screen.queryByText('+2')).not.toBeInTheDocument()
      })
    })
  })

  describe('when a camera participant publishes an unmuted microphone', () => {
    beforeEach(() => {
      videoTracks = cameras(1)
      audioTracks = [trackRef('cam-1', Track.Source.Microphone)]
      render(<ParticipantGrid />)
    })

    it('should not render the muted indicator', () => {
      expect(screen.queryByTestId('MicOffIcon')).not.toBeInTheDocument()
    })
  })

  describe('when a camera participant publishes a muted microphone', () => {
    beforeEach(() => {
      videoTracks = cameras(1)
      audioTracks = [{ ...trackRef('cam-1', Track.Source.Microphone), publication: { isMuted: true, track: {} } }]
      render(<ParticipantGrid />)
    })

    it('should render the muted indicator', () => {
      expect(screen.getByTestId('MicOffIcon')).toBeInTheDocument()
    })
  })

  describe('when the auto-expanded presentation bot leaves', () => {
    beforeEach(() => {
      videoTracks = [botTrack, ...cameras(2)]
      const view = render(<ParticipantGrid />)
      videoTracks = cameras(2)
      view.rerender(<ParticipantGrid />)
    })

    it('should collapse back to the full grid', () => {
      expect(visibleNames()).toEqual(['cam-1', 'cam-2'])
    })
  })

  describe('when an expanded camera leaves', () => {
    beforeEach(() => {
      videoTracks = cameras(4)
      const view = render(<ParticipantGrid />)
      fireEvent.click(screen.getByText('cam-3'))
      videoTracks = cameras(4).filter(track => track.participant.identity !== 'cam-3')
      view.rerender(<ParticipantGrid />)
    })

    it('should collapse back to the full grid of remaining cameras', () => {
      expect(visibleNames()).toEqual(['cam-1', 'cam-2', 'cam-4'])
    })
  })

  describe('when the grid re-renders with the expanded camera still present', () => {
    beforeEach(() => {
      videoTracks = cameras(4)
      const view = render(<ParticipantGrid />)
      fireEvent.click(screen.getByText('cam-3'))
      videoTracks = cameras(4)
      view.rerender(<ParticipantGrid />)
    })

    it('should keep it expanded', () => {
      expect(visibleNames()).toEqual(['cam-3', 'cam-1'])
    })
  })
})
