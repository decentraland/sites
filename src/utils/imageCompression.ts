const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4]
const OUTPUT_FORMATS_DEFAULT = ['image/webp', 'image/jpeg'] as const

type CompressOptions = {
  maxBytes: number
  // When set, the source is scaled to *cover* this box and center-cropped to its
  // exact aspect ratio (no stretching, no letterboxing). Output never upscales:
  // it caps at `cover.width × cover.height` and stays smaller for tiny sources.
  cover?: { width: number; height: number }
  // Forces keeping the source dimensions even if `cover` is provided. Used by the
  // vertical poster, whose 716×1814 size is validated downstream and must not be cropped.
  preserveDimensions?: boolean
  mimeTypes?: readonly string[]
}

type DrawRect = { sx: number; sy: number; sWidth: number; sHeight: number; dWidth: number; dHeight: number }

function isCompressibleType(type: string): boolean {
  return type === 'image/png' || type === 'image/jpeg'
}

function loadImageBitmap(file: File): Promise<{ width: number; height: number; bitmap: ImageBitmap | HTMLImageElement }> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).then(bitmap => ({ width: bitmap.width, height: bitmap.height, bitmap }))
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight, bitmap: img })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode_failed'))
    }
    img.src = url
  })
}

function computeDrawRect(sourceWidth: number, sourceHeight: number, { cover, preserveDimensions }: CompressOptions): DrawRect {
  if (!cover || preserveDimensions) {
    return { sx: 0, sy: 0, sWidth: sourceWidth, sHeight: sourceHeight, dWidth: sourceWidth, dHeight: sourceHeight }
  }
  const targetAspect = cover.width / cover.height
  const sourceAspect = sourceWidth / sourceHeight
  // Center-crop the overflow on the longer axis so the kept region matches the
  // target aspect ratio exactly.
  let cropWidth = sourceWidth
  let cropHeight = sourceHeight
  if (sourceAspect > targetAspect) {
    cropWidth = Math.round(sourceHeight * targetAspect)
  } else if (sourceAspect < targetAspect) {
    cropHeight = Math.round(sourceWidth / targetAspect)
  }
  const sx = Math.round((sourceWidth - cropWidth) / 2)
  const sy = Math.round((sourceHeight - cropHeight) / 2)
  // Scale the cropped region down to the target box; never upscale a small source.
  const scale = Math.min(1, cover.width / cropWidth)
  const dWidth = Math.max(1, Math.round(cropWidth * scale))
  const dHeight = Math.max(1, Math.round(cropHeight * scale))
  return { sx, sy, sWidth: cropWidth, sHeight: cropHeight, dWidth, dHeight }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), mimeType, quality)
  })
}

function extensionFor(mimeType: string): string {
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/jpeg') return '.jpg'
  return '.png'
}

function deriveCompressedName(originalName: string, mimeType: string): string {
  const dot = originalName.lastIndexOf('.')
  const stem = dot >= 0 ? originalName.slice(0, dot) : originalName
  return `${stem}${extensionFor(mimeType)}`
}

async function findBestBlob(
  canvas: HTMLCanvasElement,
  mimeTypes: readonly string[],
  maxBytes: number
): Promise<{ blob: Blob; mimeType: string } | null> {
  for (const mimeType of mimeTypes) {
    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, mimeType, quality)
      // Safari historically returns a `image/png` blob when asked for an unsupported
      // type. Skip when the encoder didn't honor the request so we move on to the
      // next format instead of returning oversized PNGs as if they were WebP.
      if (!blob || blob.type !== mimeType) break
      if (blob.size <= maxBytes) {
        return { blob, mimeType }
      }
    }
  }
  return null
}

async function compressImageFile(file: File, options: CompressOptions): Promise<File | null> {
  if (!isCompressibleType(file.type)) return null

  const formats = options.mimeTypes ?? OUTPUT_FORMATS_DEFAULT
  let loaded: { width: number; height: number; bitmap: ImageBitmap | HTMLImageElement }
  try {
    loaded = await loadImageBitmap(file)
  } catch {
    return null
  }
  const rect = computeDrawRect(loaded.width, loaded.height, options)

  const canvas = document.createElement('canvas')
  canvas.width = rect.dWidth
  canvas.height = rect.dHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try {
    ctx.drawImage(loaded.bitmap as CanvasImageSource, rect.sx, rect.sy, rect.sWidth, rect.sHeight, 0, 0, rect.dWidth, rect.dHeight)
  } catch {
    return null
  }

  if (typeof (loaded.bitmap as ImageBitmap).close === 'function') {
    ;(loaded.bitmap as ImageBitmap).close()
  }

  const best = await findBestBlob(canvas, formats, options.maxBytes)
  if (!best) return null
  return new File([best.blob], deriveCompressedName(file.name, best.mimeType), { type: best.mimeType, lastModified: Date.now() })
}

export { compressImageFile }
export type { CompressOptions }
