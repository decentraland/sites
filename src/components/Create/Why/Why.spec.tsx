import { fireEvent, render } from '@testing-library/react'
import { SectionViewedTrack } from '../../../modules/segment'
import { whyCards } from '../data'
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

const mockTrackClick = jest.fn()
jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: () => mockTrackClick
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

    it('should render a call-to-action button label on every card', () => {
      const { getByText } = render(<CreatorsWhy />)

      whyCards.forEach(card => {
        expect(getByText(card.buttonLabel)).toBeInTheDocument()
      })
    })

    it('should render every card as a link to its destination', () => {
      const { container } = render(<CreatorsWhy />)

      const hrefs = Array.from(container.querySelectorAll('a[href]')).map(card => card.getAttribute('href'))
      expect(hrefs).toEqual(whyCards.map(card => card.url))
    })

    describe('and a card is clicked', () => {
      it('should track the click', () => {
        const { container } = render(<CreatorsWhy />)

        const firstCard = container.querySelector('a[href]')
        fireEvent.click(firstCard!)

        expect(mockTrackClick).toHaveBeenCalled()
      })
    })
  })
})
