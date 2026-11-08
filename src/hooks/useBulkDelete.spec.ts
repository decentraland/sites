import { act, renderHook } from '@testing-library/react'
import { deleteSelection } from '../features/storage'
import { useBulkDelete } from './useBulkDelete'
import type { Selection } from './useSelection'

jest.mock('../features/storage', () => ({ deleteSelection: jest.fn() }))

const deleteSelectionMock = deleteSelection as jest.Mock

const makeSelection = (over: Partial<Selection> = {}): Selection =>
  ({
    selected: new Set(['a', 'b']),
    allSelected: false,
    count: 2,
    isSelected: () => false,
    toggle: jest.fn(),
    toggleAll: jest.fn(),
    toggleVisible: jest.fn(),
    clear: jest.fn(),
    ...over
  }) as unknown as Selection

describe('useBulkDelete', () => {
  let selection: Selection
  let deleteOne: jest.Mock
  let clearAll: jest.Mock
  let onResult: jest.Mock

  beforeEach(() => {
    selection = makeSelection()
    deleteOne = jest.fn().mockResolvedValue(undefined)
    clearAll = jest.fn().mockResolvedValue(undefined)
    onResult = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const renderBulkDelete = () => renderHook(() => useBulkDelete({ selection, deleteOne, clearAll, onResult }))

  describe('when confirm is clicked twice before the first finishes', () => {
    it('should run the delete only once', async () => {
      let resolveDelete: (ids: string[]) => void = () => undefined
      deleteSelectionMock.mockReturnValue(
        new Promise<string[]>(resolve => {
          resolveDelete = resolve
        })
      )
      const { result } = renderBulkDelete()

      await act(async () => {
        void result.current.confirm()
        void result.current.confirm()
      })
      expect(deleteSelectionMock).toHaveBeenCalledTimes(1)

      await act(async () => resolveDelete([]))
    })
  })

  describe('when every delete succeeds', () => {
    beforeEach(async () => {
      deleteSelectionMock.mockResolvedValue([])
    })

    it('should clear the selection, report success and close with no error', async () => {
      const { result } = renderBulkDelete()
      await act(async () => {
        await result.current.confirm()
      })

      expect(selection.clear).toHaveBeenCalledTimes(1)
      expect(onResult).toHaveBeenCalledWith({ allSelected: false, ok: true, count: 2 })
      expect(result.current.errorKey).toBeNull()
      expect(result.current.open).toBe(false)
    })
  })

  describe('when some deletes fail', () => {
    beforeEach(() => {
      deleteSelectionMock.mockResolvedValue(['b'])
    })

    it('should keep the selection, report failure and surface an error', async () => {
      const { result } = renderBulkDelete()
      await act(async () => {
        await result.current.confirm()
      })

      expect(selection.clear).not.toHaveBeenCalled()
      expect(onResult).toHaveBeenCalledWith({ allSelected: false, ok: false, count: 2 })
      expect(result.current.errorKey).toBe('component.storage.errors.bulk_delete_failed')
    })
  })

  describe('when everything is selected and the clear fails', () => {
    beforeEach(() => {
      selection = makeSelection({ allSelected: true })
      deleteSelectionMock.mockResolvedValue(['a', 'b'])
    })

    it('should report an all-scope failure and keep the selection', async () => {
      const { result } = renderBulkDelete()
      await act(async () => {
        await result.current.confirm()
      })

      expect(onResult).toHaveBeenCalledWith({ allSelected: true, ok: false, count: 2 })
      expect(selection.clear).not.toHaveBeenCalled()
    })
  })

  describe('when cancel is called', () => {
    it('should close the dialog', async () => {
      const { result } = renderBulkDelete()
      act(() => result.current.request())
      expect(result.current.open).toBe(true)

      act(() => result.current.cancel())
      expect(result.current.open).toBe(false)
    })
  })

  describe('when the error is dismissed', () => {
    beforeEach(() => {
      deleteSelectionMock.mockResolvedValue(['b'])
    })

    it('should clear the error key', async () => {
      const { result } = renderBulkDelete()
      await act(async () => {
        await result.current.confirm()
      })
      expect(result.current.errorKey).not.toBeNull()

      act(() => result.current.clearError())
      expect(result.current.errorKey).toBeNull()
    })
  })
})
