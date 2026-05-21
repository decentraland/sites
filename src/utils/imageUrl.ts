// Vercel's image optimizer (`/_vercel/image`) re-encodes remote images on the
// fly into WebP at the requested width. This collapses the 1.3 MB Live Now
// poster (raw IPFS content from peer.decentraland.org) into ~50 KB WebP at
// 500 px wide — the LCP bottleneck on slow mobile.
//
// The endpoint ONLY exists on Vercel previews (`*.vercel.app`). Production
// (`decentraland.zone/today/org`) is served from cdn.decentraland.org via
// `set-rollout-action`, where the path falls back to the SPA index.html and
// the browser renders a broken-image placeholder. Same for `vite dev`. The
// allowlist below is closed-form: only Vercel hostnames opt into the
// optimizer; everywhere else we serve the original URL.

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
  if (typeof window === 'undefined') return false
  return window.location.hostname.endsWith('.vercel.app')
}

function optimizedImageUrl(url: string | null | undefined, options: OptimizedImageOptions): string {
  if (!url) return ''
  if (!isOptimizableUrl(url)) return url
  if (!shouldUseOptimizer()) return url
  const quality = options.quality ?? 75
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${options.width}&q=${quality}`
}

export { optimizedImageUrl }
