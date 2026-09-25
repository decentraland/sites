import { useCallback, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { MediaRect } from '../features/cast2/cast2.types'
import type { NormalizedPointerDrag, NormalizedPointerDragOptions } from './useNormalizedPointerDrag.types'

const DRAG_THRESHOLD_PX = 3

const clampUnit = (value: number): number => Math.min(Math.max(value, 0), 1)

/**
 * Reports a pointer drag as `[0, 1]` fractions of a client-space rectangle.
 * @param getBounds - Target rectangle in client coordinates, read on every event.
 * @param options - Drag callbacks; a press released without moving calls `onCancel`.
 */
function useNormalizedPointerDrag(getBounds: () => MediaRect | null, options: NormalizedPointerDragOptions): NormalizedPointerDrag {
  const [isDragging, setIsDragging] = useState(false)
  const press = useRef({ isDown: false, moved: false, lastX: 0, lastY: 0, startClientX: 0, startClientY: 0 })
  const latest = useRef({ getBounds, options })
  latest.current = { getBounds, options }

  const normalize = useCallback((event: PointerEvent<HTMLElement>) => {
    const bounds = latest.current.getBounds()
    if (!bounds) return null
    return {
      x: clampUnit((event.clientX - bounds.left) / bounds.width),
      y: clampUnit((event.clientY - bounds.top) / bounds.height)
    }
  }, [])

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button > 0) return
      const point = normalize(event)
      if (!point) return
      press.current = {
        isDown: true,
        moved: false,
        lastX: point.x,
        lastY: point.y,
        startClientX: event.clientX,
        startClientY: event.clientY
      }
      latest.current.options.onStart(point.x, point.y)
    },
    [normalize]
  )

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const current = press.current
      if (!current.isDown) return
      if (event.buttons === 0) {
        current.isDown = false
        setIsDragging(false)
        latest.current.options.onCancel()
        return
      }
      if (!current.moved && Math.hypot(event.clientX - current.startClientX, event.clientY - current.startClientY) > DRAG_THRESHOLD_PX) {
        current.moved = true
        setIsDragging(true)
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      if (!current.moved) return
      const point = normalize(event)
      if (!point) return
      current.lastX = point.x
      current.lastY = point.y
      latest.current.options.onMove(point.x, point.y)
    },
    [normalize]
  )

  const onPointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const current = press.current
    if (!current.isDown) return
    current.isDown = false
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (current.moved) latest.current.options.onEnd(current.lastX, current.lastY)
    else latest.current.options.onCancel()
  }, [])

  return { isDragging, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } }
}

export { useNormalizedPointerDrag }
