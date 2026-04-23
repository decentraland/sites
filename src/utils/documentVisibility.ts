// Shared primitive for page-visibility subscriptions.
//
// Centralizes a single `visibilitychange` listener so React components
// (via `useDocumentVisible`) and module-level stores (e.g. events.client)
// can react to the same signal without each attaching its own listener.

type Listener = (visible: boolean) => void

const listeners = new Set<Listener>()
let attached = false

function notifyAll(): void {
  const visible = !document.hidden
  listeners.forEach(listener => listener(visible))
}

function ensureAttached(): void {
  if (attached || typeof document === 'undefined') return
  document.addEventListener('visibilitychange', notifyAll)
  attached = true
}

function maybeDetach(): void {
  if (listeners.size > 0 || !attached || typeof document === 'undefined') return
  document.removeEventListener('visibilitychange', notifyAll)
  attached = false
}

function subscribeVisibility(listener: Listener): () => void {
  if (listeners.has(listener)) {
    return () => {
      if (!listeners.has(listener)) return
      listeners.delete(listener)
      maybeDetach()
    }
  }
  ensureAttached()
  listeners.add(listener)
  return () => {
    if (!listeners.has(listener)) return
    listeners.delete(listener)
    maybeDetach()
  }
}

function isDocumentVisible(): boolean {
  return typeof document === 'undefined' ? true : !document.hidden
}

export { isDocumentVisible, subscribeVisibility }
