import { act, renderHook } from '@testing-library/react'
import { createMockEvent } from '../__test-utils__/factories'
import { useEventDetailModal } from './useEventDetailModal'

const mockNavigate = jest.fn()
const mockAuth = jest.fn()
jest.mock('./useAuthIdentity', () => ({ useAuthIdentity: () => mockAuth() }))

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

describe('when using the event detail modal', () => {
  beforeEach(() => {
    mockAuth.mockReturnValue({ address: '0xaaa', hasValidIdentity: true })
  })
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

  describe('and the account changes with a modal open', () => {
    let hook: ReturnType<typeof renderUseEventDetailModal>

    beforeEach(() => {
      hook = renderUseEventDetailModal()
      act(() => {
        hook.result.current.openEventDetailModal(createMockEvent({ id: 'private-event' }))
      })
    })

    it('should clear the event immediately and not resurrect it when the first wallet returns', () => {
      mockAuth.mockReturnValue({ address: '0xbbb', hasValidIdentity: true })
      hook.rerender()
      expect(hook.result.current.activeEvent).toBeNull()
      expect(hook.result.current.modalData).toBeNull()
      mockAuth.mockReturnValue({ address: '0xaaa', hasValidIdentity: true })
      hook.rerender()
      expect(hook.result.current.activeEvent).toBeNull()
      act(() => {
        hook.result.current.editActiveEvent()
      })
      expect(mockNavigate).not.toHaveBeenCalled()
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
        expect(mockNavigate).toHaveBeenCalledWith('/events/edit-event/ev-42', {
          state: { event, account: '0xaaa', session: expect.any(Number) }
        })
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
