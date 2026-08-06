import { render, screen } from '@testing-library/react'
import { LandingNavbar } from './LandingNavbar'

// decentraland-ui2 ships ESM that jest does not transform, so the styled layer is stubbed with the
// emotion `styled` it wraps plus the handful of colour tokens this navbar reads. Layout is not what is
// under test here; the chip's destination is.
jest.mock('decentraland-ui2', () => ({
  styled: jest.requireActual('@emotion/styled').default,
  dclColors: {
    base: { primary: '#ff2d55', primaryDark: '#d3255f' },
    neutral: { gray: '#716b7c', softWhite: '#ecebed', white: '#ffffff' }
  }
}))

jest.mock('@dcl/hooks', () => ({ useAnalytics: jest.fn(() => ({ track: jest.fn() })) }))
jest.mock('../../intl/LocaleContext', () => ({ useLocale: jest.fn(() => ({ locale: 'en' })) }))
jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: jest.fn(() => (key: string) => key)
}))

const props = {
  onClickSignIn: jest.fn(),
  onClickSignOut: jest.fn()
}

/**
 * Clicking your own balance is reaching for more of it, so the chip goes to the Shop's buy-credits
 * page. It used to point at /account/credits — the account section's credits SETTINGS — which is a
 * different destination entirely, and the one place a visitor who wants to top up cannot do it.
 */
describe('when the navbar shows the credits chip', () => {
  it('should send it to the buy-credits page in the Shop', () => {
    render(<LandingNavbar {...props} isSignedIn creditsBalance={120} />)

    const chip = screen.getByRole('link', { name: /credits_balance/i })
    // A same-origin path, so it survives .zone / .today / .org rather than pinning one environment.
    expect(chip).toHaveAttribute('href', '/shop/credits')
  })

  // 0 is a real balance and must still offer the way to top up; only "we don't know" hides the chip.
  it('should still offer it on a zero balance, and hide it only when the balance is unknown', () => {
    const { rerender } = render(<LandingNavbar {...props} isSignedIn creditsBalance={0} />)
    expect(screen.getByRole('link', { name: /credits_balance/i })).toHaveAttribute('href', '/shop/credits')

    rerender(<LandingNavbar {...props} isSignedIn creditsBalance={null} />)
    expect(screen.queryByRole('link', { name: /credits_balance/i })).not.toBeInTheDocument()
  })
})
