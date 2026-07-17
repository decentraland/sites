import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StorageLayout } from './StorageLayout'

const mockUseStorageScope = jest.fn()
const mockNavigate = jest.fn()
let mockPathname = '/storage/env'

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname })
}))

jest.mock('decentraland-ui2', () => {
  const h = React.createElement as unknown as (
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => React.ReactElement
  const pass =
    (tag: string) =>
    ({ children }: { children?: unknown }) =>
      h(tag, null, children)
  return {
    Box: pass('div'),
    CircularProgress: (props: Record<string, unknown>) => h('div', { role: 'progressbar', 'aria-label': props['aria-label'] }),
    // Expose a control that fires the real onChange so handleTabChange is exercised.
    Tabs: (props: Record<string, unknown>) =>
      h('div', null, [
        h('span', { key: 'active', 'data-testid': 'active-tab' }, props.value),
        h(
          'button',
          {
            key: 'change-tab',
            type: 'button',
            'aria-label': 'change-tab',
            onClick: () => (props.onChange as (e: unknown, v: string) => void)?.({}, 'scene')
          },
          'change-tab'
        ),
        h('div', { key: 'tabs' }, props.children)
      ]),
    Tab: (props: Record<string, unknown>) => h('span', null, props.label),
    Typography: pass('span')
  }
})

jest.mock('@mui/icons-material/ArrowBack', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/FmdGood', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/People', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/Settings', () => ({ __esModule: true, default: () => null }))
jest.mock('@mui/icons-material/ViewInAr', () => ({ __esModule: true, default: () => null }))

jest.mock('./StorageLayout.styled', () => {
  const h = React.createElement as unknown as (
    type: string,
    props?: Record<string, unknown> | null,
    ...children: unknown[]
  ) => React.ReactElement
  const pass = (tag: string) => (props: Record<string, unknown>) => h(tag, { onClick: props.onClick }, props.children)
  return {
    BackButton: pass('button'),
    LoaderBox: pass('div'),
    ScopeChip: pass('div'),
    ScopeRow: pass('div'),
    StorageHeader: pass('div'),
    StoragePageContainer: pass('div'),
    StorageTabsRoot: pass('div')
  }
})

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('../../../hooks/useStorageScope', () => ({
  useStorageScope: () => mockUseStorageScope()
}))

describe('StorageLayout', () => {
  beforeEach(() => {
    mockPathname = '/storage/env'
  })
  afterEach(() => jest.resetAllMocks())

  it.each([
    ['/storage/env', 'env'],
    ['/storage/scene', 'scene'],
    ['/storage/players', 'players']
  ])('derives the active tab %s -> %s', (pathname, expected) => {
    mockPathname = pathname
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.getByTestId('active-tab')).toHaveTextContent(expected)
  })

  it('shows a loader and hides children while the world base is resolving', () => {
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: null, isResolving: true, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByText('child-content')).not.toBeInTheDocument()
  })

  it('shows the unresolved error and hides children when no scene base can be derived', () => {
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: null, isResolving: false, unresolved: true })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.getByText('component.storage.errors.world_scene_unresolved')).toBeInTheDocument()
    expect(screen.queryByText('child-content')).not.toBeInTheDocument()
  })

  it('renders children and shows the position caption once the scope is resolved', () => {
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.getByText('child-content')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    // realm + position both present → the position caption renders alongside the realm chip.
    expect(screen.getByText('component.storage.sidebar.position: 5,5')).toBeInTheDocument()
  })

  it('navigates on tab change while preserving the query string', async () => {
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    await userEvent.click(screen.getByRole('button', { name: 'change-tab' }))
    expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/storage/scene', search: window.location.search })
  })

  it('uses the position as the scope label for a land (no realm) and hides the position caption', () => {
    mockUseStorageScope.mockReturnValue({ realm: null, position: '10,20', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.getByText('10,20')).toBeInTheDocument()
    expect(screen.queryByText('component.storage.sidebar.position:')).not.toBeInTheDocument()
  })

  it('omits the scope row entirely when neither realm nor position is set', () => {
    mockUseStorageScope.mockReturnValue({ realm: null, position: null, isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.getByText('child-content')).toBeInTheDocument()
  })

  it('navigates back to the world list from the header', async () => {
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    await userEvent.click(screen.getByRole('button', { name: 'component.storage.sidebar.back' }))
    expect(mockNavigate).toHaveBeenCalledWith('/storage/select')
  })
})
