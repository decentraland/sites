// Schemes allowed for free-form CMS-authored hyperlinks. Blocks javascript:, data:, vbscript:, file:, etc.
const SAFE_HYPERLINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

const parseUrl = (uri: string): URL | null => {
  try {
    return new URL(uri)
  } catch {
    return null
  }
}

const isSafeHyperlinkUri = (uri: string): boolean => {
  if (typeof uri !== 'string' || uri.length === 0) return false
  if (uri.startsWith('#') || uri.startsWith('/')) return true
  const url = parseUrl(uri)
  return !!url && SAFE_HYPERLINK_PROTOCOLS.has(url.protocol)
}

export { parseUrl, isSafeHyperlinkUri }
