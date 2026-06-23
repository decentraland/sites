import * as mockReact from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileHeader } from './ProfileHeader'

const useProfileAvatarMock = jest.fn()
const useAuthIdentityMock = jest.fn()
const useFriendshipStatusMock = jest.fn()
const useFriendsCountMock = jest.fn()
const useUpsertFriendshipMock = jest.fn()
const useMutualFriendsMock = jest.fn()
const useBlockUserMock = jest.fn()
const useModalFriendsNavigationMock = jest.fn()
const getEnvMock = jest.fn()
const redirectToAuthMock = jest.fn()
const navigateMock = jest.fn()

const upsertSpy = jest.fn().mockResolvedValue(undefined)
const setBlockedSpy = jest.fn().mockResolvedValue(undefined)

jest.mock('../../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: () => useProfileAvatarMock()
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => useAuthIdentityMock()
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../config/env', () => ({
  getEnv: (key: string) => getEnvMock(key)
}))

jest.mock('../../../utils/authRedirect', () => ({
  redirectToAuth: (target: string) => redirectToAuthMock(target)
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateMock
}))

jest.mock('../../../features/profile/profile.social.rpc', () => ({
  useFriendshipStatus: () => useFriendshipStatusMock(),
  useFriendsCount: () => useFriendsCountMock(),
  useUpsertFriendship: () => useUpsertFriendshipMock(),
  useMutualFriends: () => useMutualFriendsMock(),
  useBlockUser: () => useBlockUserMock()
}))

jest.mock('../ProfileModal/ModalProfileNavigation', () => ({
  useModalFriendsNavigation: () => useModalFriendsNavigationMock()
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

jest.mock('decentraland-ui2', () => {
  const Button = mockReact.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { startIcon?: React.ReactNode }>(
    ({ startIcon, children, ...props }, ref) => mockReact.createElement('button', { ref, ...props }, startIcon, children)
  )
  const IconButton = mockReact.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ children, ...props }, ref) =>
    mockReact.createElement('button', { ref, ...props }, children)
  )
  const Menu = ({ open, children, onClose }: { open: boolean; children: React.ReactNode; onClose?: () => void }) =>
    open
      ? mockReact.createElement(
          'div',
          { role: 'menu' },
          mockReact.createElement('button', { 'aria-label': 'menu-close', onClick: onClose }),
          children
        )
      : null
  const MenuItem = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
    mockReact.createElement('div', { role: 'menuitem', onClick }, children)
  const Box = ({ children }: { children?: React.ReactNode }) => mockReact.createElement('div', null, children)
  const Tooltip = ({ open, title, children }: { open?: boolean; title?: React.ReactNode; children?: React.ReactNode }) =>
    mockReact.createElement(mockReact.Fragment, null, children, open ? mockReact.createElement('div', { role: 'tooltip' }, title) : null)
  const useTabletAndBelowMediaQuery = () => false
  return { Box, Button, IconButton, Menu, MenuItem, Tooltip, useTabletAndBelowMediaQuery }
})

jest.mock('./ProfileHeader.styled', () => {
  const make = (testid: string, tag: string = 'div') =>
    mockReact.forwardRef<
      HTMLElement,
      React.HTMLAttributes<HTMLElement> & { $bg?: string; $offset?: number; $nameColor?: string; startIcon?: React.ReactNode }
    >(({ $bg: _bg, $offset: _offset, $nameColor: _nameColor, startIcon, ...props }, ref) =>
      mockReact.createElement(tag, { 'data-testid': testid, ref, ...props }, startIcon, props.children)
    )
  return {
    ActionsBlock: make('actions-block'),
    AddressRow: make('address-row'),
    AddressText: make('address-text'),
    BackIconButton: make('back-icon-button', 'button'),
    BlockMenuItemIcon: make('block-menu-item-icon', 'span'),
    CloseIconButton: make('close-icon-button', 'button'),
    CopyButton: make('copy-button', 'button'),
    CopyButtonIcon: make('copy-button-icon', 'span'),
    Discriminator: make('discriminator', 'span'),
    FriendCtaButton: make('friend-cta-button', 'button'),
    HeaderRoot: make('header-root'),
    IdentityBlock: make('identity-block'),
    MoreActionsButton: make('more-actions-button', 'button'),
    MutualAvatarSlot: make('mutual-avatar-slot', 'span'),
    MutualFriendsRow: make('mutual-friends-row', 'button'),
    MutualPic: make('mutual-pic', 'span'),
    MutualStack: make('mutual-stack'),
    MutualText: make('mutual-text'),
    NameAddressBlock: make('name-address-block'),
    NameRow: make('name-row'),
    NameText: make('name-text', 'span'),
    VerifiedBadge: make('verified-badge', 'span'),
    WalletIcon: make('wallet-icon', 'span')
  }
})

