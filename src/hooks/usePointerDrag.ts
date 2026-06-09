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

/**
 * Drag-to-scroll a horizontally overflowing element with a pointer (mouse, touch
 * or pen). Uses pointer events + pointer capture so the drag keeps working when
 * it starts on a child (e.g. a card image) and across device emulation, disables
 * scroll-snap while dragging, and restores it on release so the strip snaps into
 * place. `isDragging` lets the caller suppress the click fired after a drag.
 */
function usePointerDrag(ref: RefObject<HTMLDivElement | null>): PointerDrag {
  const [isDragging, setIsDragging] = useState(false)
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      const el = ref.current
      // Ignore secondary buttons (right/middle); primary mouse, touch and pen are 0.
      if (!el || event.button > 0) return
      state.current = { isDown: true, startX: event.clientX, scrollLeft: el.scrollLeft }
      if (typeof el.setPointerCapture === 'function') el.setPointerCapture(event.pointerId)
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
      const walk = event.clientX - state.current.startX
      if (Math.abs(walk) > DRAG_THRESHOLD_PX) setIsDragging(true)
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
      el.style.scrollSnapType = ''
      if (typeof el.releasePointerCapture === 'function' && el.hasPointerCapture?.(event.pointerId)) {
        el.releasePointerCapture(event.pointerId)
      }
    },
    [ref]
  )

  // Stop the browser's native drag (e.g. ghost-dragging card images) so it does
  // not hijack the pointer-drag.
  const onDragStart = useCallback((event: SyntheticEvent) => event.preventDefault(), [])

  return { isDragging, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onDragStart } }
}

export { usePointerDrag }
