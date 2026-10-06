import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useLocale } from '../../intl/LocaleContext'
import { LandingNavbar } from './LandingNavbar'
import type { LandingNavbarProps } from './LandingNavbar'

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
