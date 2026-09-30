import React from 'react'
import { useLocalParticipant, useTracks } from '@livekit/components-react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { RoomEvent, Track } from 'livekit-client'
import { overlayRect } from '../../../features/cast2/cast2.overlay'
import type { OverlayRect } from '../../../features/cast2/cast2.types'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import type { PresentationState } from '../../../features/cast2/contexts/PresentationContext'
import { PresentationStage } from './PresentationStage'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('@livekit/components-react', () => ({
  useTracks: jest.fn(),
  useLocalParticipant: jest.fn(),
  VideoTrack: ({ trackRef, className }: { trackRef: { participant: { identity: string }; source: string }; className?: string }) =>
    React.createElement('video', { 'data-identity': trackRef.participant.identity, 'data-source': trackRef.source, className })
}))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentation: jest.fn() }))
jest.mock('../../../features/cast2/cast2.helpers', () => ({ getPresenterServerUrl: () => 'https://presenter.example' }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

const mockUsePresentation = usePresentation as jest.Mock
const mockUseTracks = useTracks as jest.Mock
const mockUseLocalParticipant = useLocalParticipant as jest.Mock

const BOT = 'presentation-bot:deck'
const PRESENTER = '0xpresenter'
const LOCAL = 'stream:local'
const SLIDE_URL = 'https://presenter.example/presentations/deck/slides/0a1b2c.png'
const NEXT_SLIDE_URL = 'https://presenter.example/presentations/deck/slides/3d4e5f.png'
const LABEL = 'streaming_controls.presentation'

interface FakePublication {
  trackName: string
  isMuted: boolean
  track?: object
}

interface FakeTrackRef {
  participant: { identity: string; isLocal: boolean }
  source: Track.Source
  publication?: FakePublication
}

const trackRef = (identity: string, source: Track.Source, publication: Partial<FakePublication> = {}, isLocal = false): FakeTrackRef => ({
  participant: { identity, isLocal },
  source,
  publication: { trackName: '', isMuted: false, track: {}, ...publication }
})

const makeState = (patch: Partial<PresentationState> = {}): PresentationState => ({
  id: 'deck',
  slideCount: 3,
  currentSlide: 0,
  fileType: 'pdf',
  status: 'active',
  slideVideos: [],
  videoState: 'idle',
  overlay: { x: 0, y: 1, size: 'small' },
  slide: { url: SLIDE_URL, width: 1920, height: 1080 },
  presenterIdentity: null,
  playingVideoIndex: null,
  ...patch
})

const stubProperty = (target: object, key: string, get: () => unknown) => {
  const original = Object.getOwnPropertyDescriptor(target, key)
  Object.defineProperty(target, key, { configurable: true, get })
  return () => {
    if (original) Object.defineProperty(target, key, original)
    else delete (target as Record<string, unknown>)[key]
  }
}

describe('PresentationStage', () => {
  let state: PresentationState
  let tracks: FakeTrackRef[]
  let containerSize: { width: number; height: number }
  let resizeCallback: () => void
  let disconnect: jest.Mock
  let restorers: Array<() => void>
  let originalResizeObserver: typeof ResizeObserver
  let result: RenderResult

  const renderStage = (overlay?: React.ReactNode) => {
    result = render(<PresentationStage overlay={overlay} />)
    return result
  }

  const stage = () => result.container.firstElementChild as HTMLElement
  const slideBox = () => stage().firstElementChild as HTMLElement | null
  const slideBoxRect = () => {
    const { left, top, width, height } = (slideBox() as HTMLElement).style
    return { left: parseFloat(left), top: parseFloat(top), width: parseFloat(width), height: parseFloat(height) }
  }
  const slideImage = () => screen.queryByRole('img', { name: LABEL })
  const presentationVideo = () => result.container.querySelector<HTMLElement>(`video[data-source="${Track.Source.ScreenShare}"]`)
  const cameraVideo = () => result.container.querySelector<HTMLElement>(`video[data-source="${Track.Source.Camera}"]`)

  beforeEach(() => {
    state = makeState()
    tracks = []
    containerSize = { width: 960, height: 540 }
    mockUsePresentation.mockImplementation(() => ({ state, presentationParticipantIdentity: BOT }))
    mockUseTracks.mockImplementation(() => tracks)
    mockUseLocalParticipant.mockImplementation(() => ({ localParticipant: { identity: LOCAL } }))
    restorers = [
      stubProperty(HTMLElement.prototype, 'clientWidth', () => containerSize.width),
      stubProperty(HTMLElement.prototype, 'clientHeight', () => containerSize.height)
    ]
    disconnect = jest.fn()
    originalResizeObserver = global.ResizeObserver
    global.ResizeObserver = class {
      constructor(callback: () => void) {
        resizeCallback = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {
        disconnect()
      }
    } as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    restorers.forEach(restore => restore())
    global.ResizeObserver = originalResizeObserver
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('when it renders', () => {
    it('should re-read the room tracks whenever a camera is muted or unmuted', () => {
      renderStage()
      expect(mockUseTracks).toHaveBeenCalledWith([Track.Source.Camera, Track.Source.ScreenShare], {
        updateOnlyOn: [RoomEvent.TrackMuted, RoomEvent.TrackUnmuted]
      })
    })
  })

  describe('when the state has no slide', () => {
    beforeEach(() => {
      state = makeState({ slide: null })
    })

    it('should render an empty stage with no image and no video', () => {
      renderStage()
      expect(stage()).toBeEmptyDOMElement()
    })
  })

  describe('when the container has not been measured yet', () => {
    beforeEach(() => {
      containerSize = { width: 0, height: 0 }
    })

    it('should render nothing inside the stage', () => {
      renderStage()
      expect(stage()).toBeEmptyDOMElement()
    })

    describe('and the observer then reports a size', () => {
      beforeEach(() => {
        renderStage()
        containerSize = { width: 960, height: 540 }
        act(() => resizeCallback())
      })

      it('should render the slide image', () => {
        expect(slideImage()).toBeInTheDocument()
      })
    })
  })

  describe('when the slide URL is served by the presenter server', () => {
    it('should render the slide image from that URL', () => {
      renderStage()
      expect(slideImage()).toHaveAttribute('src', SLIDE_URL)
    })

    it('should not let the slide image be dragged', () => {
      renderStage()
      expect(slideImage()).toHaveAttribute('draggable', 'false')
    })
  })

  describe('when the slide URL is on another origin', () => {
    beforeEach(() => {
      state = makeState({ slide: { url: 'https://evil.example/presentations/deck/slides/0a1b2c.png', width: 1920, height: 1080 } })
    })

    it('should not render the slide image', () => {
      renderStage()
      expect(slideImage()).not.toBeInTheDocument()
    })
  })

  describe('when the slide image fails to load', () => {
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
        state = makeState({ slide: { url: NEXT_SLIDE_URL, width: 1920, height: 1080 } })
        result.rerender(<PresentationStage />)
      })

      it('should render the new slide image', () => {
        expect(slideImage()).toHaveAttribute('src', NEXT_SLIDE_URL)
      })
    })
  })

  describe('when a landscape slide sits in a square container', () => {
    beforeEach(() => {
      containerSize = { width: 1000, height: 1000 }
    })

    it('should letterbox the slide box vertically at full width', () => {
      renderStage()
      expect(slideBoxRect()).toEqual(expect.objectContaining({ top: expect.closeTo((1000 - 562.5) / 2), width: expect.closeTo(1000) }))
    })
  })

  describe('when a portrait slide sits in a landscape container', () => {
    beforeEach(() => {
      state = makeState({ slide: { url: SLIDE_URL, width: 1080, height: 1920 } })
    })

    it('should pillarbox the slide box horizontally at full height', () => {
      renderStage()
      expect(slideBoxRect()).toEqual({
        left: expect.closeTo((960 - 303.75) / 2),
        top: expect.closeTo(0),
        width: expect.closeTo(303.75),
        height: expect.closeTo(540)
      })
    })
  })

  describe('when the container is resized', () => {
    beforeEach(() => {
      renderStage()
      containerSize = { width: 1000, height: 1000 }
      act(() => resizeCallback())
    })

    it('should refit the slide box to the new size', () => {
      expect(slideBoxRect()).toEqual(expect.objectContaining({ width: expect.closeTo(1000), height: expect.closeTo(562.5) }))
    })
  })

  describe('when an embedded video is playing', () => {
    beforeEach(() => {
      state = makeState({
        videoState: 'playing',
        playingVideoIndex: 0,
        slideVideos: [{ url: 'https://presenter.example/video.mp4', geometry: { x: 480, y: 270, width: 960, height: 540 } }]
      })
      tracks = [trackRef(BOT, Track.Source.ScreenShare, { trackName: 'presentation-video' })]
    })

    it('should render the presentation video over its slide rectangle', () => {
      renderStage()
      expect(presentationVideo()?.parentElement).toHaveStyle({ left: '25%', top: '25%', width: '50%', height: '50%' })
    })

    it('should render the video from the presentation bot', () => {
      renderStage()
      expect(presentationVideo()).toHaveAttribute('data-identity', BOT)
    })

    describe('and it is paused', () => {
      beforeEach(() => {
        state = { ...state, videoState: 'paused' }
      })

      it('should keep rendering the presentation video', () => {
        renderStage()
        expect(presentationVideo()).toBeInTheDocument()
      })
    })

    describe('and it is still loading', () => {
      beforeEach(() => {
        state = { ...state, videoState: 'loading' }
      })

      it('should not render the presentation video', () => {
        renderStage()
        expect(presentationVideo()).not.toBeInTheDocument()
      })
    })

    describe('and the video state is idle', () => {
      beforeEach(() => {
        state = { ...state, videoState: 'idle' }
      })

      it('should not render the presentation video', () => {
        renderStage()
        expect(presentationVideo()).not.toBeInTheDocument()
      })
    })

    describe('and the playing index is out of range', () => {
      beforeEach(() => {
        state = { ...state, playingVideoIndex: 5 }
      })

      it('should not render the presentation video', () => {
        renderStage()
        expect(presentationVideo()).not.toBeInTheDocument()
      })
    })

    describe('and the bot only publishes the legacy composited track', () => {
      beforeEach(() => {
        tracks = [trackRef(BOT, Track.Source.ScreenShare, { trackName: 'presentation' })]
      })

      it('should not render the presentation video', () => {
        renderStage()
        expect(presentationVideo()).not.toBeInTheDocument()
      })
    })

    describe('and the presentation-video track belongs to another participant', () => {
      beforeEach(() => {
        tracks = [trackRef(PRESENTER, Track.Source.ScreenShare, { trackName: 'presentation-video' })]
      })

      it('should not render the presentation video', () => {
        renderStage()
        expect(presentationVideo()).not.toBeInTheDocument()
      })
    })
  })

  describe('when the presentation-video track is published between videos', () => {
    beforeEach(() => {
      state = makeState({
        videoState: 'idle',
        playingVideoIndex: null,
        slideVideos: [{ url: 'https://presenter.example/video.mp4', geometry: { x: 480, y: 270, width: 960, height: 540 } }]
      })
      tracks = [trackRef(BOT, Track.Source.ScreenShare, { trackName: 'presentation-video' })]
    })

    it('should not render the presentation video', () => {
      renderStage()
      expect(presentationVideo()).not.toBeInTheDocument()
    })
  })

  describe('when a remote presenter has an unmuted camera', () => {
    let rect: OverlayRect

    beforeEach(() => {
      state = makeState({ presenterIdentity: PRESENTER })
      tracks = [trackRef(PRESENTER, Track.Source.Camera)]
      rect = overlayRect(state.overlay, 1920, 1080)
    })

    it('should render the presenter camera in a circle scaled to the slide box', () => {
      renderStage()
      expect(cameraVideo()?.parentElement).toHaveStyle({
        left: `${rect.left * 0.5}px`,
        top: `${rect.top * 0.5}px`,
        width: `${rect.d * 0.5}px`,
        height: `${rect.d * 0.5}px`
      })
    })

    it('should render the camera of the presenter', () => {
      renderStage()
      expect(cameraVideo()).toHaveAttribute('data-identity', PRESENTER)
    })

    describe('and the camera is muted', () => {
      beforeEach(() => {
        tracks = [trackRef(PRESENTER, Track.Source.Camera, { isMuted: true })]
      })

      it('should not render the camera circle', () => {
        renderStage()
        expect(cameraVideo()).not.toBeInTheDocument()
      })
    })

    describe('and the camera publication has no track yet', () => {
      beforeEach(() => {
        tracks = [trackRef(PRESENTER, Track.Source.Camera, { track: undefined })]
      })

      it('should not render the camera circle', () => {
        renderStage()
        expect(cameraVideo()).not.toBeInTheDocument()
      })
    })

    describe('and the slide is too small for a circle', () => {
      beforeEach(() => {
        state = { ...state, slide: { url: SLIDE_URL, width: 6, height: 4 } }
      })

      it('should not render the camera circle', () => {
        renderStage()
        expect(cameraVideo()).not.toBeInTheDocument()
      })
    })
  })

  describe('when the presenter has no camera publication', () => {
    beforeEach(() => {
      state = makeState({ presenterIdentity: PRESENTER })
      tracks = [{ participant: { identity: PRESENTER, isLocal: false }, source: Track.Source.Camera }]
    })

    it('should not render the camera circle', () => {
      renderStage()
      expect(cameraVideo()).not.toBeInTheDocument()
    })
  })

  describe('when the local participant is the presenter', () => {
    beforeEach(() => {
      state = makeState({ presenterIdentity: LOCAL })
      tracks = [trackRef(LOCAL, Track.Source.Camera, {}, true)]
    })

    it('should not render the camera circle', () => {
      renderStage()
      expect(cameraVideo()).not.toBeInTheDocument()
    })
  })

  describe('when no presenter is known', () => {
    beforeEach(() => {
      state = makeState({ presenterIdentity: null })
      tracks = [trackRef(PRESENTER, Track.Source.Camera)]
    })

    it('should not render the camera circle', () => {
      renderStage()
      expect(cameraVideo()).not.toBeInTheDocument()
    })
  })

  describe('when an overlay is given', () => {
    let overlay: React.ReactNode

    beforeEach(() => {
      overlay = <span data-testid="overlay" />
    })

    it('should render the overlay inside the slide box', () => {
      renderStage(overlay)
      expect(screen.getByTestId('overlay').parentElement).toBe(slideBox())
    })

    describe('and the slide URL is on another origin', () => {
      beforeEach(() => {
        state = makeState({ slide: { url: 'https://evil.example/presentations/deck/slides/0a1b2c.png', width: 1920, height: 1080 } })
      })

      it('should still render the overlay', () => {
        renderStage(overlay)
        expect(screen.getByTestId('overlay')).toBeInTheDocument()
      })
    })
  })

  describe('when the stage unmounts', () => {
    beforeEach(() => {
      renderStage()
      result.unmount()
    })

    it('should disconnect the resize observer', () => {
      expect(disconnect).toHaveBeenCalled()
    })
  })
})
