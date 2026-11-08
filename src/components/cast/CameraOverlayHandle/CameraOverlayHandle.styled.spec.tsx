import { HandlePreview, HandlePreviewVideo } from './CameraOverlayHandle.styled'

jest.mock('decentraland-ui2', () => {
  const { styled } = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    styled: (tag: unknown, options: unknown) => (style: unknown) => {
      styled(tag, options)(style)
      return style
    }
  }
})
jest.mock('@livekit/components-react', () => ({ VideoTrack: 'video' }))

describe('when the camera overlay handle is styled', () => {
  describe('and the preview is the local camera video', () => {
    let style: unknown

    beforeEach(() => {
      style = HandlePreviewVideo
    })

    it('should cover-fit and mirror the element itself above LiveKit specificity', () => {
      expect(style).toEqual({ '&&&': expect.objectContaining({ objectFit: 'cover', transform: 'scaleX(-1)' }) })
    })
  })

  describe('and the preview wraps the video', () => {
    let style: unknown

    beforeEach(() => {
      style = HandlePreview
    })

    it('should clip it to a circle that lets pointer events through to the outline', () => {
      expect(style).toEqual(expect.objectContaining({ pointerEvents: 'none', borderRadius: '50%' }))
    })
  })
})
