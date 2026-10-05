import React from 'react'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useLocale } from '../../intl/LocaleContext'
import { LandingNavbar } from './LandingNavbar'

jest.mock('decentraland-ui2', () => ({
  styled: jest.requireActual('@emotion/styled').default,
  dclColors: {
    base: { primary: '#ff2d55', primaryDark: '#d3255f' },
    neutral: { gray: '#716b7c', softWhite: '#ecebed', white: '#ffffff' }
  }
}))

jest.mock('decentraland-ui2/dist/components/Notifications/utils', () => ({
  NotificationComponentByType: {
    known_type: ({ notification, locale }: { notification: { id: string }; locale: string }) =>
      React.createElement('div', null, `rich ${notification.id} ${locale}`)
  }
}))

jest.mock('@dcl/hooks', () => ({ useAnalytics: jest.fn() }))
jest.mock('../../intl/LocaleContext', () => ({ useLocale: jest.fn() }))
jest.mock('../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: jest.fn() }))

type NavbarProps = ComponentProps<typeof LandingNavbar>
type NotificationsProp = NonNullable<NavbarProps['notifications']>

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const SHORT_ADDRESS = '0x1234...5678'

const onClickSignIn = jest.fn()
const onClickSignOut = jest.fn()
const track = jest.fn()

const navbar = (pathname: string, extra: Partial<NavbarProps>) => (
  <MemoryRouter initialEntries={[pathname]}>
    <LandingNavbar onClickSignIn={onClickSignIn} onClickSignOut={onClickSignOut} isSignedIn={false} {...extra} />
  </MemoryRouter>
)

const renderAt = (pathname: string, extra: Partial<NavbarProps> = {}) => render(navbar(pathname, extra))

const renderSignedIn = (extra: Partial<NavbarProps> = {}) => renderAt('/', { isSignedIn: true, address: ADDRESS, ...extra })

const buildNotifications = (overrides: Partial<NotificationsProp> = {}): NotificationsProp => ({
  items: [],
  isLoading: false,
  isOpen: true,
  activeTab: 'newest',
  onClick: jest.fn(),
  onClose: jest.fn(),
  onChangeTab: jest.fn(),
  ...overrides
})

const openUserCard = () => fireEvent.click(screen.getByRole('button', { name: 'User menu', hidden: true }))

beforeEach(() => {
  jest.mocked(useAnalytics).mockReturnValue({ isInitialized: true, track } as unknown as ReturnType<typeof useAnalytics>)
  jest.mocked(useLocale).mockReturnValue({ locale: 'en' } as unknown as ReturnType<typeof useLocale>)
  jest.mocked(useFormatMessage).mockReturnValue(((key: string) => key) as unknown as ReturnType<typeof useFormatMessage>)
})

afterEach(() => {
  jest.useRealTimers()
  jest.resetAllMocks()
})

describe('when the navbar shows the credits chip', () => {
  it('should send it to the buy-credits page in the Shop', () => {
    renderAt('/', { isSignedIn: true, creditsBalance: 120 })

    expect(screen.getByRole('link', { name: /credits_balance/i })).toHaveAttribute('href', '/shop/credits')
  })

  it('should still offer it on a zero balance', () => {
    renderAt('/', { isSignedIn: true, creditsBalance: 0 })

    expect(screen.getByRole('link', { name: /credits_balance/i })).toHaveAttribute('href', '/shop/credits')
  })

  it('should hide it when the balance is unknown', () => {
    renderAt('/', { isSignedIn: true, creditsBalance: null })

    expect(screen.queryByRole('link', { name: /credits_balance/i })).not.toBeInTheDocument()
  })

  it('should print the balance as whole credits with thousands separators', () => {
    renderAt('/', { isSignedIn: true, creditsBalance: 1234.9 })

    expect(screen.getByRole('link', { name: /credits_balance/i })).toHaveTextContent('1,234')
  })
})

describe('when the visitor is on a page the Discover dropdown owns', () => {
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

describe('when the navbar renders on the landing page for a signed-out visitor', () => {
  it('should show the sign in button', () => {
    renderAt('/', { isLandingPage: true })

    expect(screen.getByRole('button', { name: 'component.landing.navbar.sign_in' })).toBeInTheDocument()
  })

  it('should leave the section tabs out', () => {
    renderAt('/', { isLandingPage: true })

    expect(screen.queryByRole('button', { name: /navbar\.discover/i, hidden: true })).not.toBeInTheDocument()
  })

  describe('and the visitor clicks sign in', () => {
    beforeEach(() => {
      renderAt('/', { isLandingPage: true })
      fireEvent.click(screen.getByRole('button', { name: 'component.landing.navbar.sign_in' }))
    })

    it('should start the sign in flow', () => {
      expect(onClickSignIn).toHaveBeenCalledTimes(1)
    })

    it('should track the sign in click', () => {
      expect(track).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: 'sign_in' }))
    })
  })

  describe('and analytics is not initialized yet', () => {
    beforeEach(() => {
      jest.mocked(useAnalytics).mockReturnValue({ isInitialized: false, track } as unknown as ReturnType<typeof useAnalytics>)
      renderAt('/', { isLandingPage: true })
      fireEvent.click(screen.getByRole('button', { name: 'component.landing.navbar.sign_in' }))
    })

    it('should not track the click', () => {
      expect(track).not.toHaveBeenCalled()
    })
  })

  describe('and a sign in is in progress', () => {
    it('should disable the button with the signing in label', () => {
      renderAt('/', { isLandingPage: true, isSigningIn: true })

      expect(screen.getByRole('button', { name: 'component.landing.navbar.signing_in' })).toBeDisabled()
    })
  })

  describe('and the visitor scrolls past the hero', () => {
    const onClickJumpIn = jest.fn()

    beforeEach(() => {
      renderAt('/', { isLandingPage: true, onClickJumpIn })
      act(() => {
        window.scrollY = 120
        window.dispatchEvent(new Event('scroll'))
      })
    })

    afterEach(() => {
      window.scrollY = 0
    })

    it('should hide the wordmark', () => {
      expect(screen.getByAltText('Decentraland')).toHaveStyle({ opacity: '0' })
    })

    it('should swap sign in for a jump in button that launches the explorer', () => {
      fireEvent.click(screen.getByRole('button', { name: 'component.landing.navbar.jump_in' }))

      expect(onClickJumpIn).toHaveBeenCalledTimes(1)
    })

    it('should track the jump in click', () => {
      fireEvent.click(screen.getByRole('button', { name: 'component.landing.navbar.jump_in' }))

      expect(track).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: 'jump_in' }))
    })
  })
})

