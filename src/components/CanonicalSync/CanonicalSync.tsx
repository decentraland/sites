import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

// index.html ships a static canonical pointing at the homepage, and Segment
// derives context.page.path/url from the first canonical link on every event.
// Without this, every route the SEO worker does not rewrite (and every route
// reached by client-side navigation) is recorded as "/". A canonical already
// matching the route is left alone so worker-set query params (?id=, ?position=)
// survive. Layout effect so it lands before any child's page()/track() effect.
function CanonicalSync() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel='canonical']")
    if (!link) return
    const current = new URL(link.href, window.location.origin)
    if (current.pathname === pathname) return
    link.href = new URL(pathname, current.origin).toString()
  }, [pathname])

  return null
}

export { CanonicalSync }
