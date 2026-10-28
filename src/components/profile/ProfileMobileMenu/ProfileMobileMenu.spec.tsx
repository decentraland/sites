import * as mockReact from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileMobileNav } from './ProfileMobileMenu'

const useAuthIdentityMock = jest.fn()
const useWalletAddressMock = jest.fn()
const useFriendshipStatusMock = jest.fn()
const useFriendsCountMock = jest.fn()
const useUpsertFriendshipMock = jest.fn()
const useMutualFriendsMock = jest.fn()
const useModalFriendsNavigationMock = jest.fn()
const getVisibleTabsMock = jest.fn()
const redirectToAuthMock = jest.fn()
const navigateMock = jest.fn()

const upsertSpy = jest.fn().mockResolvedValue(undefined)
const disconnectSpy = jest.fn().mockResolvedValue(undefined)

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => useAuthIdentityMock()
}))

jest.mock('../../../hooks/useWalletAddress', () => ({
  useWalletAddress: () => useWalletAddressMock()
}))

jest.mock('../../../features/profile/profile.social.rpc', () => ({
  useFriendshipStatus: () => useFriendshipStatusMock(),
  useFriendsCount: () => useFriendsCountMock(),
  useUpsertFriendship: () => useUpsertFriendshipMock(),
  useMutualFriends: () => useMutualFriendsMock()
}))

jest.mock('../ProfileModal/ModalProfileNavigation', () => ({
  useModalFriendsNavigation: () => useModalFriendsNavigationMock()
}))

jest.mock('../../../utils/authRedirect', () => ({
  redirectToAuth: (target: string) => redirectToAuthMock(target)
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateMock
}))

jest.mock('../FriendsModal', () => ({
  FriendsModal: ({
    open,
    mutualOfAddress,
    onSelect,
    onClose
  }: {
    open: boolean
    mutualOfAddress?: string
    onSelect?: (friend: { address: string }) => void
    onClose?: () => void
  }) =>
    open
      ? mockReact.createElement(
          mockReact.Fragment,
          null,
          mockReact.createElement('button', {
            'data-testid': 'friends-modal',
            'data-mutual-of': mutualOfAddress,
            onClick: () => onSelect?.({ address: '0xFRIENDfriendFRIENDfriendFRIENDfriend0001' })
          }),
          mockReact.createElement('button', { 'data-testid': 'friends-modal-close', onClick: onClose })
        )
      : null
}))

jest.mock('../ProfileAvatar', () => ({
  ProfileAvatar: ({ address }: { address: string }) =>
    mockReact.createElement('div', { 'data-testid': 'profile-avatar', 'data-address': address })
}))

jest.mock('../ProfileTabs', () => ({
  getVisibleTabs: (isOwnProfile: boolean) => getVisibleTabsMock(isOwnProfile)
}))

jest.mock('./ProfileMobileMenu.icons', () => ({
  TAB_ICONS: new Map([['overview', () => mockReact.createElement('span', { 'data-testid': 'tab-icon' })]])
}))

jest.mock('decentraland-ui2', () => {
  const Box = ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
  const Tooltip = ({ open, title, children }: { open?: boolean; title?: React.ReactNode; children?: React.ReactNode }) =>
    mockReact.createElement(mockReact.Fragment, null, children, open ? mockReact.createElement('div', { role: 'tooltip' }, title) : null)
  return { Box, Tooltip }
})

jest.mock('./ProfileMobileMenu.styled', () => {
  const make = (testid: string, tag: string = 'div') =>
    mockReact.forwardRef<
      HTMLElement,
      React.HTMLAttributes<HTMLElement> & { $active?: boolean; $bg?: string; $offset?: number; startIcon?: React.ReactNode }
    >(({ $active: _active, $bg: _bg, $offset: _offset, startIcon, ...props }, ref) =>
      mockReact.createElement(tag, { 'data-testid': testid, ref, ...props }, startIcon, props.children)
    )
  return {
    AddressCopyButton: make('address-copy-button', 'button'),
    CtaRow: make('cta-row'),
    DrawerCta: make('drawer-cta', 'button'),
    DrawerHeader: make('drawer-header'),
    DrawerIconButton: make('drawer-icon-button', 'button'),
    LogoutButton: make('logout-button', 'button'),
    MutualDot: make('mutual-dot', 'span'),
    MutualRow: make('mutual-row', 'button'),
    MutualSlot: make('mutual-slot', 'span'),
    MutualStack: make('mutual-stack'),
    NavScreen: make('nav-screen'),
    SectionDivider: make('section-divider'),
    TabChevron: make('tab-chevron', 'span'),
    TabItem: make('tab-item', 'button'),
    TabLabel: make('tab-label', 'span'),
    TabLeading: make('tab-leading', 'span'),
    TabList: make('tab-list'),
    UserAddressRow: make('user-address-row'),
    UserAddressText: make('user-address-text', 'span'),
    UserBlock: make('user-block'),
    UserName: make('user-name', 'span'),
    UserNameColumn: make('user-name-column')
  }
})

