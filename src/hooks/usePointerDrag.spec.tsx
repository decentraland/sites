import { act, useRef } from 'react'
import { render, screen } from '@testing-library/react'
import { usePointerDrag } from './usePointerDrag'

function Harness({ onSettle }: { onSettle?: (element: HTMLDivElement) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { isDragging, handlers } = usePointerDrag(ref, { onSettle })
  return <div ref={ref} data-testid="track" data-dragging={isDragging} {...handlers} />
}

// jsdom does not populate clientX/button on synthetic PointerEvents, so dispatch
// a MouseEvent (which carries clientX) under a pointer-event type instead.
const firePointer = (el: HTMLElement, type: string, clientX: number) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 })
  act(() => {
    el.dispatchEvent(event)
  })
  return event
}

describe('usePointerDrag', () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = jest.fn()
    HTMLElement.prototype.releasePointerCapture = jest.fn()
    HTMLElement.prototype.hasPointerCapture = jest.fn(() => true)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should scroll on every pointerMove after a pointerDown', () => {
    const setSpy = jest.spyOn(HTMLElement.prototype, 'scrollLeft', 'set')
    try {
      render(<Harness />)
      const track = screen.getByTestId('track')
      const before = setSpy.mock.calls.length
      firePointer(track, 'pointerdown', 100)
      firePointer(track, 'pointermove', 200)
      firePointer(track, 'pointermove', 50)
      firePointer(track, 'pointerup', 50)
      expect(setSpy.mock.calls.length - before).toBe(2)
    } finally {
      setSpy.mockRestore()
    }
  })

  it('should not scroll on pointerMove without a prior pointerDown', () => {
    const setSpy = jest.spyOn(HTMLElement.prototype, 'scrollLeft', 'set')
    try {
      render(<Harness />)
      const track = screen.getByTestId('track')
      const before = setSpy.mock.calls.length
      firePointer(track, 'pointermove', 100)
      expect(setSpy.mock.calls.length).toBe(before)
    } finally {
      setSpy.mockRestore()
    }
  })

  it('should flag dragging once the pointer travels past the threshold', () => {
    render(<Harness />)
    const track = screen.getByTestId('track')
    firePointer(track, 'pointerdown', 100)
    expect(track).toHaveAttribute('data-dragging', 'false')
    firePointer(track, 'pointermove', 130)
    expect(track).toHaveAttribute('data-dragging', 'true')
  })

  it('should toggle scroll-snap off during the drag and restore it on release', () => {
    render(<Harness />)
    const track = screen.getByTestId('track')
    firePointer(track, 'pointerdown', 100)
    expect(track.style.scrollSnapType).toBe('none')
    firePointer(track, 'pointerup', 100)
    expect(track.style.scrollSnapType).toBe('')
  })

  it('should run onSettle on release so the caller can snap to a page', () => {
    const onSettle = jest.fn()
    render(<Harness onSettle={onSettle} />)
    const track = screen.getByTestId('track')
    firePointer(track, 'pointerdown', 100)
    firePointer(track, 'pointermove', 60)
    firePointer(track, 'pointerup', 60)
    expect(onSettle).toHaveBeenCalledWith(track)
  })

  it('should not run onSettle when releasing without a prior pointerDown', () => {
    const onSettle = jest.fn()
    render(<Harness onSettle={onSettle} />)
    const track = screen.getByTestId('track')
    firePointer(track, 'pointerup', 100)
    expect(onSettle).not.toHaveBeenCalled()
  })

  it('should ignore a pointerUp that was not preceded by a pointerDown', () => {
    render(<Harness />)
    const track = screen.getByTestId('track')
    // No-op: nothing to restore, must not throw.
    firePointer(track, 'pointerup', 100)
    expect(track.style.scrollSnapType).toBe('')
  })

  it('should prevent the native drag on dragStart', () => {
    render(<Harness />)
    const track = screen.getByTestId('track')
    const event = new Event('dragstart', { bubbles: true, cancelable: true })
    act(() => {
      track.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
  })
})
