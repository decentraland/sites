import { compressImageFile } from './imageCompression'

type ToBlobCallback = (blob: Blob | null) => void

const originalCreateImageBitmap = (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap
const originalCreateElement = document.createElement.bind(document)

type ToBlobImpl = (mimeType: string, quality: number) => Blob | null

function installCanvasMock(toBlobImpl: ToBlobImpl) {
  const drawImage = jest.fn()
  document.createElement = jest.fn(((tag: string) => {
    if (tag !== 'canvas') return originalCreateElement(tag)
    return {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (cb: ToBlobCallback, mimeType: string, quality: number) => {
        cb(toBlobImpl(mimeType, quality))
      }
    } as unknown as HTMLCanvasElement
  }) as typeof document.createElement)
  return { drawImage }
}

function installBitmapMock(width: number, height: number) {
  ;(globalThis as unknown as { createImageBitmap: (file: File) => Promise<ImageBitmap> }).createImageBitmap = jest.fn(() =>
    Promise.resolve({ width, height, close: jest.fn() } as unknown as ImageBitmap)
  )
}

function installBitmapFailureMock() {
  ;(globalThis as unknown as { createImageBitmap: (file: File) => Promise<ImageBitmap> }).createImageBitmap = jest.fn(() =>
    Promise.reject(new Error('decode_failed'))
  )
}

function makeBlob(size: number, type: string): Blob {
  return { size, type } as unknown as Blob
}

afterEach(() => {
  ;(globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap = originalCreateImageBitmap
  document.createElement = originalCreateElement
  jest.restoreAllMocks()
})

describe('compressImageFile', () => {
  describe('when the file is not a compressible type (animated GIF, BMP, etc.)', () => {
    it('should return null for image/gif so we never strip the animation silently', async () => {
      installBitmapMock(100, 100)
      installCanvasMock(() => makeBlob(100, 'image/webp'))
      const file = new File(['x'], 'a.gif', { type: 'image/gif' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).toBeNull()
    })

    it('should return null for unknown types like image/bmp', async () => {
      installBitmapMock(100, 100)
      installCanvasMock(() => makeBlob(100, 'image/webp'))
      const file = new File(['x'], 'a.bmp', { type: 'image/bmp' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).toBeNull()
    })
  })

  describe('when decoding the file fails', () => {
    it('should return null', async () => {
      installBitmapFailureMock()
      installCanvasMock(() => makeBlob(100, 'image/webp'))
      const file = new File(['x'], 'bad.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).toBeNull()
    })
  })

  describe('when WebP encoding succeeds within budget', () => {
    it('should return a File with the .webp extension and image/webp type', async () => {
      installBitmapMock(2000, 1000)
      installCanvasMock((mime, _quality) => (mime === 'image/webp' ? makeBlob(500, 'image/webp') : null))
      const file = new File(['x'], 'photo.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024, maxWidth: 1340, maxHeight: 670 })

      expect(result).not.toBeNull()
      expect(result!.type).toBe('image/webp')
      expect(result!.name).toBe('photo.webp')
    })
  })

  describe('when WebP is unsupported by the encoder', () => {
    it('should fall back to JPEG', async () => {
      installBitmapMock(1000, 1000)
      // Simulate Safari quirk: asked for WebP, encoder returns image/png instead.
      installCanvasMock(mime => {
        if (mime === 'image/webp') return makeBlob(800, 'image/png')
        if (mime === 'image/jpeg') return makeBlob(900, 'image/jpeg')
        return null
      })
      const file = new File(['x'], 'cover.jpeg', { type: 'image/jpeg' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).not.toBeNull()
      expect(result!.type).toBe('image/jpeg')
      expect(result!.name).toBe('cover.jpg')
    })
  })

  describe('when every quality step exceeds the budget', () => {
    it('should return null', async () => {
      installBitmapMock(1000, 1000)
      installCanvasMock((mime, quality) => makeBlob(quality < 0.5 ? 1500 : 2000, mime))
      const file = new File(['x'], 'huge.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).toBeNull()
    })
  })

  describe('when preserveDimensions is set', () => {
    it('should pass the source dimensions through without scaling', async () => {
      installBitmapMock(716, 1814)
      const blobsByMime: string[] = []
      installCanvasMock((mime, _quality) => {
        blobsByMime.push(mime)
        return makeBlob(400, mime)
      })
      const file = new File(['x'], 'vertical.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024, preserveDimensions: true })

      expect(result).not.toBeNull()
      expect(blobsByMime[0]).toBe('image/webp')
    })
  })

  describe('when no maxWidth or maxHeight is provided', () => {
    it('should keep source dimensions even without preserveDimensions flag', async () => {
      installBitmapMock(500, 500)
      installCanvasMock(mime => makeBlob(100, mime))
      const file = new File(['x'], 'square.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).not.toBeNull()
    })
  })

  describe('when the canvas 2D context is unavailable', () => {
    it('should return null', async () => {
      installBitmapMock(100, 100)
      document.createElement = jest.fn(((tag: string) => {
        if (tag !== 'canvas') return originalCreateElement(tag)
        return { width: 0, height: 0, getContext: () => null } as unknown as HTMLCanvasElement
      }) as typeof document.createElement)
      const file = new File(['x'], 'a.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).toBeNull()
    })
  })

  describe('when createImageBitmap is unavailable (legacy fallback path)', () => {
    const originalImage = global.Image

    beforeEach(() => {
      delete (globalThis as { createImageBitmap?: typeof createImageBitmap }).createImageBitmap
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: jest.fn(() => 'blob:fake') })
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: jest.fn() })
      class MockImage {
        public naturalWidth = 0
        public naturalHeight = 0
        public onload: (() => void) | null = null
        public onerror: (() => void) | null = null
        set src(_url: string) {
          setTimeout(() => {
            this.naturalWidth = 100
            this.naturalHeight = 100
            this.onload?.()
          }, 0)
        }
      }
      ;(global as unknown as { Image: unknown }).Image = MockImage
    })

    afterEach(() => {
      delete (URL as unknown as Record<string, unknown>).createObjectURL
      delete (URL as unknown as Record<string, unknown>).revokeObjectURL
      ;(global as unknown as { Image: unknown }).Image = originalImage
    })

    it('should still decode via <img> and compress successfully', async () => {
      installCanvasMock(mime => makeBlob(200, mime))
      const file = new File(['x'], 'legacy.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).not.toBeNull()
      expect(result!.type).toBe('image/webp')
    })

    it('should return null when the legacy <img> decoder errors', async () => {
      class FailingImage {
        public naturalWidth = 0
        public naturalHeight = 0
        public onload: (() => void) | null = null
        public onerror: (() => void) | null = null
        set src(_url: string) {
          setTimeout(() => this.onerror?.(), 0)
        }
      }
      ;(global as unknown as { Image: unknown }).Image = FailingImage
      installCanvasMock(mime => makeBlob(200, mime))
      const file = new File(['x'], 'broken.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).toBeNull()
    })
  })

  describe('when a non-jpeg / non-webp output mime is requested', () => {
    it('should still derive a sensible filename (defaults to .png)', async () => {
      installBitmapMock(100, 100)
      installCanvasMock(mime => makeBlob(100, mime))
      const file = new File(['x'], 'snapshot.jpeg', { type: 'image/jpeg' })

      const result = await compressImageFile(file, { maxBytes: 1024, mimeTypes: ['image/png'] })

      expect(result).not.toBeNull()
      expect(result!.name).toBe('snapshot.png')
      expect(result!.type).toBe('image/png')
    })
  })

  describe('when drawImage throws (tainted canvas)', () => {
    it('should return null', async () => {
      installBitmapMock(100, 100)
      document.createElement = jest.fn(((tag: string) => {
        if (tag !== 'canvas') return originalCreateElement(tag)
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            drawImage: () => {
              throw new Error('tainted')
            }
          }),
          toBlob: (cb: ToBlobCallback) => cb(makeBlob(100, 'image/webp'))
        } as unknown as HTMLCanvasElement
      }) as typeof document.createElement)
      const file = new File(['x'], 'a.png', { type: 'image/png' })

      const result = await compressImageFile(file, { maxBytes: 1024 })

      expect(result).toBeNull()
    })
  })
})
