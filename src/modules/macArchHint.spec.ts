type MacArchHintModule = typeof import('./macArchHint')

describe('when attaching the mac architecture hint to a payload', () => {
  let attachMacArchHint: MacArchHintModule['attachMacArchHint']
  let getContextMock: jest.Mock
  const originalGetContextDescriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')

  const setUserAgent = (value: string) => {
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value })
  }

  const setMaxTouchPoints = (value: number) => {
    Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, value })
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

  const attach = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {}
    attachMacArchHint(payload)
    return payload
  }

  beforeEach(async () => {
    jest.resetModules()
    setMaxTouchPoints(0)
    ;({ attachMacArchHint } = await import('./macArchHint'))
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

    it('should leave the payload untouched without creating a WebGL context', () => {
      expect(attach()).toEqual({})
      expect(getContextMock).not.toHaveBeenCalled()
    })
  })

  describe('and the visitor is on an iPhone (UA says "like Mac OS X" but not "Macintosh")', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15')
      mockWebGl('Apple GPU')
    })

    it('should leave the payload untouched without creating a WebGL context', () => {
      expect(attach()).toEqual({})
      expect(getContextMock).not.toHaveBeenCalled()
    })
  })

  describe('and the renderer reports an Apple GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)')
    })

    it('should set mac_arch to apple_silicon', () => {
      expect(attach()).toEqual({ mac_arch: 'apple_silicon' })
    })

    it('should memoize the result and not create a second WebGL context', () => {
      attach()
      attach()

      expect(getContextMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('and the renderer reports an Intel GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics 655, Unspecified Version)')
    })

    it('should set mac_arch to intel', () => {
      expect(attach()).toEqual({ mac_arch: 'intel' })
    })
  })

  describe('and the renderer reports an AMD GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('AMD Radeon Pro 5500M OpenGL Engine')
    })

    it('should set mac_arch to intel', () => {
      expect(attach()).toEqual({ mac_arch: 'intel' })
    })
  })

  describe('and the renderer reports an NVIDIA GPU (Intel-era Macs only)', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('NVIDIA GeForce GT 750M OpenGL Engine')
    })

    it('should set mac_arch to intel', () => {
      expect(attach()).toEqual({ mac_arch: 'intel' })
    })
  })

  describe('and the renderer reports an unrecognized GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('llvmpipe (LLVM 15.0.7, 256 bits)')
    })

    it('should set mac_arch to unknown', () => {
      expect(attach()).toEqual({ mac_arch: 'unknown' })
    })
  })

  describe('and the visitor is an iPad wearing the desktop Macintosh UA', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')
      setMaxTouchPoints(5)
      mockWebGl('Apple GPU')
    })

    it('should leave the payload untouched without creating a WebGL context', () => {
      expect(attach()).toEqual({})
      expect(getContextMock).not.toHaveBeenCalled()
    })
  })

  describe('and the debug renderer extension is unavailable', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      const gl = { getExtension: jest.fn(() => null), getParameter: jest.fn() }
      getContextMock = jest.fn(() => gl)
      HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext
    })

    it('should set mac_arch to unknown', () => {
      expect(attach()).toEqual({ mac_arch: 'unknown' })
    })
  })

  describe('and WebGL is unavailable', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl(null)
    })

    it('should set mac_arch to unknown', () => {
      expect(attach()).toEqual({ mac_arch: 'unknown' })
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

    it('should set mac_arch to unknown', () => {
      expect(attach()).toEqual({ mac_arch: 'unknown' })
    })
  })
})
