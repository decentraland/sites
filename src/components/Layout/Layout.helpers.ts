// Routes whose page() event is owned by the page itself (blog, gated on async
// title resolution) or that should never produce a page() event because they
// only exist to redirect (legacy /events and /places). The Layout consults
// this predicate before firing its route-level page() call.
function isPageTrackingExempt(pathname: string): boolean {
  if (pathname === '/blog' || pathname.startsWith('/blog/')) return true
  if (pathname === '/events' || pathname.startsWith('/events/')) return true
  if (pathname === '/places' || pathname.startsWith('/places/')) return true
  if (pathname === '/cast' || pathname.startsWith('/cast/')) return true
  return false
}

export { isPageTrackingExempt }
