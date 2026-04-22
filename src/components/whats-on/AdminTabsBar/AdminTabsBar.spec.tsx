import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { AdminTabsBar } from './AdminTabsBar'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  Tab: ({ label, value }: { label: string; value: string }) => (
    <button role="tab" data-value={value}>
      {label}
    </button>
  ),
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  styled:
    () =>
    () =>
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

jest.mock('./AdminTabsBar.styled', () => ({
  Bar: ({ children }: { children: React.ReactNode }) => <nav data-testid="admin-bar">{children}</nav>
}))

jest.mock('../../../hooks/useAdminPermissions', () => ({
  useAdminPermissions: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAdminPermissions } = require('../../../hooks/useAdminPermissions') as { useAdminPermissions: jest.Mock }

describe('when the user is not an admin', () => {
  beforeEach(() => {
    useAdminPermissions.mockReturnValue({
      isAdmin: false,
      canApproveAnyEvent: false,
      canApproveOwnEvent: false,
      canEditAnyEvent: false,
      canEditAnyProfile: false
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render nothing', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminTabsBar />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('when the user is an admin with only canEditAnyProfile', () => {
  beforeEach(() => {
    useAdminPermissions.mockReturnValue({
      isAdmin: true,
      canApproveAnyEvent: false,
      canApproveOwnEvent: false,
      canEditAnyEvent: false,
      canEditAnyProfile: true
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should render the What's On tab", () => {
    render(
      <MemoryRouter>
        <AdminTabsBar />
      </MemoryRouter>
    )
    expect(screen.getByRole('tab', { name: 'whats_on_admin.tabs.whats_on' })).toBeInTheDocument()
  })

  it('should render the Users tab', () => {
    render(
      <MemoryRouter>
        <AdminTabsBar />
      </MemoryRouter>
    )
    expect(screen.getByRole('tab', { name: 'whats_on_admin.tabs.users' })).toBeInTheDocument()
  })

  it('should NOT render the Pending Events tab', () => {
    render(
      <MemoryRouter>
        <AdminTabsBar />
      </MemoryRouter>
    )
    expect(screen.queryByRole('tab', { name: 'whats_on_admin.tabs.pending_events' })).not.toBeInTheDocument()
  })
})

describe('when the user is an admin with approve and edit-profile permissions', () => {
  beforeEach(() => {
    useAdminPermissions.mockReturnValue({
      isAdmin: true,
      canApproveAnyEvent: true,
      canApproveOwnEvent: false,
      canEditAnyEvent: false,
      canEditAnyProfile: true
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render all three tabs', () => {
    render(
      <MemoryRouter>
        <AdminTabsBar />
      </MemoryRouter>
    )
    expect(screen.getByRole('tab', { name: 'whats_on_admin.tabs.whats_on' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'whats_on_admin.tabs.pending_events' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'whats_on_admin.tabs.users' })).toBeInTheDocument()
  })

  it('should render the create event CTA', () => {
    render(
      <MemoryRouter>
        <AdminTabsBar />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'whats_on_admin.cta.create_event' })).toBeInTheDocument()
  })
})
