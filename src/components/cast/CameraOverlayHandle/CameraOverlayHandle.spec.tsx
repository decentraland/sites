import React from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import type { OverlayLayout, SlideInfo } from '../../../features/cast2/cast2.types'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import { CameraOverlayHandle } from './CameraOverlayHandle'

jest.mock('@livekit/components-react', () => ({ useLocalParticipant: jest.fn() }))
jest.mock('../../../features/cast2/contexts/PresentationContext', () => ({ usePresentation: jest.fn() }))
jest.mock('../../../features/cast2/useCastTranslation', () => ({ useCastTranslation: () => ({ t: (key: string) => key }) }))
jest.mock('./CameraOverlayHandle.styled', () => ({
  HandleLayer: React.forwardRef<HTMLDivElement, { children?: React.ReactNode }>(({ children }, ref) =>
    React.createElement('div', { ref }, children)
  ),
  HandleCircle: ({ $dragging, ...rest }: { $dragging: boolean }) => React.createElement('button', { ...rest, 'data-dragging': $dragging }),
  HandlePreview: ({ children }: { children?: React.ReactNode }) => children,
  HandlePreviewVideo: ({ trackRef }: { trackRef: { source: string; participant: { identity: string } } }) =>
    React.createElement('div', { 'data-testid': 'preview', 'data-track': `${trackRef.source}:${trackRef.participant.identity}` })
}))

type CameraTrack = { track?: object; isMuted: boolean } | undefined

const HINT = 'streaming_controls.camera_overlay.drag_hint'
const SLIDE: SlideInfo = { url: 'https://presenter.test/presentations/p1/slides/ab12.png', width: 1920, height: 1080 }
const CAMERA_ON: CameraTrack = { track: {}, isMuted: false }

const circle = () => screen.queryByRole('button', { name: HINT })
const position = () => ['left', 'top', 'width'].map(key => circle()?.style.getPropertyValue(key))
const firePointer = (type: string, clientX: number) => {
  act(() => {
    circle()?.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY: 448, button: 0, buttons: 1 }))
  })
}

