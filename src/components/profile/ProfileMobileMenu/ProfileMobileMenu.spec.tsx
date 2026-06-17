import * as mockReact from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileMobileNav } from './ProfileMobileMenu'

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: undefined, hasValidIdentity: false, address: undefined })
}))

jest.mock('../../../hooks/useWalletAddress', () => ({
  useWalletAddress: () => ({ disconnect: jest.fn() })
}))

jest.mock('../../../features/profile/profile.social.rpc', () => ({
  useFriendshipStatus: () => ({ status: 'none', isLoading: false, error: null }),
  useFriendsCount: () => ({ count: undefined, isLoading: false, error: null }),
  useUpsertFriendship: () => ({ upsert: jest.fn(), isLoading: false, error: null }),
  useMutualFriends: () => ({ count: 0, friends: [], isLoading: false, error: null })
}))

jest.mock('../ProfileModal/ModalProfileNavigation', () => ({
  useModalFriendsNavigation: () => undefined
}))

// `redirectToAuth` pulls in `src/config/env.ts`, which uses `import.meta` and
// blows up in Jest's CommonJS runtime. The nav doesn't redirect in these tests.
jest.mock('../../../utils/authRedirect', () => ({
  redirectToAuth: jest.fn()
}))

jest.mock('../FriendsModal', () => ({
  FriendsModal: ({ open }: { open: boolean }) => (open ? mockReact.createElement('div', { 'data-testid': 'friends-modal' }) : null)
}))

jest.mock('../ProfileAvatar', () => ({
  ProfileAvatar: () => mockReact.createElement('div', { 'data-testid': 'profile-avatar' })
}))

jest.mock('../ProfileTabs', () => ({
  getVisibleTabs: () => [{ id: 'overview', labelKey: 'profile.tabs.overview' }]
}))

jest.mock('./ProfileMobileMenu.icons', () => ({
  TAB_ICONS: new Map()
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
    >(({ $active: _active, $bg: _bg, $offset: _offset, startIcon: _startIcon, ...props }, ref) =>
      mockReact.createElement(tag, { 'data-testid': testid, ref, ...props })
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

function renderNav() {
  return render(
    <MemoryRouter>
      <ProfileMobileNav address={address} displayName="Mojito" isOwnProfile onTabSelect={jest.fn()} />
    </MemoryRouter>
  )
}

describe('ProfileMobileNav', () => {
  beforeEach(() => {
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

  it('should render the display name and the shortened address', () => {
    renderNav()
    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText(`${address.slice(0, 6)}…${address.slice(-4)}`)).toBeInTheDocument()
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
})