describe('when a signed-out visitor is on an inner page', () => {
  beforeEach(() => {
    renderAt('/blog')
  })

  it('should start the sign in flow from the sign in button', () => {
    fireEvent.click(screen.getByRole('button', { name: 'component.landing.navbar.sign_in' }))

    expect(onClickSignIn).toHaveBeenCalledTimes(1)
  })

  it('should not render the user menu', () => {
    expect(screen.queryByRole('button', { name: 'User menu', hidden: true })).not.toBeInTheDocument()
  })
})

describe('when the visitor opens the mobile menu', () => {
  beforeEach(() => {
    renderAt('/')
    fireEvent.click(screen.getByRole('button', { name: 'Open menu', hidden: true }))
  })

  it('should turn the toggle into a close button', () => {
    expect(screen.getByRole('button', { name: 'Close menu', hidden: true })).toHaveAttribute('aria-expanded', 'true')
  })

  it('should lock the page scroll', () => {
    expect(document.body.style.overflow).toBe('hidden')
  })

  describe('and presses Escape', () => {
    beforeEach(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
    })

    it('should close the menu', () => {
      expect(screen.getByRole('button', { name: 'Open menu', hidden: true })).toHaveAttribute('aria-expanded', 'false')
    })

    it('should release the page scroll', () => {
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('and presses another key', () => {
    it('should keep the menu open', () => {
      fireEvent.keyDown(document, { key: 'Enter' })

      expect(screen.getByRole('button', { name: 'Close menu', hidden: true })).toBeInTheDocument()
    })
  })

  describe('and clicks the overlay behind it', () => {
    it('should close the menu', () => {
      const overlay = screen.getByRole('navigation', { name: 'Mobile navigation', hidden: true }).previousElementSibling as HTMLElement
      fireEvent.click(overlay)

      expect(screen.getByRole('button', { name: 'Open menu', hidden: true })).toBeInTheDocument()
    })
  })

  describe('and clicks the toggle again', () => {
    it('should close the menu', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close menu', hidden: true }))

      expect(screen.getByRole('button', { name: 'Open menu', hidden: true })).toBeInTheDocument()
    })
  })
})

describe('when the visitor expands a mobile menu section', () => {
  const mobileHeader = (name: RegExp) =>
    screen.getAllByRole('button', { name, hidden: true }).find(el => el.hasAttribute('aria-expanded') && !el.hasAttribute('aria-haspopup'))

  beforeEach(() => {
    renderAt('/')
    fireEvent.click(mobileHeader(/navbar\.shop/i) as HTMLElement)
  })

  it('should mark the section as expanded', () => {
    expect(mobileHeader(/navbar\.shop/i)).toHaveAttribute('aria-expanded', 'true')
  })

  it('should open external items in a new tab', () => {
    const merch = screen
      .getAllByRole('link', { name: 'component.landing.navbar.merch', hidden: true })
      .find(el => el.getAttribute('href') === 'https://store.decentraland.org/')

    expect(merch).toHaveAttribute('target', '_blank')
  })

  describe('and clicks the same section again', () => {
    it('should collapse it', () => {
      fireEvent.click(mobileHeader(/navbar\.shop/i) as HTMLElement)

      expect(mobileHeader(/navbar\.shop/i)).toHaveAttribute('aria-expanded', 'false')
    })
  })
})

describe('when the visitor hovers a desktop section tab', () => {
  const desktopTab = (name: RegExp) =>
    screen.getAllByRole('button', { name, hidden: true }).find(el => el.getAttribute('aria-haspopup') === 'true') as HTMLElement

  beforeEach(() => {
    jest.useFakeTimers()
    renderAt('/')
    fireEvent.mouseEnter(desktopTab(/navbar\.create/i).parentElement as HTMLElement)
  })

  it('should open its dropdown', () => {
    expect(desktopTab(/navbar\.create/i)).toHaveAttribute('aria-expanded', 'true')
  })

  describe('and the pointer leaves it', () => {
    beforeEach(() => {
      fireEvent.mouseLeave(desktopTab(/navbar\.create/i).parentElement as HTMLElement)
    })

    it('should keep the dropdown open during the grace period', () => {
      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(desktopTab(/navbar\.create/i)).toHaveAttribute('aria-expanded', 'true')
    })

    it('should close the dropdown once the grace period ends', () => {
      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(desktopTab(/navbar\.create/i)).toHaveAttribute('aria-expanded', 'false')
    })

    describe('and the pointer comes back before the grace period ends', () => {
      it('should keep the dropdown open', () => {
        fireEvent.mouseEnter(desktopTab(/navbar\.create/i).parentElement as HTMLElement)
        act(() => {
          jest.advanceTimersByTime(500)
        })

        expect(desktopTab(/navbar\.create/i)).toHaveAttribute('aria-expanded', 'true')
      })
    })
  })

  describe('and the visitor presses Escape', () => {
    it('should close the dropdown', () => {
      fireEvent.keyDown(document, { key: 'Escape' })

      expect(desktopTab(/navbar\.create/i)).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('and the page scrolls', () => {
    it('should close the dropdown', () => {
      act(() => {
        window.dispatchEvent(new Event('scroll'))
      })

      expect(desktopTab(/navbar\.create/i)).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('and the visitor clicks outside the navbar', () => {
    it('should close the dropdown', () => {
      fireEvent.mouseDown(document.body)

      expect(desktopTab(/navbar\.create/i)).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('and the visitor clicks the tab', () => {
    it('should navigate to the first item of the section', () => {
      const open = jest.spyOn(window, 'open').mockImplementation(() => null)
      fireEvent.click(desktopTab(/navbar\.create/i))

      expect(open).toHaveBeenCalledWith('https://decentraland.org/create/', '_self')
    })
  })

  describe('and the dropdown lists an external item', () => {
    it('should open it in a new tab', () => {
      const docs = screen
        .getAllByRole('link', { name: 'component.landing.navbar.creator_documentation', hidden: true })
        .find(el => el.getAttribute('rel') === 'noopener noreferrer' && el.closest('[role="navigation"]') === null)

      expect(docs).toHaveAttribute('target', '_blank')
    })
  })
})

describe('when a signed-in visitor opens the user menu', () => {
  const onOpenUserCard = jest.fn()

  beforeEach(() => {
    renderSignedIn({
      onOpenUserCard,
      avatar: { name: 'Jane', hasClaimedName: true, avatar: { snapshots: { face256: 'facehash', body: 'https://example.com/body.png' } } }
    })
    openUserCard()
  })

  it('should notify that the user card opened', () => {
    expect(onOpenUserCard).toHaveBeenCalledTimes(1)
  })

  it('should mark the avatar button as expanded', () => {
    expect(screen.getByRole('button', { name: 'User menu', hidden: true })).toHaveAttribute('aria-expanded', 'true')
  })

  it('should show the user name', () => {
    expect(screen.getAllByText('Jane', { ignore: '[hidden]' }).length).toBeGreaterThan(0)
  })

  it('should show the shortened wallet address', () => {
    expect(screen.getAllByText(SHORT_ADDRESS).length).toBeGreaterThan(0)
  })

  it('should render the full body snapshot from its absolute url', () => {
    const body = Array.from(document.querySelectorAll('img')).find(img => img.getAttribute('src') === 'https://example.com/body.png')

    expect(body).toBeDefined()
  })

  it('should resolve the face snapshot hash against the content server', () => {
    const faces = Array.from(document.querySelectorAll('img')).filter(
      img => img.getAttribute('src') === 'https://peer.decentraland.org/content/contents/facehash'
    )

    expect(faces.length).toBeGreaterThan(1)
  })

  it('should link every menu entry to its destination', () => {
    const profileLinks = screen.getAllByRole('link', { name: 'component.landing.navbar.view_profile', hidden: true })

    profileLinks.forEach(link => expect(link).toHaveAttribute('href', 'https://decentraland.org/profile'))
  })

  it('should sign out from the logout button', () => {
    fireEvent.click(screen.getAllByRole('button', { name: 'component.landing.navbar.logout', hidden: true })[0])

    expect(onClickSignOut).toHaveBeenCalledTimes(1)
  })

  describe('and the avatar image loads', () => {
    it('should fade the image in', () => {
      const face = screen.getByRole('button', { name: 'User menu', hidden: true }).querySelector('img') as HTMLImageElement
      fireEvent.load(face)

      expect(face).toHaveStyle({ opacity: '1' })
    })
  })

  describe('and the avatar image fails', () => {
    it('should still reveal the image slot', () => {
      const face = screen.getByRole('button', { name: 'User menu', hidden: true }).querySelector('img') as HTMLImageElement
      fireEvent.error(face)

      expect(face).toHaveStyle({ opacity: '1' })
    })
  })

  describe.each([
    ['loads', fireEvent.load],
    ['fails', fireEvent.error]
  ])('and the mobile avatar image %s', (_, dispatch) => {
    it('should reveal the image', () => {
      const mobileFace = document.querySelector('[data-mobile-user-card] img') as HTMLImageElement
      dispatch(mobileFace)

      expect(mobileFace).toHaveStyle({ opacity: '1' })
    })
  })

  describe('and the visitor presses inside the mobile user card', () => {
    it('should keep the card open', () => {
      fireEvent.mouseDown(document.querySelector('[data-mobile-user-card]') as HTMLElement)

      expect(screen.getByRole('button', { name: 'User menu', hidden: true })).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('and the visitor clicks inside the mobile user card', () => {
    it('should keep the card open', () => {
      fireEvent.click(document.querySelector('[data-mobile-user-card]') as HTMLElement)

      expect(screen.getByRole('button', { name: 'User menu', hidden: true })).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('and the visitor clicks outside the navbar', () => {
    it('should close the card', () => {
      fireEvent.mouseDown(document.body)

      expect(screen.getByRole('button', { name: 'User menu', hidden: true })).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('and the visitor clicks the avatar again', () => {
    it('should close the card without notifying again', () => {
      openUserCard()

      expect(onOpenUserCard).toHaveBeenCalledTimes(1)
    })
  })
})

describe('when a signed-in visitor copies the wallet address', () => {
  const writeText = jest.fn()

  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  describe('and the clipboard accepts it', () => {
    beforeEach(async () => {
      jest.useFakeTimers()
      writeText.mockResolvedValue(undefined)
      renderSignedIn()
      openUserCard()
      await act(async () => {
        fireEvent.click(screen.getAllByRole('button', { name: 'Copy address', hidden: true })[0])
      })
    })

    it('should write the full address', () => {
      expect(writeText).toHaveBeenCalledWith(ADDRESS)
    })

    it('should confirm the copy in place of the address', () => {
      expect(screen.getAllByText('component.landing.navbar.address_copied', { exact: false }).length).toBeGreaterThan(0)
    })

    it('should restore the address after two seconds', () => {
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(screen.queryByText('component.landing.navbar.address_copied', { exact: false })).not.toBeInTheDocument()
    })
  })

  describe('and the clipboard rejects it', () => {
    beforeEach(async () => {
      writeText.mockRejectedValue(new Error('denied'))
      renderSignedIn()
      openUserCard()
      await act(async () => {
        fireEvent.click(screen.getAllByRole('button', { name: 'Copy address', hidden: true })[0])
      })
    })

    it('should keep showing the address', () => {
      expect(screen.queryByText('component.landing.navbar.address_copied', { exact: false })).not.toBeInTheDocument()
    })
  })

  describe('and there is no address', () => {
    it('should not touch the clipboard', () => {
      renderAt('/', { isSignedIn: true })
      openUserCard()
      fireEvent.click(screen.getAllByRole('button', { name: 'Copy address', hidden: true })[0])

      expect(writeText).not.toHaveBeenCalled()
    })
  })
})

describe('when the user menu shows MANA balances', () => {
  const manaText = () => (document.querySelector('[data-mobile-user-card]') as HTMLElement).textContent

  it('should abbreviate thousands', () => {
    renderSignedIn({ manaBalances: { ethereum: 1500, polygon: 2000 } })
    openUserCard()

    expect(manaText()).toContain('1.5K')
  })

  it('should drop the decimal on round thousands', () => {
    renderSignedIn({ manaBalances: { ethereum: 1500, polygon: 2000 } })
    openUserCard()

    expect(manaText()).toContain('2K')
  })

  it('should keep two decimals below one MANA', () => {
    renderSignedIn({ manaBalances: { ethereum: 0.5, polygon: 0 } })
    openUserCard()

    expect(manaText()).toContain('0.50')
  })

  it('should floor balances between one and a thousand', () => {
    renderSignedIn({ manaBalances: { ethereum: 0, polygon: 42.9 } })
    openUserCard()

    expect(manaText()).toContain('42')
  })

  it('should hide the row when both balances are dust', () => {
    renderSignedIn({ manaBalances: { ethereum: 0.001, polygon: 0 } })
    openUserCard()

    expect(manaText()).not.toContain('0.00')
  })

  it('should show skeletons while the balances load', () => {
    renderSignedIn({ isManaLoading: true, manaBalances: { ethereum: 50, polygon: 50 } })
    openUserCard()

    expect(manaText()).not.toContain('50')
  })
})

describe('when the signed-in avatar is still loading', () => {
  it('should leave the avatar image out', () => {
    renderSignedIn({ isLoadingProfile: true })

    expect(screen.getByRole('button', { name: 'User menu', hidden: true }).querySelector('img')).toBeNull()
  })
})

describe('when the signed-in profile has a name', () => {
  it('should paint the avatar with its deterministic background color', () => {
    renderSignedIn({ avatar: { name: 'Jane', ethAddress: ADDRESS } })

    expect(screen.getByRole('button', { name: 'User menu', hidden: true }).style.backgroundColor).not.toBe('')
  })
})

describe('when the avatar snapshot is a data url', () => {
  it('should use it as is', () => {
    renderSignedIn({ avatar: { avatar: { snapshots: { face256: 'data:image/png;base64,AAAA' } } } })

    expect(screen.getByRole('button', { name: 'User menu', hidden: true }).querySelector('img')).toHaveAttribute(
      'src',
      'data:image/png;base64,AAAA'
    )
  })
})

describe('when the visitor has unread notifications', () => {
  const unread = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: `n${i}`, read: false, type: 'x', timestamp: Date.now(), metadata: {} }))

  it('should show the unread count on the bell', () => {
    renderSignedIn({ notifications: buildNotifications({ isOpen: false, items: unread(3) }) })

    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveTextContent('3')
  })

  it('should cap the badge at 9+', () => {
    renderSignedIn({ notifications: buildNotifications({ isOpen: false, items: unread(12) }) })

    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveTextContent('9+')
  })
})

describe('when the notifications panel is open', () => {
  describe('and the notifications are loading', () => {
    it('should show the loading message', () => {
      renderSignedIn({ notifications: buildNotifications({ isLoading: true }) })

      expect(screen.getByText('component.landing.navbar.notifications_loading')).toBeInTheDocument()
    })
  })

  describe('and there are no notifications', () => {
    it('should show the empty message', () => {
      renderSignedIn({ notifications: buildNotifications() })

      expect(screen.getByText('component.landing.navbar.notifications_empty_new')).toBeInTheDocument()
    })
  })

  describe('and the notifications have no dedicated renderer', () => {
    const now = Date.now()
    const items = [
      { id: 'a', read: false, type: 'item_sold', timestamp: now - 10_000, metadata: { link: 'https://example.com/sale' } },
      { id: 'b', read: true, type: 'bid_accepted', timestamp: now - 5 * 60_000, metadata: { title: 'Bid in', message: 'Accepted' } },
      { id: 'c', read: true, type: 'reward', timestamp: now - 3 * 3_600_000, metadata: { nftName: 'Cool hat' } },
      { id: 'd', read: true, type: 'event', timestamp: now - 2 * 86_400_000, metadata: { description: 'Starts soon' } }
    ]

    beforeEach(() => {
      renderSignedIn({ notifications: buildNotifications({ items }) })
    })

    it('should title an untitled notification after its humanized type', () => {
      expect(screen.getByText('Item Sold')).toBeInTheDocument()
    })

    it('should prefer the metadata title', () => {
      expect(screen.getByText('Bid in')).toBeInTheDocument()
    })

    it('should fall back to the nft name', () => {
      expect(screen.getByText('Cool hat')).toBeInTheDocument()
    })

    it('should show the description', () => {
      expect(screen.getByText('Starts soon')).toBeInTheDocument()
    })

    it('should show the message when there is no description', () => {
      expect(screen.getByText('Accepted')).toBeInTheDocument()
    })

    it.each(['just now', '5m ago', '3h ago', '2d ago'])('should show the relative time %s', label => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it('should open the linked page when the notification is clicked', () => {
      const open = jest.spyOn(window, 'open').mockImplementation(() => null)
      fireEvent.click(screen.getByText('Item Sold'))

      expect(open).toHaveBeenCalledWith('https://example.com/sale', '_blank', 'noopener')
    })

    it('should not open anything for a notification without a link', () => {
      const open = jest.spyOn(window, 'open').mockImplementation(() => null)
      fireEvent.click(screen.getByText('Cool hat'))

      expect(open).not.toHaveBeenCalled()
    })
  })
})

describe('when the visitor clicks the notification bell', () => {
  const onClick = jest.fn()
  const onClose = jest.fn()
  const items = [{ id: 'rich-1', read: false, type: 'known_type', timestamp: Date.now(), metadata: {} }]

  beforeEach(async () => {
    const view = renderSignedIn({ notifications: buildNotifications({ isOpen: false, items, onClick, onClose }) })
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    view.rerender(navbar('/', { isSignedIn: true, address: ADDRESS, notifications: buildNotifications({ items, onClick, onClose }) }))
    await waitFor(() => expect(screen.getByText('rich rich-1 en')).toBeInTheDocument())
  })

  it('should forward the click', () => {
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should render the notification with its dedicated renderer', () => {
    expect(screen.getByText('rich rich-1 en')).toBeInTheDocument()
  })

  describe('and then opens the user menu', () => {
    it('should close the notifications', () => {
      openUserCard()

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('and then clicks outside the navbar', () => {
    it('should close the notifications', () => {
      fireEvent.mouseDown(document.body)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})

describe('when the visitor clicks the bell without a notifications source', () => {
  it('should not render a panel', () => {
    renderSignedIn()
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))

    expect(screen.queryByText('component.landing.navbar.notifications_title')).not.toBeInTheDocument()
  })
})
