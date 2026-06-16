import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { AccountLayout } from './AccountLayout'

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>
}))

jest.mock('./AccountLayout.styled', () => ({
  AccountLayoutRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AccountContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AccountPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

describe('AccountLayout', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the visitor is not signed in', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ address: undefined, identity: undefined, hasValidIdentity: false })
    })

    it('should render the sign-in prompt instead of the account sections', () => {
      render(
        <MemoryRouter initialEntries={['/account/wallets']}>
          <AccountLayout />
        </MemoryRouter>
      )

      expect(screen.getByText('account.sign_in.title')).toBeInTheDocument()
      expect(screen.queryByTestId('account-sidebar')).not.toBeInTheDocument()
    })
  })

  describe('when the visitor is signed in', () => {
    beforeEach(() => {
      mockUseAuthIdentity.mockReturnValue({ address: '0x1234567890123456789012345678901234567890', identity: {}, hasValidIdentity: true })
    })

    it('should render the sidebar and the active section through the outlet', () => {
      render(
        <MemoryRouter initialEntries={['/account/wallets']}>
          <Routes>
            <Route element={<AccountLayout />}>
              <Route path="/account/wallets" element={<span>wallets-section</span>} />
            </Route>
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByTestId('account-sidebar')).toBeInTheDocument()
      expect(screen.getByText('wallets-section')).toBeInTheDocument()
    })
  })
})
