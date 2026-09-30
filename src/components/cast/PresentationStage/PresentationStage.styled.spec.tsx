import React from 'react'
import { render } from '@testing-library/react'
import { CameraCircle, CircleVideo, RegionVideo, SlideBox, SlideImage, StageContainer, VideoRegion } from './PresentationStage.styled'

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

describe('PresentationStage styled components', () => {
  describe('when the camera circle video is styled', () => {
    it('should cover-fit the element itself above LiveKit specificity', () => {
      expect(styleOf(CircleVideo)['&&&']).toEqual(expect.objectContaining({ objectFit: 'cover' }))
    })
  })

  describe('when the embedded video is styled', () => {
    it('should contain-fit the element itself above LiveKit specificity', () => {
      expect(styleOf(RegionVideo)['&&&']).toEqual(expect.objectContaining({ objectFit: 'contain' }))
    })
  })

  describe('when every export renders', () => {
    it('should render the whole stage tree', () => {
      const { container } = render(
        <StageContainer>
          <SlideBox>
            <SlideImage alt="slide" />
            <VideoRegion>
              <RegionVideo />
            </VideoRegion>
            <CameraCircle>
              <CircleVideo />
            </CameraCircle>
          </SlideBox>
        </StageContainer>
      )
      expect(container.querySelectorAll('video')).toHaveLength(2)
    })
  })
})
