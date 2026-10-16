import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

const stripTrailingSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

// index.html ships a static canonical pointing at the homepage, and Segment
// derives context.page.path/url from the first canonical link on every event.
// Without this, every route the SEO worker does not rewrite (and every route
// reached by client-side navigation) is recorded as "/". A canonical already
// matching the route is left alone so worker-set query params (?id=, ?position=)
// survive, but only while the live query still matches them: a canonical with a
// query is used verbatim by Segment, so a stale one would mislabel later events.
// Layout effect so it lands before any child's page()/track() effect.
function CanonicalSync() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel='canonical']")
    if (!link) return
    const current = new URL(link.href, window.location.origin)
    const samePath = stripTrailingSlash(current.pathname) === stripTrailingSlash(pathname)
    if (samePath && (!current.search || current.search === search)) return
    // Assigning pathname (instead of resolving it as a relative URL) keeps the
    // origin even for a protocol-relative path such as //evil.example/x.
    const next = new URL(current.origin)
    next.pathname = pathname
    link.href = next.toString()
  }, [pathname, search])

  return null
}

export { CanonicalSync }
