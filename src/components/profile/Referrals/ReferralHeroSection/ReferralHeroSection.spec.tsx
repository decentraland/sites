import * as mockReact from 'react'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReferralHeroSection } from './ReferralHeroSection'

const useTabletAndBelowMediaQueryMock = jest.fn()

jest.mock('../../../../utils/assetUrl', () => ({
  assetUrl: (path: string) => `https://cdn.test${path}`
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('decentraland-ui2', () => {
  const passthrough = (props: { children?: React.ReactNode }) => mockReact.createElement('div', null, props.children)
  return {
    Box: passthrough,
    InputAdornment: passthrough,
    // Expose `onClose` as a clickable affordance so the inline dismiss arrows run.
    Menu: ({ children, onClose }: { children?: React.ReactNode; onClose?: () => void }) =>
      mockReact.createElement('div', null, mockReact.createElement('button', { 'aria-label': 'menu-close', onClick: onClose }), children),
    MenuItem: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
      mockReact.createElement('button', { role: 'menuitem', onClick }, children),
    Tooltip: ({ children, onClose }: { children?: React.ReactNode; onClose?: () => void }) =>
      mockReact.createElement(
        mockReact.Fragment,
        null,
        onClose ? mockReact.createElement('button', { 'aria-label': 'tooltip-close', onClick: onClose }) : null,
        children
      ),
    Typography: passthrough,
    useTabletAndBelowMediaQuery: () => useTabletAndBelowMediaQueryMock()
  }
})

// Render the image styled components as real <img> so we can assert the
// resolved `src`; the button-like wrappers forward `onClick` so the handlers run.
jest.mock('./ReferralHeroSection.styled', () => {
  const wrapper = (props: { children?: React.ReactNode }) => mockReact.createElement('div', null, props.children)
  const image = ({ src, alt }: { src?: string; alt?: string }) => mockReact.createElement('img', { src, alt })
  const button = ({ children, onClick }: { children?: React.ReactNode; onClick?: (e: unknown) => void }) =>
    mockReact.createElement('button', { onClick }, children)
  return {
    EnvelopeImage: image,
    EnvelopeImageContainer: wrapper,
    EnvelopeShadow: wrapper,
    HeroWrapper: wrapper,
    HowItWorksButton: button,
    ReferralButton: button,
    ReferralContainer: wrapper,
    ReferralInput: ({ value, onClick }: { value?: string; onClick?: () => void }) =>
      mockReact.createElement('input', { value, onClick, readOnly: true }),
    SectionContainer: wrapper,
    Step: wrapper,
    StepImage: image,
    StepNumber: wrapper,
    StepText: wrapper,
    StepTextContainer: wrapper,
    StepsContainer: wrapper,
    Subtitle: wrapper,
    Title: wrapper,
    TooltipLink: wrapper
  }
})

const ADDRESS = '0x1234567890123456789012345678901234567890'

describe('ReferralHeroSection', () => {
  beforeEach(() => {
    useTabletAndBelowMediaQueryMock.mockReturnValue(false)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // Regression for the broken envelope icon (#584) on CDN deploys: the hero
  // envelope must resolve through `assetUrl` so it points at the CDN base.
  it('should resolve the hero envelope image through assetUrl', () => {
    render(<ReferralHeroSection profileAddress={ADDRESS} />)

    expect(screen.getByAltText('Envelope')).toHaveAttribute('src', 'https://cdn.test/images/referrals/referral-envelope.webp')
  })

  // Regression for the broken "how it works" step images (#586).
  it('should resolve every step image through assetUrl', () => {
    render(<ReferralHeroSection profileAddress={ADDRESS} />)

    expect(screen.getByAltText('Step 1')).toHaveAttribute('src', 'https://cdn.test/images/referrals/referral-envelope.webp')
    expect(screen.getByAltText('Step 2')).toHaveAttribute('src', 'https://cdn.test/images/referrals/logo-with-pointer.webp')
    expect(screen.getByAltText('Step 3')).toHaveAttribute('src', 'https://cdn.test/images/referrals/sports-medal.webp')
  })

  describe('when the profile has a claimed name', () => {
    it('should build the invite link from the avatar name instead of the address', () => {
      render(<ReferralHeroSection profileAddress={ADDRESS} avatarName="mojito" hasClaimedName />)

      expect(screen.getByRole('textbox')).toHaveValue(`${window.location.origin}/invite/mojito`)
    })
  })

  describe('when the profile has no claimed name', () => {
    it('should build the invite link from the shortened address', () => {
      render(<ReferralHeroSection profileAddress={ADDRESS} avatarName="mojito" hasClaimedName={false} />)

      const shortened = `${ADDRESS.slice(0, 6)}…${ADDRESS.slice(-4)}`
      expect(screen.getByRole('textbox')).toHaveValue(`${window.location.origin}/invite/${shortened}`)
    })

    it('should leave a short handle untouched instead of shortening it', () => {
      // A value below the 12-char threshold short-circuits the address shortener.
      render(<ReferralHeroSection profileAddress="0xabc" hasClaimedName={false} />)

      expect(screen.getByRole('textbox')).toHaveValue(`${window.location.origin}/invite/0xabc`)
    })
  })

  describe('when clicking the invite input', () => {
    it('should copy the invite url to the clipboard', async () => {
      const user = userEvent.setup()
      const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      await user.click(screen.getByRole('textbox'))

      expect(writeTextSpy).toHaveBeenCalledWith(`${window.location.origin}/invite/${ADDRESS}`)
    })

    it('should auto-dismiss the copied tooltip after the timeout elapses', async () => {
      jest.useFakeTimers()
      try {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
        render(<ReferralHeroSection profileAddress={ADDRESS} />)

        await user.click(screen.getByRole('textbox'))
        // The 2s timeout flips the tooltip back off without throwing.
        act(() => {
          jest.advanceTimersByTime(2000)
        })

        expect(screen.getByRole('textbox')).toBeInTheDocument()
      } finally {
        jest.useRealTimers()
      }
    })

    it('should dismiss the copied tooltip when the tooltip onClose fires', async () => {
      const user = userEvent.setup()
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      // The first tooltip-close affordance belongs to the copied-feedback tooltip.
      await user.click(screen.getAllByLabelText('tooltip-close')[0])

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should no-op when the clipboard API is unavailable', async () => {
      const user = userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      // No throw: the guard returns before touching `navigator.clipboard`.
      await user.click(screen.getByRole('textbox'))

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('when dismissing the share menu', () => {
    it('should clear the anchor when the menu onClose fires', async () => {
      const user = userEvent.setup()
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      await user.click(screen.getByLabelText('menu-close'))

      expect(screen.getByText('profile.referral_hero_section.share')).toBeInTheDocument()
    })
  })

  describe('when toggling the "how it works" section', () => {
    it('should flip the steps visibility on click', async () => {
      const user = userEvent.setup()
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      const howItWorks = screen.getByRole('button', { name: /how_it_works/i })
      // Toggling twice exercises both branches of the showSteps setter.
      await user.click(howItWorks)
      await user.click(howItWorks)

      expect(howItWorks).toBeInTheDocument()
    })
  })

  describe('when sharing on a desktop viewport', () => {
    beforeEach(() => {
      useTabletAndBelowMediaQueryMock.mockReturnValue(false)
    })

    it('should open the X intent in a new tab from the share menu', async () => {
      const user = userEvent.setup()
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      await user.click(screen.getByText('profile.referral_hero_section.share_on_x'))

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet?text='),
        '_blank',
        'noopener,noreferrer'
      )
      expect(openSpy.mock.calls[0][0]).toContain(encodeURIComponent(`${window.location.origin}/invite/${ADDRESS}`))
      openSpy.mockRestore()
    })

    it('should copy the invite link from the share menu copy item', async () => {
      const user = userEvent.setup()
      const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      // The first "copy" menu item (the menu copy action, not the input).
      const copyItems = screen.getAllByText('profile.referral_hero_section.copy_link')
      await user.click(copyItems[0])

      expect(writeTextSpy).toHaveBeenCalledWith(`${window.location.origin}/invite/${ADDRESS}`)
    })

    it('should anchor the share menu instead of invoking the native share sheet', async () => {
      const user = userEvent.setup()
      const shareSpy = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true })
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      await user.click(screen.getByText('profile.referral_hero_section.share'))

      expect(shareSpy).not.toHaveBeenCalled()
      Reflect.deleteProperty(navigator, 'share')
    })
  })

  describe('when sharing on a tablet/mobile viewport with the native share sheet available', () => {
    beforeEach(() => {
      useTabletAndBelowMediaQueryMock.mockReturnValue(true)
    })

    it('should invoke the native share sheet with the invite url', async () => {
      const user = userEvent.setup()
      const shareSpy = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true })
      render(<ReferralHeroSection profileAddress={ADDRESS} />)

      await user.click(screen.getByText('profile.referral_hero_section.share'))

      expect(shareSpy).toHaveBeenCalledWith(expect.objectContaining({ url: `${window.location.origin}/invite/${ADDRESS}` }))
      Reflect.deleteProperty(navigator, 'share')
    })
  })
})
