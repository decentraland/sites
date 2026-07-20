import { render, screen } from '@testing-library/react'
import { useSectionViewedTracking } from '../../hooks/useSectionViewedTracking'
import { SectionViewedTrack } from '../../modules/segment'
import { AnimatedSection } from './AnimatedSection'

let mockInView = false
jest.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: jest.fn(), inView: mockInView })
}))

jest.mock('../../hooks/useSectionViewedTracking', () => ({
  useSectionViewedTracking: jest.fn()
}))

jest.mock('decentraland-ui2', () => {
  const { styled } = jest.requireActual('../../__test-utils__/styledMock')
  return { styled }
})

const mockUseSectionViewedTracking = jest.mocked(useSectionViewedTracking)

describe('AnimatedSection', () => {
  beforeEach(() => {
    mockInView = false
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendered', () => {
    it('should render its children', () => {
      render(
        <AnimatedSection>
          <span>child content</span>
        </AnimatedSection>
      )

      expect(screen.getByText('child content')).toBeInTheDocument()
    })
  })

  describe('when a trackPlace is provided and the section is in view', () => {
    beforeEach(() => {
      mockInView = true
    })

    it('should forward the place and in-view state to the section-viewed hook', () => {
      render(
        <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_WHY}>
          <span>child</span>
        </AnimatedSection>
      )

      expect(mockUseSectionViewedTracking).toHaveBeenCalledWith(SectionViewedTrack.CREATORS_WHY, true)
    })

    it('should apply the visible class once in view', () => {
      const { container } = render(
        <AnimatedSection>
          <span>child</span>
        </AnimatedSection>
      )

      expect(container.querySelector('section')?.className).toContain('visible')
    })
  })

  describe('when no trackPlace is provided', () => {
    it('should still call the hook with an undefined place so it stays a no-op', () => {
      render(
        <AnimatedSection>
          <span>child</span>
        </AnimatedSection>
      )

      expect(mockUseSectionViewedTracking).toHaveBeenCalledWith(undefined, false)
    })
  })
})
