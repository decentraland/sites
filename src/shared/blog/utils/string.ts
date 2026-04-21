const slugify = (str: string | undefined | null): string => {
  if (!str) {
    return ''
  }
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Some CMS entries were authored with pre-encoded HTML entities (e.g. "Q&amp;A"
// stored literally). Plain-text renders (React text nodes) show the raw escape;
// HTML-attribute renders (SEO meta tags) get double-encoded as "Q&amp;amp;A".
// Decode &amp; last so double-encoded markup (`&amp;lt;`) resolves to `&lt;`
// rather than `<`, preserving the XSS-safety of downstream consumers.
// Numeric/hex references (&#60;, &#x3C;) are intentionally NOT decoded — the
// known-bad CMS entries only use named entities.
// SYNC: identical logic in api/seo.ts:decodeHTMLEntities — keep in sync.
const decodeHtmlEntities = (str: string): string =>
  str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

export { decodeHtmlEntities, slugify }
