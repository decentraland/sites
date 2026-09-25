import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
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

type NavbarProps = ComponentProps<typeof LandingNavbar>

const renderAt = (pathname: string, extra: Partial<NavbarProps> = {}) =>
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <LandingNavbar {...props} isSignedIn={false} {...extra} />
    </MemoryRouter>
  )

/**
 * Clicking your own balance is reaching for more of it, so the chip goes to the Shop's buy-credits
 * page. It used to point at /account/credits — the account section's credits SETTINGS — which is a
 * different destination entirely, and the one place a visitor who wants to top up cannot do it.
 */
describe('when the navbar shows the credits chip', () => {
  it('should send it to the buy-credits page in the Shop', () => {
    renderAt('/', { isSignedIn: true, creditsBalance: 120 })

    const chip = screen.getByRole('link', { name: /credits_balance/i })
    // A same-origin path, so it survives .zone / .today / .org rather than pinning one environment.
    expect(chip).toHaveAttribute('href', '/shop/credits')
  })

  // 0 is a real balance and must still offer the way to top up; only "we don't know" hides the chip.
  it('should still offer it on a zero balance, and hide it only when the balance is unknown', () => {
    const { rerender } = renderAt('/', { isSignedIn: true, creditsBalance: 0 })
    expect(screen.getByRole('link', { name: /credits_balance/i })).toHaveAttribute('href', '/shop/credits')

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <LandingNavbar {...props} isSignedIn creditsBalance={null} />
      </MemoryRouter>
    )
    expect(screen.queryByRole('link', { name: /credits_balance/i })).not.toBeInTheDocument()
  })
})

/**
 * Events and Places live behind the Discover dropdown, so the dropdown itself is what has to read as
 * selected while the visitor is on either of them — otherwise nothing in the navbar says where they are.
 */
describe('when the visitor is on a page the Discover dropdown owns', () => {
  // getAllBy over every match rather than the first one: the desktop tab and the mobile accordion
  // header both carry the state, and jsdom only exposes the mobile one (the desktop list is display:
  // none without the media query), so asserting on all of them covers whichever surface is in the tree.
  it.each(['/events', '/places', '/places/place/-102,129'])('should mark the Discover tab as selected on %s', pathname => {
    renderAt(pathname)

    screen.getAllByRole('button', { name: /navbar\.discover/i }).forEach(tab => expect(tab).toHaveAttribute('data-active'))
  })

  it('should leave the sections that own no in-app route unselected', () => {
    renderAt('/events')

    screen.getAllByRole('button', { name: /navbar\.(shop|create)/i }).forEach(tab => expect(tab).not.toHaveAttribute('data-active'))
  })

  it('should leave every tab unselected on the landing page', () => {
    renderAt('/')

    screen.getAllByRole('button', { name: /navbar\.discover/i }).forEach(tab => expect(tab).not.toHaveAttribute('data-active'))
  })
})

describe('when a visitor uses the mobile navigation', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should open and close the menu with the hamburger button', () => {
    renderAt('/events')

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('should expand and collapse a section', () => {
    renderAt('/events')
    const discover = screen.getAllByRole('button', { name: /navbar\.discover/i }).find(button => button.hasAttribute('aria-expanded'))
    expect(discover).toBeDefined()

    fireEvent.click(discover!)
    expect(discover).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(discover!)
    expect(discover).toHaveAttribute('aria-expanded', 'false')
  })

  it('should close the open menu on Escape', () => {
    renderAt('/events')
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('when the signed-in visitor opens the user card', () => {
  const address = '0x1234567890123456789012345678901234567890'

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should show the shortened wallet address and account links', () => {
    renderAt('/events', { isSignedIn: true, address })

    fireEvent.click(screen.getByRole('button', { name: 'User menu' }))

    expect(screen.getAllByText('0x1234...7890').length).toBeGreaterThan(0)
  })

  it('should close the user card when clicking outside navigation', () => {
    renderAt('/events', { isSignedIn: true, address })
    fireEvent.click(screen.getByRole('button', { name: 'User menu' }))

    fireEvent.mouseDown(document.body)

    expect(screen.getByRole('button', { name: 'User menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('should send sign-out clicks to the supplied handler', () => {
    renderAt('/events', { isSignedIn: true, address })
    fireEvent.click(screen.getByRole('button', { name: 'User menu' }))

    fireEvent.click(screen.getAllByText('component.landing.navbar.logout')[0])

    expect(props.onClickSignOut).toHaveBeenCalledTimes(1)
  })
})

describe('when the visitor has not signed in', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call sign-in when the sign-in button is pressed', () => {
    renderAt('/events')

    fireEvent.click(screen.getByRole('button', { name: 'component.landing.navbar.sign_in' }))

    expect(props.onClickSignIn).toHaveBeenCalledTimes(1)
  })
})

describe('when the visitor opens a desktop section', () => {
  it('should reveal its destination links on hover', () => {
    renderAt('/events')

    const desktopTab = screen
      .getAllByRole('button', { name: /navbar\.discover/i, hidden: true })
      .find(button => button.getAttribute('aria-haspopup') === 'true')!
    fireEvent.mouseEnter(desktopTab.parentElement!)

    expect(desktopTab).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('when the landing navbar is minimal', () => {
  it('should show the jump-in action after scrolling', () => {
    const onClickJumpIn = jest.fn()
    renderAt('/', { isLandingPage: true, onClickJumpIn })

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 })
    fireEvent.scroll(window)
    fireEvent.click(screen.getByRole('button', { name: /jump_in/i }))

    expect(onClickJumpIn).toHaveBeenCalledTimes(1)
  })
})

describe('when the notification list is open', () => {
  it('should show a fallback title and time for an unknown notification type', () => {
    const notifications: NonNullable<NavbarProps['notifications']> = {
      items: [{ id: 'one', read: false, type: 'new_event', timestamp: Date.now() - 120000, metadata: { message: 'New event nearby' } }],
      isLoading: false,
      isOpen: true,
      activeTab: 'newest',
      onClick: jest.fn(),
      onClose: jest.fn(),
      onChangeTab: jest.fn()
    }
    renderAt('/events', { isSignedIn: true, notifications })

    expect(screen.getByText('New Event')).toBeInTheDocument()
    expect(screen.getByText('2m ago')).toBeInTheDocument()
  })

  it('should show the empty state when no notifications exist', () => {
    const notifications: NonNullable<NavbarProps['notifications']> = {
      items: [],
      isLoading: false,
      isOpen: true,
      activeTab: 'newest',
      onClick: jest.fn(),
      onClose: jest.fn(),
      onChangeTab: jest.fn()
    }
    renderAt('/events', { isSignedIn: true, notifications })

    expect(screen.getByText('component.landing.navbar.notifications_empty_new')).toBeInTheDocument()
  })
})
