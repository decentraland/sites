import { fireEvent, render, screen } from '@testing-library/react'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import type { PresentationContextValue, PresentationState } from '../../../features/cast2/contexts/PresentationContext'
import { PresentationControls } from './PresentationControls'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentation: jest.fn() }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))

const mockUsePresentation = usePresentation as jest.Mock

const SLIDE_VIDEOS: PresentationState['slideVideos'] = [
  { url: 'https://example.com/video.mp4', geometry: { x: 0, y: 0, width: 1, height: 1 } }
]

const buildState = (overrides: Partial<PresentationState> = {}): PresentationState => ({
  id: 'presentation-1',
  slideCount: 3,
  currentSlide: 1,
  fileType: 'pdf',
  status: 'active',
  slideVideos: [],
  videoState: 'idle',
  overlay: { x: 0, y: 1, size: 'small' },
  ...overrides
})

describe('PresentationControls', () => {
  let presentation: PresentationContextValue

  const mockPresentationState = (overrides: Partial<PresentationState> = {}) => {
    presentation = { ...presentation, state: buildState(overrides) }
    mockUsePresentation.mockReturnValue(presentation)
  }

  beforeEach(() => {
    presentation = {
      state: buildState(),
      startPresentation: jest.fn(),
      startPresentationFromUrl: jest.fn(),
      navigateSlide: jest.fn(),
      goToSlide: jest.fn(),
      playVideo: jest.fn(),
      pauseVideo: jest.fn(),
      stopVideo: jest.fn(),
      setOverlay: jest.fn(),
      stopPresentation: jest.fn(),
      isPresentationActive: true,
      presentationParticipantIdentity: 'bot'
    }
    mockUsePresentation.mockReturnValue(presentation)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the presentation is active', () => {
    beforeEach(() => {
      render(<PresentationControls />)
    })

    it('should navigate to the next slide with ArrowRight', () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(presentation.navigateSlide).toHaveBeenCalledWith('next')
    })

    it('should navigate to the previous slide with ArrowLeft', () => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      expect(presentation.navigateSlide).toHaveBeenCalledWith('prev')
    })

    it('should ignore keys typed into an input', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      fireEvent.keyDown(input, { key: 'ArrowRight' })
      expect(presentation.navigateSlide).not.toHaveBeenCalled()
      input.remove()
    })

    it('should navigate with the previous and next buttons', () => {
      const [previous, next] = screen.getAllByRole('button')
      fireEvent.click(previous)
      fireEvent.click(next)
      expect(presentation.navigateSlide).toHaveBeenNthCalledWith(1, 'prev')
      expect(presentation.navigateSlide).toHaveBeenNthCalledWith(2, 'next')
    })

    it('should not offer camera bubble options in the slide controls', () => {
      expect(screen.queryByRole('button', { name: /camera_overlay/ })).not.toBeInTheDocument()
    })

    it('should show the slide position', () => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })
  })

  describe('when the slide has an idle video', () => {
    beforeEach(() => {
      mockPresentationState({ slideVideos: SLIDE_VIDEOS })
      render(<PresentationControls />)
    })

    it('should play the video with the toggle button', () => {
      fireEvent.click(screen.getAllByRole('button')[2])
      expect(presentation.playVideo).toHaveBeenCalledWith(0)
    })

    it('should play the video with Space', () => {
      fireEvent.keyDown(window, { key: ' ' })
      expect(presentation.playVideo).toHaveBeenCalledWith(0)
    })
  })

  describe('when the slide video is playing', () => {
    beforeEach(() => {
      mockPresentationState({
        slideVideos: SLIDE_VIDEOS,
        videoState: 'playing'
      })
      render(<PresentationControls />)
    })

    it('should pause the video with the toggle button', () => {
      fireEvent.click(screen.getAllByRole('button')[2])
      expect(presentation.pauseVideo).toHaveBeenCalled()
    })

    it('should stop the video with the stop button', () => {
      fireEvent.click(screen.getAllByRole('button')[3])
      expect(presentation.stopVideo).toHaveBeenCalled()
    })
  })

  describe('when the slide video is loading', () => {
    beforeEach(() => {
      mockPresentationState({
        slideVideos: SLIDE_VIDEOS,
        videoState: 'loading'
      })
      render(<PresentationControls />)
    })

    it('should ignore Space', () => {
      fireEvent.keyDown(window, { key: ' ' })
      expect(presentation.playVideo).not.toHaveBeenCalled()
      expect(presentation.pauseVideo).not.toHaveBeenCalled()
    })
  })

  describe('when the presentation is uploading', () => {
    beforeEach(() => {
      mockPresentationState({ status: 'uploading' })
      render(<PresentationControls />)
    })

    it('should show the uploading message', () => {
      expect(screen.getByText('streaming_controls.uploading_presentation')).toBeInTheDocument()
    })
  })
})
