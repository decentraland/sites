import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { CREATOR_FUND_CONTACT_EMAIL, faqEntries } from '../CreatorFund/data'
import { CreatorFundFAQSection } from './CreatorFundFAQSection'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors } = jest.requireActual('../../__test-utils__/styledMock')
  type Props = { children?: React.ReactNode; expanded?: boolean; onChange?: (event: unknown, expanded: boolean) => void; active?: boolean }
  const Accordion = ({ children, expanded, onChange }: Props) =>
    React.createElement(
      'div',
      { 'data-expanded': String(Boolean(expanded)), onClick: (event: unknown) => onChange?.(event, !expanded) },
      children
    )
  const Tag =
    (tag: string) =>
    ({ children, expanded: _expanded, onChange: _onChange, active: _active, ...rest }: Props & Record<string, unknown>) =>
      React.createElement(tag, rest, children)
  return {
    styled,
    Box,
    dclColors,
    Typography: Tag('p'),
    Button: Tag('button'),
    Accordion,
    AccordionSummary: Tag('div'),
    AccordionDetails: Tag('div')
  }
})

describe('CreatorFundFAQSection', () => {
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
    })
  })

  describe('when another tab is active', () => {
    it('should render nothing', () => {
      const { container } = render(<CreatorFundFAQSection isActive={false} />)

      expect(container).toBeEmptyDOMElement()
    })
  })
})
