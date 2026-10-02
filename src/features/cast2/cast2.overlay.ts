import type { MediaRect, OverlayLayout, OverlayRect, OverlaySize } from './cast2.types'

const RATIO: Record<OverlaySize, number> = { small: 0.15, large: 0.25 }
const MARGIN_RATIO = 0.02

const even = (n: number): number => n - (n % 2)

/** Clamps `value` into `[min, max]`. */
const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

/** Pixel rectangle of the camera bubble on a `width`×`height` slide, mirroring the presentation bot's geometry. */
function overlayRect(layout: OverlayLayout, width: number, height: number): OverlayRect {
  const margin = Math.round(width * MARGIN_RATIO)
  const d = even(Math.min(Math.round(width * RATIO[layout.size]), height - 2 * margin))
  const cx = clamp(layout.x * width, margin + d / 2, width - margin - d / 2)
  const cy = clamp(layout.y * height, margin + d / 2, height - margin - d / 2)
  return { left: even(Math.round(cx - d / 2)), top: even(Math.round(cy - d / 2)), d }
}

/** Rectangle a `mediaWidth`×`mediaHeight` media occupies inside a box under `object-fit: contain`. */
function containRect(boxWidth: number, boxHeight: number, mediaWidth: number, mediaHeight: number): MediaRect {
  if (mediaWidth === 0 || mediaHeight === 0) return { left: 0, top: 0, width: boxWidth, height: boxHeight }
  const scale = Math.min(boxWidth / mediaWidth, boxHeight / mediaHeight)
  const width = mediaWidth * scale
  const height = mediaHeight * scale
  return { left: (boxWidth - width) / 2, top: (boxHeight - height) / 2, width, height }
}

export { clamp, containRect, overlayRect }
