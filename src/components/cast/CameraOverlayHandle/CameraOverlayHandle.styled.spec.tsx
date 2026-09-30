import React from 'react'
import { render } from '@testing-library/react'
import { HandleCircle, HandleLayer, HandlePreview, HandlePreviewVideo } from './CameraOverlayHandle.styled'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const styles = new Map<unknown, unknown>()
  return {
    ...actual,
    styleOf: (component: unknown) => styles.get(component),
    styled: (tag: unknown, options: unknown) => {
      const factory = actual.styled(tag, options)
      return (style: unknown) => {
        const component = factory(style)
        styles.set(component, style)
        return component
      }
    }
  }
})
jest.mock('@livekit/components-react', () => ({
  VideoTrack: (props: Record<string, unknown>) => React.createElement('video', props)
}))

type ElementStyle = Record<string, Record<string, unknown>>

const { styleOf } = jest.requireMock<{ styleOf: (component: unknown) => ElementStyle }>('decentraland-ui2')

describe('CameraOverlayHandle styled components', () => {
  describe('when the preview video is styled', () => {
    it('should cover-fit the element itself above LiveKit specificity', () => {
      expect(styleOf(HandlePreviewVideo)['&&&']).toEqual(expect.objectContaining({ objectFit: 'cover' }))
    })

    it('should mirror the local camera', () => {
      expect(styleOf(HandlePreviewVideo)['&&&']).toEqual(expect.objectContaining({ transform: 'scaleX(-1)' }))
    })
  })

  describe('when the preview wrapper is styled', () => {
    it('should let pointer events through to the outline', () => {
      expect(styleOf(HandlePreview)).toEqual(expect.objectContaining({ pointerEvents: 'none', borderRadius: '50%' }))
    })
  })

  describe('when every export renders', () => {
    it('should render the whole handle tree', () => {
      const { container } = render(
        <HandleLayer>
          <HandleCircle $dragging={false}>
            <HandlePreview>
              <HandlePreviewVideo />
            </HandlePreview>
          </HandleCircle>
        </HandleLayer>
      )
      expect(container.querySelectorAll('video')).toHaveLength(1)
    })
  })
})
