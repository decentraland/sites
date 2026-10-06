import type { PointerEvent } from 'react'
import { act, renderHook } from '@testing-library/react'
import { useNormalizedPointerDrag } from './useNormalizedPointerDrag'
import type { NormalizedPointerDrag, NormalizedPointerDragOptions } from './useNormalizedPointerDrag.types'

const BOUNDS = { left: 100, top: 50, width: 200, height: 100 }

const createOptions = (): NormalizedPointerDragOptions => ({ onStart: jest.fn(), onMove: jest.fn(), onEnd: jest.fn(), onCancel: jest.fn() })

describe('when a pointer interacts with the drag surface', () => {
  let setPointerCapture: jest.Mock
  let getBounds: jest.Mock
  let options: NormalizedPointerDragOptions
  let result: { current: NormalizedPointerDrag }
  let rerender: (props: { opts: NormalizedPointerDragOptions }) => void

  const fire = (handler: keyof NormalizedPointerDrag['handlers'], clientX: number, clientY: number, button = 0, buttons = 1) => {
    const event = { clientX, clientY, button, buttons, pointerId: 7, currentTarget: { setPointerCapture } }
    act(() => result.current.handlers[handler](event as unknown as PointerEvent<HTMLElement>))
  }

  beforeEach(() => {
    setPointerCapture = jest.fn()
    getBounds = jest.fn().mockReturnValue(BOUNDS)
    options = createOptions()
    ;({ result, rerender } = renderHook(({ opts }) => useNormalizedPointerDrag(getBounds, opts), { initialProps: { opts: options } }))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and it goes down inside the bounds', () => {
    beforeEach(() => {
      fire('onPointerDown', 150, 75)
    })

    it('should report the normalized start point', () => {
      expect(options.onStart).toHaveBeenCalledWith(0.25, 0.25)
    })

    it('should capture the pointer', () => {
      expect(setPointerCapture).toHaveBeenCalledWith(7)
    })

    describe.each([
      ['within the drag threshold', 152, 76, []],
      ['beyond the bounds', 400, 400, [[1, 1]]]
    ])('and it moves %s', (_, clientX, clientY, moves) => {
      beforeEach(() => {
        fire('onPointerMove', clientX, clientY)
      })

      it(`should report the moves ${JSON.stringify(moves)}`, () => {
        expect((options.onMove as jest.Mock).mock.calls).toEqual(moves)
      })
    })

    describe('and it is released without moving', () => {
      beforeEach(() => {
        fire('onPointerUp', 150, 75)
      })

      it('should cancel instead of ending', () => {
        expect(options.onCancel).toHaveBeenCalledTimes(1)
        expect(options.onEnd).not.toHaveBeenCalled()
      })
    })

    describe('and it moves past the threshold', () => {
      beforeEach(() => {
        fire('onPointerMove', 200, 100)
      })

      it('should report the normalized move', () => {
        expect(options.onMove).toHaveBeenCalledWith(0.5, 0.5)
      })

      it('should start dragging', () => {
        expect(result.current.isDragging).toBe(true)
      })

      describe.each(['onPointerUp', 'onPointerCancel'] as const)('and %s ends the press', handler => {
        beforeEach(() => {
          fire(handler, 260, 140)
        })

        it('should end with the last moved position', () => {
          expect(options.onEnd).toHaveBeenCalledWith(0.5, 0.5)
        })

        it('should stop dragging', () => {
          expect(result.current.isDragging).toBe(false)
        })
      })

      describe('and later moves arrive with no button held', () => {
        beforeEach(() => {
          fire('onPointerMove', 210, 100, 0, 0)
          fire('onPointerMove', 250, 120, 0, 0)
        })

        it('should cancel the lost press once', () => {
          expect(options.onCancel).toHaveBeenCalledTimes(1)
        })

        it('should stop dragging', () => {
          expect(result.current.isDragging).toBe(false)
        })

        it('should ignore the hovers after the lost press', () => {
          expect(options.onMove).toHaveBeenCalledTimes(1)
        })
      })
    })
  })

  describe.each([
    ['a secondary button presses', 2, BOUNDS],
    ['a press lands before there are bounds', 0, null]
  ])('and %s', (_, button, bounds) => {
    beforeEach(() => {
      getBounds.mockReturnValue(bounds)
      fire('onPointerDown', 150, 75, button)
      fire('onPointerUp', 150, 75)
    })

    it('should ignore the press', () => {
      expect(options.onStart).not.toHaveBeenCalled()
      expect(options.onCancel).not.toHaveBeenCalled()
    })
  })

  describe('and the callbacks change before a drag', () => {
    let next: NormalizedPointerDragOptions

    beforeEach(() => {
      next = createOptions()
      rerender({ opts: next })
      fire('onPointerDown', 150, 75)
      fire('onPointerMove', 200, 100)
      fire('onPointerUp', 200, 100)
    })

    it('should end through the latest callbacks only', () => {
      expect(next.onEnd).toHaveBeenCalledWith(0.5, 0.5)
      expect(options.onEnd).not.toHaveBeenCalled()
    })
  })
})
