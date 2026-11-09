import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useMediaQuery } from 'decentraland-ui2'
import { getDownloadUrl } from '../../../modules/downloadConstants'
import {
  CREATOR_FUND_CONTACT_EMAIL,
  CREATOR_FUND_TERMS_URL,
  CREATOR_HUB_DOWNLOAD_PATH,
  faqEntries,
  moreWaysToEarnKeys,
  sectionLinks
} from '../data'
import { CreatorFundLanding } from './CreatorFundLanding'

jest.mock('decentraland-ui2', () => {
  const { styled, Box, dclColors, keyframes } = jest.requireActual('../../../__test-utils__/styledMock')
  return {
    styled,
    Box,
    dclColors,
    keyframes,
    AnimatedBackground: () => React.createElement('div', { 'data-testid': 'animated-background' }),
    Logo: (props: Record<string, unknown>) => React.createElement('svg', props),
    useMediaQuery: jest.fn()
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string, values?: Record<string, unknown>) => (values ? `${id} ${JSON.stringify(values)}` : id)
}))

const mockTrackClick = jest.fn()

jest.mock('../../../hooks/useUnloadSafeTrackClick', () => ({
  useUnloadSafeTrackClick: () => mockTrackClick
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

  describe('when checking click tracking', () => {
    // React clears `currentTarget` once the handler returns, so record it at call time.
    const trackedTargets: Element[] = []

    beforeEach(() => {
      trackedTargets.length = 0
      mockTrackClick.mockImplementation((event: { currentTarget: Element }) => {
        trackedTargets.push(event.currentTarget)
      })
    })

    it('should tag every link, button and FAQ question with place, section and button', () => {
      const controls = Array.from(document.querySelectorAll('a, button, summary'))

      expect(controls.length).toBeGreaterThan(20)
      controls.forEach(control => {
        expect(control).toHaveAttribute('data-place', 'Creator Fund')
        expect(control).toHaveAttribute('data-event', 'Click')
        expect(control.getAttribute('data-section')).toBeTruthy()
        expect(control.getAttribute('data-button')).toBeTruthy()
      })
    })

    it('should track the hero call to action as hero-banner', () => {
      const hero = document.getElementById('overview') as HTMLElement
      const cta = within(hero).getByRole('link', { name: 'page.creator_fund.cta.join' })

      fireEvent.click(cta)

      expect(cta).toHaveAttribute('data-section', 'hero-banner')
      expect(cta).toHaveAttribute('data-button', 'Join From Creator Hub')
      expect(trackedTargets).toEqual([cta])
    })

    it('should track the join section call to action as final-cta', () => {
      const join = document.getElementById('join') as HTMLElement
      const cta = within(join).getByRole('link', { name: 'page.creator_fund.cta.join' })

      fireEvent.click(cta)

      expect(cta).toHaveAttribute('data-section', 'final-cta')
      expect(cta).toHaveAttribute('data-button', 'Join From Creator Hub')
      expect(trackedTargets).toEqual([cta])
    })

    it('should mark the store downloads with their download target', () => {
      expect(screen.getByRole('link', { name: 'Android' })).toHaveAttribute('data-download-target', 'google_play')
      expect(screen.getByRole('link', { name: 'iOS' })).toHaveAttribute('data-download-target', 'app_store')
      expect(screen.getByRole('link', { name: 'page.creator_fund.how.opt_in_link' })).toHaveAttribute('data-download-target', 'creator_hub')
    })

    it('should track opening a FAQ question', () => {
      const question = screen.getByText(faqEntries[0].questionKey)

      fireEvent.click(question)

      expect(question).toHaveAttribute('data-section', 'faq')
      expect(trackedTargets).toEqual([question])
    })

    it('should not track closing a FAQ question', () => {
      const question = screen.getByText(faqEntries[0].questionKey)
      ;(question.parentElement as HTMLDetailsElement).open = true

      fireEvent.click(question)

      expect(mockTrackClick).not.toHaveBeenCalled()
    })
  })

  it('should render the hero as the page heading', () => {
    const heading = screen.getByRole('heading', { level: 1 })

    expect(heading).toHaveTextContent('page.creator_fund.hero.title')
    expect(heading).toHaveTextContent('page.creator_fund.hero.title_highlight')
  })

  it('should paint the three purple bands with the decentraland.org animated background', () => {
    expect(screen.getAllByTestId('animated-background')).toHaveLength(3)
  })

  it('should put decorative background photos behind the rewards and the closing sections', () => {
    const decorative = Array.from(document.querySelectorAll('img[aria-hidden="true"]'))

    expect(decorative).toHaveLength(2)
    decorative.forEach(image => expect(image).toHaveAttribute('alt', ''))
    expect(document.getElementById('join')).toContainElement(decorative[1] as HTMLElement)
  })

  it('should show an icon in every payout label', () => {
    const payouts = document.getElementById('payouts') as HTMLElement

    within(payouts)
      .getAllByRole('term')
      .forEach(label => expect(label.querySelector('svg')).toBeInTheDocument())
  })

  it('should show the season pool in the hero', () => {
    expect(screen.getByText('page.creator_fund.hero.pool_amount {"pool":"$30,000","currency":"USDC"}')).toBeInTheDocument()
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

  it('should list the steps in order: opt in, build, get paid', () => {
    const steps = within(document.getElementById('how') as HTMLElement).getAllByRole('heading', { level: 3 })

    expect(steps.map(step => step.textContent)).toEqual([
      'page.creator_fund.how.opt_in_title',
      'page.creator_fund.how.build_title',
      'page.creator_fund.how.paid_title'
    ])
  })

  it('should link the opt-in step to the Creator Hub download', () => {
    const how = document.getElementById('how') as HTMLElement

    expect(within(how).getByRole('link', { name: 'page.creator_fund.how.opt_in_link' })).toHaveAttribute('href', CREATOR_HUB_DOWNLOAD_PATH)
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

  it('should pay cycle 2 on Dec 23', () => {
    expect(
      screen.getByText(
        'page.creator_fund.dates.cycle_row {"name":"page.creator_fund.dates.cycle_name {\\"number\\":2}","amount":"$10,000","date":"Dec 23"}'
      )
    ).toBeInTheDocument()
  })

  it('should show the launch date and each cycle in the schedule', () => {
    expect(screen.getByText('Nov 11')).toBeInTheDocument()
    expect(screen.getByText(/^Nov 15\s*–\s*30$/)).toBeInTheDocument()
    expect(
      screen.getByText(
        'page.creator_fund.dates.cycle_row {"name":"page.creator_fund.dates.cycle_name {\\"number\\":3}","amount":"$10,000","date":"Jan 11, 2027"}'
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

  it('should show the other ways to earn right after the schedule', () => {
    const schedule = document.getElementById('dates') as HTMLElement
    const moreWays = screen.getByRole('heading', { name: 'page.creator_fund.more_ways.title' })

    expect(schedule.compareDocumentPosition(moreWays) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(schedule.contains(moreWays)).toBe(false)
  })

  it('should not render the builders section', () => {
    expect(screen.queryByText('page.creator_fund.builders.title')).not.toBeInTheDocument()
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
