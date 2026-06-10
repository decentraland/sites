import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { SegmentEvent } from '../../../modules/segment.types'

const mockListSceneKeysQuery = jest.fn()
const mockDeleteScene = jest.fn()
const mockClearScene = jest.fn()
const mockTrack = jest.fn()

jest.mock('../../../features/storage', () => ({
  getStorageErrorStatus: (error: unknown) => (error as { status?: string })?.status,
  useListSceneKeysQuery: (...args: unknown[]) => mockListSceneKeysQuery(...args),
  useDeleteSceneValueMutation: () => [mockDeleteScene],
  useClearSceneMutation: () => [mockClearScene]
}))
jest.mock('../../../hooks/adapters/useFormatMessage', () => ({ useFormatMessage: () => (id: string) => id }))
jest.mock('../../../hooks/useStorageTrack', () => ({ useStorageTrack: () => mockTrack }))
jest.mock('../ConfirmDialog', () => ({
  ConfirmDialog: ({ open, onConfirm, onCancel, title }: { open: boolean; onConfirm: () => void; onCancel: () => void; title: string }) =>
    open ? (
      <div>
        <button onClick={onConfirm}>{`confirm:${title}`}</button>
        <button onClick={onCancel}>{`cancel:${title}`}</button>
      </div>
    ) : null
}))
jest.mock('../SceneDialogs', () => ({
  SceneAddDialog: ({
    open,
    onError,
    onSuccess,
    onClose
  }: {
    open: boolean
    onError: (e: unknown) => void
    onSuccess: () => void
    onClose: () => void
  }) =>
    open ? (
      <div>
        <button onClick={() => onError({ status: 418 })}>scene-add-error</button>
        <button onClick={onSuccess}>scene-add-success</button>
        <button onClick={onClose}>scene-add-close</button>
      </div>
    ) : null,
  SceneEditDialog: ({
    keyName,
    onError,
    onSuccess,
    onClose
  }: {
    keyName: string
    onError: (e: unknown) => void
    onSuccess: () => void
    onClose: () => void
  }) => (
    <div>
      <span>{`scene-edit-dialog:${keyName}`}</span>
      <button onClick={() => onError({})}>scene-edit-error</button>
      <button onClick={onSuccess}>scene-edit-success</button>
      <button onClick={onClose}>scene-edit-close</button>
    </div>
  )
}))
jest.mock('../KeyTable', () => ({
  KeyTable: ({ keys, onEdit, onDelete }: { keys: string[]; onEdit: (k: string) => void; onDelete: (k: string) => void }) => (
    <div>
      <span>{`key-table:${keys.length}`}</span>
      <button onClick={() => onEdit('FOO')}>edit-foo</button>
      <button onClick={() => onDelete('BAR')}>delete-bar</button>
    </div>
  )
}))
jest.mock('decentraland-ui2', () => jest.requireActual('../../../__test-utils__/creatorsUi2Mock'))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SceneManager } = require('./SceneManager') as typeof import('./SceneManager')

const identity = {} as AuthIdentity
const scope = { identity, realm: 'w.dcl.eth', position: '0,0' }

