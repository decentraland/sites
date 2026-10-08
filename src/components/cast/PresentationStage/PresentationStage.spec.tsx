import React from 'react'
import { useLocalParticipant, useTracks } from '@livekit/components-react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { RoomEvent, Track } from 'livekit-client'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import type { PresentationState } from '../../../features/cast2/contexts/PresentationContext'
import { PresentationStage } from './PresentationStage'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({
  useTracks: jest.fn(),
  useLocalParticipant: jest.fn(),
  VideoTrack: ({ trackRef }: { trackRef: { source: string } }) => React.createElement('video', { 'data-source': trackRef.source })
}))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentation: jest.fn() }))
jest.mock('../../../features/cast2/cast2.helpers', () => ({ getPresenterServerUrl: () => 'https://presenter.example' }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({ useCastTranslation: () => ({ t: (key: string) => key }) }))

const BOT = 'presentation-bot:deck'
const PRESENTER = '0xpresenter'
const LOCAL = 'stream:local'
const SLIDE_URL = 'https://presenter.example/presentations/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/slides/0a1b2c3d4e5f6a7b.png'
const NEXT_SLIDE_URL = 'https://presenter.example/presentations/3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b/slides/3d4e5f6a7b8c9d0e.png'
const FOREIGN_SLIDE = { url: SLIDE_URL.replace('presenter.example', 'evil.example'), width: 1920, height: 1080 }
const PLAYING_VIDEO: Partial<PresentationState> = {
  videoState: 'playing',
  playingVideoIndex: 0,
  slideVideos: [{ url: 'https://presenter.example/video.mp4', geometry: { x: 480, y: 270, width: 960, height: 540 } }]
}

type FakeTrackRef = { participant: { identity: string }; source: Track.Source; publication: { trackName: string; isMuted: boolean } }

const trackRef = (identity: string, source: Track.Source, trackName = '', isMuted = false): FakeTrackRef => ({
  participant: { identity },
  source,
  publication: { trackName, isMuted }
})

const share = (px: number, total: number) => `${(px / total) * 100}%`

describe('when the presentation stage renders', () => {
  let state: PresentationState
  let tracks: FakeTrackRef[]
  let containerSize: { width: number; height: number }
  let resizeCallback: () => void
  let disconnect: jest.Mock
  let result: RenderResult

  const renderStage = () => {
    result = render(<PresentationStage overlay={<span data-testid="overlay" />} />)
  }
  const stage = () => result.container.firstElementChild as HTMLElement
  const slideBox = () => stage().firstElementChild as HTMLElement
  const slideImage = () => screen.queryByRole('img', { name: 'streaming_controls.presentation' })
  const videoOf = (source: Track.Source) => result.container.querySelector<HTMLElement>(`video[data-source="${source}"]`)
  const slideBoxRect = () => {
    const { left, top, width, height } = slideBox().style
    return [left, top, width, height].map(value => parseFloat(value) || 0)
  }

  beforeEach(() => {
    state = {
      slideVideos: [],
      videoState: 'idle',
      overlay: { x: 0, y: 1, size: 'small' },
      slide: { url: SLIDE_URL, width: 1920, height: 1080 },
      presenterIdentity: null,
      playingVideoIndex: null
    } as unknown as PresentationState
    tracks = []
    containerSize = { width: 960, height: 540 }
    disconnect = jest.fn()
    jest.mocked(usePresentation).mockImplementation(() => ({ state, presentationParticipantIdentity: BOT }) as never)
    jest.mocked(useTracks).mockImplementation(() => tracks as never)
    jest.mocked(useLocalParticipant).mockReturnValue({ localParticipant: { identity: LOCAL } } as never)
    jest.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(() => containerSize.width)
    jest.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => containerSize.height)
    jest.spyOn(globalThis, 'ResizeObserver').mockImplementation(callback => {
      resizeCallback = callback as () => void
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and the slide is served by the presenter server', () => {
    beforeEach(renderStage)

    it('should render the slide image from its URL', () => {
      expect(slideImage()).toHaveAttribute('src', SLIDE_URL)
    })

    it('should render the overlay inside the slide box', () => {
      expect(screen.getByTestId('overlay').parentElement).toBe(slideBox())
    })
  })

  describe.each([
    ['there is no slide', () => (state.slide = null)],
    ['the container has not been measured yet', () => (containerSize = { width: 0, height: 0 })]
  ])('and %s', (_, arrange) => {
    beforeEach(() => {
      arrange()
      renderStage()
    })

    it('should render an empty stage', () => {
      expect(stage()).toBeEmptyDOMElement()
    })
  })

  describe('and the slide URL is on another origin', () => {
    beforeEach(() => {
      state.slide = FOREIGN_SLIDE
      renderStage()
    })

    it('should not render the slide image', () => {
      expect(slideImage()).not.toBeInTheDocument()
    })

    it('should still render the overlay', () => {
      expect(screen.getByTestId('overlay')).toBeInTheDocument()
    })
  })

  describe('and the slide image fails to load', () => {
    let warn: jest.SpyInstance

    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      renderStage()
      fireEvent.error(slideImage() as HTMLElement)
    })

    it('should remove the slide image', () => {
      expect(slideImage()).not.toBeInTheDocument()
    })

    it('should warn without leaking the slide URL', () => {
      expect(warn).toHaveBeenCalledWith('[presentation] slide image failed to load')
    })

    describe('and the presenter moves to another slide', () => {
      beforeEach(() => {
        state = { ...state, slide: { url: NEXT_SLIDE_URL, width: 1920, height: 1080 } }
        result.rerender(<PresentationStage />)
      })

      it('should render the new slide image', () => {
        expect(slideImage()).toHaveAttribute('src', NEXT_SLIDE_URL)
      })
    })
  })

  describe.each([
    ['a landscape slide in a square container', { width: 1000, height: 1000 }, 1920, 1080, [0, 218.75, 1000, 562.5]],
    ['a portrait slide in a wide container', { width: 1920, height: 540 }, 1080, 1920, [808.125, 0, 303.75, 540]]
  ])('and the container is resized to fit %s', (_, size, slideWidth, slideHeight, rect) => {
    beforeEach(() => {
      state.slide = { url: SLIDE_URL, width: slideWidth, height: slideHeight }
      renderStage()
      containerSize = size
      act(() => resizeCallback())
    })

    it('should fit the slide box inside the container', () => {
      expect(slideBoxRect()).toEqual(rect.map(value => expect.closeTo(value)))
    })
  })

  describe('and the stage unmounts', () => {
    beforeEach(() => {
      renderStage()
      result.unmount()
    })

    it('should disconnect the resize observer', () => {
      expect(disconnect).toHaveBeenCalled()
    })
  })

  describe('and the bot streams the embedded video that is playing', () => {
    beforeEach(() => {
      state = { ...state, ...PLAYING_VIDEO }
      tracks = [trackRef(BOT, Track.Source.ScreenShare, 'presentation-video')]
    })

    describe.each([
      ['it is playing', {}],
      ['it is paused', { videoState: 'paused' } as Partial<PresentationState>]
    ])('and %s', (_, patch) => {
      beforeEach(() => {
        state = { ...state, ...patch }
        renderStage()
      })

      it('should render the video over its slide rectangle', () => {
        expect(videoOf(Track.Source.ScreenShare)?.parentElement).toHaveStyle({ left: '25%', top: '25%', width: '50%', height: '50%' })
      })
    })

    describe.each([
      ['it is still loading', { videoState: 'loading' }, null],
      ['it has stopped between videos', { videoState: 'idle', playingVideoIndex: null }, null],
      ['the playing index is out of range', { playingVideoIndex: 5 }, null],
      ['the bot only publishes the legacy composited track', {}, trackRef(BOT, Track.Source.ScreenShare, 'presentation')],
      ['the track belongs to another participant', {}, trackRef(PRESENTER, Track.Source.ScreenShare, 'presentation-video')]
    ])('and %s', (_, patch, track) => {
      beforeEach(() => {
        state = { ...state, ...patch } as PresentationState
        tracks = track ? [track] : tracks
        renderStage()
      })

      it('should not render the presentation video', () => {
        expect(videoOf(Track.Source.ScreenShare)).not.toBeInTheDocument()
      })
    })
  })

  describe('and a remote presenter has an unmuted camera', () => {
    beforeEach(() => {
      state.presenterIdentity = PRESENTER
      tracks = [trackRef(PRESENTER, Track.Source.Camera)]
      renderStage()
    })

    it('should render the presenter camera in a circle positioned as a share of the slide', () => {
      expect(videoOf(Track.Source.Camera)?.parentElement).toHaveStyle({
        left: share(38, 1920),
        top: share(754, 1080),
        width: share(288, 1920),
        height: share(288, 1080)
      })
    })

    it('should re-read the room tracks whenever a camera is muted or unmuted', () => {
      expect(useTracks).toHaveBeenCalledWith(expect.any(Array), { updateOnlyOn: [RoomEvent.TrackMuted, RoomEvent.TrackUnmuted] })
    })
  })

  describe.each([
    ['the presenter camera is muted', PRESENTER, trackRef(PRESENTER, Track.Source.Camera, '', true), 1920],
    ['the slide is too small for a circle', PRESENTER, trackRef(PRESENTER, Track.Source.Camera), 6],
    ['the local participant is the presenter', LOCAL, trackRef(LOCAL, Track.Source.Camera), 1920],
    ['no presenter is known', null, trackRef(PRESENTER, Track.Source.Camera), 1920]
  ])('and %s', (_, presenterIdentity, track, slideWidth) => {
    beforeEach(() => {
      state = { ...state, presenterIdentity, slide: { url: SLIDE_URL, width: slideWidth, height: (slideWidth * 9) / 16 } }
      tracks = [track]
      renderStage()
    })

    it('should not render the camera circle', () => {
      expect(videoOf(Track.Source.Camera)).not.toBeInTheDocument()
    })
  })
})
