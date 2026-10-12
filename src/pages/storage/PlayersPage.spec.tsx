import type { ChangeEvent, ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../../components/storage/__test-utils__/dialogMocks'
import type { Selection } from '../../hooks/useSelection'
import { SegmentEvent } from '../../modules/segment.types'
import { PlayersPage } from './PlayersPage'

type ChildrenProps = { children?: ReactNode }
type ConfirmDialogMockProps = { open: boolean; title: string; onConfirm: () => void; onCancel: () => void }
type ExportAlertMockProps = { children?: ReactNode; onClose: () => void }
type SearchFieldMockProps = {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  placeholder: string
}
type CardActionAreaMockProps = { children?: ReactNode; onClick: () => void; ['aria-label']?: string }
type FormControlLabelMockProps = { control: ReactNode; label: ReactNode }

const mockNavigate = jest.fn()
const mockClearAllPlayers = jest.fn()
const mockUseListPlayersQuery = jest.fn()
const mockUseSelection = jest.fn()
const mockUseStorageExport = jest.fn()
const mockUseLeaveGuard = jest.fn()
const mockTrack = jest.fn()
const mockProfileNames = new Map([['0xbbb', 'Alice']])

jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../config/env', () => ({ getEnv: () => 'https://example.invalid' }))
jest.mock('@mui/icons-material/ArrowDropDown', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/DeleteSweep', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('react-helmet-async', () => ({ Helmet: () => null }))
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }))

jest.mock('decentraland-ui2', () => ({
  ...dialogMockFactory(),
  Box: ({ children }: ChildrenProps) => <div>{children}</div>,
  Card: ({ children }: ChildrenProps) => <article>{children}</article>,
  CardActionArea: ({ children, onClick, ['aria-label']: ariaLabel }: CardActionAreaMockProps) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  CardContent: ({ children }: ChildrenProps) => <div>{children}</div>,
  FormControlLabel: ({ control, label }: FormControlLabelMockProps) => (
    <label>
      {control}
      {label}
    </label>
  ),
  Typography: ({ children }: ChildrenProps) => <span>{children}</span>
}))

jest.mock('../../features/storage', () => ({
  truncateAddress: jest.requireActual('../../features/storage/storage.helpers').truncateAddress,
  useClearAllPlayersMutation: () => [mockClearAllPlayers],
  useListPlayersQuery: () => mockUseListPlayersQuery()
}))
jest.mock('../../features/profile/profile.client', () => ({ useGetProfileNames: () => mockProfileNames }))

