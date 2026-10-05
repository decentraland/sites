import type { PointerEvent } from 'react'
import { act, renderHook } from '@testing-library/react'
import { useNormalizedPointerDrag } from './useNormalizedPointerDrag'
import type { NormalizedPointerDragOptions } from './useNormalizedPointerDrag.types'

const BOUNDS = { left: 100, top: 50, width: 200, height: 100 }

const createTarget = () => ({
  setPointerCapture: jest.fn()
})

type Target = ReturnType<typeof createTarget>

const pointer = (target: Target, clientX: number, clientY: number, overrides: { button?: number; buttons?: number } = {}) =>
  ({
    clientX,
    clientY,
    button: overrides.button ?? 0,
    buttons: overrides.buttons ?? 1,
    pointerId: 7,
    currentTarget: target
  }) as unknown as PointerEvent<HTMLElement>

const createOptions = (): NormalizedPointerDragOptions => ({
  onStart: jest.fn(),
  onMove: jest.fn(),
  onEnd: jest.fn(),
  onCancel: jest.fn()
})

describe('useNormalizedPointerDrag', () => {
  let target: Target
  let options: NormalizedPointerDragOptions
  let getBounds: jest.Mock

  beforeEach(() => {
    target = createTarget()
    options = createOptions()
    getBounds = jest.fn(() => BOUNDS)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const renderDrag = () => renderHook(({ opts }) => useNormalizedPointerDrag(getBounds, opts), { initialProps: { opts: options } })

  describe('when the pointer goes down inside the bounds', () => {
    it('should report the normalized start point', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      expect(options.onStart).toHaveBeenCalledWith(0.25, 0.25)
    })

    it('should capture the pointer', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      expect(target.setPointerCapture).toHaveBeenCalledWith(7)
    })
  })

  describe('when the pointer moves past the threshold after going down', () => {
    it('should report the move and start dragging', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      expect(options.onMove).toHaveBeenCalledWith(0.5, 0.5)
      expect(result.current.isDragging).toBe(true)
    })
  })

  describe('when the pointer moves within the threshold', () => {
    it('should not report a move', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 152, 76)))
      expect(options.onMove).not.toHaveBeenCalled()
      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('when the pointer moves without a prior press', () => {
    it('should not report anything', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      act(() => result.current.handlers.onPointerUp(pointer(target, 200, 100)))
      expect(options.onMove).not.toHaveBeenCalled()
      expect(options.onEnd).not.toHaveBeenCalled()
      expect(options.onCancel).not.toHaveBeenCalled()
    })
  })

  describe('when the pointer moves beyond the bounds', () => {
    it('should clamp the reported position to 1', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 400, 400)))
      expect(options.onMove).toHaveBeenCalledWith(1, 1)
    })
  })

  describe('when the pointer is released after a drag', () => {
    it('should end with the last position and stop dragging', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      act(() => result.current.handlers.onPointerUp(pointer(target, 260, 140)))
      expect(options.onEnd).toHaveBeenCalledWith(0.5, 0.5)
      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('when the pointer is released without moving', () => {
    it('should cancel instead of ending', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerUp(pointer(target, 150, 75)))
      expect(options.onCancel).toHaveBeenCalledTimes(1)
      expect(options.onEnd).not.toHaveBeenCalled()
    })
  })

  describe('when a move arrives with no button held', () => {
    it('should cancel the lost press', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 210, 100, { buttons: 0 })))
      expect(options.onCancel).toHaveBeenCalledTimes(1)
      expect(options.onEnd).not.toHaveBeenCalled()
      expect(result.current.isDragging).toBe(false)
    })

    it('should ignore later hovers', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 210, 100, { buttons: 0 })))
      act(() => result.current.handlers.onPointerMove(pointer(target, 250, 120, { buttons: 0 })))
      expect(options.onMove).toHaveBeenCalledTimes(1)
    })
  })

  describe('when a secondary button goes down', () => {
    it('should not report anything', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75, { button: 2 })))
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      act(() => result.current.handlers.onPointerUp(pointer(target, 200, 100)))
      expect(options.onStart).not.toHaveBeenCalled()
      expect(options.onMove).not.toHaveBeenCalled()
      expect(options.onEnd).not.toHaveBeenCalled()
      expect(options.onCancel).not.toHaveBeenCalled()
    })
  })

  describe('when there are no bounds yet', () => {
    it('should ignore the press', () => {
      getBounds.mockReturnValue(null)
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      expect(options.onStart).not.toHaveBeenCalled()
    })
  })

  describe('when the pointer is cancelled after a move', () => {
    it('should end with the last position', () => {
      const { result } = renderDrag()
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      act(() => result.current.handlers.onPointerCancel(pointer(target, 0, 0)))
      expect(options.onEnd).toHaveBeenCalledWith(0.5, 0.5)
    })
  })

  describe('when the callbacks change between renders', () => {
    it('should call the latest callbacks', () => {
      const { result, rerender } = renderDrag()
      const next = createOptions()
      rerender({ opts: next })
      act(() => result.current.handlers.onPointerDown(pointer(target, 150, 75)))
      act(() => result.current.handlers.onPointerMove(pointer(target, 200, 100)))
      act(() => result.current.handlers.onPointerUp(pointer(target, 200, 100)))
      expect(next.onMove).toHaveBeenCalledWith(0.5, 0.5)
      expect(next.onEnd).toHaveBeenCalledWith(0.5, 0.5)
      expect(options.onMove).not.toHaveBeenCalled()
      expect(options.onEnd).not.toHaveBeenCalled()
    })
  })
})
