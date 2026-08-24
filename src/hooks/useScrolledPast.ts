import { useEffect, useState } from 'react'

// Threshold shared by the creators navbar and sub-nav so both bars deepen in step with
// each other (and with the wemotes-builder collections app, which uses the same value).
const BAR_SCROLL_THRESHOLD = 8

/**
 * Whether the window has scrolled past `threshold` px. Passive listener, initialized on
 * mount; pass `enabled: false` to detach the listener and hold false (e.g. off-route).
 */
function useScrolledPast(threshold: number, enabled = true): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setScrolled(false)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold, enabled])

  return scrolled
}

export { BAR_SCROLL_THRESHOLD, useScrolledPast }
