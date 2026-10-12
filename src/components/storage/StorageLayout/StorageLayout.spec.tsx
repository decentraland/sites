import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../__test-utils__/dialogMocks'
import { StorageLayout } from './StorageLayout'

const mockUseStorageScope = jest.fn()
const mockUseAuthIdentity = jest.fn()
const mockUseStorageExport = jest.fn()
const mockNavigate = jest.fn()
let mockPathname = '/storage/env'
let mockSearch = ''

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname, search: mockSearch })
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
    ...dialogMockFactory(),
    Alert: (props: Record<string, unknown>) =>
      h('div', { role: 'alert' }, [
        h('span', { key: 'message' }, props.children),
        h('button', { key: 'close', type: 'button', onClick: props.onClose }, 'close alert')
      ]),
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

jest.mock('@mui/icons-material/ArrowDropDown', () => ({ __esModule: true, default: () => null }))
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
    HeaderActions: pass('div'),
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

jest.mock('../../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

jest.mock('../../../hooks/useStorageExport', () => ({
  useStorageExport: () => mockUseStorageExport()
}))

describe('StorageLayout', () => {
  beforeEach(() => {
    mockPathname = '/storage/env'
    mockSearch = ''
    mockUseAuthIdentity.mockReturnValue({ identity: undefined, address: undefined })
    mockUseStorageExport.mockReturnValue({ startExport: jest.fn(), busy: false, errorKey: null, clearError: jest.fn() })
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

  it('hides the environment tab in collaborator access context', () => {
    mockPathname = '/storage/scene'
    mockSearch = '?realm=w.dcl.eth&position=5,5&access=collaborator'
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.queryByText('component.storage.sidebar.environment')).not.toBeInTheDocument()
    expect(screen.getByText('component.storage.sidebar.scene')).toBeInTheDocument()
    expect(screen.getByText('component.storage.sidebar.player')).toBeInTheDocument()
  })

  it('shows the environment tab for owner and deployer access without the collaborator flag', () => {
    mockPathname = '/storage/env'
    mockSearch = '?realm=w.dcl.eth&position=5,5'
    mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(screen.getByText('component.storage.sidebar.environment')).toBeInTheDocument()
  })

  it('redirects a collaborator who lands on the env route to the scene tab', () => {
    mockPathname = '/storage/env'
    mockSearch = '?position=5,5&access=collaborator'
    mockUseStorageScope.mockReturnValue({ realm: null, position: '5,5', isResolving: false, unresolved: false })
    render(
      <StorageLayout>
        <div>child-content</div>
      </StorageLayout>
    )
    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: '/storage/scene', search: '?position=5,5&access=collaborator' },
      { replace: true }
    )
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

  describe('when a signed-in user is on the scene tab of a resolved scope', () => {
    let startExport: jest.Mock

    beforeEach(() => {
      startExport = jest.fn()
      mockPathname = '/storage/scene'
      mockUseAuthIdentity.mockReturnValue({ identity: { authChain: [] }, address: '0xowner' })
      mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
      mockUseStorageExport.mockReturnValue({ startExport, busy: false, errorKey: null, clearError: jest.fn() })
    })

    it('should render the download all button', () => {
      render(
        <StorageLayout>
          <div>child-content</div>
        </StorageLayout>
      )
      expect(screen.getByRole('button', { name: 'component.storage.common.download_all' })).toBeInTheDocument()
    })

    it('should export the whole scene when JSON is chosen', async () => {
      render(
        <StorageLayout>
          <div>child-content</div>
        </StorageLayout>
      )
      await userEvent.click(screen.getByRole('button', { name: 'component.storage.common.download_all' }))
      await userEvent.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_json' }))
      expect(startExport).toHaveBeenCalledWith({}, 'json')
    })

    describe('and an export job is running', () => {
      beforeEach(() => {
        mockUseStorageExport.mockReturnValue({ startExport, busy: true, errorKey: null, clearError: jest.fn() })
      })

      it('should render the download all button as busy', () => {
        render(
          <StorageLayout>
            <div>child-content</div>
          </StorageLayout>
        )
        expect(screen.getByRole('button', { name: 'component.storage.common.download_all' })).toHaveAttribute('aria-disabled', 'true')
      })
    })
  })

  describe('when the layout export is busy', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
      user = userEvent.setup()
      mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
      mockUseStorageExport.mockReturnValue({ startExport: jest.fn(), busy: true, errorKey: null, clearError: jest.fn() })
      render(
        <StorageLayout>
          <div>child-content</div>
        </StorageLayout>
      )
    })

    describe.each([
      ['the tab is changed', 'change-tab', { pathname: '/storage/scene', search: window.location.search }],
      ['back is pressed', 'component.storage.sidebar.back', '/storage/select']
    ])('and %s', (_context, buttonName, target) => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: buttonName }))
      })

      it('should open the leave dialog', () => {
        expect(screen.getByText('component.storage.leave_dialog.title')).toBeInTheDocument()
      })

      it('should not navigate', () => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      describe('and Stay is chosen', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: 'component.storage.leave_dialog.stay' }))
        })

        it('should close the leave dialog', () => {
          expect(screen.queryByText('component.storage.leave_dialog.title')).not.toBeInTheDocument()
        })

        it('should not navigate', () => {
          expect(mockNavigate).not.toHaveBeenCalled()
        })
      })

      describe('and Leave is chosen', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: 'component.storage.leave_dialog.leave' }))
        })

        it('should navigate to the requested destination', () => {
          expect(mockNavigate).toHaveBeenCalledWith(target)
        })

        it('should close the leave dialog', () => {
          expect(screen.queryByText('component.storage.leave_dialog.title')).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('when the user is on the players tab', () => {
    beforeEach(() => {
      mockPathname = '/storage/players/0xabc'
      mockUseAuthIdentity.mockReturnValue({ identity: { authChain: [] }, address: '0xowner' })
      mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
    })

    it('should render the download all button', () => {
      render(
        <StorageLayout>
          <div>child-content</div>
        </StorageLayout>
      )
      expect(screen.getByRole('button', { name: 'component.storage.common.download_all' })).toBeInTheDocument()
    })
  })

  describe.each([
    ['the scope is resolving', '/storage/scene', true, { isResolving: true, unresolved: false }],
    ['the scope is unresolved', '/storage/scene', true, { isResolving: false, unresolved: true }],
    ['there is no identity', '/storage/scene', false, { isResolving: false, unresolved: false }],
    ['the user is on the env tab', '/storage/env', true, { isResolving: false, unresolved: false }]
  ])('when %s', (_context, pathname, signedIn, scopeState) => {
    beforeEach(() => {
      mockPathname = pathname
      mockUseAuthIdentity.mockReturnValue(signedIn ? { identity: { authChain: [] }, address: '0xowner' } : { identity: undefined })
      mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', ...scopeState })
    })

    it('should not render the download all button', () => {
      render(
        <StorageLayout>
          <div>child-content</div>
        </StorageLayout>
      )
      expect(screen.queryByRole('button', { name: 'component.storage.common.download_all' })).not.toBeInTheDocument()
    })
  })

  describe('when the export reports an error', () => {
    let clearError: jest.Mock

    beforeEach(() => {
      clearError = jest.fn()
      mockPathname = '/storage/scene'
      mockUseAuthIdentity.mockReturnValue({ identity: { authChain: [] }, address: '0xowner' })
      mockUseStorageScope.mockReturnValue({ realm: 'w.dcl.eth', position: '5,5', isResolving: false, unresolved: false })
      mockUseStorageExport.mockReturnValue({
        startExport: jest.fn(),
        busy: false,
        errorKey: 'component.storage.errors.export_failed',
        clearError
      })
    })

    it('should render the translated error in an alert', () => {
      render(
        <StorageLayout>
          <div>child-content</div>
        </StorageLayout>
      )
      expect(screen.getByRole('alert')).toHaveTextContent('component.storage.errors.export_failed')
    })

    it('should clear the error when the alert is closed', async () => {
      render(
        <StorageLayout>
          <div>child-content</div>
        </StorageLayout>
      )
      await userEvent.click(screen.getByRole('button', { name: 'close alert' }))
      expect(clearError).toHaveBeenCalledTimes(1)
    })
  })
})