const address = '0xCafeCafeCafeCafeCafeCafeCafeCafeCafeCafe'

function renderNav(props: Partial<React.ComponentProps<typeof ProfileMobileNav>> = {}) {
  return render(
    <MemoryRouter>
      <ProfileMobileNav address={address} displayName="Mojito" isOwnProfile onTabSelect={jest.fn()} {...props} />
    </MemoryRouter>
  )
}

describe('ProfileMobileNav', () => {
  beforeEach(() => {
    useAuthIdentityMock.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
    useWalletAddressMock.mockReturnValue({ disconnect: disconnectSpy })
    useFriendshipStatusMock.mockReturnValue({ status: 'none', isLoading: false, error: null })
    useFriendsCountMock.mockReturnValue({ count: undefined, isLoading: false, error: null })
    useUpsertFriendshipMock.mockReturnValue({ upsert: upsertSpy, isLoading: false, error: null })
    useMutualFriendsMock.mockReturnValue({ count: 0, friends: [], isLoading: false, error: null })
    useModalFriendsNavigationMock.mockReturnValue(undefined)
    getVisibleTabsMock.mockReturnValue([{ id: 'overview', labelKey: 'profile.tabs.overview' }])
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the display name and the shortened address', () => {
    renderNav()
    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText(`${address.slice(0, 6)}…${address.slice(-4)}`)).toBeInTheDocument()
  })

  it('should leave a short address untouched', () => {
    renderNav({ address: '0xabc', displayName: 'Tiny' })
    expect(screen.getByText('0xabc')).toBeInTheDocument()
  })

  it('should copy the address to the clipboard when clicking the copy button', async () => {
    const user = userEvent.setup()
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
    renderNav()
    await user.click(screen.getByRole('button', { name: /profile\.header\.copy_address/i }))
    expect(writeTextSpy).toHaveBeenCalledWith(address)
  })

  it('should surface the copied feedback after copying the address', async () => {
    const user = userEvent.setup()
    renderNav()
    expect(screen.queryByText('profile.header.address_copied')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /profile\.header\.copy_address/i }))
    expect(await screen.findByText('profile.header.address_copied')).toBeInTheDocument()
  })

  describe('when rendering the top header row', () => {
    it('should render and wire both the back and close buttons', async () => {
      const onBack = jest.fn()
      const onClose = jest.fn()
      const user = userEvent.setup()
      renderNav({ onBack, onClose })

      await user.click(screen.getByRole('button', { name: /profile\.header\.back/i }))
      await user.click(screen.getByRole('button', { name: /profile\.header\.close_profile/i }))

      expect(onBack).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should render the placeholder when only a close handler is provided', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()
      renderNav({ onClose })

      await user.click(screen.getByRole('button', { name: /profile\.header\.close_profile/i }))
      expect(onClose).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('button', { name: /profile\.header\.back/i })).not.toBeInTheDocument()
    })
  })

  describe('when viewing the own profile', () => {
    it('should render the share CTA and copy the profile url', async () => {
      const user = userEvent.setup()
      const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
      renderNav({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.share_profile/i }))

      expect(writeTextSpy).toHaveBeenCalledWith(`${window.location.origin}/profile/${address}`)
    })

    it('should render the friends count CTA and open the friends modal', async () => {
      useFriendsCountMock.mockReturnValue({ count: 4, isLoading: false, error: null })
      const user = userEvent.setup()
      renderNav({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.friends_count/i }))

      expect(screen.getByTestId('friends-modal')).toBeInTheDocument()
    })

    it('should navigate to the selected friend and lowercase the address', async () => {
      useFriendsCountMock.mockReturnValue({ count: 4, isLoading: false, error: null })
      const user = userEvent.setup()
      renderNav({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.friends_count/i }))
      await user.click(screen.getByTestId('friends-modal'))

      expect(navigateMock).toHaveBeenCalledWith('/profile/0xfriendfriendfriendfriendfriendfriend0001')
    })

    it('should disconnect the wallet on logout', async () => {
      const user = userEvent.setup()
      renderNav({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.logout/i }))

      expect(disconnectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('when viewing a member profile as an anonymous viewer', () => {
    it('should redirect to auth from the friend CTA without upserting', async () => {
      const user = userEvent.setup()
      renderNav({ isOwnProfile: false })

      await user.click(screen.getByRole('button', { name: /profile\.header\.add_friend/i }))

      expect(redirectToAuthMock).toHaveBeenCalledTimes(1)
      expect(upsertSpy).not.toHaveBeenCalled()
    })
  })

  describe('when viewing a member profile as an authenticated viewer', () => {
    beforeEach(() => {
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
    })

    it('should upsert the friendship with the request action', async () => {
      const user = userEvent.setup()
      renderNav({ isOwnProfile: false })

      await user.click(screen.getByRole('button', { name: /profile\.header\.add_friend/i }))

      expect(upsertSpy).toHaveBeenCalledWith({ address, action: 'request' })
    })

    it('should swallow upsert rejections', async () => {
      upsertSpy.mockRejectedValueOnce(new Error('boom'))
      const user = userEvent.setup()
      renderNav({ isOwnProfile: false })

      await expect(user.click(screen.getByRole('button', { name: /profile\.header\.add_friend/i }))).resolves.toBeUndefined()
      expect(upsertSpy).toHaveBeenCalled()
    })

    it('should render avatar slots and color dots for mutual friends', () => {
      useMutualFriendsMock.mockReturnValue({
        count: 3,
        friends: [{ address: '0xMutual1Mutual1Mutual1Mutual1Mutual10001', name: 'Pal', hasClaimedName: true }],
        isLoading: false,
        error: null
      })
      renderNav({ isOwnProfile: false })

      expect(screen.getAllByTestId('mutual-slot')).toHaveLength(1)
      expect(screen.getAllByTestId('mutual-dot')).toHaveLength(2)
    })

    it('should open the mutual friends modal scoped to the address', async () => {
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderNav({ isOwnProfile: false })

      await user.click(screen.getByRole('button', { name: /profile\.friends_modal\.mutual_title/i }))

      expect(screen.getByTestId('friends-modal').getAttribute('data-mutual-of')).toBe(address)
    })

    it('should navigate to the selected mutual friend', async () => {
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderNav({ isOwnProfile: false })

      await user.click(screen.getByRole('button', { name: /profile\.friends_modal\.mutual_title/i }))
      await user.click(screen.getByTestId('friends-modal'))

      expect(navigateMock).toHaveBeenCalledWith('/profile/0xfriendfriendfriendfriendfriendfriend0001')
    })

    it('should close the mutual friends modal without navigating when dismissed', async () => {
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderNav({ isOwnProfile: false })

      await user.click(screen.getByRole('button', { name: /profile\.friends_modal\.mutual_title/i }))
      await user.click(screen.getByTestId('friends-modal-close'))

      expect(navigateMock).not.toHaveBeenCalled()
      expect(screen.queryByTestId('friends-modal')).not.toBeInTheDocument()
    })
  })

  describe('when embedded inside a modal with surface navigation', () => {
    it('should open the friends surface instead of the modal on the own profile', async () => {
      const openFriendsSurface = jest.fn()
      useModalFriendsNavigationMock.mockReturnValue(openFriendsSurface)
      useFriendsCountMock.mockReturnValue({ count: 4, isLoading: false, error: null })
      const user = userEvent.setup()
      renderNav({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.friends_count/i }))

      expect(openFriendsSurface).toHaveBeenCalledWith()
      expect(screen.queryByTestId('friends-modal')).not.toBeInTheDocument()
    })

    it('should open the mutual surface with the address on a member profile', async () => {
      const openFriendsSurface = jest.fn()
      useModalFriendsNavigationMock.mockReturnValue(openFriendsSurface)
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderNav({ isOwnProfile: false })

      await user.click(screen.getByRole('button', { name: /profile\.friends_modal\.mutual_title/i }))

      expect(openFriendsSurface).toHaveBeenCalledWith(address)
    })
  })

  describe('when filtering the tab list', () => {
    it('should drop the hidden tabs and select the remaining ones', async () => {
      getVisibleTabsMock.mockReturnValue([
        { id: 'overview', labelKey: 'profile.tabs.overview' },
        { id: 'places', labelKey: 'profile.tabs.my_places' }
      ])
      const onTabSelect = jest.fn()
      const user = userEvent.setup()
      renderNav({ isOwnProfile: true, hiddenTabs: new Set(['places']), onTabSelect, activeTab: 'overview' })

      const tabItems = screen.getAllByTestId('tab-item')
      expect(tabItems).toHaveLength(1)

      await user.click(tabItems[0])
      expect(onTabSelect).toHaveBeenCalledWith('overview')
    })

    it('should keep every tab when there is no hidden set', () => {
      getVisibleTabsMock.mockReturnValue([
        { id: 'overview', labelKey: 'profile.tabs.overview' },
        { id: 'places', labelKey: 'profile.tabs.my_places' }
      ])
      renderNav({ isOwnProfile: true })

      expect(screen.getAllByTestId('tab-item')).toHaveLength(2)
    })

    it('should render a leading icon only when one is registered for the tab', () => {
      getVisibleTabsMock.mockReturnValue([
        { id: 'overview', labelKey: 'profile.tabs.overview' },
        { id: 'places', labelKey: 'profile.tabs.my_places' }
      ])
      renderNav({ isOwnProfile: true })

      // Only `overview` has an entry in the mocked TAB_ICONS map.
      expect(screen.getAllByTestId('tab-icon')).toHaveLength(1)
    })
  })
})
