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

jest.mock('../../../features/profile/profile.social.rpc', () => ({
  useFriendshipStatus: () => ({ status: 'none', isLoading: false, error: null }),
  useFriendsCount: () => ({ count: undefined, isLoading: false, error: null }),
  useUpsertFriendship: () => ({ upsert: jest.fn(), isLoading: false, error: null }),
  useMutualFriends: () => ({ count: 0, friends: [], isLoading: false, error: null }),
  useBlockUser: () => ({ setBlocked: jest.fn(), isLoading: false, error: null })
}))

jest.mock('../FriendsModal', () => ({
  FriendsModal: () => null
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
  return { Button, IconButton, Menu, MenuItem }
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
    CloseIconButton: make('close-icon-button', 'button'),
    CopyButton: make('copy-button', 'button'),
    Discriminator: make('discriminator', 'span'),
    HeaderRoot: make('header-root'),
    IdentityBlock: make('identity-block'),
    MutualFriendsRow: make('mutual-friends-row'),
    MutualPic: make('mutual-pic', 'span'),
    MutualStack: make('mutual-stack'),
    MutualText: make('mutual-text'),
    NameAddressBlock: make('name-address-block'),
    NameRow: make('name-row'),
    NameText: make('name-text'),
    VerifiedBadge: make('verified-badge', 'span')
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
    useProfileAvatarMock.mockReturnValue({
      avatar: { name: 'Mojito', hasClaimedName: true, userId: address },
      avatarForCard: undefined,
      avatarFace: undefined,
      name: 'Mojito',
      backgroundColor: '#ff4bed'
    })
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the display name and the truncated address', () => {
    renderHeader(false)
    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText(`${address.slice(0, 4)}...${address.slice(-4)}`)).toBeInTheDocument()
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

  it('should copy the address to the clipboard when clicking the copy button', async () => {
    const user = userEvent.setup()
    const writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText')
    renderHeader(false)
    await user.click(screen.getByRole('button', { name: /profile\.header\.copy_address/i }))
    expect(writeTextSpy).toHaveBeenCalledWith(address)
  })
})
