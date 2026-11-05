import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { useMediaQuery } from 'decentraland-ui2'
import { getDownloadUrl } from '../../../modules/downloadConstants'
import { connectCards } from '../../Create/data'
import { CREATOR_FUND_CONTACT_EMAIL, CREATOR_FUND_TERMS_URL, faqEntries, moreWaysToEarnKeys, sectionLinks } from '../data'
import { CreatorFundLanding } from './CreatorFundLanding'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors, keyframes } = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    styled,
    Box,
    dclColors,
    keyframes,
    Logo: (props: Record<string, unknown>) => React.createElement('svg', props),
    useMediaQuery: jest.fn()
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string, values?: Record<string, unknown>) => (values ? `${id} ${JSON.stringify(values)}` : id)
}))

jest.mock('../../../intl/LocaleContext', () => ({
  useLocale: () => ({ locale: 'en', setLocale: jest.fn() })
}))

jest.mock('../../Video', () => ({
  Video: ({ source }: { source: string }) => React.createElement('video', { 'data-testid': 'hero-video', src: source })
}))

describe('CreatorFundLanding', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    })) as unknown as typeof window.matchMedia
    ;(useMediaQuery as jest.Mock).mockReturnValue(false)
    render(<CreatorFundLanding />)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render the hero as the page heading', () => {
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'page.creator_fund.hero.title page.creator_fund.hero.title_highlight'
    )
  })

  it('should show the season pool in the hero', () => {
    expect(screen.getByText('page.creator_fund.hero.pool_amount {"pool":"$30,000"}')).toBeInTheDocument()
  })

  it('should render a target section for every section link', () => {
    const nav = screen.getByRole('navigation', { name: 'page.creator_fund.nav.aria_label' })

    sectionLinks.forEach(link => {
      expect(within(nav).getByRole('link', { name: link.labelKey })).toHaveAttribute('href', `#${link.id}`)
      expect(document.getElementById(link.id)).toBeInTheDocument()
    })
  })

  it('should point the join calls to action above the join section at it', () => {
    const join = document.getElementById('join') as HTMLElement
    const earlierLinks = screen.getAllByRole('link', { name: 'page.creator_fund.cta.join' }).filter(link => !join.contains(link))

    expect(earlierLinks.length).toBeGreaterThan(0)
    earlierLinks.forEach(link => expect(link).toHaveAttribute('href', '#join'))
  })

  it('should link each platform to its download', () => {
    expect(screen.getByRole('link', { name: 'Android' })).toHaveAttribute('href', getDownloadUrl('android'))
    expect(screen.getByRole('link', { name: 'iOS' })).toHaveAttribute('href', getDownloadUrl('ios'))
    expect(screen.getByRole('link', { name: 'Windows' })).toHaveAttribute('href', getDownloadUrl('windows'))
    expect(screen.getByRole('link', { name: 'Mac' })).toHaveAttribute('href', getDownloadUrl('apple'))
  })

  it('should show the Beta Season dates in the hero', () => {
    expect(screen.getByText(/^Nov 15\s*–\s*Dec 31$/)).toBeInTheDocument()
  })

  it('should list the steps in flyer order: build, opt in, get paid', () => {
    const steps = within(document.getElementById('how') as HTMLElement).getAllByRole('heading', { level: 3 })

    expect(steps.map(step => step.textContent)).toEqual([
      'page.creator_fund.how.build_title',
      'page.creator_fund.how.opt_in_title',
      'page.creator_fund.how.paid_title'
    ])
  })

  it('should interpolate the cycle allocation into the get-paid step', () => {
    expect(screen.getByText('page.creator_fund.how.paid_text {"amount":"$10,000","currency":"USDC"}')).toBeInTheDocument()
  })

  it('should list the payout terms with the program values', () => {
    expect(
      screen.getAllByText(
        'page.creator_fund.rewards.currency {"days":14,"currency":"USDC","standard":"ERC-20","network":"Ethereum mainnet"}'
      )
    ).toHaveLength(1)
  })

  it('should show the launch date and each cycle in the schedule', () => {
    expect(screen.getByText('Nov 11')).toBeInTheDocument()
    expect(screen.getByText(/^Nov 15\s*–\s*30$/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'page.creator_fund.dates.cycle_row {"name":"page.creator_fund.dates.cycle_name {\\"number\\":3}","amount":"$10,000","date":"Jan 10, 2027"}'
      )
    ).toBeInTheDocument()
  })

  it('should place Payouts before Eligibility', () => {
    const payouts = document.getElementById('payouts') as HTMLElement
    const eligibility = document.getElementById('eligibility') as HTMLElement

    expect(payouts.compareDocumentPosition(eligibility) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('should list the other ways to earn', () => {
    moreWaysToEarnKeys.forEach(key => expect(screen.getByText(key)).toBeInTheDocument())
  })

  it('should show a quote for every builder', () => {
    connectCards.forEach(builder => expect(screen.getByRole('img', { name: builder.name })).toBeInTheDocument())
  })

  it('should render every FAQ entry', () => {
    faqEntries.forEach(entry => expect(screen.getByText(entry.questionKey)).toBeInTheDocument())
  })

  it('should send creators to Creator Hub from the join section CTA', () => {
    const join = document.getElementById('join') as HTMLElement

    expect(within(join).getByRole('link', { name: 'page.creator_fund.cta.join' })).toHaveAttribute('href', '/create')
  })

  it('should offer the support address under the FAQ', () => {
    const faq = document.getElementById('faq') as HTMLElement

    expect(within(faq).getByText(/page\.creator_fund\.faq\.contact_prompt/)).toBeInTheDocument()
    expect(within(faq).getByRole('link', { name: CREATOR_FUND_CONTACT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${CREATOR_FUND_CONTACT_EMAIL}`
    )
  })

  it('should link See Terms to the Program Terms page', () => {
    expect(screen.getByRole('link', { name: 'page.creator_fund.join.see_terms' })).toHaveAttribute('href', CREATOR_FUND_TERMS_URL)
  })

  it('should not render a Creator Fund footer of its own', () => {
    expect(document.getElementById('terms')).not.toBeInTheDocument()
  })

  it('should play the landscape hero video on desktop', () => {
    expect(screen.getByTestId('hero-video')).toBeInTheDocument()
  })
})
