import { act, renderHook } from '@testing-library/react'
import { createMockEvent } from '../__test-utils__/factories'
import type { EventEntry } from '../features/whats-on-events/events.types'
import { useAdminEventDeepLink } from './useAdminEventDeepLink'

const mockSetSearchParams = jest.fn()
const mockUseSearchParams = jest.fn()

jest.mock('react-router-dom', () => ({
  useSearchParams: () => mockUseSearchParams()
}))

function setSearchString(search: string) {
  mockUseSearchParams.mockReturnValue([new URLSearchParams(search), mockSetSearchParams])
}

describe('useAdminEventDeepLink', () => {
  let onMatch: jest.Mock<void, [EventEntry]>

  beforeEach(() => {
    onMatch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no id query param is present', () => {
    beforeEach(() => {
      setSearchString('')
    })

    it('should not call onMatch even after events resolve', () => {
      const events = [createMockEvent({ id: 'ev-1' })]
      renderHook(() => useAdminEventDeepLink({ events, isLoaded: true, onMatch }))

      expect(onMatch).not.toHaveBeenCalled()
    })

    it('should not strip any params when closeDeepLink is invoked without an id', () => {
      const { result } = renderHook(() => useAdminEventDeepLink({ events: [], isLoaded: true, onMatch }))

      act(() => {
        result.current.closeDeepLink()
      })

      expect(mockSetSearchParams).not.toHaveBeenCalled()
    })
  })

  describe('when id is present but events have not loaded yet', () => {
    beforeEach(() => {
      setSearchString('id=ev-7')
    })

    it('should not call onMatch while isLoaded is false', () => {
      renderHook(() => useAdminEventDeepLink({ events: [], isLoaded: false, onMatch }))

      expect(onMatch).not.toHaveBeenCalled()
    })

    it('should not strip the id while loading so the link survives the initial fetch', () => {
      renderHook(() => useAdminEventDeepLink({ events: [], isLoaded: false, onMatch }))

      expect(mockSetSearchParams).not.toHaveBeenCalled()
    })
  })

  describe('when id is present and events are loaded with a match', () => {
    const matched = createMockEvent({ id: 'ev-7', name: 'Pending one' })
    const others = [createMockEvent({ id: 'ev-other', name: 'Other' }), matched]

    beforeEach(() => {
      setSearchString('id=ev-7&filter=mine')
    })

    it('should call onMatch with the matching event exactly once', () => {
      const { rerender } = renderHook(props => useAdminEventDeepLink(props), {
        initialProps: { events: others, isLoaded: true, onMatch }
      })

      expect(onMatch).toHaveBeenCalledTimes(1)
      expect(onMatch).toHaveBeenCalledWith(matched)

      rerender({ events: [...others], isLoaded: true, onMatch })

      expect(onMatch).toHaveBeenCalledTimes(1)
    })

    describe('and closeDeepLink is invoked', () => {
      it('should drop only the id param via replace navigation', () => {
        const { result } = renderHook(() => useAdminEventDeepLink({ events: others, isLoaded: true, onMatch }))

        act(() => {
          result.current.closeDeepLink()
        })

        expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
        const [updater, options] = mockSetSearchParams.mock.calls[0]
        const next = updater(new URLSearchParams('id=ev-7&filter=mine'))
        expect(next.get('id')).toBeNull()
        expect(next.get('filter')).toBe('mine')
        expect(options).toEqual({ replace: true })
      })
    })
  })

  describe('when id is present and events are loaded with no match', () => {
    beforeEach(() => {
      setSearchString('id=ev-missing')
    })

    it('should strip the id param silently and not call onMatch', () => {
      renderHook(() => useAdminEventDeepLink({ events: [createMockEvent({ id: 'ev-other' })], isLoaded: true, onMatch }))

      expect(onMatch).not.toHaveBeenCalled()
      expect(mockSetSearchParams).toHaveBeenCalledTimes(1)
      const [, options] = mockSetSearchParams.mock.calls[0]
      expect(options).toEqual({ replace: true })
    })
  })
})
