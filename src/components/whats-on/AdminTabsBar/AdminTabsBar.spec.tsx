import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { AdminTabsBar } from './AdminTabsBar'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>
}))

jest.mock('./AdminTabsBar.styled', () => ({
  Bar: ({ children }: { children: React.ReactNode }) => <nav data-testid="admin-bar">{children}</nav>,
  BarTabs: ({ children, onChange }: { children: React.ReactNode; onChange?: (e: unknown, value: string | unknown) => void }) => (
    <div role="tablist" data-onchange-string={onChange ? 'true' : 'false'}>
      <button data-testid="trigger-string-change" onClick={() => onChange?.(null, '/whats-on/admin/users')}>
        change-string
      </button>
      <button data-testid="trigger-non-string-change" onClick={() => onChange?.(null, 42)}>
        change-non-string
      </button>
      {children}
    </div>
  ),
  BarTab: ({ label, value }: { label: string; value: string }) => (
    <button role="tab" data-value={value}>
      {label}
    </button>
  ),
  CreateEventButtonWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
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

  it('should navigate when the create event button is clicked', () => {
    const ProbePath = () => {
      const location = useLocation()
      return <div data-testid="path">{location.pathname}</div>
    }
    render(
      <MemoryRouter initialEntries={['/whats-on']}>
        <Routes>
          <Route
            path="/whats-on"
            element={
              <>
                <AdminTabsBar />
                <ProbePath />
              </>
            }
          />
          <Route path="*" element={<ProbePath />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'whats_on_admin.cta.create_event' }))
    expect(screen.getByTestId('path').textContent).toBe('/whats-on/new-hangout')
  })

  it('should navigate when a tab string value is provided to onChange', () => {
    const ProbePath = () => {
      const location = useLocation()
      return <div data-testid="path">{location.pathname}</div>
    }
    render(
      <MemoryRouter initialEntries={['/whats-on']}>
        <Routes>
          <Route
            path="/whats-on"
            element={
              <>
                <AdminTabsBar />
                <ProbePath />
              </>
            }
          />
          <Route path="*" element={<ProbePath />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId('trigger-string-change'))
    expect(screen.getByTestId('path').textContent).toBe('/whats-on/admin/users')
  })

  it('should ignore non-string change values', () => {
    const ProbePath = () => {
      const location = useLocation()
      return <div data-testid="path">{location.pathname}</div>
    }
    render(
      <MemoryRouter initialEntries={['/whats-on']}>
        <Routes>
          <Route
            path="/whats-on"
            element={
              <>
                <AdminTabsBar />
                <ProbePath />
              </>
            }
          />
          <Route path="*" element={<ProbePath />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByTestId('trigger-non-string-change'))
    expect(screen.getByTestId('path').textContent).toBe('/whats-on')
  })
})

describe('when the active route resolves activeValue', () => {
  beforeEach(() => {
    useAdminPermissions.mockReturnValue({
      isAdmin: true,
      canApproveAnyEvent: true,
      canApproveOwnEvent: false,
      canEditAnyEvent: false,
      canEditAnyProfile: true
    })
  })

  it.each(['/whats-on', '/whats-on/admin/pending-events', '/whats-on/admin/users', '/some/other/page'])(
    'should produce the right activeValue for %s',
    pathname => {
      render(
        <MemoryRouter initialEntries={[pathname]}>
          <AdminTabsBar />
        </MemoryRouter>
      )
    }
  )
})
