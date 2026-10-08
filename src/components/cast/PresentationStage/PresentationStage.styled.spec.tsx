import { CircleVideo, RegionVideo } from './PresentationStage.styled'

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
