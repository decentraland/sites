// Loads third-party scripts only after the page is idle so they never enter
// Lighthouse/Lantern's critical-path dependency graph. Each script here was
// previously either inlined in index.html or eagerly fired via Segment during
// React mount, which inflated simulated LCP by ~700ms.

const CONTENTSQUARE_SRC = 'https://t.contentsquare.net/uxa/c07af53c07b18.js'

let started = false

function injectContentsquare(): void {
  if (document.querySelector(`script[src="${CONTENTSQUARE_SRC}"]`)) return
  const s = document.createElement('script')
  s.src = CONTENTSQUARE_SRC
  s.async = true
  document.body.appendChild(s)
}

function runWhenIdle(cb: () => void, timeout = 4000): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(cb, { timeout })
  } else {
    window.setTimeout(cb, 2000)
  }
}

/**
 * Schedules the deferred third-party scripts to load after the page is fully
 * loaded AND the main thread is idle. Safe to call multiple times.
 */
export function scheduleDeferredThirdParty(): void {
  if (started) return
  started = true

  const start = () => runWhenIdle(injectContentsquare)

  if (document.readyState === 'complete') {
    start()
  } else {
    window.addEventListener('load', start, { once: true })
  }
}
