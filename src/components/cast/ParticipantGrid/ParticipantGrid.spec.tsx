jest.mock('livekit-client', () => ({
  Track: { Source: { Camera: 'camera', ScreenShare: 'screen_share', Microphone: 'microphone' } }
}))

jest.mock('@livekit/components-react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  return {
    useTracks: jest.fn(),
    useIsSpeaking: jest.fn(),
    VideoTrack: () => ReactLib.createElement('div', { 'data-testid': 'video-track' })
  }
})

jest.mock('@mui/icons-material/MicOff', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/VideocamOff', () => ({ __esModule: true, default: () => null }))

jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../../../features/cast2/cast2.utils', () => ({
  getDisplayName: (p: { identity?: string }) => p?.identity ?? 'Anonymous',
  isPresentationBot: (p: { __isBot?: boolean }) => !!p?.__isBot
}))

jest.mock('../Avatar/Avatar', () => ({ Avatar: () => null }))
jest.mock('../LiveKitEnhancements/SpeakingIndicator', () => ({ SpeakingIndicator: () => null }))

// Plain-tag stand-ins for the styled components. Transient ($-prefixed) style props are surfaced
// as data-* attributes so tests can assert layout state without the real styled engine.
jest.mock('./ParticipantGrid.styled', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react') as typeof import('react')
  const create =
    (tag: string, testId?: string) =>
    ({ children, ...rest }: { children?: unknown } & Record<string, unknown>) => {
      const props: Record<string, unknown> = {}
      Object.keys(rest).forEach(key => {
        if (key.startsWith('$')) {
          props[`data-${key.slice(1).toLowerCase()}`] = String(rest[key])
        } else {
          props[key] = rest[key]
        }
      })
      if (testId) props['data-testid'] = testId
      return ReactLib.createElement(tag, props, children as never)
    }
  return {
    ParticipantGridContainer: create('div', 'grid-container'),
    NoParticipants: create('div', 'no-participants'),
    NoParticipantsIcon: create('div'),
    ParticipantTileContainer: create('div', 'tile'),
    FloatingVideoContainer: create('div', 'floating'),
    ThumbnailGrid: create('div', 'thumbnails'),
    ThumbnailItem: create('div'),
    SpeakingIndicatorWrapper: create('div'),
    OverflowCard: create('div', 'overflow-card'),
    OverflowAvatarStack: create('div'),
    OverflowCount: create('div'),
    ParticipantName: create('div'),
    ThumbnailOverflowCard: create('div', 'thumbnail-overflow-card'),
    AvatarFallback: create('div', 'avatar-fallback'),
    LoadingSpinner: create('div'),
    LoadingText: create('div'),
    MutedIndicator: create('div', 'muted-indicator')
  }
})

import { useIsSpeaking, useTracks } from '@livekit/components-react'
import { fireEvent, render, screen } from '@testing-library/react'
import { ParticipantGrid } from './ParticipantGrid'

const mockUseTracks = useTracks as jest.Mock
const mockUseIsSpeaking = useIsSpeaking as jest.Mock

type Participant = { sid: string; identity: string; isLocal: boolean; __isBot: boolean }
type TrackRef = { source: string; participant: Participant; publication: Record<string, unknown> }

const participant = (over: Partial<Participant> = {}): Participant => ({
  sid: over.identity ?? 's',
  identity: 'anon',
  isLocal: false,
  __isBot: false,
  ...over
})

const videoPublication = (over: Record<string, unknown> = {}) => ({
  isMuted: false,
  track: { mediaStream: { active: true }, readyState: 'live' },
  ...over
})

const cameraTrack = (identity: string, pOver: Partial<Participant> = {}, pubOver: Record<string, unknown> = {}): TrackRef => ({
  source: 'camera',
  participant: participant({ sid: identity, identity, ...pOver }),
  publication: videoPublication(pubOver)
})

const screenTrack = (identity: string): TrackRef => ({
  source: 'screen_share',
  participant: participant({ sid: identity, identity }),
  publication: videoPublication()
})

const presentationTrack = (identity = 'bot'): TrackRef => ({
  source: 'screen_share',
  participant: participant({ sid: identity, identity, __isBot: true }),
  publication: videoPublication()
})

const fullscreenTile = () => screen.getAllByTestId('tile').find(el => el.getAttribute('data-isfullscreen') === 'true')
const isExpanded = () => screen.getByTestId('grid-container').getAttribute('data-expandedview') === 'true'

