import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dialogMockFactory } from '../../components/storage/__test-utils__/dialogMocks'
import type { Selection } from '../../hooks/useSelection'
import { SegmentEvent } from '../../modules/segment.types'
import { EnvPage } from './EnvPage'

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

const mockDeleteEnv = jest.fn()
const mockClearEnv = jest.fn()
const mockUseListEnvKeysQuery = jest.fn()
const mockUseSelection = jest.fn()
const mockTrack = jest.fn()

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
jest.mock('@mui/icons-material/Delete', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/DeleteSweep', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/ArrowDropDown', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/Download', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('react-helmet-async', () => ({ Helmet: () => null }))

jest.mock('decentraland-ui2', () => ({
  ...dialogMockFactory(),
  Box: ({ children }: ChildrenProps) => <div>{children}</div>
}))

jest.mock('../../features/storage', () => ({
  deleteSelection: jest.requireActual('../../features/storage/storage.helpers').deleteSelection,
  getStorageErrorStatus: jest.requireActual('../../features/storage/storage.helpers').getStorageErrorStatus,
  useClearEnvMutation: () => [mockClearEnv],
  useDeleteEnvMutation: () => [mockDeleteEnv],
  useListEnvKeysQuery: () => mockUseListEnvKeysQuery()
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
jest.mock('../../components/storage/EnvDialogs', () => ({
  EnvAddDialog: mockFormDialog('add dialog'),
  EnvEditDialog: mockFormDialog('edit dialog')
}))
jest.mock('./shared.styled', () => ({
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
jest.mock('../../hooks/useStorageRedirect', () => ({ useStorageRedirect: jest.fn() }))
jest.mock('../../hooks/useStorageScope', () => ({
  useStorageScope: () => ({ realm: 'flutterecho.dcl.eth', position: '0,-1', blocked: false })
}))
jest.mock('../../hooks/useStorageTrack', () => ({ useStorageTrack: () => mockTrack }))

const ENV_KEYS = [{ key: 'API_KEY' }, { key: 'SECRET' }, { key: 'TOKEN' }]
const SCOPE = { identity: undefined, realm: 'flutterecho.dcl.eth', position: '0,-1' }

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

describe('EnvPage', () => {
  let selection: Selection

  beforeEach(() => {
    selection = buildSelection()
    mockUseListEnvKeysQuery.mockReturnValue({ currentData: ENV_KEYS, isLoading: false })
    mockUseSelection.mockImplementation(() => selection)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when nothing is selected', () => {
    it('should select over the loaded keys', () => {
      render(<EnvPage />)
      expect(mockUseSelection).toHaveBeenCalledWith(['API_KEY', 'SECRET', 'TOKEN'])
    })

    it('should not render a bulk delete action', () => {
      render(<EnvPage />)
      expect(screen.queryByRole('button', { name: /component\.storage\.common\.delete_(all|selected)/ })).not.toBeInTheDocument()
    })

    it('should not render a clear all button', () => {
      render(<EnvPage />)
      expect(screen.queryByRole('button', { name: 'component.storage.env_page.clear_all' })).not.toBeInTheDocument()
    })

    it('should not offer row downloads', () => {
      render(<EnvPage />)
      expect(screen.queryByRole('button', { name: 'download API_KEY' })).not.toBeInTheDocument()
    })
  })

  describe('when a row checkbox is clicked', () => {
    it('should toggle that key', async () => {
      const user = userEvent.setup()
      render(<EnvPage />)
      await user.click(screen.getByRole('checkbox', { name: 'select SECRET' }))
      expect(selection.toggle).toHaveBeenCalledWith('SECRET')
    })
  })

  describe('when the header checkbox is clicked', () => {
    it('should toggle the whole selection', async () => {
      const user = userEvent.setup()
      render(<EnvPage />)
      await user.click(screen.getByRole('checkbox', { name: 'select all rows' }))
      expect(selection.toggleAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the keys are loading', () => {
    beforeEach(() => {
      mockUseListEnvKeysQuery.mockReturnValue({ currentData: undefined, isLoading: true })
    })

    it('should render a progress indicator', () => {
      render(<EnvPage />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('when one key is selected', () => {
    beforeEach(() => {
      selection = buildSelection({ selected: new Set(['SECRET']), count: 1, isSelected: id => id === 'SECRET' })
    })

    it('should render the bulk delete action', () => {
      render(<EnvPage />)
      expect(screen.getByRole('button', { name: 'component.storage.common.delete_selected 1' })).toBeInTheDocument()
    })

    it('should not render a bulk download action', () => {
      render(<EnvPage />)
      expect(screen.queryByRole('button', { name: /component\.storage\.common\.download/ })).not.toBeInTheDocument()
    })
  })

  describe('when keys API_KEY and TOKEN are selected and the bulk delete is requested', () => {
    let user: ReturnType<typeof userEvent.setup>
    const DIALOG = 'component.storage.common.delete_selected_dialog.title'

    beforeEach(async () => {
      const selected = new Set(['API_KEY', 'TOKEN'])
      selection = buildSelection({ selected, count: 2, isSelected: id => selected.has(id) })
      user = userEvent.setup()
      render(<EnvPage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.common.delete_selected 2' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockDeleteEnv.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should delete each selected key in the current scope', () => {
        expect(mockDeleteEnv.mock.calls).toEqual([[{ ...SCOPE, key: 'API_KEY' }], [{ ...SCOPE, key: 'TOKEN' }]])
      })

      it('should not clear every key', () => {
        expect(mockClearEnv).not.toHaveBeenCalled()
      })

      it('should track the success with the deleted count', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_DELETE_SUCCESS, { count: 2 })
      })

      it('should clear the selection and close the dialog', () => {
        expect(selection.clear).toHaveBeenCalledTimes(1)
        expect(screen.queryByRole('dialog', { name: DIALOG })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and a delete fails', () => {
      beforeEach(async () => {
        mockDeleteEnv.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should track the failure with the attempted count', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_DELETE_FAILURE, { count: 2 })
      })
    })

    describe('and it is cancelled', () => {
      beforeEach(async () => {
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'cancel' }))
      })

      it('should close the dialog without deleting', () => {
        expect(screen.queryByRole('dialog', { name: DIALOG })).not.toBeInTheDocument()
        expect(mockDeleteEnv).not.toHaveBeenCalled()
      })
    })
  })

  describe('when every key is selected and the bulk delete is requested', () => {
    let user: ReturnType<typeof userEvent.setup>
    const DIALOG = 'component.storage.env_page.clear_dialog.title'

    beforeEach(async () => {
      selection = buildSelection({ selected: new Set(ENV_KEYS.map(({ key }) => key)), allSelected: true, count: 3, isSelected: () => true })
      user = userEvent.setup()
      render(<EnvPage />)
      await user.click(screen.getByRole('button', { name: 'component.storage.common.delete_all' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockClearEnv.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should clear every key in the current scope', () => {
        expect(mockClearEnv).toHaveBeenCalledWith(SCOPE)
      })

      it('should track the success and close the dialog', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_CLEAR_SUCCESS)
        expect(screen.queryByRole('dialog', { name: DIALOG })).not.toBeInTheDocument()
      })
    })

    describe('and it is confirmed and fails', () => {
      beforeEach(async () => {
        mockClearEnv.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should track the failure', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_CLEAR_FAILURE)
      })
    })
  })

  describe('when a row delete is requested', () => {
    let user: ReturnType<typeof userEvent.setup>
    const DIALOG = 'component.storage.env_page.delete_dialog.title'

    beforeEach(async () => {
      user = userEvent.setup()
      render(<EnvPage />)
      await user.click(screen.getByRole('button', { name: 'delete SECRET' }))
    })

    describe('and it is confirmed and succeeds', () => {
      beforeEach(async () => {
        mockDeleteEnv.mockReturnValue({ unwrap: () => Promise.resolve() })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should delete the key and track the success', () => {
        expect(mockDeleteEnv).toHaveBeenCalledWith({ ...SCOPE, key: 'SECRET' })
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_DELETE_SUCCESS)
      })
    })

    describe('and it is confirmed and fails', () => {
      beforeEach(async () => {
        mockDeleteEnv.mockReturnValue({ unwrap: () => Promise.reject({ status: 500 }) })
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'confirm' }))
      })

      it('should track the failure', () => {
        expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_DELETE_FAILURE)
      })
    })

    describe('and it is cancelled', () => {
      beforeEach(async () => {
        await user.click(within(screen.getByRole('dialog', { name: DIALOG })).getByRole('button', { name: 'cancel' }))
      })

      it('should close the dialog without deleting', () => {
        expect(mockDeleteEnv).not.toHaveBeenCalled()
      })
    })
  })

  describe.each([
    ['add', 'component.storage.env_page.add', 'add dialog'],
    ['edit', 'edit SECRET', 'edit dialog']
  ])('when the %s dialog is opened', (_name, opener, dialogName) => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<EnvPage />)
      await user.click(screen.getByRole('button', { name: opener }))
    })

    it('should close the dialog when it is dismissed', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'close' }))
      expect(screen.queryByRole('dialog', { name: dialogName })).not.toBeInTheDocument()
    })

    it('should track a successful save', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'succeed' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_SET_SUCCESS)
    })

    it('should track a failed save with its status', async () => {
      await user.click(within(screen.getByRole('dialog', { name: dialogName })).getByRole('button', { name: 'fail' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_SET_FAILURE, { errorStatus: 500 })
    })
  })
})
