import { act, renderHook } from '@testing-library/react'
import { useScrollParallax } from './useScrollParallax'

const PROPERTY = '--offset'

type MotionQuery = { matches: boolean; addEventListener: jest.Mock; removeEventListener: jest.Mock }

const mountWithElement = (top: number, speed = 0.25, limit = 1000) => {
  const element = document.createElement('section')
  element.getBoundingClientRect = jest.fn(() => ({ top }) as DOMRect)
  const hook = renderHook(() => {
    const ref = useScrollParallax<HTMLElement>(PROPERTY, speed, limit)
    // Attach the element before the effect runs, as React does when the ref is on a node.
    ;(ref as { current: HTMLElement | null }).current = element
    return ref
  })
  return { element, ...hook }
}

describe('useScrollParallax', () => {
  let motionQuery: MotionQuery
  let frameCallbacks: FrameRequestCallback[]

  beforeEach(() => {
    motionQuery = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }
    window.matchMedia = jest.fn(() => motionQuery) as unknown as typeof window.matchMedia
    frameCallbacks = []
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    })
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('when the element mounts', () => {
    it('should write the scaled scroll offset to the custom property', () => {
      const { element } = mountWithElement(200)

      expect(element.style.getPropertyValue(PROPERTY)).toBe('-50px')
    })
  })

  describe('when the page scrolls', () => {
    it('should update the offset on the next animation frame', () => {
      const { element } = mountWithElement(200)
      ;(element.getBoundingClientRect as jest.Mock).mockReturnValue({ top: -400 })

      act(() => {
        window.dispatchEvent(new Event('scroll'))
        window.dispatchEvent(new Event('scroll'))
      })
      expect(frameCallbacks).toHaveLength(1)

      act(() => frameCallbacks[0](0))
      expect(element.style.getPropertyValue(PROPERTY)).toBe('100px')
    })
  })

  describe('when the scroll offset goes past the limit', () => {
    it('should clamp it so the artwork keeps covering the element', () => {
      const { element } = mountWithElement(-2000, 0.25, 80)

      expect(element.style.getPropertyValue(PROPERTY)).toBe('80px')
    })
  })

  describe('when the visitor prefers reduced motion', () => {
    it('should keep the offset at zero', () => {
      motionQuery.matches = true
      const { element } = mountWithElement(200)

      expect(element.style.getPropertyValue(PROPERTY)).toBe('0px')
    })
  })

  describe('when the element unmounts', () => {
    it('should remove the custom property and stop listening', () => {
      const removeListener = jest.spyOn(window, 'removeEventListener')
      const { element, unmount } = mountWithElement(200)

      unmount()

      expect(element.style.getPropertyValue(PROPERTY)).toBe('')
      expect(removeListener).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(motionQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })
  })

  describe('when no element is attached', () => {
    it('should do nothing', () => {
      const addListener = jest.spyOn(window, 'addEventListener')
      renderHook(() => useScrollParallax<HTMLElement>(PROPERTY, 0.25, 80))

      expect(addListener).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything())
    })
  })
})
