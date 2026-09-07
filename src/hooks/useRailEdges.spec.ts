import { act, renderHook } from '@testing-library/react'
import { useRailEdges } from './useRailEdges'

type Observed = { target: Element; trigger: () => void }
let observed: Observed[] = []

class MockResizeObserver {
  private readonly callback: () => void
  constructor(callback: () => void) {
    this.callback = callback
  }
  observe(target: Element) {
    observed.push({ target, trigger: this.callback })
  }
  disconnect() {
    observed = observed.filter(entry => entry.trigger !== this.callback)
  }
}

function makeRail({ clientWidth, scrollWidth, scrollLeft = 0 }: { clientWidth: number; scrollWidth: number; scrollLeft?: number }) {
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth })
  Object.defineProperty(el, 'scrollWidth', { configurable: true, writable: true, value: scrollWidth })
  el.scrollLeft = scrollLeft
  return el
}

describe('when tracking which side of a rail still has content', () => {
  beforeEach(() => {
    observed = []
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof globalThis.ResizeObserver
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the rail is wider than its scrollport', () => {
    it('should report content to the right and none to the left', () => {
      const { result } = renderHook(() => useRailEdges(4))

      act(() => {
        result.current.attachRail(makeRail({ clientWidth: 400, scrollWidth: 1200 }))
      })

      expect(result.current.canScrollRight).toBe(true)
      expect(result.current.canScrollLeft).toBe(false)
    })

    it('should flip once it is scrolled to the end', () => {
      const { result } = renderHook(() => useRailEdges(4))
      const rail = makeRail({ clientWidth: 400, scrollWidth: 1200 })

      act(() => {
        result.current.attachRail(rail)
      })
      act(() => {
        rail.scrollLeft = 800
        rail.dispatchEvent(new Event('scroll'))
      })

      expect(result.current.canScrollLeft).toBe(true)
      expect(result.current.canScrollRight).toBe(false)
    })

    it('should ignore a sub-pixel remainder rather than claim there is more to reach', () => {
      const { result } = renderHook(() => useRailEdges(4))

      act(() => {
        result.current.attachRail(makeRail({ clientWidth: 400, scrollWidth: 401 }))
      })

      expect(result.current.canScrollRight).toBe(false)
    })
  })

  describe('and every item already fits', () => {
    it('should report no content on either side', () => {
      const { result } = renderHook(() => useRailEdges(2))

      act(() => {
        result.current.attachRail(makeRail({ clientWidth: 1200, scrollWidth: 1200 }))
      })

      expect(result.current.canScrollLeft).toBe(false)
      expect(result.current.canScrollRight).toBe(false)
    })
  })

  describe('and the rail gains an item after it mounted', () => {
    // A rail that grows from three cards to four grows its scrollWidth while its
    // own box stays the same size, so a ResizeObserver never reports it.
    it('should re-measure when the item count changes', () => {
      const rail = makeRail({ clientWidth: 400, scrollWidth: 400 })
      const { result, rerender } = renderHook(({ count }: { count: number }) => useRailEdges(count), {
        initialProps: { count: 3 }
      })

      act(() => {
        result.current.attachRail(rail)
      })
      expect(result.current.canScrollRight).toBe(false)

      Object.defineProperty(rail, 'scrollWidth', { configurable: true, value: 1200 })
      rerender({ count: 4 })

      expect(result.current.canScrollRight).toBe(true)
    })
  })

  describe('and the viewport changes size', () => {
    it('should re-measure from the observer', () => {
      const rail = makeRail({ clientWidth: 1200, scrollWidth: 1200 })
      const { result } = renderHook(() => useRailEdges(4))

      act(() => {
        result.current.attachRail(rail)
      })
      expect(result.current.canScrollRight).toBe(false)

      Object.defineProperty(rail, 'scrollWidth', { configurable: true, value: 2000 })
      act(() => {
        observed.forEach(entry => entry.trigger())
      })

      expect(result.current.canScrollRight).toBe(true)
    })
  })

  describe('and the caller tracks more than the edges', () => {
    it('should run its callback off the same measurement instead of a second observer', () => {
      const onMeasure = jest.fn()
      const rail = makeRail({ clientWidth: 400, scrollWidth: 1200 })
      const { result } = renderHook(() => useRailEdges(4, { onMeasure }))

      act(() => {
        result.current.attachRail(rail)
      })
      expect(onMeasure).toHaveBeenCalledTimes(1)

      act(() => {
        rail.scrollLeft = 200
        rail.dispatchEvent(new Event('scroll'))
      })
      expect(onMeasure).toHaveBeenCalledTimes(2)

      act(() => {
        observed.forEach(entry => entry.trigger())
      })
      expect(onMeasure).toHaveBeenCalledTimes(3)
    })
  })

  describe('and the rail unmounts', () => {
    it('should stop observing it', () => {
      const { result } = renderHook(() => useRailEdges(4))

      act(() => {
        result.current.attachRail(makeRail({ clientWidth: 400, scrollWidth: 1200 }))
      })
      expect(observed).toHaveLength(1)

      act(() => {
        result.current.attachRail(null)
      })

      expect(observed).toHaveLength(0)
      expect(result.current.railRef.current).toBeNull()
    })
  })
})
