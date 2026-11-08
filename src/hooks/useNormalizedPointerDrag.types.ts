import type { PointerEvent } from 'react'

interface NormalizedPointerDragOptions {
  onStart: (x: number, y: number) => void
  onMove: (x: number, y: number) => void
  onEnd: (x: number, y: number) => void
  onCancel: () => void
}

type NormalizedPointerHandler = (event: PointerEvent<HTMLElement>) => void

interface NormalizedPointerDrag {
  isDragging: boolean
  handlers: {
    onPointerDown: NormalizedPointerHandler
    onPointerMove: NormalizedPointerHandler
    onPointerUp: NormalizedPointerHandler
    onPointerCancel: NormalizedPointerHandler
  }
}

export type { NormalizedPointerDrag, NormalizedPointerDragOptions }
