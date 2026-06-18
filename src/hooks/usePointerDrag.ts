import { useCallback, useRef, useState } from 'react'
import type { PointerEvent, RefObject, SyntheticEvent } from 'react'

// Pointer travel before a press is treated as a drag (and clicks are suppressed).
const DRAG_THRESHOLD_PX = 5

type PointerDragHandlers = {
  onPointerDown: (event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerUp: (event: PointerEvent) => void
  onPointerCancel: (event: PointerEvent) => void
  onDragStart: (event: SyntheticEvent) => void
}

type PointerDrag = {
  isDragging: boolean
  handlers: PointerDragHandlers
}

type PointerDragOptions = {
  // Called on release (while snap is still disabled) so the caller can land the
  // scroll on a page boundary; the CSS scroll-snap is restored right after.
  onSettle?: (element: HTMLDivElement) => void
}

/**
 * Drag-to-scroll a paged, horizontally overflowing element with a pointer (mouse,
 * touch or pen). Captures the pointer only after the travel passes the drag
 * threshold — never on the initial press — so a plain click still reaches the
 * cards inside (capture retargets the derived click to the container), while a
 * real drag keeps working when it leaves the element. Disables scroll-snap
 * while dragging. On release it runs the optional `onSettle`
 * (to snap to a page) and restores scroll-snap. `isDragging` lets the caller
 * suppress the click fired after a drag.
 */
function usePointerDrag(ref: RefObject<HTMLDivElement | null>, options?: PointerDragOptions): PointerDrag {
  const onSettle = options?.onSettle
  const [isDragging, setIsDragging] = useState(false)
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, captured: false })

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      const el = ref.current
      // Ignore secondary buttons (right/middle); primary mouse, touch and pen are 0.
      if (!el || event.button > 0) return
      state.current = { isDown: true, startX: event.clientX, scrollLeft: el.scrollLeft, captured: false }
      el.style.scrollSnapType = 'none'
      setIsDragging(false)
    },
    [ref]
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!state.current.isDown) return
      const el = ref.current
      if (!el) return
      // Below the threshold nothing is captured yet, so a press that leaves the
      // element and is released outside never delivers pointerup here. Detect
      // the lost press (no button held) and restore scroll-snap instead of
      // dragging the carousel around on a plain hover.
      if (event.buttons === 0) {
        state.current.isDown = false
        el.style.scrollSnapType = ''
        return
      }
      const walk = event.clientX - state.current.startX
      if (Math.abs(walk) > DRAG_THRESHOLD_PX) {
        setIsDragging(true)
        // Capture only once the press becomes a drag: capturing on pointerdown
        // retargets the derived click to the container (Pointer Events spec),
        // which swallows plain clicks on the cards inside.
        if (!state.current.captured && typeof el.setPointerCapture === 'function') {
          el.setPointerCapture(event.pointerId)
          state.current.captured = true
        }
      }
      el.scrollLeft = state.current.scrollLeft - walk
    },
    [ref]
  )

  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      if (!state.current.isDown) return
      state.current.isDown = false
      const el = ref.current
      if (!el) return
      // Land on a page boundary (while snap is still off, so it is not fought),
      // then restore scroll-snap.
      onSettle?.(el)
      el.style.scrollSnapType = ''
      if (typeof el.releasePointerCapture === 'function' && el.hasPointerCapture?.(event.pointerId)) {
        el.releasePointerCapture(event.pointerId)
      }
    },
    [ref, onSettle]
  )

  // Stop the browser's native drag (e.g. ghost-dragging card images) so it does
  // not hijack the pointer-drag.
  const onDragStart = useCallback((event: SyntheticEvent) => event.preventDefault(), [])

  return { isDragging, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDragStart } }
}

export { usePointerDrag }