jest.mock('../../components/storage/_shared/StorageCard.styled', () => ({
  CardFooter: ({ children }: ChildrenProps) => <footer>{children}</footer>
}))
jest.mock('../../components/storage/SearchField', () => ({
  SearchField: ({ value, onChange, onClear, placeholder }: SearchFieldMockProps) => (
    <div>
      <input aria-label={placeholder} value={value} onChange={onChange} />
      <button type="button" onClick={onClear}>
        clear search
      </button>
    </div>
  )
}))
jest.mock('../../components/storage/ConfirmDialog', () => ({
  ConfirmDialog: ({ open, title, onConfirm, onCancel }: ConfirmDialogMockProps) =>
    open ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onConfirm}>
          confirm
        </button>
        <button type="button" onClick={onCancel}>
          cancel
        </button>
      </div>
    ) : null
}))
jest.mock('./SelectPage.styled', () => ({ CardsGrid: ({ children }: ChildrenProps) => <div>{children}</div> }))
jest.mock('./shared.styled', () => ({
  ExportAlert: ({ children, onClose }: ExportAlertMockProps) => (
    <div role="alert">
      {children}
      <button type="button" onClick={onClose}>
        close alert
      </button>
    </div>
  ),
  SectionActions: ({ children }: ChildrenProps) => <div>{children}</div>,
  SectionHeader: ({ children }: ChildrenProps) => <div>{children}</div>
}))
jest.mock('../../components/storage/StorageLayout', () => ({
  StorageLayout: ({ children }: ChildrenProps) => <div>{children}</div>
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, values?: Record<string, unknown>) => (values ? [key, ...Object.values(values)].join(' ') : key)
}))
jest.mock('../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => ({ identity: undefined, address: '0xowner' }) }))
jest.mock('../../hooks/usePageViewTracking', () => ({ usePageViewTracking: jest.fn() }))
jest.mock('../../hooks/useSelection', () => ({ useSelection: (ids: string[]) => mockUseSelection(ids) }))
jest.mock('../../hooks/useStorageExport', () => ({ useStorageExport: () => mockUseStorageExport() }))
jest.mock('../../hooks/useStorageRedirect', () => ({ useStorageRedirect: jest.fn() }))
jest.mock('../../hooks/useStorageScope', () => ({
  useStorageScope: () => ({ realm: 'flutterecho.dcl.eth', position: '0,-1', blocked: false })
}))
jest.mock('../../hooks/useStorageTrack', () => ({ useStorageTrack: () => mockTrack }))

const PLAYERS = ['0xaaa', '0xbbb', '0xccc']
const SELECT_ALL = 'component.storage.common.select_all'
const SEARCH = 'component.storage.player_page.search_players'

const buildSelection = (overrides: Partial<Selection> = {}): Selection => ({
  selected: new Set(),
  allSelected: false,
  count: 0,
  isSelected: () => false,
  toggle: jest.fn(),
  toggleAll: jest.fn(),
  toggleVisible: jest.fn(),
  clear: jest.fn(),
  ...overrides
})

const buildPartialSelection = (ids: string[]): Selection => {
  const selected = new Set(ids)
  return buildSelection({ selected, count: selected.size, isSelected: id => selected.has(id) })
}

describe('PlayersPage', () => {
  let startExport: jest.Mock
  let clearError: jest.Mock
  let selection: Selection
  let confirmLeave: jest.Mock

  beforeEach(() => {
    startExport = jest.fn()
    clearError = jest.fn()
    selection = buildSelection()
    confirmLeave = jest.fn((go: () => void) => go())
    mockUseLeaveGuard.mockReturnValue(confirmLeave)
    mockUseListPlayersQuery.mockReturnValue({ currentData: PLAYERS, isLoading: false })
    mockUseSelection.mockImplementation(() => selection)
    mockUseStorageExport.mockImplementation(() => ({ startExport, busy: false, errorKey: null, clearError }))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when nothing is selected', () => {
    it('should select over the loaded players', () => {
      render(<PlayersPage />)
      expect(mockUseSelection).toHaveBeenCalledWith(PLAYERS)
    })

    it('should register the idle export with the leave guard', () => {
      render(<PlayersPage />)
      expect(mockUseLeaveGuard).toHaveBeenCalledWith(false)
    })

    it('should render the select all checkbox unchecked', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('checkbox', { name: SELECT_ALL })).not.toBeChecked()
    })

    it('should not render a download button', () => {
      render(<PlayersPage />)
      expect(screen.queryByRole('button', { name: /download/ })).not.toBeInTheDocument()
    })

    it('should render a checkbox on every card', () => {
      render(<PlayersPage />)
      expect(screen.getAllByRole('checkbox', { name: /component\.storage\.common\.select_row/ })).toHaveLength(3)
    })
  })

  describe('when the select all checkbox is clicked without a search term', () => {
    it('should toggle the whole selection', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)
      await user.click(screen.getByRole('checkbox', { name: SELECT_ALL }))
      expect(selection.toggleAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the select all checkbox is clicked with a search term', () => {
    it('should toggle only the visible players', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)
      await user.type(screen.getByRole('textbox', { name: SEARCH }), 'ali')
      await user.click(screen.getByRole('checkbox', { name: SELECT_ALL }))
      expect(selection.toggleVisible).toHaveBeenCalledWith(['0xbbb'])
    })
  })

  describe('when a card checkbox is clicked', () => {
    it('should toggle that player', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)
      await user.click(screen.getByRole('checkbox', { name: 'component.storage.common.select_row 0xaaa' }))
      expect(selection.toggle).toHaveBeenCalledWith('0xaaa')
    })
  })

  describe('when some players are selected', () => {
    beforeEach(() => {
      selection = buildPartialSelection(['0xaaa', '0xccc'])
    })

    it('should render the select all checkbox as indeterminate', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('checkbox', { name: SELECT_ALL })).toHaveAttribute('data-indeterminate', 'true')
    })

    it('should check the selected cards', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('checkbox', { name: 'component.storage.common.select_row 0xccc' })).toBeChecked()
    })

    describe('and JSON is chosen', () => {
      it('should start an export job for the selected players only', async () => {
        const user = userEvent.setup()
        render(<PlayersPage />)
        await user.click(screen.getByRole('button', { name: 'component.storage.common.download_selected 2' }))
        await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_json' }))
        expect(startExport).toHaveBeenCalledWith({ world: { keys: [] }, players: { addresses: ['0xaaa', '0xccc'] } }, 'json')
      })
    })
  })

  describe('when every visible player is selected by hand', () => {
    beforeEach(() => {
      selection = buildPartialSelection(PLAYERS)
    })

    it('should render the select all checkbox checked', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('checkbox', { name: SELECT_ALL })).toBeChecked()
    })
  })

  describe('when every player is selected and CSV is chosen', () => {
    beforeEach(() => {
      selection = buildSelection({ selected: new Set(PLAYERS), allSelected: true, count: 3, isSelected: () => true })
    })

    it('should start an export job for every player', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.common.download_all_selected' }))
      await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_csv' }))
      expect(startExport).toHaveBeenCalledWith({ world: { keys: [] } }, 'csv')
    })
  })

  describe('when an export job is running', () => {
    beforeEach(() => {
      selection = buildPartialSelection(['0xaaa'])
      mockUseStorageExport.mockImplementation(() => ({ startExport, busy: true, errorKey: null, clearError }))
    })

    it('should render the download selected button as busy', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('button', { name: 'component.storage.common.download_selected 1' })).toHaveAttribute('aria-disabled', 'true')
    })

    it('should register the busy export with the leave guard', () => {
      render(<PlayersPage />)
      expect(mockUseLeaveGuard).toHaveBeenCalledWith(true)
    })
  })

  describe('when the export reports an error', () => {
    beforeEach(() => {
      mockUseStorageExport.mockImplementation(() => ({
        startExport,
        busy: false,
        errorKey: 'component.storage.errors.export_failed',
        clearError
      }))
    })

    it('should render the translated error in an alert', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('alert')).toHaveTextContent('component.storage.errors.export_failed')
    })

    it('should clear the error when the alert is closed', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)
      await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'close alert' }))
      expect(clearError).toHaveBeenCalledTimes(1)
    })
  })

  describe('when a card is clicked', () => {
    it('should navigate to the player detail keeping the current search', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.player_page.select_player 0xccc' }))
      expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/storage/players/0xccc', search: window.location.search })
    })

    describe('and the leave guard holds the navigation', () => {
      beforeEach(async () => {
        confirmLeave.mockImplementation(() => undefined)
        const user = userEvent.setup()
        render(<PlayersPage />)
        await user.click(screen.getByRole('button', { name: 'component.storage.player_page.select_player 0xccc' }))
      })

      it('should route the navigation through the leave guard', () => {
        expect(confirmLeave).toHaveBeenCalledTimes(1)
      })

      it('should not navigate before the guard lets it go', () => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })

      describe('and the guard lets it go', () => {
        beforeEach(() => {
          const [go] = confirmLeave.mock.calls[0] as [() => void]
          go()
        })

        it('should navigate to the player detail', () => {
          expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/storage/players/0xccc', search: window.location.search })
        })
      })
    })
  })

  describe('when searching by address', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<PlayersPage />)
      await user.type(screen.getByRole('textbox', { name: SEARCH }), '0xc')
    })

    it('should render only the matching cards', () => {
      expect(screen.getAllByRole('button', { name: /component\.storage\.player_page\.select_player/ })).toHaveLength(1)
    })

    describe('and the search is cleared', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: 'clear search' }))
      })

      it('should render every card again', () => {
        expect(screen.getAllByRole('button', { name: /component\.storage\.player_page\.select_player/ })).toHaveLength(3)
      })
    })
  })

  describe('when the search matches nothing', () => {
    it('should render the no results message', async () => {
      const user = userEvent.setup()
      render(<PlayersPage />)
      await user.type(screen.getByRole('textbox', { name: SEARCH }), 'zzz')
      expect(screen.getByText('component.storage.player_page.no_search_results zzz')).toBeInTheDocument()
    })
  })

  describe('when the players are loading', () => {
    beforeEach(() => {
      mockUseListPlayersQuery.mockReturnValue({ currentData: undefined, isLoading: true })
    })

    it('should render a progress indicator', () => {
      render(<PlayersPage />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when the scene has no players', () => {
    beforeEach(() => {
      mockUseListPlayersQuery.mockReturnValue({ currentData: [], isLoading: false })
    })

    it('should render the empty message', () => {
      render(<PlayersPage />)
      expect(screen.getByText('component.storage.player_page.no_players')).toBeInTheDocument()
    })

    it('should not render the select all checkbox', () => {
      render(<PlayersPage />)
      expect(screen.queryByRole('checkbox', { name: SELECT_ALL })).not.toBeInTheDocument()
    })
  })

  describe('when clearing all players is requested', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<PlayersPage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.player_page.clear_all_players' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockClearAllPlayers.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.clear_all_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should clear every player in the current scope', () => {
        expect(mockClearAllPlayers).toHaveBeenCalledWith({ identity: undefined, realm: 'flutterecho.dcl.eth', position: '0,-1' })
      })

      it('should track the success and close the dialog', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_SUCCESS)
        expect(screen.queryByRole('dialog', { name: 'component.storage.player_page.clear_all_dialog.title' })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and fails', () => {
      beforeEach(async () => {
        mockClearAllPlayers.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.clear_all_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should track the failure', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_CLEAR_ALL_FAILURE)
      })
    })

    describe('and it is cancelled', () => {
      beforeEach(async () => {
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.clear_all_dialog.title' })).getByRole('button', {
            name: 'cancel'
          })
        )
      })

      it('should close the dialog without clearing', () => {
        expect(screen.queryByRole('dialog', { name: 'component.storage.player_page.clear_all_dialog.title' })).not.toBeInTheDocument()
        expect(mockClearAllPlayers).not.toHaveBeenCalled()
      })
    })
  })
})
