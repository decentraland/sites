import React from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { OverlayLayout, SlideInfo } from '../../../features/cast2/cast2.types'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import { CameraOverlayHandle } from './CameraOverlayHandle'

jest.mock('@livekit/components-react', () => ({ useLocalParticipant: jest.fn(), VideoTrack: () => null }))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentation: jest.fn() }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({
  useCastTranslation: () => ({ t: (key: string) => key })
}))
jest.mock('./CameraOverlayHandle.styled', () => ({
  HandleLayer: React.forwardRef<HTMLDivElement, { children?: React.ReactNode }>(({ children, ...rest }, ref) =>
    React.createElement('div', { ...rest, ref }, children)
  ),
  HandleCircle: ({ $left, $dragging, style, ...rest }: Record<string, unknown>) =>
    React.createElement('button', {
      ...rest,
      'data-left': (style as React.CSSProperties).left,
      'data-top': (style as React.CSSProperties).top,
      'data-size': (style as React.CSSProperties).width,
      'data-transient-left': $left,
      'data-dragging': String($dragging)
    }),
  HandlePreview: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'handle-preview' }, children),
  HandlePreviewVideo: ({ trackRef }: { trackRef: { source: string; participant: { identity: string } } }) =>
    React.createElement('div', {
      'data-testid': 'handle-preview-video',
      'data-source': trackRef.source,
      'data-identity': trackRef.participant.identity
    })
}))

const mockUsePresentation = usePresentation as jest.Mock
const mockUseLocalParticipant = useLocalParticipant as jest.Mock

const HINT = 'streaming_controls.camera_overlay.drag_hint'

const firePointer = (element: HTMLElement, type: string, clientX: number, clientY: number, buttons = 1) => {
  act(() => {
    element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY, button: 0, buttons }))
  })
}

const stubProperty = (target: object, key: string, get: () => unknown) => {
  const original = Object.getOwnPropertyDescriptor(target, key)
  Object.defineProperty(target, key, { configurable: true, get })
  return () => {
    if (original) Object.defineProperty(target, key, original)
    else delete (target as Record<string, unknown>)[key]
  }
}

