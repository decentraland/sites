import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import type { PresentationContextValue, PresentationState } from '../../../features/cast2/contexts/PresentationContext'
import { useLocalVideoTracks } from '../../../hooks/useLocalVideoTracks'
import { PresentationControls } from './PresentationControls'

jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/styledMock'))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentation: jest.fn() }))
jest.mock('../../../hooks/useLocalVideoTracks', () => ({ useLocalVideoTracks: jest.fn() }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('../common/DeviceSelector/DeviceSelector.styled', () => ({
  DropdownList: ({
    open,
    onClose,
    MenuListProps,
    children
  }: {
    open: boolean
    onClose: () => void
    MenuListProps: Record<string, string>
    children: React.ReactNode
  }) =>
    open
      ? React.createElement(
          'ul',
          {
            role: 'menu',
            id: MenuListProps.id,
            'aria-labelledby': MenuListProps['aria-labelledby'],
            onKeyDown: (event: React.KeyboardEvent) => event.key === 'Escape' && onClose()
          },
          children
        )
      : null,
  DropdownItem: ({ selected, children, ...rest }: { selected: boolean; children: React.ReactNode }) =>
    React.createElement('li', { ...rest, 'data-selected': String(selected) }, children)
}))

const mockUsePresentation = usePresentation as jest.Mock
const mockUseLocalVideoTracks = useLocalVideoTracks as jest.Mock

const MENU_BUTTON = 'streaming_controls.camera_overlay.menu_button'
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
    mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the camera is off', () => {
    beforeEach(() => {
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: false })
      render(<PresentationControls />)
    })

    it('should not render the camera bubble button', () => {
      expect(screen.queryByRole('button', { name: MENU_BUTTON })).not.toBeInTheDocument()
    })
  })

  describe('when the camera is on and the camera bubble button is clicked', () => {
    beforeEach(() => {
      render(<PresentationControls />)
      fireEvent.click(screen.getByRole('button', { name: MENU_BUTTON }))
    })

    it('should mark the button as expanded and controlling the menu', () => {
      const button = screen.getByRole('button', { name: MENU_BUTTON })
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(button).toHaveAttribute('aria-controls', screen.getByRole('menu').id)
    })

    it('should list both sizes and the four corners', () => {
      const labels = screen.getAllByRole('menuitemradio').map(item => item.textContent)
      expect(labels).toEqual([
        'streaming_controls.camera_overlay.size_small',
        'streaming_controls.camera_overlay.size_large',
        'streaming_controls.camera_overlay.top_left',
        'streaming_controls.camera_overlay.top_right',
        'streaming_controls.camera_overlay.bottom_left',
        'streaming_controls.camera_overlay.bottom_right'
      ])
    })

    it('should mark the current size and corner as checked', () => {
      const checked = screen.getAllByRole('menuitemradio', { checked: true }).map(item => item.textContent)
      expect(checked).toEqual(['streaming_controls.camera_overlay.size_small', 'streaming_controls.camera_overlay.bottom_left'])
    })

    it('should separate the sizes from the corners', () => {
      expect(screen.getByRole('separator')).toBeInTheDocument()
    })

    describe('and the large size is picked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('menuitemradio', { name: 'streaming_controls.camera_overlay.size_large' }))
      })

      it('should set the overlay size', () => {
        expect(presentation.setOverlay).toHaveBeenCalledWith({ size: 'large' })
      })

      it('should close the menu', () => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      })
    })

    describe('and the top right corner is picked', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('menuitemradio', { name: 'streaming_controls.camera_overlay.top_right' }))
      })

      it('should move the overlay to that corner', () => {
        expect(presentation.setOverlay).toHaveBeenCalledWith({ x: 1, y: 0 })
      })
    })

    describe('and Escape is pressed in the menu', () => {
      beforeEach(() => {
        fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
      })

      it('should close the menu', () => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: MENU_BUTTON })).toHaveAttribute('aria-expanded', 'false')
      })
    })

    describe('and ArrowRight is pressed', () => {
      beforeEach(() => {
        fireEvent.keyDown(window, { key: 'ArrowRight' })
      })

      it('should not navigate the slides', () => {
        expect(presentation.navigateSlide).not.toHaveBeenCalled()
      })
    })
  })

  describe('when the overlay sits off any corner', () => {
    beforeEach(() => {
      mockPresentationState({ overlay: { x: 0.5, y: 0.5, size: 'large' } })
      render(<PresentationControls />)
      fireEvent.click(screen.getByRole('button', { name: MENU_BUTTON }))
    })

    it('should only mark the size as checked', () => {
      const checked = screen.getAllByRole('menuitemradio', { checked: true }).map(item => item.textContent)
      expect(checked).toEqual(['streaming_controls.camera_overlay.size_large'])
    })
  })

  describe('when the menu is open and the camera turns off and on again', () => {
    beforeEach(() => {
      const { rerender } = render(<PresentationControls />)
      fireEvent.click(screen.getByRole('button', { name: MENU_BUTTON }))
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: false, hasLocalScreenShare: false })
      rerender(<PresentationControls />)
      mockUseLocalVideoTracks.mockReturnValue({ hasLocalCamera: true, hasLocalScreenShare: false })
      rerender(<PresentationControls />)
    })

    it('should leave the menu closed', () => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should navigate the slides with ArrowRight again', () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(presentation.navigateSlide).toHaveBeenCalledWith('next')
    })
  })

  describe('when the menu is open and the presentation ends and restarts', () => {
    beforeEach(() => {
      const { rerender } = render(<PresentationControls />)
      fireEvent.click(screen.getByRole('button', { name: MENU_BUTTON }))
      mockPresentationState({ status: 'idle' })
      rerender(<PresentationControls />)
      mockPresentationState()
      rerender(<PresentationControls />)
    })

    it('should leave the menu closed', () => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })

  describe('when the menu is closed', () => {
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
