import { act, renderHook } from '@testing-library/react'
import { createMockEvent } from '../__test-utils__/factories'
import { useEventDetailModal } from './useEventDetailModal'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

describe('useEventDetailModal', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when initialized', () => {
    it('should expose no active modal data', () => {
      const { result } = renderHook(() => useEventDetailModal())

      expect(result.current.activeEvent).toBeNull()
      expect(result.current.modalData).toBeNull()
    })
  })

  describe('when an event is opened', () => {
    let event: ReturnType<typeof createMockEvent>
    let result: ReturnType<typeof renderUseEventDetailModal>['result']

    beforeEach(() => {
      event = createMockEvent({ id: 'ev-42', name: 'Edit me' })
      result = renderUseEventDetailModal().result
      act(() => {
        result.current.openEventDetailModal(event)
      })
    })

    it('should expose normalized modal data', () => {
      expect(result.current.modalData?.id).toBe('ev-42')
    })

    describe('and editActiveEvent is called', () => {
      beforeEach(() => {
        act(() => {
          result.current.editActiveEvent()
        })
      })

      it('should navigate to the edit route with the original event in location state', () => {
        expect(mockNavigate).toHaveBeenCalledWith('/whats-on/edit-event/ev-42', { state: { event } })
      })
    })

    describe('and the modal is closed', () => {
      beforeEach(() => {
        act(() => {
          result.current.closeEventDetailModal()
        })
      })

      it('should clear the active event', () => {
        expect(result.current.activeEvent).toBeNull()
      })
    })
  })
})

function renderUseEventDetailModal() {
  return renderHook(() => useEventDetailModal())
}
