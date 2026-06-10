import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockUseDeployments = jest.fn()
const mockUseWorld = jest.fn()
const mockUseNames = jest.fn()
const mockUseDomains = jest.fn()
const mockAuthIdentity = jest.fn()
const mockRedirect = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }))
jest.mock('../../../features/creators', () => ({
  useGetWorldDeploymentsQuery: (...args: unknown[]) => mockUseDeployments(...args),
  // Mirror the real merge: lower-cased owner names + collaborator domains.
  mergeCreatorWorlds: (names: string[] | undefined, domains: { name: string }[] | undefined) => [
    ...(names ?? []).map(name => ({ name: name.toLowerCase(), role: 'owner' })),
    ...(domains ?? []).map(domain => ({ name: domain.name.toLowerCase(), role: 'collaborator' }))
  ]
}))
jest.mock('../../../features/discover', () => ({
  useGetDiscoverWorldByNameQuery: (...args: unknown[]) => mockUseWorld(...args)
}))
jest.mock('../../../features/storage', () => ({
  useGetUserDCLNamesQuery: (...args: unknown[]) => mockUseNames(...args),
  useGetContributableDomainsQuery: (...args: unknown[]) => mockUseDomains(...args)
}))
jest.mock('../../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => mockAuthIdentity() }))
jest.mock('../../../utils/authRedirect', () => ({ redirectToAuth: (...args: unknown[]) => mockRedirect(...args) }))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))
jest.mock('../../../App.styled', () => ({
  CenteredBox: ({ children }: { children?: React.ReactNode }) => <div data-testid="centered">{children}</div>
}))
jest.mock('decentraland-ui2', () => ({
  Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  CircularProgress: () => <div data-testid="spinner" />
}))
jest.mock('./CreatorWorldLayout.styled', () => ({
  WorldPageRoot: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  MainColumn: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  SideRail: ({ children }: { children?: React.ReactNode }) => <nav>{children}</nav>,
  BackLink: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  RailLink: ({ children, to }: { children?: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  RailBadge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  NotFoundBox: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  NotFoundTitle: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
  NotFoundHint: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { CreatorWorldLayout } = require('./CreatorWorldLayout') as typeof import('./CreatorWorldLayout')

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/creators/world/test.dcl.eth']}>
      <Routes>
        <Route path="/creators/world/:name" element={<CreatorWorldLayout />}>
          <Route index element={<div data-testid="outlet">overview</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('CreatorWorldLayout', () => {
  beforeEach(() => {
    // Default: connected wallet that owns the routed world → has access.
    mockAuthIdentity.mockReturnValue({ identity: { id: 'i' }, address: '0xabc' })
    mockUseNames.mockReturnValue({ data: ['test.dcl.eth'], isLoading: false })
    mockUseDomains.mockReturnValue({ data: [], isLoading: false })
    mockUseDeployments.mockReturnValue({ data: [{ entityId: 'e1', title: 'Scene' }], isLoading: false, isError: false })
    mockUseWorld.mockReturnValue({ data: null })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should prompt to sign in when no wallet is connected', () => {
    mockAuthIdentity.mockReturnValue({ identity: undefined, address: undefined })
    renderLayout()
    expect(screen.getByText('page.creators.world.sign_in.title')).toBeInTheDocument()
  })

  it('should redirect to auth with the world return path from the sign-in state', () => {
    mockAuthIdentity.mockReturnValue({ identity: undefined, address: undefined })
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.home.sign_in' }))
    expect(mockRedirect).toHaveBeenCalledWith('/creators/world/test.dcl.eth')
  })

  it('should show a spinner while ownership permissions load', () => {
    mockUseNames.mockReturnValue({ data: undefined, isLoading: true })
    renderLayout()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('should deny access when the wallet does not own or collaborate on the world', () => {
    mockUseNames.mockReturnValue({ data: ['other.dcl.eth'], isLoading: false })
    renderLayout()
    expect(screen.getByText('page.creators.world.no_access.title')).toBeInTheDocument()
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument()
  })

  it('should grant access to a collaborator (contributable) world', () => {
    mockUseNames.mockReturnValue({ data: [], isLoading: false })
    mockUseDomains.mockReturnValue({ data: [{ name: 'test.dcl.eth' }], isLoading: false })
    renderLayout()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('should navigate back to the creations grid from the no-access state', () => {
    mockUseNames.mockReturnValue({ data: ['other.dcl.eth'], isLoading: false })
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.back' }))
    expect(mockNavigate).toHaveBeenCalledWith('/creators')
  })

  it('should show a spinner while deployments load', () => {
    mockUseDeployments.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderLayout()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('should show the not-found state when the world is unreachable', () => {
    mockUseDeployments.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderLayout()
    expect(screen.getByText('page.creators.world.not_found.title')).toBeInTheDocument()
  })

  it('should navigate back to the creations grid from the not-found state', () => {
    mockUseDeployments.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.back' }))
    expect(mockNavigate).toHaveBeenCalledWith('/creators')
  })

  it('should render the routed rail and the child outlet on success', () => {
    renderLayout()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /page.creators.world.nav.overview/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /page.creators.world.nav.auth_server/ })).toBeInTheDocument()
  })

  it('should navigate back to the creations grid from the rail back link', () => {
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.back' }))
    expect(mockNavigate).toHaveBeenCalledWith('/creators')
  })
})
