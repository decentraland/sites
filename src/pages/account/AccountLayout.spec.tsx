import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { AccountIndexRedirect, AccountLayout } from './AccountLayout'

type ButtonProps = { children?: ReactNode; onClick?: () => void; 'aria-label'?: string; 'data-role'?: string }

let mockIsMobile = false
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => mockIsMobile
}))

jest.mock('@mui/icons-material/ArrowBackIosNew', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Close', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick }: ButtonProps) => <button onClick={onClick}>{children}</button>,
  useTheme: () => ({ breakpoints: { down: () => 'down-md' } })
}))

jest.mock('./AccountLayout.styled', () => ({
  AccountLayoutRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AccountContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AccountPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MobileSection: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MobileSectionHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  MobileBackButton: ({ children, onClick, 'data-role': dataRole }: ButtonProps) => (
    <button data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  ),
  MobileCloseButton: ({ children, onClick, 'aria-label': ariaLabel, 'data-role': dataRole }: ButtonProps) => (
    <button data-role={dataRole} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  SignInPrompt: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SignInTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>
}))

jest.mock('../../components/account/AccountSidebar/AccountSidebar', () => ({
  AccountSidebar: ({ address }: { address: string }) => <div data-testid="account-sidebar">{address}</div>
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const mockSignIn = jest.fn()
jest.mock('../../hooks/useSignInRedirect', () => ({
  useSignInRedirect: () => mockSignIn
}))

const mockUseAuthIdentity = jest.fn()
jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

const renderLayoutAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<span>index-outlet</span>} />
          <Route path="wallets" element={<span>wallets-section</span>} />
          <Route path="notifications" element={<span>notifications-section</span>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('AccountLayout', () => {
  beforeEach(() => {
    mockIsMobile = false
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the visitor is not signed in', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ address: undefined })
    })

    it('should render the sign-in prompt instead of the account sections', () => {
      renderLayoutAt('/account/wallets')

      expect(screen.getByText('account.sign_in.title')).toBeInTheDocument()
      expect(screen.queryByTestId('account-sidebar')).not.toBeInTheDocument()
    })
  })

  describe('when signed in on desktop', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ address: '0x1234567890123456789012345678901234567890' })
    })

    it('should render the sidebar and the active section side by side', () => {
      renderLayoutAt('/account/wallets')

      expect(screen.getByTestId('account-sidebar')).toBeInTheDocument()
      expect(screen.getByText('wallets-section')).toBeInTheDocument()
    })
  })

  describe('when signed in on mobile', () => {
    beforeEach(() => {
      mockIsMobile = true
      mockUseAuthIdentity.mockReturnValue({ address: '0x1234567890123456789012345678901234567890' })
    })

    it('should show only the dashboard sidebar on the index route', () => {
      renderLayoutAt('/account')

      expect(screen.getByTestId('account-sidebar')).toBeInTheDocument()
      expect(screen.queryByText('wallets-section')).not.toBeInTheDocument()
    })

    it('should show the section behind a back/close header without the sidebar', () => {
      renderLayoutAt('/account/notifications')

      expect(screen.queryByTestId('account-sidebar')).not.toBeInTheDocument()
      expect(screen.getByText('notifications-section')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'account.nav.close' })).toBeInTheDocument()
    })
  })
})

describe('AccountIndexRedirect', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect to wallets on desktop', () => {
    mockIsMobile = false
    render(
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<AccountIndexRedirect />} />
          <Route path="/account/wallets" element={<span>redirected-wallets</span>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('redirected-wallets')).toBeInTheDocument()
  })

  it('should render nothing on mobile so the dashboard shows', () => {
    mockIsMobile = true
    const { container } = render(
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<AccountIndexRedirect />} />
        </Routes>
      </MemoryRouter>
    )

    expect(container.textContent).toBe('')
  })
})
