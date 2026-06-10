import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockUseDeployments = jest.fn()
const mockUseWorld = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useNavigate: () => mockNavigate }))
jest.mock('../../../features/creators', () => ({
  useGetWorldDeploymentsQuery: (...args: unknown[]) => mockUseDeployments(...args)
}))
jest.mock('../../../features/discover', () => ({
  useGetDiscoverWorldByNameQuery: (...args: unknown[]) => mockUseWorld(...args)
}))
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
    mockUseWorld.mockReturnValue({ data: null })
  })
  afterEach(() => {
    jest.resetAllMocks()
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
    mockUseDeployments.mockReturnValue({ data: [{ entityId: 'e1', title: 'Scene' }], isLoading: false, isError: false })
    renderLayout()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /page.creators.world.nav.overview/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /page.creators.world.nav.auth_server/ })).toBeInTheDocument()
  })

  it('should navigate back to the creations grid from the rail back link', () => {
    mockUseDeployments.mockReturnValue({ data: [{ entityId: 'e1', title: 'Scene' }], isLoading: false, isError: false })
    renderLayout()
    fireEvent.click(screen.getByRole('button', { name: 'page.creators.world.back' }))
    expect(mockNavigate).toHaveBeenCalledWith('/creators')
  })
})
