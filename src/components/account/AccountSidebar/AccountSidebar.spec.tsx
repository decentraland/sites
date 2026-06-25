import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AccountSidebar } from './AccountSidebar'

type ChildrenProps = { children?: ReactNode }
type NavProps = ChildrenProps & { 'data-role'?: string }
type ButtonProps = NavProps & { onClick?: () => void; 'aria-label'?: string }
type AddressProps = { value: string; shorten?: boolean }
type TooltipProps = ChildrenProps & { title?: ReactNode }

jest.mock('@mui/icons-material/AccountBalanceWalletOutlined', () => ({
  __esModule: true,
  default: () => <span data-testid="wallet-icon" />
}))
jest.mock('@mui/icons-material/CardGiftcardOutlined', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/ChevronRight', () => ({ __esModule: true, default: () => <span data-testid="chevron-icon" /> }))
jest.mock('@mui/icons-material/ContentCopyOutlined', () => ({ __esModule: true, default: () => <span data-testid="copy-icon" /> }))
jest.mock('@mui/icons-material/DeleteOutlineOutlined', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/LogoutOutlined', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/NotificationsNoneOutlined', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  Address: ({ value, shorten }: AddressProps) => (
    <span data-role="address">{shorten ? `${value.slice(0, 6)}...${value.slice(-4)}` : value}</span>
  ),
  Tooltip: ({ children, title }: TooltipProps) => <span data-tooltip={String(title)}>{children}</span>
}))

jest.mock('./AccountSidebar.styled', () => ({
  Sidebar: ({ children }: ChildrenProps) => <nav>{children}</nav>,
  UserHeader: ({ children }: ChildrenProps) => <div>{children}</div>,
  Avatar: ({ children }: ChildrenProps) => <div>{children}</div>,
  AvatarImage: ({ src }: { src?: string }) => <img alt="" src={src} />,
  UserInfo: ({ children }: ChildrenProps) => <div>{children}</div>,
  UserName: ({ children }: ChildrenProps) => <div>{children}</div>,
  AddressRow: ({ children }: ChildrenProps) => <div>{children}</div>,
  CopyButton: ({ children, onClick, 'data-role': dataRole, 'aria-label': ariaLabel }: ButtonProps) => (
    <button type="button" data-role={dataRole} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  Divider: () => <hr />,
  SectionLabel: ({ children }: ChildrenProps) => <div>{children}</div>,
  Nav: ({ children }: ChildrenProps) => <div>{children}</div>,
  NavChevron: ({ children }: ChildrenProps) => <span>{children}</span>,
  NavItem: ({ children, 'data-role': dataRole }: NavProps) => <a data-role={dataRole}>{children}</a>,
  DeleteNavItem: ({ children, 'data-role': dataRole }: NavProps) => <a data-role={dataRole}>{children}</a>,
  LogoutButton: ({ children, onClick, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  ),
  BottomGroup: ({ children }: ChildrenProps) => <div>{children}</div>
}))

const mockDisconnect = jest.fn()
jest.mock('../../../hooks/useWalletAddress', () => ({
  useWalletAddress: () => ({ disconnect: mockDisconnect })
}))

let mockIsThirdweb = true
jest.mock('../../../hooks/useIsThirdwebAccount', () => ({
  useIsThirdwebAccount: () => mockIsThirdweb
}))

jest.mock('../../../features/profile/profile.client', () => ({
  useGetProfileQuery: () => ({ data: undefined })
}))

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const ADDRESS = '0x1234567890123456789012345678901234567890'

const renderSidebar = (initialPath = '/account/wallets') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AccountSidebar address={ADDRESS} />
    </MemoryRouter>
  )

describe('AccountSidebar', () => {
  const writeText = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    mockIsThirdweb = true
    Object.assign(navigator, { clipboard: { writeText } })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the three section links plus delete and logout for a thirdweb account', () => {
    renderSidebar()

    expect(screen.getByText('account.nav.wallets')).toBeInTheDocument()
    expect(screen.getByText('account.nav.notifications')).toBeInTheDocument()
    expect(screen.getByText('account.nav.credits')).toBeInTheDocument()
    expect(screen.getByText('account.nav.delete')).toBeInTheDocument()
    expect(screen.getByText('account.nav.logout')).toBeInTheDocument()
  })

  it('should hide the delete entry for a non-thirdweb account (logout stays)', () => {
    mockIsThirdweb = false
    renderSidebar()

    expect(screen.queryByText('account.nav.delete')).not.toBeInTheDocument()
    expect(screen.getByText('account.nav.logout')).toBeInTheDocument()
  })

  it('should render the shortened wallet address and the wallet icon', () => {
    renderSidebar()

    expect(screen.getByText('0x1234...7890', { selector: '[data-role="address"]' })).toBeInTheDocument()
    // The wallet glyph appears in both the address row and the Wallets nav item.
    expect(screen.getAllByTestId('wallet-icon').length).toBeGreaterThanOrEqual(1)
  })

  it('should copy the address and surface the copied tooltip when the copy button is clicked', async () => {
    renderSidebar()

    fireEvent.click(screen.getByRole('button', { name: /account.copy/ }))

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
    await waitFor(() => expect(screen.getByTestId('copy-icon').closest('[data-tooltip]')).toHaveAttribute('data-tooltip', 'account.copied'))
  })

  it('should disconnect the wallet when logout is clicked', () => {
    renderSidebar()

    fireEvent.click(screen.getByText('account.nav.logout'))

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})
