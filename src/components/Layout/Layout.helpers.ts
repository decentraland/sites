// Routes whose page() event is owned by the page itself (blog, gated on async
// title resolution; places, whose pages fire their own) or that should never
// produce a page() event because they only exist to redirect. The redirect-only
// set is the pair of renamed prefixes, /whats-on and /discover, plus the deep
// links the standalone events and places sites used. The Layout consults this
// predicate before firing its route-level page() call.
//
// NOTE: /events is deliberately absent. It is the canonical Events section now
// (it was a redirect-only legacy prefix before the rename) and relies on the
// Layout's route-level page(), exactly as /whats-on did.
function isPageTrackingExempt(pathname: string): boolean {
  if (pathname === '/blog' || pathname.startsWith('/blog/')) return true
  if (pathname === '/whats-on' || pathname.startsWith('/whats-on/')) return true
  if (pathname === '/discover' || pathname.startsWith('/discover/')) return true
  // The one standalone-site deep link that still lives under a canonical prefix.
  if (pathname === '/events/event') return true
  if (pathname === '/cast' || pathname.startsWith('/cast/')) return true
  if (pathname === '/storage' || pathname.startsWith('/storage/')) return true
  if (pathname === '/social' || pathname.startsWith('/social/')) return true
  if (pathname === '/places' || pathname.startsWith('/places/')) return true
  return false
}

export { isPageTrackingExempt }
