import { fireEvent, render, screen } from '@testing-library/react'
import { CREATOR_FUND_CONTACT_EMAIL, faqEntries } from '../CreatorFund/data'
import { CreatorFundFAQSection } from './CreatorFundFAQSection'

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('decentraland-ui2', () => jest.requireActual('../../__test-utils__/ui2Mock').createUi2Mock())

const mockTrackClick = jest.fn()

jest.mock('../../hooks/useUnloadSafeTrackClick', () => ({
  useUnloadSafeTrackClick: () => mockTrackClick
}))

// React clears `currentTarget` once the handler returns, so record what each click tracked at call time.
const tracked: Array<{ section: string | null; button: string | null }> = []

describe('CreatorFundFAQSection', () => {
  beforeEach(() => {
    tracked.length = 0
    mockTrackClick.mockImplementation((event: { currentTarget: Element }) => {
      tracked.push({ section: event.currentTarget.getAttribute('data-section'), button: event.currentTarget.getAttribute('data-button') })
    })
  })

  afterEach(() => {
    mockTrackClick.mockReset()
  })

  describe('when the Creator Fund tab is active', () => {
    beforeEach(() => {
      render(<CreatorFundFAQSection isActive />)
    })

    it('should show the section title', () => {
      expect(screen.getByText('component.landing.help.creator_fund_section.title')).toBeInTheDocument()
    })

    it('should list every Creator Fund page question with its answer', () => {
      faqEntries.forEach(entry => {
        expect(screen.getByText(entry.questionKey)).toBeInTheDocument()
        expect(screen.getByText(entry.answerKey)).toBeInTheDocument()
      })
    })

    it('should end with the Creator Fund support address', () => {
      expect(screen.getByRole('link', { name: CREATOR_FUND_CONTACT_EMAIL })).toHaveAttribute('href', `mailto:${CREATOR_FUND_CONTACT_EMAIL}`)
      expect(screen.getByText(/page\.creator_fund\.faq\.contact_prompt/)).toBeInTheDocument()
    })

    describe('and a question is clicked', () => {
      it('should expand it, and collapse it on a second click', () => {
        const accordion = screen.getByText(faqEntries[0].questionKey).closest('[data-expanded]') as HTMLElement

        fireEvent.click(accordion)
        expect(accordion).toHaveAttribute('data-expanded', 'true')

        fireEvent.click(accordion)
        expect(accordion).toHaveAttribute('data-expanded', 'false')
      })

      it('should track opening it under the help-center section, but not closing it', () => {
        const question = screen.getByText(faqEntries[0].questionKey)

        fireEvent.click(question)
        fireEvent.click(question)

        expect(tracked).toEqual([{ section: 'help-center', button: faqEntries[0].trackingName }])
      })
    })

    describe('and the support address is clicked', () => {
      it('should track it under the help-center section', () => {
        fireEvent.click(screen.getByRole('link', { name: CREATOR_FUND_CONTACT_EMAIL }))

        expect(tracked).toEqual([{ section: 'help-center', button: 'Email Creator Fund' }])
      })
    })
  })

  describe('when another tab is active', () => {
    it('should render nothing', () => {
      const { container } = render(<CreatorFundFAQSection isActive={false} />)

      expect(container).toBeEmptyDOMElement()
    })
  })
})