describe('when the camera overlay handle renders', () => {
  let overlay: OverlayLayout
  let slide: SlideInfo | null
  let presenterIdentity: string | null
  let cameraTrack: CameraTrack
  let setOverlay: jest.Mock
  let onTileClick: jest.Mock
  let now: number
  let videoSize: { width: number; height: number }
  let layerSize: { width: number; height: number }
  let resizeCallback: () => void
  let disconnect: jest.Mock
  let view: RenderResult

  const tree = () => (
    <div onClick={onTileClick}>
      <video />
      <CameraOverlayHandle />
    </div>
  )
  const renderHandle = () => {
    view = render(tree())
  }

  beforeEach(() => {
    overlay = { x: 0, y: 1, size: 'small' }
    slide = null
    presenterIdentity = null
    cameraTrack = undefined
    setOverlay = jest.fn()
    onTileClick = jest.fn()
    now = 1000
    videoSize = { width: 960, height: 540 }
    layerSize = { width: 960, height: 540 }
    disconnect = jest.fn()
    jest.mocked(usePresentation).mockImplementation(() => ({ state: { overlay, slide, presenterIdentity }, setOverlay }) as never)
    jest.mocked(useLocalParticipant).mockImplementation(() => ({ localParticipant: { identity: '0xabc' }, cameraTrack }) as never)
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    jest.spyOn(HTMLVideoElement.prototype, 'videoWidth', 'get').mockImplementation(() => videoSize.width)
    jest.spyOn(HTMLVideoElement.prototype, 'videoHeight', 'get').mockImplementation(() => videoSize.height)
    jest.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(() => layerSize.width)
    jest.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => layerSize.height)
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 960, height: 540 } as DOMRect)
    jest.spyOn(globalThis, 'ResizeObserver').mockImplementation(callback => {
      resizeCallback = callback as () => void
      return { observe: jest.fn(), unobserve: jest.fn(), disconnect }
    })
    HTMLElement.prototype.setPointerCapture = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and it is laid over a 960x540 video', () => {
    beforeEach(renderHandle)

    it('should outline the bubble at its server position', () => {
      expect(position()).toEqual(['18px', '376px', '144px'])
    })

    describe('and the outline is grabbed off-centre and dragged', () => {
      beforeEach(() => {
        firePointer('pointerdown', 100)
        firePointer('pointermove', 120)
      })

      it('should move the outline keeping the grab offset', () => {
        expect(position()).toEqual(['38px', '376px', '144px'])
      })

      it('should mark the outline as dragging', () => {
        expect(circle()).toHaveAttribute('data-dragging', 'true')
      })

      describe.each([
        ['within 100 ms of the last send', 1030, 1],
        ['100 ms after the last send', 1100, 2]
      ])('and another move lands %s', (_, time, sends) => {
        beforeEach(() => {
          now = time
          firePointer('pointermove', 150)
        })

        it(`should have sent ${sends} position update(s)`, () => {
          expect(setOverlay).toHaveBeenCalledTimes(sends)
        })
      })

      describe('and the server echoes another position mid-drag', () => {
        beforeEach(() => {
          overlay = { x: 1, y: 0, size: 'small' }
          view.rerender(tree())
        })

        it('should keep the dragged position', () => {
          expect(position()).toEqual(['38px', '376px', '144px'])
        })
      })

      describe('and the outline is released', () => {
        beforeEach(() => {
          firePointer('pointerup', 120)
        })

        it('should send the dropped position', () => {
          expect(setOverlay).toHaveBeenLastCalledWith({ x: expect.closeTo(110 / 960), y: expect.closeTo(448 / 540) })
        })

        describe('and it is grabbed again at its centre and dragged', () => {
          beforeEach(() => {
            firePointer('pointerdown', 90)
            firePointer('pointermove', 120)
          })

          it('should use a fresh grab offset', () => {
            expect(position()).toEqual(['48px', '376px', '144px'])
          })
        })
      })
    })

    describe('and the outline is clicked without moving', () => {
      beforeEach(() => {
        firePointer('pointerdown', 100)
        firePointer('pointerup', 100)
        fireEvent.click(circle() as HTMLElement)
      })

      it('should send nothing', () => {
        expect(setOverlay).not.toHaveBeenCalled()
      })

      it('should not bubble the click to the tile', () => {
        expect(onTileClick).not.toHaveBeenCalled()
      })

      describe('and the server moves the bubble', () => {
        beforeEach(() => {
          overlay = { x: 1, y: 0, size: 'small' }
          view.rerender(tree())
        })

        it('should follow the server position', () => {
          expect(position()).toEqual(['796px', '18px', '144px'])
        })
      })
    })

    describe('and the tile resizes', () => {
      beforeEach(() => {
        layerSize = { width: 480, height: 480 }
        act(() => resizeCallback())
      })

      it('should rescale the outline to the letterboxed video', () => {
        expect(position()).toEqual(['9px', '293px', '72px'])
      })
    })

    describe('and it unmounts', () => {
      beforeEach(() => {
        view.unmount()
      })

      it('should stop observing the layer', () => {
        expect(disconnect).toHaveBeenCalled()
      })
    })
  })

  describe.each([
    ['the video has no intrinsic size yet', () => (videoSize = { width: 0, height: 0 })],
    ['the slide is too small for a bubble', () => (slide = { ...SLIDE, width: 6, height: 4 })]
  ])('and %s', (_, arrange) => {
    beforeEach(() => {
      arrange()
      renderHandle()
    })

    it('should render no outline', () => {
      expect(circle()).not.toBeInTheDocument()
    })
  })

  describe('and the video metadata loads after the first render', () => {
    beforeEach(() => {
      videoSize = { width: 0, height: 0 }
      renderHandle()
      videoSize = { width: 960, height: 540 }
      act(() => {
        view.container.querySelector('video')?.dispatchEvent(new Event('loadedmetadata'))
      })
    })

    it('should outline the bubble at its server position', () => {
      expect(position()).toEqual(['18px', '376px', '144px'])
    })
  })

  describe('and the local participant presents a client-composed slide with the camera on', () => {
    beforeEach(() => {
      slide = SLIDE
      presenterIdentity = '0xabc'
      cameraTrack = CAMERA_ON
      renderHandle()
    })

    it('should place the outline from the slide size', () => {
      expect(position()).toEqual(['19px', '377px', '144px'])
    })

    it('should preview the local camera inside the outline', () => {
      expect(within(circle() as HTMLElement).getByTestId('preview')).toHaveAttribute('data-track', 'camera:0xabc')
    })
  })

  describe.each<[string, SlideInfo | null, string, CameraTrack]>([
    ['the presentation is not client-composed', null, '0xabc', CAMERA_ON],
    ['another participant presents', SLIDE, '0xdef', CAMERA_ON],
    ['the local camera is muted', SLIDE, '0xabc', { track: {}, isMuted: true }],
    ['the local camera publication has no track', SLIDE, '0xabc', { isMuted: false }],
    ['the local camera is off', SLIDE, '0xabc', undefined]
  ])('and %s', (_, slideInfo, presenter, camera) => {
    beforeEach(() => {
      slide = slideInfo
      presenterIdentity = presenter
      cameraTrack = camera
      renderHandle()
    })

    it('should not preview the local camera', () => {
      expect(screen.queryByTestId('preview')).not.toBeInTheDocument()
    })
  })
})