describe('ParticipantGrid', () => {
  let videoTracks: TrackRef[]
  let audioTracks: Array<{ participant: { identity: string }; publication: { isMuted: boolean } }>

  beforeEach(() => {
    videoTracks = []
    audioTracks = []
    mockUseTracks.mockImplementation((sources: string[]) => (sources.includes('microphone') ? audioTracks : videoTracks))
    mockUseIsSpeaking.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when there are no tracks', () => {
    it('should render the no-video-streams empty state', () => {
      render(<ParticipantGrid />)
      expect(screen.getByText('empty_state.no_video_streams')).toBeInTheDocument()
    })
  })

  describe('when localParticipantVisible is false and only local tracks exist', () => {
    it('should filter out local tracks and show the waiting state', () => {
      videoTracks = [cameraTrack('me', { isLocal: true })]
      render(<ParticipantGrid localParticipantVisible={false} />)
      expect(screen.getByText('empty_state.waiting_participants')).toBeInTheDocument()
    })
  })

  describe('when a single participant is present', () => {
    it('should render its video without expansion', () => {
      videoTracks = [cameraTrack('alice')]
      render(<ParticipantGrid />)
      expect(screen.getByText('alice')).toBeInTheDocument()
      expect(screen.getByTestId('video-track')).toBeInTheDocument()
      expect(isExpanded()).toBe(false)
    })
  })

  describe('when multiple participants are present without a share', () => {
    it('should expand and collapse a tile on click', () => {
      videoTracks = [cameraTrack('alice'), cameraTrack('bob')]
      render(<ParticipantGrid />)
      expect(isExpanded()).toBe(false)

      fireEvent.click(screen.getByText('alice'))
      expect(isExpanded()).toBe(true)
      expect(fullscreenTile()?.textContent).toContain('alice')

      fireEvent.click(screen.getByText('alice'))
      expect(isExpanded()).toBe(false)
    })
  })

  describe('when a screen share is present among camera tracks', () => {
    it('should auto-focus the first screen share with the other track floating', () => {
      videoTracks = [cameraTrack('alice'), screenTrack('bob')]
      render(<ParticipantGrid />)
      expect(isExpanded()).toBe(true)
      expect(fullscreenTile()?.textContent).toContain('bob - screen')
      expect(screen.getByTestId('floating')).toBeInTheDocument()
    })

    it('should refocus when the floating tile is clicked', () => {
      videoTracks = [cameraTrack('alice'), screenTrack('bob')]
      render(<ParticipantGrid />)
      fireEvent.click(screen.getByText('alice'))
      expect(fullscreenTile()?.textContent).toContain('alice')
    })

    it('should not steal focus when a second participant shares', () => {
      videoTracks = [cameraTrack('alice'), screenTrack('bob')]
      const { rerender } = render(<ParticipantGrid />)
      expect(fullscreenTile()?.textContent).toContain('bob - screen')

      videoTracks = [cameraTrack('alice'), screenTrack('bob'), screenTrack('carol')]
      rerender(<ParticipantGrid />)
      expect(fullscreenTile()?.textContent).toContain('bob - screen')
    })

    it('should collapse back to the grid when the focused share ends', () => {
      videoTracks = [cameraTrack('alice'), screenTrack('bob')]
      const { rerender } = render(<ParticipantGrid />)
      expect(isExpanded()).toBe(true)

      videoTracks = [cameraTrack('alice')]
      rerender(<ParticipantGrid />)
      expect(isExpanded()).toBe(false)
    })
  })

  describe('when a presentation bot and a screen share are both present', () => {
    it('should focus the presentation and hide other thumbnails', () => {
      videoTracks = [screenTrack('bob'), presentationTrack('botpres')]
      render(<ParticipantGrid />)
      expect(fullscreenTile()?.textContent).toContain('streaming_controls.presentation')
      expect(screen.queryByText('bob - screen')).not.toBeInTheDocument()
    })
  })

  describe('when the expanded view has more thumbnails than the maximum', () => {
    it('should render a thumbnail overflow card and refocus a thumbnail on click', () => {
      videoTracks = [screenTrack('bob'), cameraTrack('a'), cameraTrack('b'), cameraTrack('c')]
      render(<ParticipantGrid />)
      expect(screen.getByTestId('thumbnails')).toBeInTheDocument()
      expect(screen.getByTestId('thumbnail-overflow-card')).toBeInTheDocument()

      fireEvent.click(screen.getByText('a'))
      expect(fullscreenTile()?.textContent).toContain('a')
    })
  })

  describe('when there are more participants than the grid maximum', () => {
    it('should show an overflow card and reveal all on click', () => {
      videoTracks = Array.from({ length: 11 }, (_, i) => cameraTrack(`u${i}`))
      render(<ParticipantGrid />)
      expect(screen.getByTestId('overflow-card')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('overflow-card'))
      expect(screen.queryByTestId('overflow-card')).not.toBeInTheDocument()
    })
  })

  describe('ParticipantTile render states', () => {
    it('should show an avatar fallback when the camera video is inactive', () => {
      videoTracks = [cameraTrack('alice', {}, { track: { mediaStream: { active: false }, readyState: 'live' } })]
      render(<ParticipantGrid />)
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument()
      expect(screen.queryByTestId('video-track')).not.toBeInTheDocument()
    })

    it('should show the initializing state when the track is not yet live', () => {
      videoTracks = [cameraTrack('alice', {}, { track: { mediaStream: { active: true }, readyState: 'pending' } })]
      render(<ParticipantGrid />)
      expect(screen.getByText('streaming_controls.initializing_video')).toBeInTheDocument()
    })

    it('should render speaking/muted indicators driven by the audio track', () => {
      mockUseIsSpeaking.mockReturnValue(true)
      videoTracks = [cameraTrack('alice'), cameraTrack('bob')]
      audioTracks = [{ participant: { identity: 'alice' }, publication: { isMuted: false } }]
      render(<ParticipantGrid />)
      // bob has no audio track -> treated as muted -> at least one muted indicator
      expect(screen.getAllByTestId('muted-indicator').length).toBeGreaterThanOrEqual(1)
    })

    it('should mirror the local participant camera', () => {
      videoTracks = [cameraTrack('me', { isLocal: true }), cameraTrack('bob')]
      render(<ParticipantGrid />)
      const mirrored = screen.getAllByTestId('tile').find(el => el.getAttribute('data-mirror') === 'true')
      expect(mirrored?.textContent).toContain('me')
    })
  })
})
