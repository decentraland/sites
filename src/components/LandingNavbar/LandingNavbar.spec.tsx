import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAnalytics } from '@dcl/hooks'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useLocale } from '../../intl/LocaleContext'
import { LandingNavbar } from './LandingNavbar'
import type { LandingNavbarProps } from './LandingNavbar'

jest.mock('decentraland-ui2', () => ({
  styled: jest.requireActual('@emotion/styled').default,
  keyframes: jest.requireActual('@emotion/react').keyframes,
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

type NotificationsProp = NonNullable<LandingNavbarProps['notifications']>

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const FACE_URL = 'https://peer.decentraland.org/content/contents/facehash'
const SNAPSHOTS = { face256: 'facehash', body: 'https://example.com/body.png' }
const COPIED = 'component.landing.navbar.address_copied'

let props: LandingNavbarProps
let pathname: string
let track: jest.Mock
const navbar = () => (
  <MemoryRouter initialEntries={[pathname]}>
    <LandingNavbar {...props} />
  </MemoryRouter>
)
const renderNavbar = () => render(navbar())
const renderSignedIn = (extra: Partial<LandingNavbarProps> = {}) => {
  props = { ...props, isSignedIn: true, address: ADDRESS, ...extra }
  return renderNavbar()
}
const renderAt = (path: string, extra: Partial<LandingNavbarProps> = {}) => {
  pathname = path
  props = { ...props, isSignedIn: false, ...extra }
  return renderNavbar()
}
const button = (name: string | RegExp) => screen.getByRole('button', { name, hidden: true })
const userMenu = () => button('User menu')
const creditsChip = () => screen.queryByRole('link', { name: /credits_balance/i })
const openUserMenu = (extra: Partial<LandingNavbarProps> = {}) => {
  renderSignedIn(extra)
  fireEvent.click(userMenu())
}
const overlay = () => screen.getByRole('navigation', { name: 'Mobile navigation', hidden: true }).previousElementSibling as Element
const advance = (ms: number) => act(() => void jest.advanceTimersByTime(ms))
const notificationsWith = (overrides: Partial<NotificationsProp> = {}): NotificationsProp => ({
  items: [],
  isLoading: false,
  isOpen: true,
  activeTab: 'newest',
  onClick: jest.fn(),
  onClose: jest.fn(),
  onChangeTab: jest.fn(),
  ...overrides
})

beforeEach(() => {
  pathname = '/'
  track = jest.fn()
  props = { isSignedIn: false, onClickSignIn: jest.fn(), onClickSignOut: jest.fn() }
  jest.mocked(useAnalytics).mockReturnValue({ isInitialized: true, track } as unknown as ReturnType<typeof useAnalytics>)
  jest.mocked(useLocale).mockReturnValue({ locale: 'en' } as unknown as ReturnType<typeof useLocale>)
  jest.mocked(useFormatMessage).mockReturnValue(((key: string) => key) as unknown as ReturnType<typeof useFormatMessage>)
})

afterEach(() => {
  jest.useRealTimers()
  jest.resetAllMocks()
})

describe.each([
  [0, '0'],
  [1234.9, '1,234']
])('when a signed-in visitor has %s credits', (creditsBalance, label) => {
  beforeEach(() => renderSignedIn({ creditsBalance }))
  it('should link the chip to the buy-credits page in the Shop', () => expect(creditsChip()).toHaveAttribute('href', '/shop/credits'))
  it(`should print ${label} whole credits`, () => expect(creditsChip()).toHaveTextContent(label))
})

describe('when the credits balance of a signed-in visitor is unknown', () => {
  beforeEach(() => renderSignedIn({ creditsBalance: null }))
  it('should hide the chip', () => expect(creditsChip()).toBeNull())
})

describe.each([
  ['/places', true],
  ['/', false]
])('when the visitor is on %s', (path, active) => {
  beforeEach(() => {
    pathname = path
    renderNavbar()
  })
  it(`should ${active ? '' : 'not '}mark the Discover tab as selected`, () =>
    expect(screen.getByRole('button', { name: /navbar\.discover/i }).hasAttribute('data-active')).toBe(active))
})

describe('when a signed-out visitor is on the landing page', () => {
  beforeEach(() => {
    props = { ...props, isLandingPage: true, onClickJumpIn: jest.fn() }
  })

  describe('and analytics is ready', () => {
    beforeEach(() => renderNavbar())
    it('should leave the section tabs out', () =>
      expect(screen.queryByRole('button', { name: /navbar\.discover/i, hidden: true })).toBeNull())

    describe('and the visitor clicks sign in', () => {
      beforeEach(() => fireEvent.click(button('component.landing.navbar.sign_in')))
      it('should start the sign in flow', () => expect(props.onClickSignIn).toHaveBeenCalledTimes(1))
      it('should track the sign in click', () => expect(track.mock.calls[0][1]).toMatchObject({ action: 'sign_in' }))
    })

    describe('and the visitor scrolls past the hero', () => {
      beforeEach(() => {
        window.scrollY = 120
        act(() => void window.dispatchEvent(new Event('scroll')))
      })
      afterEach(() => {
        window.scrollY = 0
      })
      it('should hide the wordmark', () => expect(screen.getByAltText('Decentraland')).toHaveStyle({ opacity: '0' }))

      describe('and the visitor clicks jump in', () => {
        beforeEach(() => fireEvent.click(button('component.landing.navbar.jump_in')))
        it('should launch the explorer', () => expect(props.onClickJumpIn).toHaveBeenCalledTimes(1))
        it('should track the jump in click', () => expect(track.mock.calls[0][1]).toMatchObject({ action: 'jump_in' }))
      })
    })
  })

  describe('and analytics is not initialized yet', () => {
    beforeEach(() => {
      jest.mocked(useAnalytics).mockReturnValue({ isInitialized: false, track } as unknown as ReturnType<typeof useAnalytics>)
      renderNavbar()
      fireEvent.click(button('component.landing.navbar.sign_in'))
    })
    it('should not track the sign in click', () => expect(track).not.toHaveBeenCalled())
  })

  describe('and a sign in is in progress', () => {
    beforeEach(() => {
      props.isSigningIn = true
      renderNavbar()
    })
    it('should disable the button with the signing in label', () => expect(button('component.landing.navbar.signing_in')).toBeDisabled())
  })
})

describe('when a signed-out visitor is on an inner page', () => {
  beforeEach(() => {
    pathname = '/blog'
    renderNavbar()
  })
  it('should not render the user menu', () => expect(screen.queryByRole('button', { name: 'User menu', hidden: true })).toBeNull())

  describe('and the visitor clicks sign in', () => {
    beforeEach(() => fireEvent.click(button('component.landing.navbar.sign_in')))
    it('should start the sign in flow', () => expect(props.onClickSignIn).toHaveBeenCalledTimes(1))
  })
})

describe('when the visitor opens the mobile menu', () => {
  beforeEach(() => {
    renderNavbar()
    fireEvent.click(button('Open menu'))
  })
  it('should turn the toggle into a close button', () => expect(button('Close menu')).toHaveAttribute('aria-expanded', 'true'))
  it('should lock the page scroll', () => expect(document.body.style.overflow).toBe('hidden'))

  describe.each([
    ['presses Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['clicks the overlay', () => fireEvent.click(overlay())],
    ['clicks the toggle again', () => fireEvent.click(button('Close menu'))]
  ])('and the visitor %s', (_, close) => {
    beforeEach(close)
    it('should close the menu', () => expect(button('Open menu')).toHaveAttribute('aria-expanded', 'false'))
    it('should release the page scroll', () => expect(document.body.style.overflow).toBe(''))
  })
})

describe('when the visitor expands a mobile menu section', () => {
  const shopHeader = () =>
    screen.getAllByRole('button', { name: /navbar\.shop/i, hidden: true }).find(el => !el.hasAttribute('aria-haspopup')) as HTMLElement

  beforeEach(() => {
    renderNavbar()
    fireEvent.click(shopHeader())
  })
  it('should mark the section as expanded', () => expect(shopHeader()).toHaveAttribute('aria-expanded', 'true'))

  describe('and the visitor clicks the same section again', () => {
    beforeEach(() => fireEvent.click(shopHeader()))
    it('should collapse it', () => expect(shopHeader()).toHaveAttribute('aria-expanded', 'false'))
  })
})

describe('when the visitor hovers a desktop section tab', () => {
  const createTab = () =>
    screen.getAllByRole('button', { name: /navbar\.create/i, hidden: true }).find(el => el.hasAttribute('aria-haspopup')) as HTMLElement

  beforeEach(() => {
    jest.useFakeTimers()
    renderNavbar()
    fireEvent.mouseEnter(createTab().parentElement as Element)
  })
  it('should open its dropdown', () => expect(createTab()).toHaveAttribute('aria-expanded', 'true'))
  it('should open its external items in a new tab', () =>
    expect(screen.getAllByRole('link', { name: /creator_documentation/, hidden: true }).map(link => link.getAttribute('target'))).toEqual([
      '_blank',
      '_blank'
    ]))

  describe('and the pointer leaves it', () => {
    beforeEach(() => fireEvent.mouseLeave(createTab().parentElement as Element))

    describe.each([
      ['the grace period has not ended', () => advance(200), 'true'],
      ['the grace period ends', () => advance(300), 'false'],
      [
        'the pointer comes back before the grace period ends',
        () => {
          fireEvent.mouseEnter(createTab().parentElement as Element)
          advance(500)
        },
        'true'
      ]
    ])('and %s', (_, wait, expanded) => {
      beforeEach(wait)
      it(`should leave the dropdown expanded=${expanded}`, () => expect(createTab()).toHaveAttribute('aria-expanded', expanded))
    })
  })

  describe.each([
    ['presses Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['scrolls the page', () => act(() => void window.dispatchEvent(new Event('scroll')))],
    ['clicks outside the navbar', () => fireEvent.mouseDown(document.body)]
  ])('and the visitor %s', (_, close) => {
    beforeEach(close)
    it('should close the dropdown', () => expect(createTab()).toHaveAttribute('aria-expanded', 'false'))
  })

  describe('and the visitor clicks the tab', () => {
    let open: jest.SpyInstance
    beforeEach(() => {
      open = jest.spyOn(window, 'open').mockImplementation(() => null)
      fireEvent.click(createTab())
    })
    it('should navigate to the first item of the section', () =>
      expect(open).toHaveBeenCalledWith('https://decentraland.org/create/', '_self'))
  })
})

describe('when a signed-in visitor opens the user menu', () => {
  beforeEach(() =>
    openUserMenu({ onOpenUserCard: jest.fn(), avatar: { name: 'Jane', hasClaimedName: true, avatar: { snapshots: SNAPSHOTS } } })
  )
  it('should notify that the user card opened', () => expect(props.onOpenUserCard).toHaveBeenCalledTimes(1))
  it('should paint the avatar with its deterministic background color', () => expect(userMenu().style.backgroundColor).not.toBe(''))
  it('should show the user name in both cards', () => expect(screen.getAllByText('Jane')).toHaveLength(2))
  it('should show the shortened wallet address in both cards', () => expect(screen.getAllByText('0x1234...5678')).toHaveLength(2))
  it('should render the body snapshot from its absolute url', () =>
    expect(document.querySelector('img[src="https://example.com/body.png"]')).toBeInTheDocument())
  it('should resolve the face snapshot hash against the content server', () =>
    expect(document.querySelectorAll(`img[src="${FACE_URL}"]`)).toHaveLength(2))

  describe('and the visitor clicks logout', () => {
    beforeEach(() => fireEvent.click(screen.getAllByRole('button', { name: 'component.landing.navbar.logout', hidden: true })[0]))
    it('should sign out', () => expect(props.onClickSignOut).toHaveBeenCalledTimes(1))
  })

  describe.each([
    ['load', fireEvent.load],
    ['fail', fireEvent.error]
  ])('and the avatar images %s', (_, dispatch) => {
    let faces: HTMLImageElement[]
    beforeEach(() => {
      faces = Array.from(document.querySelectorAll<HTMLImageElement>(`img[src="${FACE_URL}"]`))
      faces.forEach(face => dispatch(face))
    })
    it('should reveal them', () => expect(faces.map(face => face.style.opacity)).toEqual(['1', '1']))
  })

  describe.each([
    ['presses', fireEvent.mouseDown],
    ['clicks', fireEvent.click]
  ])('and the visitor %s inside the mobile user card', (_, press) => {
    beforeEach(() => press(document.querySelector('[data-mobile-user-card]') as Element))
    it('should keep the card open', () => expect(userMenu()).toHaveAttribute('aria-expanded', 'true'))
  })

  describe('and the visitor clicks outside the navbar', () => {
    beforeEach(() => fireEvent.mouseDown(document.body))
    it('should close the card', () => expect(userMenu()).toHaveAttribute('aria-expanded', 'false'))
  })

  describe('and the visitor clicks the avatar again', () => {
    beforeEach(() => fireEvent.click(userMenu()))
    it('should close the card without notifying again', () => expect(props.onOpenUserCard).toHaveBeenCalledTimes(1))
  })
})

describe('when a signed-in visitor copies the wallet address', () => {
  let writeText: jest.Mock
  const copyAddress = async (extra: Partial<LandingNavbarProps> = {}) => {
    openUserMenu(extra)
    await act(async () => void fireEvent.click(screen.getAllByRole('button', { name: 'Copy address', hidden: true })[0]))
  }

  beforeEach(() => {
    writeText = jest.fn()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  })

  describe('and the clipboard accepts it', () => {
    beforeEach(async () => {
      jest.useFakeTimers()
      writeText.mockResolvedValueOnce(undefined)
      await copyAddress()
    })
    it('should write the full address', () => expect(writeText).toHaveBeenCalledWith(ADDRESS))
    it('should confirm the copy in place of the address', () => expect(screen.getAllByText(COPIED, { exact: false })).toHaveLength(2))

    describe('and two seconds pass', () => {
      beforeEach(() => advance(2000))
      it('should restore the address', () => expect(screen.queryByText(COPIED, { exact: false })).toBeNull())
    })
  })

  describe('and the clipboard rejects it', () => {
    beforeEach(async () => {
      writeText.mockRejectedValueOnce(new Error('denied'))
      await copyAddress()
    })
    it('should keep showing the address', () => expect(screen.queryByText(COPIED, { exact: false })).toBeNull())
  })

  describe('and there is no address', () => {
    beforeEach(() => copyAddress({ address: undefined }))
    it('should not touch the clipboard', () => expect(writeText).not.toHaveBeenCalled())
  })
})

describe('when a signed-in visitor opens the user menu with MANA balances', () => {
  describe.each([
    ['1.5K', { ethereum: 1500, polygon: 0 }],
    ['2K', { ethereum: 0, polygon: 2000 }],
    ['0.50', { ethereum: 0.5, polygon: 0 }],
    ['42', { ethereum: 0, polygon: 42.9 }]
  ])('and the balance formats as %s', (label, manaBalances) => {
    beforeEach(() => openUserMenu({ manaBalances }))
    it('should print it in both user cards', () => expect(screen.getAllByText(label)).toHaveLength(2))
  })

  describe.each([
    ['both balances are dust', '0.00', { manaBalances: { ethereum: 0.001, polygon: 0 } }],
    ['the balances are loading', '50', { isManaLoading: true, manaBalances: { ethereum: 50, polygon: 50 } }]
  ])('and %s', (_, hidden, extra) => {
    beforeEach(() => openUserMenu(extra))
    it(`should not print ${hidden}`, () => expect(screen.queryByText(hidden)).toBeNull())
  })
})

describe('when a signed-in visitor sees the avatar button', () => {
  describe('and the profile is still loading', () => {
    beforeEach(() => renderSignedIn({ isLoadingProfile: true }))
    it('should leave the avatar image out', () => expect(userMenu().querySelector('img')).toBeNull())
  })

  describe('and the face snapshot is a data url', () => {
    beforeEach(() => renderSignedIn({ avatar: { avatar: { snapshots: { face256: 'data:image/png;base64,AAAA' } } } }))
    it('should use it as is', () => expect(userMenu().querySelector('img')).toHaveAttribute('src', 'data:image/png;base64,AAAA'))
  })
})

describe('when a signed-in visitor has notifications', () => {
  describe.each([
    [3, '3'],
    [12, '9+']
  ])('and %s of them are unread', (count, badge) => {
    beforeEach(() => {
      const items = Array.from({ length: count }, (_, i) => ({ id: `n${i}`, read: false, type: 'x', timestamp: Date.now(), metadata: {} }))
      renderSignedIn({ notifications: notificationsWith({ isOpen: false, items }) })
    })
    it(`should show ${badge} on the bell`, () => expect(screen.getByRole('button', { name: 'Notifications' })).toHaveTextContent(badge))
  })

  describe.each([
    ['are loading', { isLoading: true }, 'component.landing.navbar.notifications_loading'],
    ['are empty', {}, 'component.landing.navbar.notifications_empty_new']
  ])('and they %s', (_, overrides, message) => {
    beforeEach(() => renderSignedIn({ notifications: notificationsWith(overrides) }))
    it(`should show the ${message} message`, () => expect(screen.getByText(message)).toBeInTheDocument())
  })

  describe('and they have no dedicated renderer', () => {
    let open: jest.SpyInstance
    beforeEach(() => {
      const now = Date.now()
      open = jest.spyOn(window, 'open').mockImplementation(() => null)
      renderSignedIn({
        notifications: notificationsWith({
          items: [
            { id: 'a', read: false, type: 'item_sold', timestamp: now - 10_000, metadata: { link: 'https://example.com/sale' } },
            { id: 'b', read: true, type: 'bid_accepted', timestamp: now - 5 * 60_000, metadata: { title: 'Bid in', message: 'Accepted' } },
            { id: 'c', read: true, type: 'reward', timestamp: now - 3 * 3_600_000, metadata: { nftName: 'Cool hat' } },
            { id: 'd', read: true, type: 'event', timestamp: now - 2 * 86_400_000, metadata: { description: 'Starts soon' } }
          ]
        })
      })
    })

    it.each([
      ['the humanized type of an untitled one', 'Item Sold'],
      ['the metadata title', 'Bid in'],
      ['the nft name of an untitled one', 'Cool hat'],
      ['the description', 'Starts soon'],
      ['the message in place of a missing description', 'Accepted'],
      ['seconds as just now', 'just now'],
      ['minutes ago', '5m ago'],
      ['hours ago', '3h ago'],
      ['days ago', '2d ago']
    ])('should show %s', (_, text) => expect(screen.getByText(text)).toBeInTheDocument())

    describe('and the visitor clicks a linked notification', () => {
      beforeEach(() => fireEvent.click(screen.getByText('Item Sold')))
      it('should open the linked page in a new tab', () =>
        expect(open).toHaveBeenCalledWith('https://example.com/sale', '_blank', 'noopener'))
    })

    describe('and the visitor clicks a notification without a link', () => {
      beforeEach(() => fireEvent.click(screen.getByText('Cool hat')))
      it('should not open anything', () => expect(open).not.toHaveBeenCalled())
    })
  })
})

describe('when the visitor clicks the notification bell', () => {
  let notifications: NotificationsProp
  beforeEach(async () => {
    notifications = notificationsWith({
      isOpen: false,
      items: [{ id: 'rich-1', read: false, type: 'known_type', timestamp: 0, metadata: {} }]
    })
    const view = renderSignedIn({ notifications })
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    props.notifications = { ...notifications, isOpen: true }
    view.rerender(navbar())
    await waitFor(() => expect(screen.getByText('rich rich-1 en')).toBeInTheDocument())
  })
  it('should forward the click', () => expect(notifications.onClick).toHaveBeenCalledTimes(1))
  it('should render the notification with its dedicated renderer', () => expect(screen.getByText('rich rich-1 en')).toBeInTheDocument())

  describe.each([
    ['opens the user menu', () => fireEvent.click(userMenu())],
    ['clicks outside the navbar', () => fireEvent.mouseDown(document.body)]
  ])('and then %s', (_, action) => {
    beforeEach(action)
    it('should close the notifications', () => expect(notifications.onClose).toHaveBeenCalledTimes(1))
  })
})

describe('when the visitor clicks a navbar link', () => {
  let user: ReturnType<typeof userEvent.setup>
  let track: jest.Mock

  const preventNavigation = (element: HTMLElement) => {
    element.addEventListener('click', event => event.preventDefault())
    return element
  }

  const desktopSection = (name: RegExp) =>
    screen.getAllByRole('button', { name, hidden: true }).find(button => button.getAttribute('aria-haspopup') === 'true')!

  beforeEach(() => {
    user = userEvent.setup()
    track = jest.fn()
    ;(jest.requireMock('@dcl/hooks').useAnalytics as jest.Mock).mockReturnValue({ isInitialized: true, track })
  })

  describe('and it is a desktop dropdown destination', () => {
    beforeEach(async () => {
      renderAt('/events')
      const createTab = desktopSection(/navbar\.create$/i)
      await user.hover(createTab.parentElement!)
      fireEvent.click(
        preventNavigation(within(createTab.parentElement!).getByRole('link', { name: /creator_documentation/i, hidden: true }))
      )
    })

    it('should send one event with the link, its section and its destination', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', {
        place: 'Landing Navbar',
        event: 'click',
        action: 'creator_documentation',
        section: 'create',
        href: 'https://docs.decentraland.org/creator'
      })
    })
  })

  describe('and it is a desktop section tab', () => {
    let open: jest.SpyInstance

    beforeEach(() => {
      open = jest.spyOn(window, 'open').mockImplementation(() => null)
      renderAt('/events')
      fireEvent.click(desktopSection(/navbar\.create$/i))
    })

    afterEach(() => {
      open.mockRestore()
    })

    it('should send the section with its first destination before navigating there', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(
        'Click',
        expect.objectContaining({ action: 'create', section: 'create', href: 'https://decentraland.org/create/' })
      )
      expect(track.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0])
      expect(open).toHaveBeenCalledWith('https://decentraland.org/create/', '_self')
    })
  })

  describe('and it is a mobile menu destination', () => {
    beforeEach(async () => {
      renderAt('/events')
      await user.click(screen.getByRole('button', { name: 'Open menu' }))
      const mobileMenu = screen.getByRole('navigation', { name: 'Mobile navigation' })
      fireEvent.click(preventNavigation(within(mobileMenu).getByRole('link', { name: /navbar\.wearables/i, hidden: true })))
    })

    it('should send it under its section', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(
        'Click',
        expect.objectContaining({ action: 'wearables', section: 'shop', href: 'https://decentraland.org/shop/items?category=wearable' })
      )
    })
  })

  describe('and it is the Learn link in the mobile menu', () => {
    beforeEach(() => {
      renderAt('/events')
      const mobileMenu = screen.getByRole('navigation', { name: 'Mobile navigation' })
      fireEvent.click(preventNavigation(within(mobileMenu).getByRole('link', { name: /navbar\.learn/i, hidden: true })))
    })

    it('should send it under its own section', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(
        'Click',
        expect.objectContaining({ action: 'learn', section: 'learn', href: 'https://decentraland.org/blog/' })
      )
    })
  })

  describe('and it is a user menu entry', () => {
    beforeEach(async () => {
      renderAt('/events', { isSignedIn: true, address: '0x1234567890123456789012345678901234567890' })
      await user.click(screen.getByRole('button', { name: 'User menu' }))
      const userMenu = screen.getByRole('button', { name: 'User menu' }).parentElement!
      fireEvent.click(preventNavigation(within(userMenu).getByRole('link', { name: /navbar\.view_profile/i, hidden: true })))
    })

    it('should send it under the user menu section', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(
        'Click',
        expect.objectContaining({ action: 'view_profile', section: 'user_menu', href: 'https://decentraland.org/profile' })
      )
    })
  })

  describe('and it is the Learn tab on desktop', () => {
    beforeEach(() => {
      renderAt('/events')
      const mobileMenu = screen.getByRole('navigation', { name: 'Mobile navigation' })
      const desktopLearn = screen.getAllByRole('link', { name: /navbar\.learn/i, hidden: true }).find(link => !mobileMenu.contains(link))!
      fireEvent.click(preventNavigation(desktopLearn))
    })

    it('should send it under its own section', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(
        'Click',
        expect.objectContaining({ action: 'learn', section: 'learn', href: 'https://decentraland.org/blog/' })
      )
    })
  })

  describe('and it is a user menu entry in the mobile user card', () => {
    beforeEach(async () => {
      const { container } = renderAt('/events', { isSignedIn: true, address: '0x1234567890123456789012345678901234567890' })
      await user.click(screen.getByRole('button', { name: 'User menu' }))
      const mobileUserCard = container.ownerDocument.querySelector<HTMLElement>('[data-mobile-user-card]')!
      fireEvent.click(preventNavigation(within(mobileUserCard).getByRole('link', { name: /navbar\.view_profile/i, hidden: true })))
    })

    it('should send it under the user menu section', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith(
        'Click',
        expect.objectContaining({ action: 'view_profile', section: 'user_menu', href: 'https://decentraland.org/profile' })
      )
    })
  })

  describe('and analytics has not finished loading', () => {
    beforeEach(async () => {
      ;(jest.requireMock('@dcl/hooks').useAnalytics as jest.Mock).mockReturnValue({ isInitialized: false, track })
      renderAt('/events')
      const createTab = desktopSection(/navbar\.create$/i)
      await user.hover(createTab.parentElement!)
      fireEvent.click(
        preventNavigation(within(createTab.parentElement!).getByRole('link', { name: /creator_documentation/i, hidden: true }))
      )
    })

    it('should not send anything', () => {
      expect(track).not.toHaveBeenCalled()
    })
  })

  describe('and it is the logo', () => {
    beforeEach(() => {
      renderAt('/events')
      fireEvent.click(preventNavigation(screen.getByRole('link', { name: 'Decentraland Home' })))
    })

    it('should send it as the home link', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'logo', section: 'home', href: '/' }))
    })
  })

  describe('and it is the logo of the minimal navbar', () => {
    beforeEach(() => {
      renderAt('/', { isLandingPage: true })
      fireEvent.click(preventNavigation(screen.getByRole('link', { name: 'Decentraland Home' })))
    })

    it('should send it as the home link', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'logo', section: 'home', href: '/' }))
    })
  })

  describe('and it is a middle click on the logo', () => {
    beforeEach(() => {
      renderAt('/events')
      fireEvent(screen.getByRole('link', { name: 'Decentraland Home' }), new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    })

    it('should send it as the home link', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'logo', section: 'home' }))
    })
  })

  describe('and it is a middle click on the credits chip', () => {
    beforeEach(() => {
      renderAt('/events', { isSignedIn: true, creditsBalance: 120 })
      fireEvent(screen.getByRole('link', { name: /credits_balance/i }), new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    })

    it('should send it under its own section', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'credits', section: 'credits' }))
    })
  })

  describe('and it is the credits chip', () => {
    beforeEach(() => {
      renderAt('/events', { isSignedIn: true, creditsBalance: 120 })
      fireEvent.click(preventNavigation(screen.getByRole('link', { name: /credits_balance/i })))
    })

    it('should send it under its own section, apart from the user menu', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'credits', section: 'credits', href: '/shop/credits' }))
    })
  })

  describe('and it is a middle click', () => {
    beforeEach(() => {
      renderAt('/events')
      const learn = within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('link', {
        name: /navbar\.learn/i,
        hidden: true
      })
      fireEvent(learn, new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    })

    it('should send one event for the link', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'learn', section: 'learn' }))
    })
  })

  describe('and it is a middle click on a desktop dropdown destination', () => {
    beforeEach(async () => {
      renderAt('/events')
      const createTab = desktopSection(/navbar\.create$/i)
      await user.hover(createTab.parentElement!)
      const link = within(createTab.parentElement!).getByRole('link', { name: /creator_documentation/i, hidden: true })
      fireEvent(link, new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    })

    it('should send one event for the link', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'creator_documentation', section: 'create' }))
    })
  })

  describe('and it is a middle click on a user menu entry', () => {
    beforeEach(async () => {
      renderAt('/events', { isSignedIn: true, address: '0x1234567890123456789012345678901234567890' })
      await user.click(screen.getByRole('button', { name: 'User menu' }))
      const userMenu = screen.getByRole('button', { name: 'User menu' }).parentElement!
      const link = within(userMenu).getByRole('link', { name: /navbar\.view_profile/i, hidden: true })
      fireEvent(link, new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    })

    it('should send one event for the link', () => {
      expect(track).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledWith('Click', expect.objectContaining({ action: 'view_profile', section: 'user_menu' }))
    })
  })

  describe('and the browser also fires click for the middle button', () => {
    beforeEach(() => {
      renderAt('/events')
      const learn = within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('link', {
        name: /navbar\.learn/i,
        hidden: true
      })
      fireEvent(learn, new MouseEvent('auxclick', { bubbles: true, button: 1 }))
      fireEvent.click(preventNavigation(learn), { button: 1 })
    })

    it('should send only one event', () => {
      expect(track).toHaveBeenCalledTimes(1)
    })
  })

  describe('and it is a right click', () => {
    beforeEach(() => {
      renderAt('/events')
      const learn = within(screen.getByRole('navigation', { name: 'Mobile navigation' })).getByRole('link', {
        name: /navbar\.learn/i,
        hidden: true
      })
      fireEvent(learn, new MouseEvent('auxclick', { bubbles: true, button: 2 }))
      // Browsers do not send this today, but it exercises the primary-button guard on click too.
      fireEvent.click(preventNavigation(learn), { button: 2 })
    })

    it('should not send anything', () => {
      expect(track).not.toHaveBeenCalled()
    })
  })
})
