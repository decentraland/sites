import { fireEvent, render } from '@testing-library/react'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useSectionViewedTracking } from '../../../hooks/useSectionViewedTracking'
import { CreatorsFaqs } from './Faqs'

jest.mock('decentraland-ui2', () => {
  const actual = jest.requireActual('../../../__test-utils__/styledMock')
  const Typography = ({ children, ...rest }: { children?: React.ReactNode }) => <p {...rest}>{children}</p>
  return { ...actual, Typography }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

jest.mock('../../../hooks/adapters/useTrackLinkContext', () => ({
  useTrackClick: jest.fn()
}))

jest.mock('../../../hooks/useSectionViewedTracking', () => ({
  useSectionViewedTracking: jest.fn()
}))

let mockInView = false
jest.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: jest.fn(), inView: mockInView })
}))

jest.mock('../../Icon/CircleAndArrow', () => ({
  CircleAndArrow: () => <span data-testid="arrow" />
}))

const mockTrackClick = jest.mocked(useTrackClick)
const mockUseSectionViewedTracking = jest.mocked(useSectionViewedTracking)
const trackClick = jest.fn()

describe('CreatorsFaqs', () => {
  beforeEach(() => {
    mockInView = false
    mockTrackClick.mockReturnValue(trackClick)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a question is expanded', () => {
    it('should track the expand only once and not on the following collapse', () => {
      const { container } = render(<CreatorsFaqs />)

      const accordion = container.querySelector('[data-title][role="button"]') as HTMLElement
      expect(accordion).toHaveAttribute('data-place', 'Creators Faqs')

      fireEvent.click(accordion) // expand -> tracked
      fireEvent.click(accordion) // collapse -> not tracked

      expect(trackClick).toHaveBeenCalledTimes(1)
    })

    it('should track an expand triggered by the keyboard', () => {
      const { container } = render(<CreatorsFaqs />)

      const accordion = container.querySelector('[data-title][role="button"]') as HTMLElement
      fireEvent.keyDown(accordion, { key: 'Enter' })

      expect(trackClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the FAQs CTA is clicked', () => {
    it('should track the click with the Creators Faqs place', () => {
      const { container } = render(<CreatorsFaqs />)

      const cta = container.querySelector('[data-title="faqs-cta"]') as HTMLElement
      expect(cta).toHaveAttribute('data-place', 'Creators Faqs')

      fireEvent.click(cta)

      expect(trackClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the section scrolls into view', () => {
    beforeEach(() => {
      mockInView = true
    })

    it('should ask the section-viewed hook to report the Creators Faqs section', () => {
      render(<CreatorsFaqs />)

      expect(mockUseSectionViewedTracking).toHaveBeenCalledWith('Creators Faqs', true)
    })
  })
})