const address = '0xCafeCafeCafeCafeCafeCafeCafeCafeCafeCafe'

function renderHeader(props: Partial<React.ComponentProps<typeof ProfileHeader>> = {}) {
  return render(
    <MemoryRouter>
      <ProfileHeader address={address} isOwnProfile={false} {...props} />
    </MemoryRouter>
  )
}

describe('ProfileHeader', () => {
  beforeEach(() => {
    useMutualFriendsMock.mockReturnValue({ count: 0, friends: [], isLoading: false, error: null })
    useFriendshipStatusMock.mockReturnValue({ status: 'none', isLoading: false, error: null })
    useFriendsCountMock.mockReturnValue({ count: undefined, isLoading: false, error: null })
    useUpsertFriendshipMock.mockReturnValue({ upsert: upsertSpy, isLoading: false, error: null })
    useBlockUserMock.mockReturnValue({ setBlocked: setBlockedSpy, isLoading: false, error: null })
    useAuthIdentityMock.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
    useModalFriendsNavigationMock.mockReturnValue(undefined)
    getEnvMock.mockReturnValue(undefined)
    useProfileAvatarMock.mockReturnValue({
      avatar: { name: 'Mojito', hasClaimedName: true, userId: address },
      name: 'Mojito',
      backgroundColor: '#ff4bed'
    })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the display name and the truncated address', () => {
    renderHeader({ onClose: jest.fn() })
    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText(`${address.slice(0, 6)}…${address.slice(-4)}`)).toBeInTheDocument()
  })

  it('should render the discriminator suffix when the name is not claimed', () => {
    useProfileAvatarMock.mockReturnValue({
      avatar: { name: '0xCafe', hasClaimedName: false, userId: address },
      name: '',
      backgroundColor: '#ff4bed'
    })
    renderHeader()
    expect(screen.getByText(`#${address.slice(-4)}`)).toBeInTheDocument()
  })

  it('should show the Add friend CTA on Member view', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /profile\.header\.add_friend/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /profile\.header\.invite_friends/i })).not.toBeInTheDocument()
  })

  it('should show Get a name and Invite friends CTAs on My view when no claimed name', () => {
    useProfileAvatarMock.mockReturnValue({
      avatar: { name: '0xCafe', hasClaimedName: false, userId: address },
      name: '0xCafe',
      backgroundColor: '#ff4bed'
    })
    renderHeader({ isOwnProfile: true })
    expect(screen.getByRole('button', { name: /profile\.header\.get_a_name/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /profile\.header\.invite_friends/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /profile\.header\.add_friend/i })).not.toBeInTheDocument()
  })

  it('should show Manage world CTA on My view when name is claimed', () => {
    renderHeader({ isOwnProfile: true })
    expect(screen.getByRole('button', { name: /profile\.header\.manage_world/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /profile\.header\.get_a_name/i })).not.toBeInTheDocument()
  })

  describe('when an anonymous viewer clicks the friend CTA', () => {
    it('should redirect to auth with the current location and not call upsert', async () => {
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByRole('button', { name: /profile\.header\.add_friend/i }))

      expect(redirectToAuthMock).toHaveBeenCalledTimes(1)
      expect(upsertSpy).not.toHaveBeenCalled()
    })
  })

  describe('when an authenticated viewer clicks the friend CTA', () => {
    beforeEach(() => {
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useFriendshipStatusMock.mockReturnValue({ status: 'none', isLoading: false, error: null })
    })

    it('should upsert the friendship with the request action', async () => {
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByRole('button', { name: /profile\.header\.add_friend/i }))

      expect(upsertSpy).toHaveBeenCalledWith({ address, action: 'request' })
      expect(redirectToAuthMock).not.toHaveBeenCalled()
    })

    it('should swallow upsert rejections without surfacing them', async () => {
      upsertSpy.mockRejectedValueOnce(new Error('boom'))
      const user = userEvent.setup()
      renderHeader()

      // The handler's `.catch` keeps the rejection from becoming an unhandled promise.
      await expect(user.click(screen.getByRole('button', { name: /profile\.header\.add_friend/i }))).resolves.toBeUndefined()
      expect(upsertSpy).toHaveBeenCalled()
    })
  })

  describe('when an authenticated viewer toggles block from the more-actions menu', () => {
    beforeEach(() => {
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useFriendshipStatusMock.mockReturnValue({ status: 'none', isLoading: false, error: null })
    })

    it('should open the menu and block the user', async () => {
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByRole('button', { name: /profile\.header\.more_actions/i }))
      await user.click(screen.getByText('profile.header.block'))

      expect(setBlockedSpy).toHaveBeenCalledWith({ address, blocked: true })
    })

    it('should unblock when the current status is blocked', async () => {
      useFriendshipStatusMock.mockReturnValue({ status: 'blocked', isLoading: false, error: null })
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByRole('button', { name: /profile\.header\.more_actions/i }))
      await user.click(screen.getByText('profile.header.unblock'))

      expect(setBlockedSpy).toHaveBeenCalledWith({ address, blocked: false })
    })

    it('should close the more-actions menu without blocking when dismissed', async () => {
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByRole('button', { name: /profile\.header\.more_actions/i }))
      await user.click(screen.getByLabelText('menu-close'))

      expect(setBlockedSpy).not.toHaveBeenCalled()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('should swallow setBlocked rejections without surfacing them', async () => {
      setBlockedSpy.mockRejectedValueOnce(new Error('boom'))
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByRole('button', { name: /profile\.header\.more_actions/i }))
      await expect(user.click(screen.getByText('profile.header.block'))).resolves.toBeUndefined()
      expect(setBlockedSpy).toHaveBeenCalled()
    })
  })

  describe('when the My view has a friends count', () => {
    beforeEach(() => {
      useFriendsCountMock.mockReturnValue({ count: 7, isLoading: false, error: null })
    })

    it('should open the friends modal from the friends button', async () => {
      const user = userEvent.setup()
      renderHeader({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.friends_count/i }))

      expect(screen.getByTestId('friends-modal')).toBeInTheDocument()
    })

    it('should navigate to the selected friend profile and lowercase the address', async () => {
      const user = userEvent.setup()
      renderHeader({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.friends_count/i }))
      await user.click(screen.getByTestId('friends-modal'))

      expect(navigateMock).toHaveBeenCalledWith('/profile/0xfriendfriendfriendfriendfriendfriend0001')
    })

    it('should close the friends modal without navigating when dismissed', async () => {
      const user = userEvent.setup()
      renderHeader({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.friends_count/i }))
      await user.click(screen.getByTestId('friends-modal-close'))

      expect(navigateMock).not.toHaveBeenCalled()
      expect(screen.queryByTestId('friends-modal')).not.toBeInTheDocument()
    })
  })

  describe('when a builder URL is configured', () => {
    beforeEach(() => {
      getEnvMock.mockReturnValue('https://builder.test/')
    })

    it('should open the names builder from Get a name', async () => {
      useProfileAvatarMock.mockReturnValue({
        avatar: { name: '0xCafe', hasClaimedName: false, userId: address },
        name: '0xCafe',
        backgroundColor: '#ff4bed'
      })
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      const user = userEvent.setup()
      renderHeader({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.get_a_name/i }))

      expect(openSpy).toHaveBeenCalledWith('https://builder.test/names', '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })

    it('should open the worlds builder from Manage world', async () => {
      const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
      const user = userEvent.setup()
      renderHeader({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.manage_world/i }))

      expect(openSpy).toHaveBeenCalledWith('https://builder.test/worlds', '_blank', 'noopener,noreferrer')
      openSpy.mockRestore()
    })
  })

  describe('when inviting friends on the My view', () => {
    it('should copy the invite link to the clipboard', async () => {
      const user = userEvent.setup()
      const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
      renderHeader({ isOwnProfile: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.invite_friends/i }))

      expect(writeTextSpy).toHaveBeenCalledWith(`${window.location.origin}/invite/${address}`)
    })
  })

  describe('when the member has mutual friends', () => {
    it('should render avatar slots for previewed mutuals and color dots otherwise', () => {
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useMutualFriendsMock.mockReturnValue({
        count: 3,
        friends: [{ address: '0xMutual1Mutual1Mutual1Mutual1Mutual10001', name: 'Pal', hasClaimedName: true }],
        isLoading: false,
        error: null
      })
      renderHeader()

      // First slot has a previewed friend → ProfileAvatar; remaining → color dots.
      expect(screen.getAllByTestId('mutual-avatar-slot')).toHaveLength(1)
      expect(screen.getAllByTestId('mutual-pic')).toHaveLength(2)
    })

    it('should open the mutual friends modal when clicking the cluster', async () => {
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByTestId('mutual-friends-row'))

      expect(screen.getByTestId('friends-modal').getAttribute('data-mutual-of')).toBe(address)
    })

    it('should navigate to the selected mutual friend and close the modal', async () => {
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByTestId('mutual-friends-row'))
      await user.click(screen.getByTestId('friends-modal'))

      expect(navigateMock).toHaveBeenCalledWith('/profile/0xfriendfriendfriendfriendfriendfriend0001')
    })

    it('should close the mutual friends modal without navigating when dismissed', async () => {
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderHeader()

      await user.click(screen.getByTestId('mutual-friends-row'))
      await user.click(screen.getByTestId('friends-modal-close'))

      expect(navigateMock).not.toHaveBeenCalled()
      expect(screen.queryByTestId('friends-modal')).not.toBeInTheDocument()
    })
  })

  describe('when embedded inside a modal with surface navigation', () => {
    it('should open the friends surface instead of the stacked modal on the My view', async () => {
      const openFriendsSurface = jest.fn()
      useModalFriendsNavigationMock.mockReturnValue(openFriendsSurface)
      useFriendsCountMock.mockReturnValue({ count: 3, isLoading: false, error: null })
      const user = userEvent.setup()
      renderHeader({ isOwnProfile: true, embedded: true })

      await user.click(screen.getByRole('button', { name: /profile\.header\.friends_count/i }))

      expect(openFriendsSurface).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('friends-modal')).not.toBeInTheDocument()
    })

    it('should open the mutual friends surface with the address on the Member view', async () => {
      const openFriendsSurface = jest.fn()
      useModalFriendsNavigationMock.mockReturnValue(openFriendsSurface)
      useAuthIdentityMock.mockReturnValue({ identity: {}, hasValidIdentity: true, address: '0xself' })
      useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
      const user = userEvent.setup()
      renderHeader({ embedded: true })

      await user.click(screen.getByTestId('mutual-friends-row'))

      expect(openFriendsSurface).toHaveBeenCalledWith(address)
    })
  })

  describe('when the header is mounted on top of another surface', () => {
    it('should render the back button and invoke onBack', async () => {
      const onBack = jest.fn()
      const user = userEvent.setup()
      renderHeader({ onBack })

      await user.click(screen.getByRole('button', { name: /profile\.header\.back/i }))

      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it('should render the close button and invoke onClose', async () => {
      const onClose = jest.fn()
      const user = userEvent.setup()
      renderHeader({ onClose })

      await user.click(screen.getByRole('button', { name: /profile\.header\.close_profile/i }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('should copy the address to the clipboard when clicking the copy button', async () => {
    const user = userEvent.setup()
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
    renderHeader()
    await user.click(screen.getByRole('button', { name: /profile\.header\.copy_address/i }))
    expect(writeTextSpy).toHaveBeenCalledWith(address)
  })

  it('should surface the copied feedback after copying the address', async () => {
    const user = userEvent.setup()
    renderHeader()
    expect(screen.queryByText('profile.header.address_copied')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /profile\.header\.copy_address/i }))
    expect(await screen.findByText('profile.header.address_copied')).toBeInTheDocument()
  })
})
