import { optimizedImageUrl } from './imageUrl'

describe('optimizedImageUrl', () => {
  const originalLocation = window.location
  const setHostname = (hostname: string): void => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, hostname }
    })
  }

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
  })

  describe('when the input URL is empty or nullish', () => {
    it('returns an empty string for null', () => {
      expect(optimizedImageUrl(null, { width: 500 })).toBe('')
    })

    it('returns an empty string for undefined', () => {
      expect(optimizedImageUrl(undefined, { width: 500 })).toBe('')
    })

    it('returns an empty string for ""', () => {
      expect(optimizedImageUrl('', { width: 500 })).toBe('')
    })
  })

  describe('when the input URL has an unsupported protocol', () => {
    beforeEach(() => setHostname('decentraland.org'))

    it('returns the original URL for `data:`', () => {
      const url = 'data:image/png;base64,AAAA'
      expect(optimizedImageUrl(url, { width: 500 })).toBe(url)
    })

    it('returns the original URL for `javascript:`', () => {
      const url = 'javascript:alert(1)'
      expect(optimizedImageUrl(url, { width: 500 })).toBe(url)
    })

    it('returns the original protocol-relative URL untouched', () => {
      const url = '//cdn.example.com/foo.webp'
      expect(optimizedImageUrl(url, { width: 500 })).toBe(url)
    })
  })

  describe('when running on localhost', () => {
    beforeEach(() => setHostname('localhost'))

    it('returns the original URL', () => {
      expect(optimizedImageUrl('https://peer.decentraland.org/x.webp', { width: 500 })).toBe('https://peer.decentraland.org/x.webp')
    })

    it('returns same-origin paths untouched', () => {
      expect(optimizedImageUrl('/assets/foo-abc.webp', { width: 800 })).toBe('/assets/foo-abc.webp')
    })
  })

  describe('when running on a Vercel deployment', () => {
    beforeEach(() => setHostname('decentraland.org'))

    it('wraps absolute https URLs through /_vercel/image', () => {
      const result = optimizedImageUrl('https://peer.decentraland.org/x.webp', { width: 500 })
      expect(result).toBe(`/_vercel/image?url=${encodeURIComponent('https://peer.decentraland.org/x.webp')}&w=500&q=75`)
    })

    it('wraps absolute http URLs', () => {
      const result = optimizedImageUrl('http://example.com/x.png', { width: 256 })
      expect(result).toBe(`/_vercel/image?url=${encodeURIComponent('http://example.com/x.png')}&w=256&q=75`)
    })

    it('wraps same-origin paths starting with `/`', () => {
      const result = optimizedImageUrl('/assets/foo-abc.webp', { width: 1920 })
      expect(result).toBe('/_vercel/image?url=%2Fassets%2Ffoo-abc.webp&w=1920&q=75')
    })

    it('honours an explicit quality override', () => {
      const result = optimizedImageUrl('/foo.png', { width: 100, quality: 40 })
      expect(result).toContain('&q=40')
    })

    it('does not wrap protocol-relative URLs', () => {
      const url = '//cdn.example.com/foo.webp'
      expect(optimizedImageUrl(url, { width: 500 })).toBe(url)
    })

    it('does not wrap unsupported-protocol URLs', () => {
      expect(optimizedImageUrl('ftp://example.com/x.png', { width: 500 })).toBe('ftp://example.com/x.png')
    })
  })

  describe('when called with a non-string value (e.g. mocked Vite module)', () => {
    beforeEach(() => setHostname('decentraland.org'))

    it('does not throw on object inputs', () => {
      expect(() => optimizedImageUrl({} as unknown as string, { width: 500 })).not.toThrow()
    })

    it('does not throw on numeric inputs', () => {
      expect(() => optimizedImageUrl(42 as unknown as string, { width: 500 })).not.toThrow()
    })
  })
})
