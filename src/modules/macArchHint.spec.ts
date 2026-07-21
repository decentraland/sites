type MacArchHintModule = typeof import('./macArchHint')

describe('when resolving the mac architecture hint', () => {
  let getMacArchHint: MacArchHintModule['getMacArchHint']
  let attachMacArchHint: MacArchHintModule['attachMacArchHint']
  let getContextMock: jest.Mock
  const originalGetContextDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')

  const setUserAgent = (value: string) => {
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value })
  }

  const mockWebGl = (renderer: string | null) => {
    const gl = renderer
      ? {
          getExtension: jest.fn((name: string) => {
            if (name === 'WEBGL_debug_renderer_info') return { UNMASKED_RENDERER_WEBGL: 37446 }
            if (name === 'WEBGL_lose_context') return { loseContext: jest.fn() }
            return null
          }),
          getParameter: jest.fn(() => renderer)
        }
      : null
    getContextMock = jest.fn(() => gl)
    HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext
  }

  beforeEach(async () => {
    jest.resetModules()
    ;({ getMacArchHint, attachMacArchHint } = await import('./macArchHint'))
  })

  afterEach(() => {
    if (originalGetContextDescriptor) {
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', originalGetContextDescriptor)
    }
    jest.resetAllMocks()
  })

  describe('and the visitor is not on macOS', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      mockWebGl('ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)')
    })

    it('should return null without creating a WebGL context', () => {
      expect(getMacArchHint()).toBeNull()
      expect(getContextMock).not.toHaveBeenCalled()
    })
  })

  describe('and the renderer reports an Apple GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)')
    })

    it('should return apple_silicon', () => {
      expect(getMacArchHint()).toBe('apple_silicon')
    })

    it('should memoize the result and not create a second WebGL context', () => {
      getMacArchHint()
      getMacArchHint()

      expect(getContextMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the renderer reports an Intel GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics 655, Unspecified Version)')
    })

    it('should return intel', () => {
      expect(getMacArchHint()).toBe('intel')
    })
  })

  describe('and the renderer reports an AMD GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('AMD Radeon Pro 5500M OpenGL Engine')
    })

    it('should return intel', () => {
      expect(getMacArchHint()).toBe('intel')
    })
  })

  describe('and the renderer reports an unrecognized GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('NVIDIA GeForce GTX 1080 OpenGL Engine')
    })

    it('should return unknown', () => {
      expect(getMacArchHint()).toBe('unknown')
    })
  })

  describe('and the debug renderer extension is unavailable', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      const gl = { getExtension: jest.fn(() => null), getParameter: jest.fn() }
      getContextMock = jest.fn(() => gl)
      HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext
    })

    it('should return unknown', () => {
      expect(getMacArchHint()).toBe('unknown')
    })
  })

  describe('and WebGL is unavailable', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl(null)
    })

    it('should return unknown', () => {
      expect(getMacArchHint()).toBe('unknown')
    })
  })

  describe('and creating the context throws', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      getContextMock = jest.fn(() => {
        throw new Error('blocked')
      })
      HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext
    })

    it('should return unknown', () => {
      expect(getMacArchHint()).toBe('unknown')
    })
  })

  describe('and attaching the hint to a payload on a macOS visitor', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)')
    })

    it('should set mac_arch on the payload', () => {
      const payload: Record<string, unknown> = {}

      attachMacArchHint(payload)

      expect(payload).toEqual({ mac_arch: 'apple_silicon' })
    })
  })

  describe('and attaching the hint to a payload off macOS', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      mockWebGl('ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)')
    })

    it('should leave the payload untouched', () => {
      const payload: Record<string, unknown> = {}

      attachMacArchHint(payload)

      expect(payload).toEqual({})
    })
  })
})
