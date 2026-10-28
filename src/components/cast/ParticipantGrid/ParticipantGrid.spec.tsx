import React from 'react'
import { useTracks } from '@livekit/components-react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { Track } from 'livekit-client'
import { ParticipantGrid } from './ParticipantGrid'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({
  useTracks: jest.fn(),
  useIsSpeaking: () => false,
  VideoTrack: () => React.createElement('video', { 'data-testid': 'video-track' })
}))
jest.mock('../../../features/cast2/cast2.utils', () => ({
  ...jest.requireActual('../../../features/cast2/cast2.utils'),
  isPresentationBot: (participant: { identity: string }) => participant.identity.startsWith('presentation-bot:'),
  getDisplayName: (participant: { identity: string }) => participant.identity
}))
jest.mock('../../../features/cast2/useCastTranslation', () => ({ useCastTranslation: () => ({ t: (key: string) => key }) }))
jest.mock('../Avatar/Avatar', () => ({ Avatar: () => null }))
jest.mock('../LiveKitEnhancements/SpeakingIndicator', () => ({ SpeakingIndicator: () => null }))

const trackRef = (identity: string, source: Track.Source, publication: { isMuted?: boolean; track?: object; trackName?: string } = {}) => ({
  participant: { sid: `${identity}-sid`, identity, isLocal: identity === 'me' },
  source,
  publication: { isMuted: false, track: {}, ...publication }
})

type FakeTrack = ReturnType<typeof trackRef>

const BOT = 'presentation-bot:room:1'
const cameras = (count: number) => Array.from({ length: count }, (_, index) => trackRef(`cam-${index + 1}`, Track.Source.Camera))
const visibleNames = () => screen.queryAllByText(/^(cam-\d+|me)$/).map(element => element.textContent)

