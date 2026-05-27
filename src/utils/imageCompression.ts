const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4]
const OUTPUT_FORMATS_DEFAULT = ['image/webp', 'image/jpeg'] as const

type CompressOptions = {
  maxBytes: number
  maxWidth?: number
  maxHeight?: number
  preserveDimensions?: boolean
  mimeTypes?: readonly string[]
}

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

function computeTargetSize(
  sourceWidth: number,
  sourceHeight: number,
  { maxWidth, maxHeight, preserveDimensions }: CompressOptions
): { width: number; height: number } {
  if (preserveDimensions || (!maxWidth && !maxHeight)) {
    return { width: sourceWidth, height: sourceHeight }
  }
  const widthRatio = maxWidth ? maxWidth / sourceWidth : 1
  const heightRatio = maxHeight ? maxHeight / sourceHeight : 1
  const ratio = Math.min(1, widthRatio, heightRatio)
  return { width: Math.max(1, Math.round(sourceWidth * ratio)), height: Math.max(1, Math.round(sourceHeight * ratio)) }
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
  const { width, height } = computeTargetSize(loaded.width, loaded.height, options)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  try {
    ctx.drawImage(loaded.bitmap as CanvasImageSource, 0, 0, width, height)
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
