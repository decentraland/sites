import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../../components/storage/__test-utils__/dialogMocks'
import { buildExportFile } from '../../features/storage/storage.helpers'
import type { Selection } from '../../hooks/useSelection'
import { SegmentEvent } from '../../modules/segment.types'
import { PlayerDetailPage } from './PlayerDetailPage'

type ChildrenProps = { children?: ReactNode }
type KeyTableMockProps = {
  keys: { key: string }[]
  emptyLabel: string
  onEdit: (key: string) => void
  onDelete: (key: string) => void
  onDownload?: (key: string) => void
  selected?: ReadonlySet<string>
  allSelected?: boolean
  onToggle?: (key: string) => void
  onToggleAll?: () => void
}
type FormDialogMockProps = { open: boolean; onClose: () => void; onSuccess: () => void; onError: (error: unknown) => void }
type ConfirmDialogMockProps = { open: boolean; title: string; onConfirm: () => void; onCancel: () => void }
type ExportAlertMockProps = { children?: ReactNode; onClose: () => void }
type ButtonBaseMockProps = { children?: ReactNode; onClick?: () => void; ['aria-label']?: string }

const mockNavigate = jest.fn()
const mockGetPlayerValue = jest.fn()
const mockDeletePlayerValue = jest.fn()
const mockClearPlayer = jest.fn()
const mockUseListPlayerKeysQuery = jest.fn()
const mockUseSelection = jest.fn()
const mockUseStorageExport = jest.fn()
const mockUseLeaveGuard = jest.fn()
const mockTrack = jest.fn()
const mockTriggerBlobDownload = jest.fn()

function mockFormDialog(name: string) {
  return ({ open, onClose, onSuccess, onError }: FormDialogMockProps) =>
    open ? (
      <div role="dialog" aria-label={name}>
        <button type="button" onClick={onClose}>
          close
        </button>
        <button type="button" onClick={onSuccess}>
          succeed
        </button>
        <button type="button" onClick={() => onError({ status: 500 })}>
          fail
        </button>
      </div>
    ) : null
}

jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../config/env', () => ({ getEnv: () => 'https://example.invalid' }))
jest.mock('@mui/icons-material/Add', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/ArrowBack', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/ArrowDropDown', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/DeleteSweep', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('react-helmet-async', () => ({ Helmet: () => null }))
jest.mock('react-router-dom', () => ({
  Link: ({ children }: ChildrenProps) => <a href="/storage/players">{children}</a>,
  useNavigate: () => mockNavigate,
  useParams: () => ({ address: '0xabc' })
}))

jest.mock('decentraland-ui2', () => ({
  ...dialogMockFactory(),
  Box: ({ children }: ChildrenProps) => <div>{children}</div>,
  ButtonBase: ({ children, onClick, ['aria-label']: ariaLabel }: ButtonBaseMockProps) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  Typography: ({ children }: ChildrenProps) => <span>{children}</span>
}))

jest.mock('../../features/storage', () => ({
  buildExportFile: jest.requireActual('../../features/storage/storage.helpers').buildExportFile,
  getStorageErrorStatus: jest.requireActual('../../features/storage/storage.helpers').getStorageErrorStatus,
  toStorageValueFile: jest.requireActual('../../features/storage/storage.helpers').toStorageValueFile,
  truncateAddress: jest.requireActual('../../features/storage/storage.helpers').truncateAddress,
  useClearPlayerMutation: () => [mockClearPlayer],
  useDeletePlayerValueMutation: () => [mockDeletePlayerValue],
  useLazyGetPlayerValueQuery: () => [mockGetPlayerValue],
  useListPlayerKeysQuery: (args: unknown, options: unknown) => mockUseListPlayerKeysQuery(args, options)
}))

jest.mock('../../components/storage/KeyTable', () => ({
  KeyTable: ({ keys, emptyLabel, onEdit, onDelete, onDownload, selected, allSelected, onToggle, onToggleAll }: KeyTableMockProps) =>
    keys.length === 0 ? (
      <p>{emptyLabel}</p>
    ) : (
      <div>
        <input type="checkbox" aria-label="select all rows" checked={Boolean(allSelected)} onChange={() => onToggleAll?.()} />
        {keys.map(({ key }) => (
          <div key={key}>
            <input
              type="checkbox"
              aria-label={`select ${key}`}
              checked={Boolean(allSelected || selected?.has(key))}
              onChange={() => onToggle?.(key)}
            />
            {onDownload ? <button type="button" aria-label={`download ${key}`} onClick={() => onDownload(key)} /> : null}
            <button type="button" aria-label={`edit ${key}`} onClick={() => onEdit(key)} />
            <button type="button" aria-label={`delete ${key}`} onClick={() => onDelete(key)} />
          </div>
        ))}
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
jest.mock('../../components/storage/PlayerDialogs', () => ({
  PlayerAddDialog: mockFormDialog('add dialog'),
  PlayerEditDialog: mockFormDialog('edit dialog')
}))
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
jest.mock('../../components/storage/ExportMenuButton/ExportMenuButton.styled', () => ({
  ExportMenuRoot: ({ children }: ChildrenProps) => <div>{children}</div>,
  ExportStatus: ({ children, role }: ChildrenProps & { role?: string }) => <span role={role}>{children}</span>
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, values?: Record<string, unknown>) => (values ? [key, ...Object.values(values)].join(' ') : key)
}))
jest.mock('../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => ({ identity: undefined, address: '0xowner' }) }))
jest.mock('../../hooks/usePageViewTracking', () => ({ usePageViewTracking: jest.fn() }))
jest.mock('../../hooks/useSelection', () => ({ useSelection: (ids: string[]) => mockUseSelection(ids) }))
jest.mock('../../hooks/useLeaveGuard', () => ({ useLeaveGuard: (busy: boolean) => mockUseLeaveGuard(busy) }))
jest.mock('../../hooks/useStorageExport', () => ({ useStorageExport: () => mockUseStorageExport() }))
jest.mock('../../hooks/useStorageRedirect', () => ({ useStorageRedirect: jest.fn() }))
jest.mock('../../hooks/useStorageScope', () => ({
  useStorageScope: () => ({ realm: 'flutterecho.dcl.eth', position: '0,-1', blocked: false })
}))
jest.mock('../../hooks/useStorageTrack', () => ({ useStorageTrack: () => mockTrack }))
jest.mock('../../modules/file', () => ({
  triggerBlobDownload: (blob: Blob, filename: string) => mockTriggerBlobDownload(blob, filename)
}))

const PLAYER_KEYS = [
  { key: 'a', value: { score: 1 } },
  { key: 'b', value: 'x,y' },
  { key: 'save.json', value: { level: 3 } }
]

const readBlob = (blob: Blob): Promise<string> =>
  new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsText(blob)
  })

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

describe('PlayerDetailPage', () => {
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
    mockUseListPlayerKeysQuery.mockReturnValue({ currentData: PLAYER_KEYS, isLoading: false })
    mockUseSelection.mockImplementation(() => selection)
    mockUseStorageExport.mockImplementation(() => ({ startExport, busy: false, errorKey: null, clearError }))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the page renders', () => {
    it('should list the keys of the route player', () => {
      render(<PlayerDetailPage />)
      expect(mockUseListPlayerKeysQuery).toHaveBeenCalledWith(
        { identity: undefined, address: '0xabc', realm: 'flutterecho.dcl.eth', position: '0,-1' },
        { skip: true }
      )
    })

    it('should select over the loaded keys', () => {
      render(<PlayerDetailPage />)
      expect(mockUseSelection).toHaveBeenCalledWith(['a', 'b', 'save.json'])
    })

    it('should register the idle export with the leave guard', () => {
      render(<PlayerDetailPage />)
      expect(mockUseLeaveGuard).toHaveBeenCalledWith(false)
    })

    it('should not render a download selected button', () => {
      render(<PlayerDetailPage />)
      expect(screen.queryByRole('button', { name: /component\.storage\.common\.download_(all_)?selected/ })).not.toBeInTheDocument()
    })
  })

  describe('when the header checkbox is clicked', () => {
    it('should toggle the whole selection', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(screen.getByRole('checkbox', { name: 'select all rows' }))
      expect(selection.toggleAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('when a row checkbox is clicked', () => {
    it('should toggle that key', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(screen.getByRole('checkbox', { name: 'select b' }))
      expect(selection.toggle).toHaveBeenCalledWith('b')
    })
  })

  describe('when rows a and b are selected and JSON is chosen', () => {
    beforeEach(() => {
      const selected = new Set(['a', 'b'])
      selection = buildSelection({ selected, count: 2, isSelected: id => selected.has(id) })
    })

    it('should save the loaded rows as player rows of the route address without an export job', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)

      await user.click(screen.getByRole('button', { name: 'component.storage.common.download_selected 2' }))
      await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_json' }))

      expect(mockTriggerBlobDownload).toHaveBeenCalledTimes(1)
      const [blob, filename] = mockTriggerBlobDownload.mock.calls[0] as [Blob, string]
      expect(filename).toBe('storage-export.json')
      expect(await readBlob(blob)).toBe(
        buildExportFile(
          'json',
          [],
          [
            { address: '0xabc', key: 'a', value: { score: 1 } },
            { address: '0xabc', key: 'b', value: 'x,y' }
          ]
        ).content
      )
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SELECTION_DOWNLOAD_SUCCESS, { format: 'json', count: 2 })
      expect(startExport).not.toHaveBeenCalled()
    })
  })

  describe('when every key is selected and CSV is chosen', () => {
    beforeEach(() => {
      selection = buildSelection({
        selected: new Set(PLAYER_KEYS.map(({ key }) => key)),
        allSelected: true,
        count: 3,
        isSelected: () => true
      })
    })

    it('should start an export job for all keys of the route player', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)

      await user.click(screen.getByRole('button', { name: 'component.storage.common.download_all_selected' }))
      await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_csv' }))

      expect(startExport).toHaveBeenCalledWith({ world: { keys: [] }, players: { addresses: ['0xabc'] } }, 'csv')
      expect(mockTriggerBlobDownload).not.toHaveBeenCalled()
    })
  })

  describe('when an export job is running', () => {
    beforeEach(() => {
      selection = buildSelection({ selected: new Set(['a']), count: 1, isSelected: id => id === 'a' })
      mockUseStorageExport.mockImplementation(() => ({ startExport, busy: true, errorKey: null, clearError }))
    })

    it('should render the download selected button as busy', () => {
      render(<PlayerDetailPage />)
      expect(screen.getByRole('button', { name: 'component.storage.common.download_selected 1' })).toHaveAttribute('aria-disabled', 'true')
    })

    it('should register the busy export with the leave guard', () => {
      render(<PlayerDetailPage />)
      expect(mockUseLeaveGuard).toHaveBeenCalledWith(true)
    })
  })

  describe('when the export reports an error', () => {
    beforeEach(() => {
      mockUseStorageExport.mockImplementation(() => ({
        startExport,
        busy: false,
        errorKey: 'component.storage.errors.rate_limited',
        clearError
      }))
    })

    it('should render the translated error in an alert', () => {
      render(<PlayerDetailPage />)
      expect(screen.getByRole('alert')).toHaveTextContent('component.storage.errors.rate_limited')
    })

    it('should clear the error when the alert is closed', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'close alert' }))
      expect(clearError).toHaveBeenCalledTimes(1)
    })
  })

  describe('when a key is downloaded and the value loads', () => {
    beforeEach(() => {
      mockGetPlayerValue.mockReturnValue({ unwrap: () => Promise.resolve({ key: 'save.json', value: { level: 3 } }) })
    })

    it('should fetch the value of the route player in the current scope', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(screen.getByRole('button', { name: 'download save.json' }))
      await waitFor(() =>
        expect(mockGetPlayerValue).toHaveBeenCalledWith({
          identity: undefined,
          realm: 'flutterecho.dcl.eth',
          position: '0,-1',
          address: '0xabc',
          key: 'save.json'
        })
      )
    })

    it('should save the value as a file named after the key and track the success', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)

      await user.click(screen.getByRole('button', { name: 'download save.json' }))

      await waitFor(() => expect(mockTriggerBlobDownload).toHaveBeenCalledTimes(1))
      const [blob, filename] = mockTriggerBlobDownload.mock.calls[0] as [Blob, string]
      expect(filename).toBe('save.json')
      expect(await readBlob(blob)).toBe(JSON.stringify({ level: 3 }, null, 2))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_DOWNLOAD_SUCCESS)
    })
  })

  describe('when a key is downloaded and the value fails to load', () => {
    beforeEach(() => {
      mockGetPlayerValue.mockReturnValue({ unwrap: () => Promise.reject({ status: 403 }) })
    })

    it('should not save a file and should track the failure', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)

      await user.click(screen.getByRole('button', { name: 'download save.json' }))

      await waitFor(() => expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_DOWNLOAD_FAILURE, { errorStatus: 403 }))
      expect(mockTriggerBlobDownload).not.toHaveBeenCalled()
    })
  })

  describe('when the back link is clicked', () => {
    it('should navigate to the players list keeping the current search', async () => {
      const user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.player_page.back_to_players' }))
      expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/storage/players', search: window.location.search })
    })

    describe('and the leave guard holds the navigation', () => {
      let notPrevented: boolean

      beforeEach(() => {
        confirmLeave.mockImplementation(() => undefined)
        render(<PlayerDetailPage />)
        notPrevented = fireEvent.click(screen.getByRole('button', { name: 'component.storage.player_page.back_to_players' }))
      })

      it('should prevent the link default navigation', () => {
        expect(notPrevented).toBe(false)
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

        it('should navigate to the players list keeping the current search', () => {
          expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/storage/players', search: window.location.search })
        })
      })
    })

    describe.each(['metaKey', 'ctrlKey', 'shiftKey', 'altKey'])('and %s is held', modifier => {
      let notPrevented: boolean

      beforeEach(() => {
        render(<PlayerDetailPage />)
        notPrevented = fireEvent.click(screen.getByRole('button', { name: 'component.storage.player_page.back_to_players' }), {
          [modifier]: true
        })
      })

      it('should let the link handle the click', () => {
        expect(notPrevented).toBe(true)
      })

      it('should not route the click through the leave guard', () => {
        expect(confirmLeave).not.toHaveBeenCalled()
      })

      it('should not navigate programmatically', () => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })
  })

  describe('when the keys are loading', () => {
    beforeEach(() => {
      mockUseListPlayerKeysQuery.mockReturnValue({ currentData: undefined, isLoading: true })
    })

    it('should render a progress indicator', () => {
      render(<PlayerDetailPage />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when the player has no keys', () => {
    beforeEach(() => {
      mockUseListPlayerKeysQuery.mockReturnValue({ currentData: [], isLoading: false })
    })

    it('should render the empty label', () => {
      render(<PlayerDetailPage />)
      expect(screen.getByText('component.storage.player_page.no_keys')).toBeInTheDocument()
    })

    it('should not offer to clear the player', () => {
      render(<PlayerDetailPage />)
      expect(screen.queryByRole('button', { name: 'component.storage.player_page.clear_this_player' })).not.toBeInTheDocument()
    })
  })

  describe.each([
    ['add', 'component.storage.player_page.add', 'add dialog'],
    ['edit', 'edit a', 'edit dialog']
  ])('when the %s dialog is opened', (_name, opener, dialogName) => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(screen.getByRole('button', { name: opener }))
    })

    it('should close the dialog when it is dismissed', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'close' }))
      expect(screen.queryByRole('dialog', { name: dialogName })).not.toBeInTheDocument()
    })

    it('should track a successful save', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'succeed' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_SET_SUCCESS)
    })

    it('should track a failed save with its status', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'fail' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_SET_FAILURE, { errorStatus: 500 })
    })
  })

  describe('when a key delete is requested', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(screen.getByRole('button', { name: 'delete a' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockDeletePlayerValue.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.delete_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should delete the key of the route player', () => {
        expect(mockDeletePlayerValue).toHaveBeenCalledWith({
          identity: undefined,
          realm: 'flutterecho.dcl.eth',
          position: '0,-1',
          address: '0xabc',
          key: 'a'
        })
      })

      it('should track the success and close the dialog', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_DELETE_SUCCESS)
        expect(screen.queryByRole('dialog', { name: 'component.storage.player_page.delete_dialog.title' })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and fails', () => {
      beforeEach(async () => {
        mockDeletePlayerValue.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.delete_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should track the failure', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_DELETE_FAILURE)
      })
    })

    describe('and it is cancelled', () => {
      beforeEach(async () => {
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.delete_dialog.title' })).getByRole('button', {
            name: 'cancel'
          })
        )
      })

      it('should close the dialog without deleting', () => {
        expect(screen.queryByRole('dialog', { name: 'component.storage.player_page.delete_dialog.title' })).not.toBeInTheDocument()
        expect(mockDeletePlayerValue).not.toHaveBeenCalled()
      })
    })
  })

  describe('when clearing the player is requested', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<PlayerDetailPage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.player_page.clear_this_player' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockClearPlayer.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.clear_player_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should clear the route player in the current scope', () => {
        expect(mockClearPlayer).toHaveBeenCalledWith({
          identity: undefined,
          realm: 'flutterecho.dcl.eth',
          position: '0,-1',
          address: '0xabc'
        })
      })

      it('should track the success and close the dialog', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_CLEAR_SUCCESS)
        expect(screen.queryByRole('dialog', { name: 'component.storage.player_page.clear_player_dialog.title' })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and fails', () => {
      beforeEach(async () => {
        mockClearPlayer.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.clear_player_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should track the failure', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_PLAYER_CLEAR_FAILURE)
      })
    })

    describe('and it is cancelled', () => {
      beforeEach(async () => {
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.player_page.clear_player_dialog.title' })).getByRole('button', {
            name: 'cancel'
          })
        )
      })

      it('should close the dialog without clearing', () => {
        expect(screen.queryByRole('dialog', { name: 'component.storage.player_page.clear_player_dialog.title' })).not.toBeInTheDocument()
        expect(mockClearPlayer).not.toHaveBeenCalled()
      })
    })
  })
})
