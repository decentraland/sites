import { act, cleanup, renderHook } from '@testing-library/react'
// eslint-disable-next-line import/no-unresolved
import { useLeaveGuard, useLeavePrompt } from './useLeaveGuard'

const renderGuard = (busy: boolean) => renderHook(({ busy: isBusy }) => useLeaveGuard(isBusy), { initialProps: { busy } })
const renderPrompt = () => renderHook(() => useLeavePrompt())

const dispatchBeforeUnload = (): Event => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event
}

describe('useLeaveGuard', () => {
  let go: jest.Mock

  beforeEach(() => {
    go = jest.fn()
  })

  afterEach(() => {
    cleanup()
    jest.resetAllMocks()
  })

  describe('when no instance is busy', () => {
    let prompt: ReturnType<typeof renderPrompt>

    beforeEach(() => {
      const guard = renderGuard(false)
      prompt = renderPrompt()
      act(() => guard.result.current(go))
    })

    it('should call go at once', () => {
      expect(go).toHaveBeenCalledTimes(1)
    })

    it('should keep the prompt closed', () => {
      expect(prompt.result.current.open).toBe(false)
    })

    it('should not prevent a beforeunload event', () => {
      expect(dispatchBeforeUnload().defaultPrevented).toBe(false)
    })
  })

  describe('when one instance is busy and a leave is requested', () => {
    let guard: ReturnType<typeof renderGuard>
    let prompt: ReturnType<typeof renderPrompt>

    beforeEach(() => {
      guard = renderGuard(true)
      prompt = renderPrompt()
      act(() => guard.result.current(go))
    })

    it('should not call go', () => {
      expect(go).not.toHaveBeenCalled()
    })

    it('should open the prompt', () => {
      expect(prompt.result.current.open).toBe(true)
    })

    describe('and stay is chosen', () => {
      beforeEach(() => {
        act(() => prompt.result.current.stay())
      })

      it('should close the prompt', () => {
        expect(prompt.result.current.open).toBe(false)
      })

      it('should not call go', () => {
        expect(go).not.toHaveBeenCalled()
      })
    })

    describe('and leave is chosen', () => {
      beforeEach(() => {
        act(() => prompt.result.current.leave())
      })

      it('should close the prompt', () => {
        expect(prompt.result.current.open).toBe(false)
      })

      it('should call go once', () => {
        expect(go).toHaveBeenCalledTimes(1)
      })

      describe('and leave is chosen again', () => {
        beforeEach(() => {
          act(() => prompt.result.current.leave())
        })

        it('should not call go a second time', () => {
          expect(go).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('and the instance becomes idle', () => {
      beforeEach(() => {
        guard.rerender({ busy: false })
      })

      it('should close the prompt', () => {
        expect(prompt.result.current.open).toBe(false)
      })

      it('should not call go', () => {
        expect(go).not.toHaveBeenCalled()
      })
    })

    describe('and the component using the prompt unmounts', () => {
      let nextPrompt: ReturnType<typeof renderPrompt>

      beforeEach(() => {
        prompt.unmount()
        nextPrompt = renderPrompt()
        act(() => nextPrompt.result.current.leave())
      })

      it('should mount the next prompt closed', () => {
        expect(nextPrompt.result.current.open).toBe(false)
      })

      it('should not call go from the next prompt', () => {
        expect(go).not.toHaveBeenCalled()
      })
    })
  })

  describe('when two instances are busy and a leave is requested', () => {
    let first: ReturnType<typeof renderGuard>
    let second: ReturnType<typeof renderGuard>
    let prompt: ReturnType<typeof renderPrompt>

    beforeEach(() => {
      first = renderGuard(true)
      second = renderGuard(true)
      prompt = renderPrompt()
      act(() => first.result.current(go))
    })

    describe('and only one becomes idle', () => {
      beforeEach(() => {
        first.rerender({ busy: false })
      })

      it('should keep the prompt open', () => {
        expect(prompt.result.current.open).toBe(true)
      })
    })

    describe('and both become idle', () => {
      beforeEach(() => {
        first.rerender({ busy: false })
        second.rerender({ busy: false })
      })

      it('should close the prompt', () => {
        expect(prompt.result.current.open).toBe(false)
      })

      it('should not call go', () => {
        expect(go).not.toHaveBeenCalled()
      })
    })
  })

  describe('when the busy instance becomes idle', () => {
    beforeEach(() => {
      const guard = renderGuard(true)
      guard.rerender({ busy: false })
      act(() => guard.result.current(go))
    })

    it('should call go at once on a later leave', () => {
      expect(go).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the busy instance unmounts', () => {
    beforeEach(() => {
      renderGuard(true).unmount()
      const guard = renderGuard(false)
      act(() => guard.result.current(go))
    })

    it('should call go at once on a later leave', () => {
      expect(go).toHaveBeenCalledTimes(1)
    })
  })

  describe('when leave is chosen with nothing pending', () => {
    let prompt: ReturnType<typeof renderPrompt>

    beforeEach(() => {
      renderGuard(true)
      prompt = renderPrompt()
      act(() => prompt.result.current.leave())
    })

    it('should keep the prompt closed', () => {
      expect(prompt.result.current.open).toBe(false)
    })
  })

  describe('when an instance is busy and the page is about to unload', () => {
    let guard: ReturnType<typeof renderGuard>

    beforeEach(() => {
      guard = renderGuard(true)
      renderPrompt()
    })

    it('should prevent the beforeunload event', () => {
      expect(dispatchBeforeUnload().defaultPrevented).toBe(true)
    })

    describe('and the instance becomes idle', () => {
      beforeEach(() => {
        guard.rerender({ busy: false })
      })

      it('should not prevent the beforeunload event', () => {
        expect(dispatchBeforeUnload().defaultPrevented).toBe(false)
      })
    })
  })
})
