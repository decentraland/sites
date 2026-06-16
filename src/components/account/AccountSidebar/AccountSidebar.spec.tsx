import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AccountSidebar } from './AccountSidebar'

type ChildrenProps = { children?: ReactNode }
type NavProps = { children?: ReactNode; 'data-role'?: string }
type ButtonProps = NavProps & { onClick?: () => void }

jest.mock('@mui/icons-material/AccountBalanceWalletRounded', () => ({
  __esModule: true,
  default: () => <span data-testid="wallets-icon" />
}))
jest.mock('@mui/icons-material/CardGiftcardRounded', () => ({ __esModule: true, default: () => <span data-testid="credits-icon" /> }))
jest.mock('@mui/icons-material/DeleteOutlineRounded', () => ({ __esModule: true, default: () => <span data-testid="delete-icon" /> }))
jest.mock('@mui/icons-material/LogoutRounded', () => ({ __esModule: true, default: () => <span data-testid="logout-icon" /> }))
jest.mock('@mui/icons-material/NotificationsRounded', () => ({
  __esModule: true,
  default: () => <span data-testid="notifications-icon" />
}))

jest.mock('./AccountSidebar.styled', () => ({
  Sidebar: ({ children }: ChildrenProps) => <nav>{children}</nav>,
  UserHeader: ({ children }: ChildrenProps) => <div>{children}</div>,
  Avatar: ({ children }: ChildrenProps) => <div>{children}</div>,
  AvatarImage: ({ src }: { src?: string }) => <img alt="" src={src} />,
  UserName: ({ children }: ChildrenProps) => <div>{children}</div>,
  UserAddress: ({ children }: ChildrenProps) => <div>{children}</div>,
  SectionLabel: ({ children }: ChildrenProps) => <div>{children}</div>,
  Nav: ({ children }: ChildrenProps) => <div>{children}</div>,
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
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the three section links plus delete and logout', () => {
    renderSidebar()

    expect(screen.getByText('account.nav.wallets')).toBeInTheDocument()
    expect(screen.getByText('account.nav.notifications')).toBeInTheDocument()
    expect(screen.getByText('account.nav.credits')).toBeInTheDocument()
    expect(screen.getByText('account.nav.delete')).toBeInTheDocument()
    expect(screen.getByText('account.nav.logout')).toBeInTheDocument()
  })

  it('should show the shortened address when the profile has no claimed name', () => {
    renderSidebar()

    // Falls back to the shortened address in both the name slot and the address label.
    expect(screen.getAllByText('0x1234...7890').length).toBeGreaterThan(0)
  })

  it('should disconnect the wallet when logout is clicked', () => {
    renderSidebar()

    fireEvent.click(screen.getByText('account.nav.logout'))

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})
