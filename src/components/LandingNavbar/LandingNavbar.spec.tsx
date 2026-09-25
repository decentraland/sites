import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
jest.mock('decentraland-ui2/dist/components/Notifications/utils', () => ({ NotificationComponentByType: {} }))

jest.mock('@dcl/hooks', () => ({ useAnalytics: jest.fn() }))
jest.mock('../../intl/LocaleContext', () => ({ useLocale: jest.fn() }))
jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: jest.fn()
}))

let props: Pick<NavbarProps, 'onClickSignIn' | 'onClickSignOut'>

type NavbarProps = ComponentProps<typeof LandingNavbar>

beforeEach(() => {
  props = { onClickSignIn: jest.fn(), onClickSignOut: jest.fn() }
  ;(jest.requireMock('@dcl/hooks').useAnalytics as jest.Mock).mockReturnValue({ track: jest.fn() })
  ;(jest.requireMock('../../intl/LocaleContext').useLocale as jest.Mock).mockReturnValue({ locale: 'en' })
  ;(jest.requireMock('../../hooks/adapters/useFormatMessage').useFormatMessage as jest.Mock).mockReturnValue((key: string) => key)
})

afterEach(() => {
  jest.resetAllMocks()
})

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
  let user: ReturnType<typeof userEvent.setup>
  let pathname: string

  beforeEach(() => {
    user = userEvent.setup()
    pathname = '/events'
  })

  it('should open the menu with the hamburger button', async () => {
    renderAt(pathname)

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('should close the menu with the hamburger button', async () => {
    renderAt(pathname)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    await user.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  describe('and a section is expanded', () => {
    let discover: HTMLElement

    beforeEach(() => {
      renderAt(pathname)
      discover = screen.getAllByRole('button', { name: /navbar\.discover/i }).find(button => button.hasAttribute('aria-expanded'))!
    })

    it('should expose the expanded state', async () => {
      await user.click(discover)

      expect(discover).toHaveAttribute('aria-expanded', 'true')
    })

    it('should collapse after a second click', async () => {
      await user.click(discover)
      await user.click(discover)

      expect(discover).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('and the menu is open', () => {
    beforeEach(async () => {
      renderAt(pathname)
      await user.click(screen.getByRole('button', { name: 'Open menu' }))
    })

    it('should close on Escape', async () => {
      await user.keyboard('{Escape}')

      expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
    })
  })
})

describe('when the signed-in visitor opens the user card', () => {
  let address: string
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    address = '0x1234567890123456789012345678901234567890'
    user = userEvent.setup()
  })

  it('should show the shortened wallet address', async () => {
    renderAt('/events', { isSignedIn: true, address })

    await user.click(screen.getByRole('button', { name: 'User menu' }))

    expect(screen.getAllByText('0x1234...7890').length).toBeGreaterThan(0)
  })

  it('should close when clicking outside navigation', async () => {
    renderAt('/events', { isSignedIn: true, address })
    await user.click(screen.getByRole('button', { name: 'User menu' }))

    await user.click(document.body)

    expect(screen.getByRole('button', { name: 'User menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('should invoke the sign-out handler', async () => {
    renderAt('/events', { isSignedIn: true, address })
    await user.click(screen.getByRole('button', { name: 'User menu' }))

    await user.click(screen.getAllByText('component.landing.navbar.logout')[0])

    expect(props.onClickSignOut).toHaveBeenCalledTimes(1)
  })

  describe('and the visitor copies the wallet address', () => {
    let writeText: jest.Mock

    beforeEach(() => {
      writeText = jest.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    })

    it('should copy the full address', async () => {
      renderAt('/events', { isSignedIn: true, address })
      await user.click(screen.getByRole('button', { name: 'User menu' }))

      await user.click(screen.getAllByRole('button', { name: 'Copy address' })[0])

      expect(writeText).toHaveBeenCalledWith(address)
    })

    it('should confirm a successful copy', async () => {
      renderAt('/events', { isSignedIn: true, address })
      await user.click(screen.getByRole('button', { name: 'User menu' }))

      await user.click(screen.getAllByRole('button', { name: 'Copy address' })[0])

      await waitFor(() => expect(screen.getAllByText('component.landing.navbar.address_copied').length).toBeGreaterThan(0))
    })

    describe('and the clipboard rejects the request', () => {
      beforeEach(() => {
        writeText.mockRejectedValueOnce(new Error('clipboard unavailable'))
      })

      it('should keep the address visible', async () => {
        renderAt('/events', { isSignedIn: true, address })
        await user.click(screen.getByRole('button', { name: 'User menu' }))

        await user.click(screen.getAllByRole('button', { name: 'Copy address' })[0])

        expect(screen.getAllByText('0x1234...7890').length).toBeGreaterThan(0)
      })
    })
  })
})

describe('when the visitor has not signed in', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
  })

  it('should invoke the sign-in handler', async () => {
    renderAt('/events')

    await user.click(screen.getByRole('button', { name: 'component.landing.navbar.sign_in' }))

    expect(props.onClickSignIn).toHaveBeenCalledTimes(1)
  })
})

describe('when the visitor opens a desktop section', () => {
  let user: ReturnType<typeof userEvent.setup>
  let desktopTab: HTMLElement

  beforeEach(() => {
    user = userEvent.setup()
    renderAt('/events')
    desktopTab = screen
      .getAllByRole('button', { name: /navbar\.discover/i, hidden: true })
      .find(button => button.getAttribute('aria-haspopup') === 'true')!
  })

  it('should reveal its destination links on hover', async () => {
    await user.hover(desktopTab.parentElement!)

    expect(desktopTab).toHaveAttribute('aria-expanded', 'true')
  })

  it('should close the section after the pointer leaves', async () => {
    await user.hover(desktopTab.parentElement!)

    await user.unhover(desktopTab.parentElement!)

    await waitFor(() => expect(desktopTab).toHaveAttribute('aria-expanded', 'false'))
  })
})

describe('when the landing navbar is minimal', () => {
  let onClickJumpIn: jest.Mock
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    onClickJumpIn = jest.fn()
    user = userEvent.setup()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 })
  })

  it('should invoke jump-in after scrolling', async () => {
    renderAt('/', { isLandingPage: true, onClickJumpIn })
    fireEvent.scroll(window)

    await user.click(screen.getByRole('button', { name: /jump_in/i }))

    expect(onClickJumpIn).toHaveBeenCalledTimes(1)
  })
})

