import { act, renderHook, waitFor } from '@testing-library/react'
import { useDeleteHangout } from './useDeleteHangout'

const mockDeleteEvent = jest.fn()
const mockUnwrap = jest.fn()

jest.mock('../features/events', () => ({
  useDeleteEventMutation: () => [mockDeleteEvent, { isLoading: false }]
}))

jest.mock('./useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => (values ? `${key}:${JSON.stringify(values)}` : key)
  })
}))

const mockedAuthIdentity = jest.requireMock('./useAuthIdentity').useAuthIdentity as jest.Mock

const IDENTITY = { ephemeralIdentity: {} }

describe('useDeleteHangout', () => {
  beforeEach(() => {
    mockedAuthIdentity.mockReturnValue({ identity: IDENTITY })
    mockDeleteEvent.mockReturnValue({ unwrap: mockUnwrap })
    mockUnwrap.mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when nothing has been requested yet', () => {
    it('should start with the confirm modal closed and no feedback', () => {
      const { result } = renderHook(() => useDeleteHangout())
      expect(result.current.isConfirmOpen).toBe(false)
      expect(result.current.feedback).toBeNull()
    })
  })

  describe('when requestDelete is called', () => {
    it('should open the confirmation modal', () => {
      const { result } = renderHook(() => useDeleteHangout())
      act(() => result.current.requestDelete({ id: 'ev-1', name: 'My Hangout' }))
      expect(result.current.isConfirmOpen).toBe(true)
    })
  })

  describe('when confirmDelete succeeds', () => {
    it('should call the mutation, show the success toast, close the modal, and notify onDeleted', async () => {
      const onDeleted = jest.fn()
      const { result } = renderHook(() => useDeleteHangout({ onDeleted }))
      act(() => result.current.requestDelete({ id: 'ev-1', name: 'My Hangout' }))
      await act(async () => {
        await result.current.confirmDelete()
      })
      expect(mockDeleteEvent).toHaveBeenCalledWith({ eventId: 'ev-1', identity: IDENTITY })
      expect(onDeleted).toHaveBeenCalledTimes(1)
      expect(result.current.isConfirmOpen).toBe(false)
      expect(result.current.feedback).toEqual({
        title: 'event_detail.delete_modal.toast_title',
        message: 'event_detail.delete_modal.toast_description:{"name":"My Hangout"}',
        severity: 'success'
      })
    })
  })

  describe('when confirmDelete fails', () => {
    beforeEach(() => {
      mockUnwrap.mockRejectedValue(new Error('boom'))
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('should surface a generic error toast and keep the modal open', async () => {
      const onDeleted = jest.fn()
      const { result } = renderHook(() => useDeleteHangout({ onDeleted }))
      act(() => result.current.requestDelete({ id: 'ev-1', name: 'My Hangout' }))
      await act(async () => {
        await result.current.confirmDelete()
      })
      expect(onDeleted).not.toHaveBeenCalled()
      expect(result.current.feedback).toEqual({ message: 'event_detail.delete_modal.error', severity: 'error' })
    })
  })

  describe('when confirmDelete is called without a pending target', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('should not call the mutation', async () => {
      const { result } = renderHook(() => useDeleteHangout())
      await act(async () => {
        await result.current.confirmDelete()
      })
      expect(mockDeleteEvent).not.toHaveBeenCalled()
    })
  })

  describe('when there is no identity', () => {
    beforeEach(() => {
      mockedAuthIdentity.mockReturnValue({ identity: undefined })
      jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    it('should not call the mutation', async () => {
      const { result } = renderHook(() => useDeleteHangout())
      act(() => result.current.requestDelete({ id: 'ev-1', name: 'My Hangout' }))
      await act(async () => {
        await result.current.confirmDelete()
      })
      expect(mockDeleteEvent).not.toHaveBeenCalled()
    })
  })

  describe('when clearFeedback is called', () => {
    it('should reset the feedback to null', async () => {
      const { result } = renderHook(() => useDeleteHangout())
      act(() => result.current.requestDelete({ id: 'ev-1', name: 'My Hangout' }))
      await act(async () => {
        await result.current.confirmDelete()
      })
      await waitFor(() => expect(result.current.feedback).not.toBeNull())
      act(() => result.current.clearFeedback())
      expect(result.current.feedback).toBeNull()
    })
  })

  describe('when closeConfirm is called', () => {
    it('should close the confirmation modal', () => {
      const { result } = renderHook(() => useDeleteHangout())
      act(() => result.current.requestDelete({ id: 'ev-1', name: 'My Hangout' }))
      act(() => result.current.closeConfirm())
      expect(result.current.isConfirmOpen).toBe(false)
    })
  })
})
