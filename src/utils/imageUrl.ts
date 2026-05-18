// Vercel's image optimizer (`/_vercel/image`) re-encodes remote images on the
// fly into WebP at the requested width. This collapses the 1.3 MB Live Now
// poster (raw IPFS content from peer.decentraland.org) into ~50 KB WebP at
// 500 px wide — the LCP bottleneck on slow mobile.
//
// The endpoint only exists on Vercel deployments. On `vite dev` and any
// non-Vercel host (CI preview, internal tools) the path 404s, so we fall back
// to the original URL there.

const HOSTS_WITHOUT_OPTIMIZER = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

interface OptimizedImageOptions {
  width: number
  quality?: number
}

function isOptimizableUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false
  // Same-origin asset paths (e.g. Vite-emitted `/assets/foo.webp`) are valid
  // for `/_vercel/image`, so accept any string that starts with `/` (but not
  // protocol-relative `//host`).
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function shouldUseOptimizer(): boolean {
  if (typeof window === 'undefined') return true
  return !HOSTS_WITHOUT_OPTIMIZER.has(window.location.hostname)
}

function optimizedImageUrl(url: string | null | undefined, options: OptimizedImageOptions): string {
  if (!url) return ''
  if (!isOptimizableUrl(url)) return url
  if (!shouldUseOptimizer()) return url
  const quality = options.quality ?? 75
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${options.width}&q=${quality}`
}

export { optimizedImageUrl }
