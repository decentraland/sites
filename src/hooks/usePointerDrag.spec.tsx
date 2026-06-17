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
// `buttons` defaults to 1 on pointermove (primary button held, as during a drag).
const firePointer = (el: HTMLElement, type: string, clientX: number, buttons?: number) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    button: 0,
    buttons: buttons ?? (type === 'pointermove' ? 1 : 0)
  })
  act(() => {
    el.dispatchEvent(event)
  })
  return event
}

describe('usePointerDrag', () => {
  let setPointerCaptureMock: jest.Mock

  beforeEach(() => {
    setPointerCaptureMock = jest.fn()
    HTMLElement.prototype.setPointerCapture = setPointerCaptureMock
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

  it('should drop a press released outside the element instead of scrolling on hover', () => {
    // Below the threshold nothing is captured, so a press that leaves the track
    // and is released outside never delivers pointerup to it. The next hover
    // move (buttons === 0) must reset the press and restore scroll-snap
    // instead of dragging the carousel around with no button held.
    const setSpy = jest.spyOn(HTMLElement.prototype, 'scrollLeft', 'set')
    try {
      render(<Harness />)
      const track = screen.getByTestId('track')
      firePointer(track, 'pointerdown', 100)
      expect(track.style.scrollSnapType).toBe('none')
      // Pointer re-enters and moves with no button pressed (released outside).
      const before = setSpy.mock.calls.length
      firePointer(track, 'pointermove', 300, 0)
      expect(setSpy.mock.calls.length).toBe(before)
      expect(track.style.scrollSnapType).toBe('')
      expect(track).toHaveAttribute('data-dragging', 'false')
    } finally {
      setSpy.mockRestore()
    }
  })

  it('should not capture the pointer on pointerDown alone', () => {
    // Capturing on pointerdown retargets the derived click to the container
    // (per the Pointer Events spec), swallowing clicks on the cards inside.
    render(<Harness />)
    const track = screen.getByTestId('track')
    firePointer(track, 'pointerdown', 100)
    expect(setPointerCaptureMock).not.toHaveBeenCalled()
  })

  it('should capture the pointer only once the travel passes the drag threshold', () => {
    render(<Harness />)
    const track = screen.getByTestId('track')
    firePointer(track, 'pointerdown', 100)
    firePointer(track, 'pointermove', 103)
    expect(setPointerCaptureMock).not.toHaveBeenCalled()
    firePointer(track, 'pointermove', 130)
    firePointer(track, 'pointermove', 160)
    expect(setPointerCaptureMock).toHaveBeenCalledTimes(1)
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
