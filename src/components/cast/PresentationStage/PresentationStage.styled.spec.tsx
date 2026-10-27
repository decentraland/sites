import { CircleVideo, RegionVideo, VideoRegion } from './PresentationStage.styled'

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

describe.each([
  ['camera circle video', CircleVideo, 'cover'],
  ['embedded video', RegionVideo, 'contain']
])('when the %s is styled', (_, component, objectFit) => {
  let style: unknown

  beforeEach(() => {
    style = component
  })

  it(`should ${objectFit}-fit the element itself above LiveKit specificity`, () => {
    expect(style).toEqual({ '&&&': expect.objectContaining({ objectFit }) })
  })
})

describe('when the video region is styled', () => {
  let style: Record<string, unknown>

  beforeEach(() => {
    const regionStyle = VideoRegion as unknown as (props: { theme: unknown }) => Record<string, unknown>
    style = regionStyle({ theme: { palette: { common: { black: '#000' } } } })
  })

  it('should not clip the unmute button in a short region', () => {
    expect(style).not.toHaveProperty('overflow')
  })
})
