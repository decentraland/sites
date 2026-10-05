import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { clamp } from '../features/cast2/cast2.overlay'
import type { MediaRect } from '../features/cast2/cast2.types'
import type { NormalizedPointerDrag, NormalizedPointerDragOptions } from './useNormalizedPointerDrag.types'

const DRAG_THRESHOLD_PX = 3

/**
 * Reports a pointer drag as `[0, 1]` fractions of a client-space rectangle.
 * @param getBounds - Target rectangle in client coordinates, read on every event.
 * @param options - Drag callbacks; a press released without moving calls `onCancel`.
 */
function useNormalizedPointerDrag(getBounds: () => MediaRect | null, options: NormalizedPointerDragOptions): NormalizedPointerDrag {
  const [isDragging, setIsDragging] = useState(false)
  const press = useRef({ isDown: false, moved: false, lastX: 0, lastY: 0, startClientX: 0, startClientY: 0 })

  const normalize = (event: PointerEvent<HTMLElement>) => {
    const bounds = getBounds()
    if (!bounds) return null
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1)
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button > 0) return
    const point = normalize(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    press.current = { isDown: true, moved: false, lastX: point.x, lastY: point.y, startClientX: event.clientX, startClientY: event.clientY }
    options.onStart(point.x, point.y)
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = press.current
    if (!current.isDown) return
    if (event.buttons === 0) {
      current.isDown = false
      setIsDragging(false)
      options.onCancel()
      return
    }
    if (!current.moved && Math.hypot(event.clientX - current.startClientX, event.clientY - current.startClientY) > DRAG_THRESHOLD_PX) {
      current.moved = true
      setIsDragging(true)
    }
    if (!current.moved) return
    const point = normalize(event)
    if (!point) return
    current.lastX = point.x
    current.lastY = point.y
    options.onMove(point.x, point.y)
  }

  const onPointerUp = () => {
    const current = press.current
    if (!current.isDown) return
    current.isDown = false
    setIsDragging(false)
    if (current.moved) options.onEnd(current.lastX, current.lastY)
    else options.onCancel()
  }

  return { isDragging, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } }
}

export { useNormalizedPointerDrag }
