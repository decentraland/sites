import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

// Pad a decoded PNG to a target width/height with white pixels. Pixelmatch
// requires both inputs to be the same size; pages of different heights (the
// preview added or removed sections) would otherwise be unable to compare.
// We pad with opaque white so the "extra" region renders as obvious diff.
function padToSize(png, width, height) {
  if (png.width === width && png.height === height) return png
  const padded = new PNG({ width, height })
  padded.data.fill(0xff) // opaque white (RGBA = 255,255,255,255)
  for (let y = 0; y < png.height && y < height; y++) {
    const srcOffset = y * png.width * 4
    const dstOffset = y * width * 4
    const rowLen = Math.min(png.width, width) * 4
    png.data.copy(padded.data, dstOffset, srcOffset, srcOffset + rowLen)
  }
  return padded
}

/**
 * Pixel-diff two screenshot buffers. Returns the diff image as a PNG buffer
 * plus a percentage of differing pixels. Both inputs are expected to be PNG.
 *
 * Threshold (passed to pixelmatch) controls per-pixel sensitivity to color
 * difference; 0.1 ignores most antialiasing and gamma noise.
 */
export function diffPngBuffers(bufA, bufB, options = {}) {
  const a = PNG.sync.read(bufA)
  const b = PNG.sync.read(bufB)
  const width = Math.max(a.width, b.width)
  const height = Math.max(a.height, b.height)
  const paddedA = padToSize(a, width, height)
  const paddedB = padToSize(b, width, height)
  const diff = new PNG({ width, height })
  const changedPixels = pixelmatch(paddedA.data, paddedB.data, diff.data, width, height, {
    threshold: options.threshold ?? 0.1,
    includeAA: false,
    alpha: 0.4,
    diffColor: [255, 0, 0]
  })
  const totalPixels = width * height
  return {
    diffBuffer: PNG.sync.write(diff),
    changedPixels,
    totalPixels,
    percent: totalPixels === 0 ? 0 : (changedPixels / totalPixels) * 100,
    width,
    height
  }
}
