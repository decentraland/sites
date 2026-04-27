import { skipToken } from '@reduxjs/toolkit/query/react'
import { act, renderHook } from '@testing-library/react'
import { createMockEvent } from '../__test-utils__/factories'
import { useEventDeepLink } from './useEventDeepLink'

const mockSetSearchParams = jest.fn()
const mockUseSearchParams = jest.fn()
const mockUseGetEventByIdQuery = jest.fn()
const mockUseAuthIdentity = jest.fn()

jest.mock('react-router-dom', () => ({
  useSearchParams: () => mockUseSearchParams()
}))

jest.mock('../features/whats-on-events', () => ({
  useGetEventByIdQuery: (...args: unknown[]) => mockUseGetEventByIdQuery(...args)
}))

jest.mock('./useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentity()
}))

describe('useEventDeepLink', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no id query param is present', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams(''), mockSetSearchParams])
      mockUseAuthIdentity.mockReturnValue({ identity: undefined })
      mockUseGetEventByIdQuery.mockReturnValue({ data: undefined })
    })

    it('should pass skipToken to useGetEventByIdQuery so the request never fires', () => {
      renderHook(() => useEventDeepLink())

      expect(mockUseGetEventByIdQuery).toHaveBeenCalledWith(skipToken)
    })

    it('should expose isOpen=false and modalData=null', () => {
      const { result } = renderHook(() => useEventDeepLink())

      expect(result.current.isOpen).toBe(false)
      expect(result.current.modalData).toBeNull()
    })
  })

  describe('when an id query param is present', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue([new URLSearchParams('id=ev-42'), mockSetSearchParams])
      mockUseAuthIdentity.mockReturnValue({ identity: undefined })
    })

    describe('and the event has been fetched successfully', () => {
      beforeEach(() => {
        const event = createMockEvent({ id: 'ev-42', name: 'Deep linked' })
        mockUseGetEventByIdQuery.mockReturnValue({ data: event })
      })

      it('should request the event by id with the current identity', () => {
        renderHook(() => useEventDeepLink())

        expect(mockUseGetEventByIdQuery).toHaveBeenCalledWith({ eventId: 'ev-42', identity: undefined })
      })

      it('should expose isOpen=true and the normalized modal data', () => {
        const { result } = renderHook(() => useEventDeepLink())

        expect(result.current.isOpen).toBe(true)
        expect(result.current.modalData?.id).toBe('ev-42')
      })

      describe('and closeDeepLink is called', () => {
        it('should drop only the id param from the URL via replace navigation', () => {
          mockUseSearchParams.mockReturnValue([new URLSearchParams('id=ev-42&filter=mine'), mockSetSearchParams])
          const { result } = renderHook(() => useEventDeepLink())

          act(() => {
            result.current.closeDeepLink()
          })

          expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
          const [updater, options] = mockSetSearchParams.mock.calls[0]
          const next = updater(new URLSearchParams('id=ev-42&filter=mine'))
          expect(next.get('id')).toBeNull()
          expect(next.get('filter')).toBe('mine')
          expect(options).toEqual({ replace: true })
        })
      })
    })

    describe('and the event has not been fetched yet', () => {
      beforeEach(() => {
        mockUseGetEventByIdQuery.mockReturnValue({ data: undefined })
      })

      it('should keep isOpen=false until the data resolves', () => {
        const { result } = renderHook(() => useEventDeepLink())

        expect(result.current.isOpen).toBe(false)
        expect(result.current.modalData).toBeNull()
      })
    })

    describe('and the event request fails with a 404 (invalid id)', () => {
      beforeEach(() => {
        mockUseGetEventByIdQuery.mockReturnValue({ data: undefined, error: { status: 404, data: null } })
      })

      it('should strip the id param from the URL so the broken deep link does not persist on reload', () => {
        renderHook(() => useEventDeepLink())

        expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
        const [, options] = mockSetSearchParams.mock.calls[0]
        expect(options).toEqual({ replace: true })
      })
    })

    describe('and the event request fails transiently (5xx or network error)', () => {
      it('should keep the id param in the URL so a transient API blip does not destroy the deep link', () => {
        mockUseGetEventByIdQuery.mockReturnValue({ data: undefined, error: { status: 503, data: null } })

        renderHook(() => useEventDeepLink())

        expect(mockSetSearchParams).not.toHaveBeenCalled()
      })

      it('should also keep the id when the error is a fetch error without a numeric status', () => {
        mockUseGetEventByIdQuery.mockReturnValue({ data: undefined, error: { status: 'FETCH_ERROR', error: 'network down' } })

        renderHook(() => useEventDeepLink())

        expect(mockSetSearchParams).not.toHaveBeenCalled()
      })
    })
  })
})
