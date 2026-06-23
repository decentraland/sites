import { safeCssUrl } from './safeCssUrl'

describe('safeCssUrl', () => {
  describe('when given a valid https url', () => {
    it('should return the normalized url', () => {
      expect(safeCssUrl('https://cdn.example.test/image.png')).toBe('https://cdn.example.test/image.png')
    })
  })

  describe('when the url contains a double quote', () => {
    it('should percent-encode the quote to prevent css injection', () => {
      expect(safeCssUrl('https://cdn.example.test/a%22.png')).toBe('https://cdn.example.test/a%22.png')
    })

    it('should encode a literal quote injected via a query string', () => {
      const result = safeCssUrl('https://cdn.example.test/img?x=");background:red')
      expect(result).not.toContain('"')
      expect(result).toContain('%22')
    })
  })

  describe('when the protocol is not https', () => {
    it('should return an empty string for http urls', () => {
      expect(safeCssUrl('http://cdn.example.test/image.png')).toBe('')
    })

    it('should return an empty string for javascript urls', () => {
      expect(safeCssUrl('javascript:alert(1)')).toBe('')
    })

    it('should return an empty string for data urls', () => {
      expect(safeCssUrl('data:image/png;base64,AAAA')).toBe('')
    })
  })

  describe('when the url cannot be parsed', () => {
    it('should return an empty string', () => {
      expect(safeCssUrl('not a url')).toBe('')
    })

    it('should return an empty string for an empty input', () => {
      expect(safeCssUrl('')).toBe('')
    })
  })
})
