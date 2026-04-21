import { decodeHtmlEntities, slugify } from './string'

describe('decodeHtmlEntities', () => {
  describe('when input contains a literal &amp; entity', () => {
    it('should decode it to an ampersand', () => {
      expect(decodeHtmlEntities('Q&amp;A with Creative Departmint')).toBe('Q&A with Creative Departmint')
    })
  })

  describe('when input contains multiple entity types', () => {
    it('should decode each entity', () => {
      expect(decodeHtmlEntities('A &lt;b&gt; &amp; &quot;c&quot; &#39;d&#39; &nbsp;e')).toBe('A <b> & "c" \'d\'  e')
    })
  })

  describe('when input is doubly-encoded HTML', () => {
    it('should not unwrap the inner escape (keeps XSS-safety)', () => {
      expect(decodeHtmlEntities('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;')
    })
  })

  describe('when input has no entities', () => {
    it('should return the input unchanged', () => {
      expect(decodeHtmlEntities('Plain title with no entities')).toBe('Plain title with no entities')
    })
  })

  describe('when input is empty', () => {
    it('should return an empty string', () => {
      expect(decodeHtmlEntities('')).toBe('')
    })
  })
})

describe('slugify', () => {
  describe('when input is undefined', () => {
    it('should return empty string', () => {
      expect(slugify(undefined)).toBe('')
    })
  })

  describe('when input has spaces and symbols', () => {
    it('should produce a dash-separated lowercase slug', () => {
      expect(slugify('Hello World! Foo_Bar')).toBe('hello-world-foo-bar')
    })
  })
})