describe('when the participant grid renders', () => {
  let videoTracks: FakeTrack[]
  let audioTracks: FakeTrack[]
  let view: RenderResult

  beforeEach(() => {
    audioTracks = []
    jest
      .mocked(useTracks)
      .mockImplementation(sources => ((sources as Track.Source[]).includes(Track.Source.Microphone) ? audioTracks : videoTracks) as never)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe.each([
    ['the presentation bot is the only tile', [trackRef(BOT, Track.Source.ScreenShare)], 1],
    ['the presentation bot video is still initialising', [trackRef(BOT, Track.Source.ScreenShare, { track: { readyState: 'new' } })], 0],
    ['the presentation bot is auto-expanded next to a camera', [trackRef(BOT, Track.Source.ScreenShare), ...cameras(1)], 1],
    ['only a camera tile is shown', cameras(1), 0]
  ])('and %s', (_, tracks, overlays) => {
    beforeEach(() => {
      videoTracks = tracks
      render(<ParticipantGrid presentationOverlay={<span data-testid="slot" />} />)
    })

    it(`should render the presentation overlay ${overlays} time(s)`, () => {
      expect(screen.queryAllByTestId('slot')).toHaveLength(overlays)
    })
  })

  describe.each([
    ['client-composition video', 'presentation-video', 0],
    ['legacy composited', 'presentation', 1]
  ])('and the bot publishes its %s track', (_, trackName, tiles) => {
    beforeEach(() => {
      videoTracks = [trackRef(BOT, Track.Source.ScreenShare, { trackName })]
      render(<ParticipantGrid />)
    })

    it(`should render ${tiles} video tile(s) for it`, () => {
      expect(screen.queryAllByTestId('video-track')).toHaveLength(tiles)
    })
  })

  describe.each([
    ['there are no video tracks', true, 'empty_state.no_video_streams'],
    ['the hidden local participant is the only track', false, 'empty_state.waiting_participants']
  ])('and %s', (_, localParticipantVisible, message) => {
    beforeEach(() => {
      videoTracks = localParticipantVisible ? [] : [trackRef('me', Track.Source.Camera)]
      render(<ParticipantGrid localParticipantVisible={localParticipantVisible} />)
    })

    it('should render the matching empty state', () => {
      expect(screen.getByText(message)).toBeInTheDocument()
    })
  })

  describe('and the local participant is hidden next to a remote camera', () => {
    beforeEach(() => {
      videoTracks = [trackRef('me', Track.Source.Camera), ...cameras(1)]
      render(<ParticipantGrid localParticipantVisible={false} />)
    })

    it('should render only the remote camera tile', () => {
      expect(visibleNames()).toEqual(['cam-1'])
    })
  })

  describe('and two cameras are shown', () => {
    beforeEach(() => {
      videoTracks = cameras(2)
      render(<ParticipantGrid />)
      fireEvent.click(screen.getByText('cam-2'))
    })

    it('should expand the clicked tile ahead of the floating tile', () => {
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

  describe('and four cameras are shown with one expanded', () => {
    beforeEach(() => {
      videoTracks = cameras(4)
      view = render(<ParticipantGrid />)
      fireEvent.click(screen.getByText('cam-3'))
    })

    it('should render the expanded tile and a single thumbnail', () => {
      expect(visibleNames()).toEqual(['cam-3', 'cam-1'])
    })

    it('should summarise the remaining thumbnails in an overflow card', () => {
      expect(screen.getByText('+2')).toBeInTheDocument()
    })

    describe.each([
      ['the thumbnail is clicked', 'cam-1', ['cam-1', 'cam-2']],
      ['the expanded tile is clicked again', 'cam-3', ['cam-1', 'cam-2', 'cam-3', 'cam-4']]
    ])('and %s', (_, name, expected) => {
      beforeEach(() => {
        fireEvent.click(screen.getByText(name))
      })

      it('should rearrange the tiles', () => {
        expect(visibleNames()).toEqual(expected)
      })
    })

    describe.each([
      ['the expanded camera leaves', ['cam-1', 'cam-2', 'cam-4'], ['cam-1', 'cam-2', 'cam-4']],
      ['the expanded camera stays', ['cam-1', 'cam-2', 'cam-3', 'cam-4'], ['cam-3', 'cam-1']]
    ])('and the grid re-renders as %s', (_, remaining, expected) => {
      beforeEach(() => {
        videoTracks = cameras(4).filter(track => remaining.includes(track.participant.identity))
        view.rerender(<ParticipantGrid />)
      })

      it('should render the tiles in the expected layout', () => {
        expect(visibleNames()).toEqual(expected)
      })
    })
  })

  describe('and ten cameras are shown', () => {
    beforeEach(() => {
      videoTracks = cameras(10)
      render(<ParticipantGrid />)
    })

    it('should render the first eight tiles', () => {
      expect(visibleNames()).toHaveLength(8)
    })

    describe('and the overflow card is clicked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByText('+2'))
      })

      it('should render every tile', () => {
        expect(visibleNames()).toHaveLength(10)
      })
    })
  })

  describe.each([
    ['an unmuted', false, 0],
    ['a muted', true, 1]
  ])('and a camera participant publishes %s microphone', (_, isMuted, icons) => {
    beforeEach(() => {
      videoTracks = cameras(1)
      audioTracks = [trackRef('cam-1', Track.Source.Microphone, { isMuted })]
      render(<ParticipantGrid />)
    })

    it(`should render ${icons} muted indicator(s)`, () => {
      expect(screen.queryAllByTestId('MicOffIcon')).toHaveLength(icons)
    })
  })

  describe('and the auto-expanded presentation bot leaves', () => {
    beforeEach(() => {
      videoTracks = [trackRef(BOT, Track.Source.ScreenShare), ...cameras(2)]
      view = render(<ParticipantGrid />)
      videoTracks = cameras(2)
      view.rerender(<ParticipantGrid />)
    })

    it('should collapse back to the full grid', () => {
      expect(visibleNames()).toEqual(['cam-1', 'cam-2'])
    })
  })
})
