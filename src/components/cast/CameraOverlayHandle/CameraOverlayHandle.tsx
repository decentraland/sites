import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { clamp, containRect, overlayRect } from '../../../features/cast2/cast2.overlay'
import type { MeasuredMedia, OverlayLayout } from '../../../features/cast2/cast2.types'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { useNormalizedPointerDrag } from '../../../hooks/useNormalizedPointerDrag'
import { HandleCircle, HandleLayer } from './CameraOverlayHandle.styled'

const SEND_INTERVAL_MS = 100

const stopClick = (event: MouseEvent) => event.stopPropagation()

/** Draggable outline of the presenter's camera bubble, laid over the presentation tile's video. */
function CameraOverlayHandle() {
  const { t } = useCastTranslation()
  const { state, setOverlay } = usePresentation()
  const layerRef = useRef<HTMLDivElement>(null)
  const [media, setMedia] = useState<MeasuredMedia | null>(null)
  const [local, setLocal] = useState<Pick<OverlayLayout, 'x' | 'y'> | null>(null)
  const offsetRef = useRef({ dx: 0, dy: 0 })
  const lastSentRef = useRef(Number.NEGATIVE_INFINITY)

  useEffect(() => {
    const layer = layerRef.current
    const video = layer?.parentElement?.querySelector('video')
    if (!layer || !video) return
    const measure = () =>
      setMedia({
        ...containRect(layer.clientWidth, layer.clientHeight, video.videoWidth, video.videoHeight),
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(layer)
    video.addEventListener('loadedmetadata', measure)
    video.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      video.removeEventListener('loadedmetadata', measure)
      video.removeEventListener('resize', measure)
    }
  }, [])

  const measured = media && media.videoWidth > 0 && media.videoHeight > 0 ? media : null
  const displayed = local ? { ...state.overlay, ...local } : state.overlay
  const rect = measured ? overlayRect(displayed, measured.videoWidth, measured.videoHeight) : null

  const getBounds = () => {
    const layer = layerRef.current
    if (!layer || !measured || measured.width === 0 || measured.height === 0) return null
    const box = layer.getBoundingClientRect()
    return { left: box.left + measured.left, top: box.top + measured.top, width: measured.width, height: measured.height }
  }

  const withOffset = (x: number, y: number) => ({
    x: clamp(x + offsetRef.current.dx, 0, 1),
    y: clamp(y + offsetRef.current.dy, 0, 1)
  })

  const { isDragging, handlers } = useNormalizedPointerDrag(getBounds, {
    onStart: (x, y) => {
      if (!measured || !rect) return
      offsetRef.current = {
        dx: (rect.left + rect.d / 2) / measured.videoWidth - x,
        dy: (rect.top + rect.d / 2) / measured.videoHeight - y
      }
    },
    onMove: (x, y) => {
      const position = withOffset(x, y)
      setLocal(position)
      const now = Date.now()
      if (now - lastSentRef.current < SEND_INTERVAL_MS) return
      lastSentRef.current = now
      setOverlay(position)
    },
    onEnd: (x, y) => {
      setOverlay(withOffset(x, y))
      setLocal(null)
    },
    onCancel: () => setLocal(null)
  })

  const hint = t('streaming_controls.camera_overlay.drag_hint')
  const scale = measured ? measured.width / measured.videoWidth : 0

  return (
    <HandleLayer ref={layerRef}>
      {measured && rect ? (
        <HandleCircle
          type="button"
          aria-label={hint}
          title={hint}
          $left={measured.left + rect.left * scale}
          $top={measured.top + rect.top * scale}
          $size={rect.d * scale}
          $dragging={isDragging}
          onClick={stopClick}
          {...handlers}
        />
      ) : null}
    </HandleLayer>
  )
}

export { CameraOverlayHandle }