describe('SceneManager', () => {
  beforeEach(() => {
    mockListSceneKeysQuery.mockReturnValue({ data: ['A', 'B'], isLoading: false })
    mockDeleteScene.mockReturnValue({ unwrap: () => Promise.resolve() })
    mockClearScene.mockReturnValue({ unwrap: () => Promise.resolve() })
  })
  afterEach(() => jest.resetAllMocks())

  describe('when keys are loading', () => {
    it('should render the progress spinner instead of the table', () => {
      mockListSceneKeysQuery.mockReturnValue({ data: undefined, isLoading: true })
      render(<SceneManager {...scope} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.queryByText(/key-table/)).not.toBeInTheDocument()
    })
  })

  describe('when keys are present', () => {
    it('should render the key table and the clear-all action', () => {
      render(<SceneManager {...scope} />)
      expect(screen.getByText('key-table:2')).toBeInTheDocument()
      expect(screen.getByText('component.storage.scene_page.clear_all')).toBeInTheDocument()
    })
  })

  describe('when there are no keys', () => {
    it('should hide the clear-all action', () => {
      mockListSceneKeysQuery.mockReturnValue({ data: [], isLoading: false })
      render(<SceneManager {...scope} />)
      expect(screen.queryByText('component.storage.scene_page.clear_all')).not.toBeInTheDocument()
    })
  })

  describe('when deleting a key', () => {
    it('should call the delete mutation and track success', async () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('delete-bar'))
      fireEvent.click(screen.getByText('confirm:component.storage.scene_page.delete_dialog.title'))
      await waitFor(() => expect(mockDeleteScene).toHaveBeenCalledWith({ identity, realm: 'w.dcl.eth', position: '0,0', key: 'BAR' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DELETE_SUCCESS)
    })

    it('should track failure when the delete mutation rejects', async () => {
      mockDeleteScene.mockReturnValue({ unwrap: () => Promise.reject(new Error('boom')) })
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('delete-bar'))
      fireEvent.click(screen.getByText('confirm:component.storage.scene_page.delete_dialog.title'))
      await waitFor(() => expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_DELETE_FAILURE))
    })
  })

  describe('when clearing all keys', () => {
    it('should call the clear mutation and track success', async () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('component.storage.scene_page.clear_all'))
      fireEvent.click(screen.getByText('confirm:component.storage.scene_page.clear_dialog.title'))
      await waitFor(() => expect(mockClearScene).toHaveBeenCalledWith({ identity, realm: 'w.dcl.eth', position: '0,0' }))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_CLEAR_SUCCESS)
    })

    it('should track failure when the clear mutation rejects', async () => {
      mockClearScene.mockReturnValue({ unwrap: () => Promise.reject(new Error('boom')) })
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('component.storage.scene_page.clear_all'))
      fireEvent.click(screen.getByText('confirm:component.storage.scene_page.clear_dialog.title'))
      await waitFor(() => expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_CLEAR_FAILURE))
    })
  })

  describe('when opening the add dialog', () => {
    it('should track a set-failure with the mapped error status', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('component.storage.scene_page.add'))
      fireEvent.click(screen.getByText('scene-add-error'))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_SET_FAILURE, { errorStatus: 418 })
    })

    it('should track a set-success', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('component.storage.scene_page.add'))
      fireEvent.click(screen.getByText('scene-add-success'))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_SET_SUCCESS)
    })
  })

  describe('when editing a key', () => {
    it('should open the edit dialog and track unknown error status when none provided', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('edit-foo'))
      expect(screen.getByText('scene-edit-dialog:FOO')).toBeInTheDocument()
      fireEvent.click(screen.getByText('scene-edit-error'))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_SET_FAILURE, { errorStatus: 'unknown' })
    })

    it('should track a set-success from the edit dialog', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('edit-foo'))
      fireEvent.click(screen.getByText('scene-edit-success'))
      expect(mockTrack).toHaveBeenCalledWith(SegmentEvent.STORAGE_SCENE_SET_SUCCESS)
    })
  })

  describe('when cancelling the delete dialog', () => {
    it('should close the dialog without calling the mutation', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('delete-bar'))
      fireEvent.click(screen.getByText('cancel:component.storage.scene_page.delete_dialog.title'))
      expect(screen.queryByText('confirm:component.storage.scene_page.delete_dialog.title')).not.toBeInTheDocument()
      expect(mockDeleteScene).not.toHaveBeenCalled()
    })
  })

  describe('when cancelling the clear-all dialog', () => {
    it('should close the dialog without calling the mutation', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('component.storage.scene_page.clear_all'))
      fireEvent.click(screen.getByText('cancel:component.storage.scene_page.clear_dialog.title'))
      expect(screen.queryByText('confirm:component.storage.scene_page.clear_dialog.title')).not.toBeInTheDocument()
      expect(mockClearScene).not.toHaveBeenCalled()
    })
  })

  describe('when closing the add and edit dialogs', () => {
    it('should close the add dialog', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('component.storage.scene_page.add'))
      fireEvent.click(screen.getByText('scene-add-close'))
      expect(screen.queryByText('scene-add-success')).not.toBeInTheDocument()
    })

    it('should close the edit dialog', () => {
      render(<SceneManager {...scope} />)
      fireEvent.click(screen.getByText('edit-foo'))
      fireEvent.click(screen.getByText('scene-edit-close'))
      expect(screen.queryByText('scene-edit-dialog:FOO')).not.toBeInTheDocument()
    })
  })

  describe('when there is no identity', () => {
    it('should skip the list query', () => {
      render(<SceneManager identity={undefined} realm={null} position={null} />)
      expect(mockListSceneKeysQuery.mock.calls[0][1]).toEqual({ skip: true })
    })
  })
})
