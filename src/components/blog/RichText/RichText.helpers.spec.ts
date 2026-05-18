import { isSafeHyperlinkUri } from './RichText.helpers'

describe('isSafeHyperlinkUri', () => {
  describe('when the uri uses an allowed scheme', () => {
    it.each(['https://decentraland.org', 'http://example.com/foo?bar=1', 'mailto:hello@example.com'])('should accept %s', uri => {
      expect(isSafeHyperlinkUri(uri)).toBe(true)
    })
  })

  describe('when the uri is a same-document reference', () => {
    it.each(['#section', '/blog/post'])('should accept %s', uri => {
      expect(isSafeHyperlinkUri(uri)).toBe(true)
    })
  })

  describe('when the uri uses a dangerous scheme', () => {
    it.each([
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'file:///etc/passwd',
      'blob:https://example.com/abc',
      'about:blank'
    ])('should reject %s', uri => {
      expect(isSafeHyperlinkUri(uri)).toBe(false)
    })
  })

  describe('when the uri is malformed or empty', () => {
    it.each(['', 'not a url', 'http//missing-colon', '://no-scheme'])('should reject %s', uri => {
      expect(isSafeHyperlinkUri(uri)).toBe(false)
    })
  })

  describe('when the uri tries to smuggle a dangerous scheme past whitespace trimming', () => {
    it.each([' javascript:alert(1)', '\tjavascript:alert(1)', '\njavascript:alert(1)'])('should reject %j', uri => {
      expect(isSafeHyperlinkUri(uri)).toBe(false)
    })
  })

  describe('when the uri contains path traversal segments', () => {
    it('should reject relative traversal that fails URL parsing', () => {
      expect(isSafeHyperlinkUri('../etc/passwd')).toBe(false)
    })
    it('should accept absolute paths regardless of traversal segments (resolved as same-origin)', () => {
      expect(isSafeHyperlinkUri('/blog/../etc/passwd')).toBe(true)
    })
  })

  describe('when the input is not a string', () => {
    it('should reject non-string values', () => {
      expect(isSafeHyperlinkUri(undefined as unknown as string)).toBe(false)
      expect(isSafeHyperlinkUri(null as unknown as string)).toBe(false)
    })
  })
})