describe('CameraOverlayHandle', () => {
  let overlay: OverlayLayout
  let setOverlay: jest.Mock
  let now: number
  let videoSize: { width: number; height: number }
  let layerSize: { width: number; height: number }
  let resizeCallback: () => void
  let disconnect: jest.Mock
  let restorers: Array<() => void>
  let originalResizeObserver: typeof ResizeObserver
  let onTileClick: jest.Mock

  const tree = () => (
    <div onClick={onTileClick}>
      <video />
      <CameraOverlayHandle />
    </div>
  )

  const renderHandle = () => render(tree())

  const circle = () => screen.getByRole('button', { name: HINT })

  const position = () => ({
    left: circle().getAttribute('data-left'),
    top: circle().getAttribute('data-top'),
    size: circle().getAttribute('data-size')
  })

  beforeEach(() => {
    overlay = { x: 0, y: 1, size: 'small' }
    setOverlay = jest.fn(async (patch: Partial<OverlayLayout>) => {
      overlay = { ...overlay, ...patch }
    })
    mockUsePresentation.mockImplementation(() => ({ state: { overlay, slide: null, presenterIdentity: null }, setOverlay }))
    mockUseLocalParticipant.mockReturnValue({ localParticipant: { identity: '0xabc' }, cameraTrack: undefined })
    now = 1000
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    videoSize = { width: 960, height: 540 }
    layerSize = { width: 960, height: 540 }
    onTileClick = jest.fn()
    restorers = [
      stubProperty(HTMLVideoElement.prototype, 'videoWidth', () => videoSize.width),
      stubProperty(HTMLVideoElement.prototype, 'videoHeight', () => videoSize.height),
      stubProperty(HTMLElement.prototype, 'clientWidth', () => layerSize.width),
      stubProperty(HTMLElement.prototype, 'clientHeight', () => layerSize.height)
    ]
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 960, height: 540 } as DOMRect)
    HTMLElement.prototype.setPointerCapture = jest.fn()
    HTMLElement.prototype.releasePointerCapture = jest.fn()
    HTMLElement.prototype.hasPointerCapture = jest.fn(() => true)
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

  describe('when it first renders over a 960x540 slide', () => {
    it('should outline the bubble at its server position', () => {
      renderHandle()
      expect(position()).toEqual({ left: '18', top: '376', size: '144' })
    })

    it('should pass the geometry through the style prop instead of a styled prop', () => {
      renderHandle()
      expect(circle()).not.toHaveAttribute('data-transient-left')
    })

    it('should label the outline with the drag hint', () => {
      renderHandle()
      expect(circle()).toHaveAttribute('title', HINT)
      expect(circle()).toHaveAttribute('type', 'button')
    })
  })

  describe('when the outline is grabbed off-centre and dragged', () => {
    it('should keep the grab offset', () => {
      renderHandle()
      firePointer(circle(), 'pointerdown', 100, 448)
      firePointer(circle(), 'pointermove', 120, 448)
      expect(position()).toEqual({ left: '38', top: '376', size: '144' })
      expect(circle()).toHaveAttribute('data-dragging', 'true')
    })
  })

  describe('when a drag moves several times', () => {
    it('should send at most once per 100 ms and once more on release', () => {
      renderHandle()
      firePointer(circle(), 'pointerdown', 100, 448)
      firePointer(circle(), 'pointermove', 120, 448)
      now = 1050
      firePointer(circle(), 'pointermove', 130, 448)
      now = 1100
      firePointer(circle(), 'pointermove', 140, 448)
      expect(setOverlay).toHaveBeenCalledTimes(2)
      now = 1120
      firePointer(circle(), 'pointerup', 140, 448)
      expect(setOverlay).toHaveBeenCalledTimes(3)
      const [patch] = setOverlay.mock.calls[2]
      expect(patch.x).toBeCloseTo(130 / 960)
      expect(patch.y).toBeCloseTo(448 / 540)
    })
  })

  describe('when a move lands within 100 ms of a send', () => {
    it('should move the outline without sending', () => {
      renderHandle()
      firePointer(circle(), 'pointerdown', 100, 448)
      firePointer(circle(), 'pointermove', 120, 448)
      expect(setOverlay).toHaveBeenCalledTimes(1)
      now = 1030
      firePointer(circle(), 'pointermove', 150, 448)
      expect(setOverlay).toHaveBeenCalledTimes(1)
      expect(circle()).toHaveAttribute('data-left', '68')
    })
  })

  describe('when a second drag follows the first', () => {
    it('should use a fresh grab offset from the dropped position', () => {
      const view = renderHandle()
      firePointer(circle(), 'pointerdown', 100, 448)
      firePointer(circle(), 'pointermove', 120, 448)
      firePointer(circle(), 'pointerup', 120, 448)
      overlay = { ...overlay, x: 110 / 960, y: 448 / 540 }
      view.rerender(tree())
      now = 2000
      firePointer(circle(), 'pointerdown', 120, 448)
      firePointer(circle(), 'pointermove', 140, 448)
      expect(circle()).toHaveAttribute('data-left', '58')
    })
  })

  describe('when a server echo arrives mid-drag', () => {
    it('should keep the dragged position', () => {
      const view = renderHandle()
      firePointer(circle(), 'pointerdown', 100, 448)
      firePointer(circle(), 'pointermove', 120, 448)
      overlay = { x: 0.3, y: 0.3, size: 'small' }
      view.rerender(tree())
      expect(position()).toEqual({ left: '38', top: '376', size: '144' })
    })
  })

  describe('when the outline is clicked without moving', () => {
    it('should send nothing and keep following the server position', () => {
      const view = renderHandle()
      firePointer(circle(), 'pointerdown', 100, 448)
      firePointer(circle(), 'pointerup', 100, 448)
      fireEvent.click(circle())
      expect(setOverlay).not.toHaveBeenCalled()
      overlay = { x: 1, y: 0, size: 'small' }
      view.rerender(tree())
      expect(position()).toEqual({ left: '796', top: '18', size: '144' })
    })

    it('should not bubble the click to the tile', () => {
      renderHandle()
      fireEvent.click(circle())
      expect(onTileClick).not.toHaveBeenCalled()
    })
  })

  describe('when the press is lost before release', () => {
    it('should drop the local position and send nothing more', () => {
      const view = renderHandle()
      firePointer(circle(), 'pointerdown', 100, 448)
      firePointer(circle(), 'pointermove', 120, 448)
      firePointer(circle(), 'pointermove', 130, 448, 0)
      overlay = { x: 1, y: 0, size: 'small' }
      view.rerender(tree())
      expect(position()).toEqual({ left: '796', top: '18', size: '144' })
      expect(setOverlay).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the video has no intrinsic size', () => {
    beforeEach(() => {
      videoSize = { width: 0, height: 0 }
    })

    it('should render nothing', () => {
      renderHandle()
      expect(screen.queryByRole('button', { name: HINT })).not.toBeInTheDocument()
    })

    it('should appear once the video metadata loads', () => {
      const { container } = renderHandle()
      videoSize = { width: 960, height: 540 }
      act(() => {
        container.querySelector('video')?.dispatchEvent(new Event('loadedmetadata'))
      })
      expect(position()).toEqual({ left: '18', top: '376', size: '144' })
    })
  })

  describe('when the tile resizes', () => {
    it('should rescale the outline to the letterboxed slide', () => {
      renderHandle()
      layerSize = { width: 480, height: 480 }
      act(() => resizeCallback())
      expect(position()).toEqual({ left: '9', top: '293', size: '72' })
    })
  })

  describe('when it unmounts', () => {
    it('should stop observing the layer', () => {
      const view = renderHandle()
      view.unmount()
      expect(disconnect).toHaveBeenCalled()
    })
  })

  describe('when the video is too small for a bubble', () => {
    beforeEach(() => {
      videoSize = { width: 6, height: 4 }
    })

    it('should render no outline', () => {
      renderHandle()
      expect(screen.queryByRole('button', { name: HINT })).not.toBeInTheDocument()
    })
  })

  describe('when the local camera is on without a client-composed slide', () => {
    beforeEach(() => {
      mockUseLocalParticipant.mockReturnValue({ localParticipant: { identity: '0xabc' }, cameraTrack: { track: {}, isMuted: false } })
    })

    it('should not preview the camera inside the outline', () => {
      renderHandle()
      expect(screen.queryByTestId('handle-preview')).not.toBeInTheDocument()
    })
  })

  describe('when the presentation is client-composed', () => {
    let slide: SlideInfo
    let presenterIdentity: string | null

    const slideTree = () => (
      <div>
        <CameraOverlayHandle />
      </div>
    )

    const renderSlideHandle = () => render(slideTree())

    beforeEach(() => {
      slide = { url: 'https://presenter.test/presentations/p1/slides/ab12.png', width: 1920, height: 1080 }
      presenterIdentity = '0xabc'
      mockUsePresentation.mockImplementation(() => ({ state: { overlay, slide, presenterIdentity }, setOverlay }))
    })

    describe('and the layer has no video sibling', () => {
      it('should place the outline from the slide size', () => {
        renderSlideHandle()
        expect(position()).toEqual({ left: '19', top: '377', size: '144' })
      })

      it('should not preview a camera that is absent', () => {
        renderSlideHandle()
        expect(screen.queryByTestId('handle-preview')).not.toBeInTheDocument()
      })
    })

    describe('and the layer resizes', () => {
      it('should rescale the outline to the letterboxed slide', () => {
        renderSlideHandle()
        layerSize = { width: 480, height: 480 }
        act(() => resizeCallback())
        expect(position()).toEqual({ left: '9.5', top: '293.5', size: '72' })
      })
    })

    describe('and it unmounts', () => {
      it('should stop observing the layer', () => {
        const view = renderSlideHandle()
        view.unmount()
        expect(disconnect).toHaveBeenCalled()
      })
    })

    describe('and the slide is too small for a bubble', () => {
      beforeEach(() => {
        slide = { ...slide, width: 6, height: 4 }
      })

      it('should render no outline', () => {
        renderSlideHandle()
        expect(screen.queryByRole('button', { name: HINT })).not.toBeInTheDocument()
      })
    })

    describe('and the local participant presents with the camera on', () => {
      beforeEach(() => {
        mockUseLocalParticipant.mockReturnValue({ localParticipant: { identity: '0xabc' }, cameraTrack: { track: {}, isMuted: false } })
      })

      it('should preview the local camera inside the outline', () => {
        renderSlideHandle()
        expect(circle()).toContainElement(screen.getByTestId('handle-preview-video'))
      })

      it('should preview the camera source of the local participant', () => {
        renderSlideHandle()
        expect(screen.getByTestId('handle-preview-video')).toHaveAttribute('data-source', 'camera')
        expect(screen.getByTestId('handle-preview-video')).toHaveAttribute('data-identity', '0xabc')
      })
    })

    describe('and another participant presents', () => {
      beforeEach(() => {
        presenterIdentity = '0xdef'
        mockUseLocalParticipant.mockReturnValue({ localParticipant: { identity: '0xabc' }, cameraTrack: { track: {}, isMuted: false } })
      })

      it('should not preview the local camera', () => {
        renderSlideHandle()
        expect(screen.queryByTestId('handle-preview')).not.toBeInTheDocument()
      })
    })

    describe('and the local camera is muted', () => {
      beforeEach(() => {
        mockUseLocalParticipant.mockReturnValue({ localParticipant: { identity: '0xabc' }, cameraTrack: { track: {}, isMuted: true } })
      })

      it('should not preview the local camera', () => {
        renderSlideHandle()
        expect(screen.queryByTestId('handle-preview')).not.toBeInTheDocument()
      })
    })

    describe('and the local camera publication has no track', () => {
      beforeEach(() => {
        mockUseLocalParticipant.mockReturnValue({ localParticipant: { identity: '0xabc' }, cameraTrack: { isMuted: false } })
      })

      it('should not preview the local camera', () => {
        renderSlideHandle()
        expect(screen.queryByTestId('handle-preview')).not.toBeInTheDocument()
      })
    })
  })
})
