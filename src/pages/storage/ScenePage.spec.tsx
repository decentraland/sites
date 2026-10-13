import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../../components/storage/__test-utils__/dialogMocks'
import { buildExportFile } from '../../features/storage/storage.helpers'
import type { Selection } from '../../hooks/useSelection'
import { SegmentEvent } from '../../modules/segment.types'
import { ScenePage } from './ScenePage'

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
  bulkActions?: ReactNode
}
type FormDialogMockProps = { open: boolean; onClose: () => void; onSuccess: () => void; onError: (error: unknown) => void }
type ConfirmDialogMockProps = { open: boolean; title: string; onConfirm: () => void; onCancel: () => void }
type ExportAlertMockProps = { children?: ReactNode; onClose: () => void }

const mockGetSceneValue = jest.fn()
const mockDeleteSceneValue = jest.fn()
const mockClearScene = jest.fn()
const mockUseListSceneKeysQuery = jest.fn()
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
jest.mock('@mui/icons-material/ArrowDropDown', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Delete', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/DeleteSweep', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Download', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('react-helmet-async', () => ({ Helmet: () => null }))

jest.mock('decentraland-ui2', () => ({
  ...dialogMockFactory(),
  Box: ({ children }: ChildrenProps) => <div>{children}</div>
}))

jest.mock('../../features/storage', () => ({
  buildExportFile: jest.requireActual('../../features/storage/storage.helpers').buildExportFile,
  deleteSelection: jest.requireActual('../../features/storage/storage.helpers').deleteSelection,
  getStorageErrorStatus: jest.requireActual('../../features/storage/storage.helpers').getStorageErrorStatus,
  toStorageValueFile: jest.requireActual('../../features/storage/storage.helpers').toStorageValueFile,
  useClearSceneMutation: () => [mockClearScene],
  useDeleteSceneValueMutation: () => [mockDeleteSceneValue],
  useLazyGetSceneValueQuery: () => [mockGetSceneValue],
  useListSceneKeysQuery: () => mockUseListSceneKeysQuery()
}))

jest.mock('../../components/storage/KeyTable', () => ({
  KeyTable: ({
    keys,
    emptyLabel,
    onEdit,
    onDelete,
    onDownload,
    selected,
    allSelected,
    onToggle,
    onToggleAll,
    bulkActions
  }: KeyTableMockProps) =>
    keys.length === 0 ? (
      <p>{emptyLabel}</p>
    ) : (
      <div>
        {bulkActions}
        <input type="checkbox" aria-label="select all rows" checked={Boolean(allSelected)} onChange={() => onToggleAll?.()} />
        {keys.map(({ key }) => (
          <div key={key}>
            <input
              type="checkbox"
              aria-label={`select ${key}`}
              checked={Boolean(allSelected || selected?.has(key))}
              onChange={() => onToggle?.(key)}
            />
            <button type="button" aria-label={`download ${key}`} onClick={() => onDownload?.(key)} />
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
jest.mock('../../components/storage/SceneDialogs', () => ({
  SceneAddDialog: mockFormDialog('add dialog'),
  SceneEditDialog: mockFormDialog('edit dialog')
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
jest.mock('../../components/storage/_shared/ActionIconButton.styled', () => ({
  ActionIconButton: jest.requireMock('decentraland-ui2').IconButton
}))
jest.mock('../../components/storage/ExportMenuButton/ExportMenuButton.styled', () => ({
  ExportMenuRoot: ({ children }: ChildrenProps) => <div>{children}</div>,
  ExportStatus: ({ children, role }: ChildrenProps & { role?: string }) => <span role={role}>{children}</span>
}))

jest.mock('../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string, values?: Record<string, unknown>) => (values ? [key, ...Object.values(values)].join(' ') : key)
}))
jest.mock('../../hooks/useAuthIdentity', () => ({ useAuthIdentity: () => ({ identity: undefined, address: '0xabc' }) }))
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

const SCENE_KEYS = [
  { key: 'a', value: { score: 1 } },
  { key: 'b', value: 'x,y' },
  { key: 'feedback-1.csv', value: 'id,rating\n1,5' }
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

describe('ScenePage', () => {
  let startExport: jest.Mock
  let clearError: jest.Mock
  let selection: Selection

  beforeEach(() => {
    startExport = jest.fn()
    clearError = jest.fn()
    selection = buildSelection()
    mockUseListSceneKeysQuery.mockReturnValue({ currentData: SCENE_KEYS, isLoading: false })
    mockUseSelection.mockImplementation(() => selection)
    mockUseStorageExport.mockImplementation(() => ({ startExport, busy: false, errorKey: null, clearError }))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when nothing is selected', () => {
    it('should not render a download selected button', () => {
      render(<ScenePage />)
      expect(screen.queryByRole('button', { name: /component\.storage\.common\.download_(all|selected)/ })).not.toBeInTheDocument()
    })

    it('should not render a bulk delete action', () => {
      render(<ScenePage />)
      expect(screen.queryByRole('button', { name: /component\.storage\.common\.delete_(all|selected)/ })).not.toBeInTheDocument()
    })

    it('should not render a clear all button', () => {
      render(<ScenePage />)
      expect(screen.queryByRole('button', { name: 'component.storage.scene_page.clear_all' })).not.toBeInTheDocument()
    })

    it('should select over the loaded keys', () => {
      render(<ScenePage />)
      expect(mockUseSelection).toHaveBeenCalledWith(['a', 'b', 'feedback-1.csv'])
    })

    it('should register the idle export with the leave guard', () => {
      render(<ScenePage />)
      expect(mockUseLeaveGuard).toHaveBeenCalledWith(false)
    })
  })

  describe('when the header checkbox is clicked', () => {
    it('should toggle the whole selection', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)
      await user.click(screen.getByRole('checkbox', { name: 'select all rows' }))
      expect(selection.toggleAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('when a row checkbox is clicked', () => {
    it('should toggle that key', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)
      await user.click(screen.getByRole('checkbox', { name: 'select a' }))
      expect(selection.toggle).toHaveBeenCalledWith('a')
    })
  })

  describe('when rows a and b are selected and CSV is chosen', () => {
    beforeEach(() => {
      const selected = new Set(['a', 'b'])
      selection = buildSelection({ selected, count: 2, isSelected: id => selected.has(id) })
    })

    it('should save the loaded rows instantly as storage-export.csv without an export job', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)

      await user.click(screen.getByRole('button', { name: 'component.storage.common.download_selected 2' }))
      await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_csv' }))

      expect(mockTriggerBlobDownload).toHaveBeenCalledTimes(1)
      const [blob, filename] = mockTriggerBlobDownload.mock.calls[0] as [Blob, string]
      expect(filename).toBe('storage-export.csv')
      expect(await readBlob(blob)).toBe(buildExportFile('csv', [SCENE_KEYS[0], SCENE_KEYS[1]], []).content)
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SELECTION_DOWNLOAD_SUCCESS, { format: 'csv', count: 2 })
      expect(startExport).not.toHaveBeenCalled()
    })
  })

  describe('when every key is selected and JSON is chosen', () => {
    beforeEach(() => {
      selection = buildSelection({
        selected: new Set(SCENE_KEYS.map(({ key }) => key)),
        allSelected: true,
        count: 3,
        isSelected: () => true
      })
    })

    it('should start an export job for all world keys and save nothing instantly', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)

      await user.click(screen.getByRole('button', { name: 'component.storage.common.download_all' }))
      await user.click(screen.getByRole('menuitem', { name: 'component.storage.common.format_json' }))

      expect(startExport).toHaveBeenCalledWith({ players: { addresses: [] } }, 'json')
      expect(mockTriggerBlobDownload).not.toHaveBeenCalled()
    })
  })

  describe('when an export job is running', () => {
    beforeEach(() => {
      selection = buildSelection({ selected: new Set(['a']), count: 1, isSelected: id => id === 'a' })
      mockUseStorageExport.mockImplementation(() => ({ startExport, busy: true, errorKey: null, clearError }))
    })

    it('should render the download selected button as busy', () => {
      render(<ScenePage />)
      expect(screen.getByRole('button', { name: 'component.storage.common.download_selected 1' })).toHaveAttribute('aria-disabled', 'true')
    })

    it('should register the busy export with the leave guard', () => {
      render(<ScenePage />)
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
      render(<ScenePage />)
      expect(screen.getByRole('alert')).toHaveTextContent('component.storage.errors.export_failed')
    })

    it('should clear the error when the alert is closed', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)
      await user.click(within(screen.getByRole('alert')).getByRole('button', { name: 'close alert' }))
      expect(clearError).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the keys are loading', () => {
    beforeEach(() => {
      mockUseListSceneKeysQuery.mockReturnValue({ currentData: undefined, isLoading: true })
    })

    it('should render a progress indicator', () => {
      render(<ScenePage />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when a key is downloaded and the value loads', () => {
    beforeEach(() => {
      mockGetSceneValue.mockReturnValue({ unwrap: () => Promise.resolve({ key: 'feedback-1.csv', value: 'id,rating\n1,5' }) })
    })

    it('should save the value as a file named after the key', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)

      await user.click(screen.getByRole('button', { name: 'download feedback-1.csv' }))

      await waitFor(() => expect(mockTriggerBlobDownload).toHaveBeenCalledTimes(1))
      const [blob, filename] = mockTriggerBlobDownload.mock.calls[0] as [Blob, string]
      expect(filename).toBe('feedback-1.csv')
      expect(blob.type).toBe('text/csv')
      expect(blob.size).toBe('id,rating\n1,5'.length)
      expect(mockGetSceneValue).toHaveBeenCalledWith({
        identity: undefined,
        realm: 'flutterecho.dcl.eth',
        position: '0,-1',
        key: 'feedback-1.csv'
      })
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DOWNLOAD_SUCCESS)
    })
  })

  describe('when a key is downloaded and the value fails to load', () => {
    beforeEach(() => {
      mockGetSceneValue.mockReturnValue({ unwrap: () => Promise.reject({ status: 403 }) })
    })

    it('should not save a file and should track the failure', async () => {
      const user = userEvent.setup()
      render(<ScenePage />)

      await user.click(screen.getByRole('button', { name: 'download feedback-1.csv' }))

      await waitFor(() => expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DOWNLOAD_FAILURE, { errorStatus: 403 }))
      expect(mockTriggerBlobDownload).not.toHaveBeenCalled()
    })
  })

  describe.each([
    ['add', 'component.storage.scene_page.add', 'add dialog'],
    ['edit', 'edit a', 'edit dialog']
  ])('when the %s dialog is opened', (_name, opener, dialogName) => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<ScenePage />)
      await user.click(screen.getByRole('button', { name: opener }))
    })

    it('should close the dialog when it is dismissed', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'close' }))
      expect(screen.queryByRole('dialog', { name: dialogName })).not.toBeInTheDocument()
    })

    it('should track a successful save', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'succeed' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_SET_SUCCESS)
    })

    it('should track a failed save with its status', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'fail' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_SET_FAILURE, { errorStatus: 500 })
    })
  })

  describe('when a key delete is requested', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<ScenePage />)
      await user.click(screen.getByRole('button', { name: 'delete a' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockDeleteSceneValue.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.scene_page.delete_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should delete the key in the current scope', () => {
        expect(mockDeleteSceneValue).toHaveBeenCalledWith({ identity: undefined, realm: 'flutterecho.dcl.eth', position: '0,-1', key: 'a' })
      })

      it('should track the success and close the dialog', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DELETE_SUCCESS)
        expect(screen.queryByRole('dialog', { name: 'component.storage.scene_page.delete_dialog.title' })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and fails', () => {
      beforeEach(async () => {
        mockDeleteSceneValue.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.scene_page.delete_dialog.title' })).getByRole('button', {
            name: 'confirm'
          })
        )
      })

      it('should track the failure', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DELETE_FAILURE)
      })
    })

    describe('and it is cancelled', () => {
      beforeEach(async () => {
        await user.click(
          within(screen.getByRole('dialog', { name: 'component.storage.scene_page.delete_dialog.title' })).getByRole('button', {
            name: 'cancel'
          })
        )
      })

      it('should close the dialog without deleting', () => {
        expect(screen.queryByRole('dialog', { name: 'component.storage.scene_page.delete_dialog.title' })).not.toBeInTheDocument()
        expect(mockDeleteSceneValue).not.toHaveBeenCalled()
      })
    })
  })

  describe('when keys a and b are selected and the bulk delete is requested', () => {
    let user: ReturnType<typeof userEvent.setup>
    const DIALOG = 'component.storage.common.delete_selected_dialog.title'

    beforeEach(async () => {
      const selected = new Set(['a', 'b'])
      selection = buildSelection({ selected, count: 2, isSelected: id => selected.has(id) })
      user = userEvent.setup()
      render(<ScenePage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.common.delete_selected 2' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockDeleteSceneValue.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should delete each selected key in the current scope', () => {
        expect(mockDeleteSceneValue.mock.calls).toEqual([
          [{ identity: undefined, realm: 'flutterecho.dcl.eth', position: '0,-1', key: 'a' }],
          [{ identity: undefined, realm: 'flutterecho.dcl.eth', position: '0,-1', key: 'b' }]
        ])
      })

      it('should not clear the whole scene', () => {
        expect(mockClearScene).not.toHaveBeenCalled()
      })

      it('should track the success with the deleted count', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DELETE_SUCCESS, { count: 2 })
      })

      it('should clear the selection and close the dialog', () => {
        expect(selection.clear).toHaveBeenCalledTimes(1)
        expect(screen.queryByRole('dialog', { name: DIALOG })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and a delete fails', () => {
      beforeEach(async () => {
        mockDeleteSceneValue.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should track the failure with the attempted count', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DELETE_FAILURE, { count: 2 })
      })
    })

    describe('and it is cancelled', () => {
      beforeEach(async () => {
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'cancel' }))
      })

      it('should close the dialog without deleting', () => {
        expect(screen.queryByRole('dialog', { name: DIALOG })).not.toBeInTheDocument()
        expect(mockDeleteSceneValue).not.toHaveBeenCalled()
      })
    })
  })

  describe('when every key is selected and the bulk delete is requested', () => {
    let user: ReturnType<typeof userEvent.setup>
    const DIALOG = 'component.storage.scene_page.clear_dialog.title'

    beforeEach(async () => {
      selection = buildSelection({
        selected: new Set(SCENE_KEYS.map(({ key }) => key)),
        allSelected: true,
        count: 3,
        isSelected: () => true
      })
      user = userEvent.setup()
      render(<ScenePage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.common.delete_all' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockClearScene.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should clear the scene in the current scope', () => {
        expect(mockClearScene).toHaveBeenCalledWith({ identity: undefined, realm: 'flutterecho.dcl.eth', position: '0,-1' })
      })

      it('should not delete key by key', () => {
        expect(mockDeleteSceneValue).not.toHaveBeenCalled()
      })

      it('should track the success and close the dialog', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_CLEAR_SUCCESS)
        expect(screen.queryByRole('dialog', { name: DIALOG })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and fails', () => {
      beforeEach(async () => {
        mockClearScene.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should track the failure', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_CLEAR_FAILURE)
      })
    })
  })
})
