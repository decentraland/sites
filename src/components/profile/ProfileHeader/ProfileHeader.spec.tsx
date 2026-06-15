import * as mockReact from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileHeader } from './ProfileHeader'

const useProfileAvatarMock = jest.fn()
jest.mock('../../../hooks/useProfileAvatar', () => ({
  useProfileAvatar: () => useProfileAvatarMock()
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: jest.fn().mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

// `import.meta.env` is not available in Jest's CommonJS runtime; mock the env
// module so we don't reach into `src/config/index.ts` from this test.
jest.mock('../../../config/env', () => ({
  getEnv: () => undefined
}))

const useMutualFriendsMock = jest.fn()
jest.mock('../../../features/profile/profile.social.rpc', () => ({
  useFriendshipStatus: () => ({ status: 'none', isLoading: false, error: null }),
  useFriendsCount: () => ({ count: undefined, isLoading: false, error: null }),
  useUpsertFriendship: () => ({ upsert: jest.fn(), isLoading: false, error: null }),
  useMutualFriends: () => useMutualFriendsMock(),
  useBlockUser: () => ({ setBlocked: jest.fn(), isLoading: false, error: null })
}))

jest.mock('../FriendsModal', () => ({
  FriendsModal: ({ open, mutualOfAddress }: { open: boolean; mutualOfAddress?: string }) =>
    open ? mockReact.createElement('div', { 'data-testid': 'friends-modal', 'data-mutual-of': mutualOfAddress }) : null
}))

jest.mock('../ProfileAvatar', () => ({
  ProfileAvatar: () => mockReact.createElement('div', { 'data-testid': 'profile-avatar' })
}))

jest.mock('decentraland-ui2', () => {
  const Button = mockReact.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { startIcon?: React.ReactNode }>(
    ({ startIcon, children, ...props }, ref) => mockReact.createElement('button', { ref, ...props }, startIcon, children)
  )
  const IconButton = mockReact.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ children, ...props }, ref) =>
    mockReact.createElement('button', { ref, ...props }, children)
  )
  const Menu = ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? mockReact.createElement('div', { role: 'menu' }, children) : null
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
    mockReact.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { $bg?: string; $offset?: number }>(
      ({ $bg: _bg, $offset: _offset, ...props }, ref) => mockReact.createElement(tag, { 'data-testid': testid, ref, ...props })
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
    MobileMenuIconButton: make('mobile-menu-icon-button', 'button'),
    MoreActionsButton: make('more-actions-button', 'button'),
    MutualAvatarSlot: make('mutual-avatar-slot', 'span'),
    MutualFriendsRow: make('mutual-friends-row'),
    MutualPic: make('mutual-pic', 'span'),
    MutualStack: make('mutual-stack'),
    MutualText: make('mutual-text'),
    NameAddressBlock: make('name-address-block'),
    NameRow: make('name-row'),
    NameText: make('name-text'),
    VerifiedBadge: make('verified-badge', 'span'),
    WalletIcon: make('wallet-icon', 'span')
  }
})

const address = '0xCafeCafeCafeCafeCafeCafeCafeCafeCafeCafe'

const onCloseMock = jest.fn()

function renderHeader(isOwnProfile: boolean) {
  return render(
    <MemoryRouter>
      <ProfileHeader address={address} isOwnProfile={isOwnProfile} onClose={onCloseMock} />
    </MemoryRouter>
  )
}

describe('ProfileHeader', () => {
  beforeEach(() => {
    useMutualFriendsMock.mockReturnValue({ count: 0, friends: [], isLoading: false, error: null })
    useProfileAvatarMock.mockReturnValue({
      avatar: { name: 'Mojito', hasClaimedName: true, userId: address },
      avatarForCard: undefined,
      avatarFace: undefined,
      name: 'Mojito',
      backgroundColor: '#ff4bed'
    })
    // `defineProperty` (not Object.assign) — userEvent.setup() leaves a getter-only
    // `navigator.clipboard` stub behind that a plain assign cannot overwrite.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the display name and the truncated address', () => {
    renderHeader(false)
    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText(`${address.slice(0, 6)}…${address.slice(-4)}`)).toBeInTheDocument()
  })

  it('should show the Add friend CTA on Member view', () => {
    renderHeader(false)
    expect(screen.getByRole('button', { name: /profile\.header\.add_friend/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /profile\.header\.invite_friends/i })).not.toBeInTheDocument()
  })

  it('should show Get a name and Invite friends CTAs on My view when no claimed name', () => {
    useProfileAvatarMock.mockReturnValue({
      avatar: { name: '0xCafe', hasClaimedName: false, userId: address },
      avatarForCard: undefined,
      avatarFace: undefined,
      name: '0xCafe',
      backgroundColor: '#ff4bed'
    })
    renderHeader(true)
    expect(screen.getByRole('button', { name: /profile\.header\.get_a_name/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /profile\.header\.invite_friends/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /profile\.header\.add_friend/i })).not.toBeInTheDocument()
  })

  it('should hide Get a name CTA on My view when name is claimed', () => {
    renderHeader(true)
    expect(screen.queryByRole('button', { name: /profile\.header\.get_a_name/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /profile\.header\.invite_friends/i })).toBeInTheDocument()
  })

  it('should open the mutual friends modal when clicking the mutual friends cluster on Member view', async () => {
    useMutualFriendsMock.mockReturnValue({ count: 2, friends: [], isLoading: false, error: null })
    const user = userEvent.setup()
    renderHeader(false)

    await user.click(screen.getByTestId('mutual-friends-row'))

    const modal = screen.getByTestId('friends-modal')
    expect(modal.getAttribute('data-mutual-of')).toBe(address)
  })

  it('should copy the address to the clipboard when clicking the copy button', async () => {
    const user = userEvent.setup()
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
    renderHeader(false)
    await user.click(screen.getByRole('button', { name: /profile\.header\.copy_address/i }))
    expect(writeTextSpy).toHaveBeenCalledWith(address)
  })

  it('should surface the copied feedback after copying the address', async () => {
    const user = userEvent.setup()
    renderHeader(false)
    expect(screen.queryByText('profile.header.address_copied')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /profile\.header\.copy_address/i }))
    expect(await screen.findByText('profile.header.address_copied')).toBeInTheDocument()
  })
})
