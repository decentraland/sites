import { render } from '@testing-library/react'
import { SectionViewedTrack } from '../../../modules/segment'
import { CreatorsWhy } from './Why'

const mockAnimatedSection = jest.fn()
jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return { ...actual, Typography }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../AnimatedSection', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnimatedSection: (props: any) => {
    mockAnimatedSection(props.trackPlace)
    return <div>{props.children}</div>
  }
}))

describe('CreatorsWhy', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered', () => {
    it('should mark the section for the Creators Why section-viewed event', () => {
      render(<CreatorsWhy />)

      expect(mockAnimatedSection).toHaveBeenCalledWith(SectionViewedTrack.CREATORS_WHY)
    })

    it('should render a card image for each why entry', () => {
      const { container } = render(<CreatorsWhy />)

      expect(container.querySelectorAll('img').length).toBeGreaterThan(0)
    })
  })
})
