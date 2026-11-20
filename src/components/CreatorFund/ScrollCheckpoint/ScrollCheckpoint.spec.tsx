import { useInView } from 'react-intersection-observer'
import { render } from '@testing-library/react'
import { useMobileMediaQuery } from 'decentraland-ui2'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { isAnalyticsOffForVisitor } from '../../../modules/analyticsSessionGate'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { SCROLL_SECTIONS } from '../data'
import { ScrollCheckpoint } from './ScrollCheckpoint'

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn()
}))

jest.mock('decentraland-ui2', () => ({
  useMobileMediaQuery: jest.fn()
}))

jest.mock('../../../hooks/useDeferredTrack', () => ({
  useDeferredTrack: jest.fn()
}))

jest.mock('../../../modules/analyticsSessionGate', () => ({
  isAnalyticsOffForVisitor: jest.fn()
}))

const mockUseInView = jest.mocked(useInView)
const mockUseMobileMediaQuery = jest.mocked(useMobileMediaQuery)
const mockUseDeferredTrack = jest.mocked(useDeferredTrack)
const mockIsAnalyticsOffForVisitor = jest.mocked(isAnalyticsOffForVisitor)

const mockInView = (inView: boolean) => mockUseInView.mockReturnValue({ ref: jest.fn(), inView } as unknown as ReturnType<typeof useInView>)

describe('ScrollCheckpoint', () => {
  let track: jest.Mock

  beforeEach(() => {
    track = jest.fn()
    mockUseDeferredTrack.mockReturnValue(track)
    mockUseMobileMediaQuery.mockReturnValue(false)
    mockIsAnalyticsOffForVisitor.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when it renders', () => {
    beforeEach(() => {
      mockInView(false)
    })

    it('should render an empty marker named after its section', () => {
      const { container } = render(<ScrollCheckpoint name={SCROLL_SECTIONS.faq} />)

      expect(container.querySelector('[data-scroll-checkpoint="faq"]')).toBeEmptyDOMElement()
    })

    it('should watch once for the section reaching the upper half of the screen', () => {
      render(<ScrollCheckpoint name={SCROLL_SECTIONS.faq} />)

      expect(mockUseInView).toHaveBeenCalledWith({ triggerOnce: true, rootMargin: '0px 0px -50% 0px' })
    })
  })

  describe('when the section has not been reached', () => {
    beforeEach(() => {
      mockInView(false)
      render(<ScrollCheckpoint name={SCROLL_SECTIONS.payouts} />)
    })

    it('should not send a Scroll event', () => {
      expect(track).not.toHaveBeenCalled()
    })
  })

  describe('when the section is reached', () => {
    let rerender: ReturnType<typeof render>['rerender']

    beforeEach(() => {
      mockInView(false)
      ;({ rerender } = render(<ScrollCheckpoint name={SCROLL_SECTIONS.payouts} />))
      mockInView(true)
      rerender(<ScrollCheckpoint name={SCROLL_SECTIONS.payouts} />)
    })

    it('should send one Scroll event with the place and the section as scroll_to', () => {
      expect(track).toHaveBeenCalledTimes(1)

      expect(track).toHaveBeenCalledWith(SegmentEvent.SCROLL, {
        place: SectionViewedTrack.CREATOR_FUND,
        scroll_to: 'payouts',
        mobile: false
      })
    })

    it('should not send it again on later renders', () => {
      mockUseMobileMediaQuery.mockReturnValue(true)
      rerender(<ScrollCheckpoint name={SCROLL_SECTIONS.payouts} />)

      expect(track).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the section is reached on a phone', () => {
    beforeEach(() => {
      mockUseMobileMediaQuery.mockReturnValue(true)
      mockInView(true)
      render(<ScrollCheckpoint name={SCROLL_SECTIONS.hero} />)
    })

    it('should flag the event as mobile', () => {
      expect(track).toHaveBeenCalledWith(SegmentEvent.SCROLL, {
        place: SectionViewedTrack.CREATOR_FUND,
        scroll_to: 'hero-banner',
        mobile: true
      })
    })
  })

  describe('when analytics is off for the visitor', () => {
    beforeEach(() => {
      mockIsAnalyticsOffForVisitor.mockReturnValue(true)
      mockInView(true)
      render(<ScrollCheckpoint name={SCROLL_SECTIONS.faq} />)
    })

    it('should not send a Scroll event', () => {
      expect(track).not.toHaveBeenCalled()
    })
  })
})
