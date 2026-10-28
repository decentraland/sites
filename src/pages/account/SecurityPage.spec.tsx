import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { SecurityPage } from './SecurityPage'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: ChildrenProps) => <>{children}</>
}))

jest.mock('./SecurityPage.styled', () => ({
  PageRoot: ({ children }: ChildrenProps) => <div>{children}</div>,
  LoadingState: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>
}))

jest.mock('decentraland-ui2', () => ({
  CircularProgress: () => <span data-role="spinner" />
}))

jest.mock('../../components/account/Security/SecuritySection/SecuritySection', () => ({
  SecuritySection: () => <div data-role="security-section" />
}))

type NoticeProps = { title: string; description: string; dataRole?: string }
jest.mock('../../components/account/AccountUnavailableNotice/AccountUnavailableNotice', () => ({
  AccountUnavailableNotice: ({ title, description, dataRole }: NoticeProps) => (
    <div data-role={dataRole}>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  )
}))

let mockIsMagic = false
let mockIsResolvingProvider = false
jest.mock('../../hooks/useCanDeleteAccount', () => ({
  useCanDeleteAccount: () => ({ canDelete: mockIsMagic, isMagic: mockIsMagic, isResolvingProvider: mockIsResolvingProvider })
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

describe('SecurityPage', () => {
  beforeEach(() => {
    mockIsMagic = false
    mockIsResolvingProvider = false
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when the account is a Magic login', () => {
    beforeEach(() => {
      mockIsMagic = true
    })

    it('should render the reveal section (not the loader or unavailable message)', () => {
      const { container } = render(<SecurityPage />)

      expect(container.querySelector('[data-role="security-section"]')).toBeTruthy()
      expect(container.querySelector('[data-role="security-loading"]')).toBeNull()
      expect(container.querySelector('[data-role="security-unavailable"]')).toBeNull()
    })
  })

  describe('when provider detection is still resolving', () => {
    beforeEach(() => {
      mockIsResolvingProvider = true
    })

    it('should show the loader and neither the section nor the unavailable message', () => {
      const { container } = render(<SecurityPage />)

      expect(container.querySelector('[data-role="security-loading"]')).toBeTruthy()
      expect(container.querySelector('[data-role="security-section"]')).toBeNull()
      expect(container.querySelector('[data-role="security-unavailable"]')).toBeNull()
    })
  })

  describe('when the account is not a Magic login', () => {
    it('should show the unavailable message (not the section or loader)', () => {
      const { container } = render(<SecurityPage />)

      expect(container.querySelector('[data-role="security-unavailable"]')).toBeTruthy()
      expect(screen.getByText('account.security.unavailable_title')).toBeInTheDocument()
      expect(container.querySelector('[data-role="security-section"]')).toBeNull()
    })
  })

  it('should render the localized page title', () => {
    const { container } = render(<SecurityPage />)

    expect(container.querySelector('title')?.textContent).toBe('account.pages.security.title | Decentraland')
  })
})