describe('when the notification list is open', () => {
  let notifications: NonNullable<NavbarProps['notifications']>

  describe('and the bell is clicked', () => {
    let onClick: jest.Mock
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
      onClick = jest.fn()
      user = userEvent.setup()
      notifications = {
        items: [],
        isLoading: false,
        isOpen: false,
        activeTab: 'newest',
        onClick,
        onClose: jest.fn(),
        onChangeTab: jest.fn()
      }
    })

    it('should invoke the notification handler', async () => {
      renderAt('/events', { isSignedIn: true, notifications })

      await user.click(screen.getByRole('button', { name: 'Notifications' }))

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('and an unrecognized notification is present', () => {
    beforeEach(() => {
      notifications = {
        items: [{ id: 'one', read: false, type: 'new_event', timestamp: Date.now() - 120000, metadata: { message: 'New event nearby' } }],
        isLoading: false,
        isOpen: true,
        activeTab: 'newest',
        onClick: jest.fn(),
        onClose: jest.fn(),
        onChangeTab: jest.fn()
      }
    })

    it('should show a fallback title', () => {
      renderAt('/events', { isSignedIn: true, notifications })

      expect(screen.getByText('New Event')).toBeInTheDocument()
    })

    it('should show the relative time', () => {
      renderAt('/events', { isSignedIn: true, notifications })

      expect(screen.getByText('2m ago')).toBeInTheDocument()
    })
  })

  describe('and no notifications exist', () => {
    beforeEach(() => {
      notifications = {
        items: [],
        isLoading: false,
        isOpen: true,
        activeTab: 'newest',
        onClick: jest.fn(),
        onClose: jest.fn(),
        onChangeTab: jest.fn()
      }
    })

    it('should show the empty state', () => {
      renderAt('/events', { isSignedIn: true, notifications })

      expect(screen.getByText('component.landing.navbar.notifications_empty_new')).toBeInTheDocument()
    })
  })
})
