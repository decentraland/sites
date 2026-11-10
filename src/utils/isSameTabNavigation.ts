import type { MouseEvent } from 'react'

// Targets that load the link in this browsing context or one that contains it, so the page is replaced.
const SAME_CONTEXT_TARGETS: ReadonlyArray<string | null> = [null, '', '_self', '_parent', '_top']

/**
 * Whether a primary click on a link replaces the current page. A link that opens elsewhere (`_blank` or a
 * named target, or ctrl/cmd/shift held) or downloads its file (a `download` attribute, or alt/option held) leaves
 * this page alive, so its click can wait for analytics.
 */
function isSameTabNavigation(event: Pick<MouseEvent, 'currentTarget' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): boolean {
  const target = event.currentTarget.getAttribute('target')?.toLowerCase() ?? null
  return (
    SAME_CONTEXT_TARGETS.includes(target) &&
    !event.currentTarget.hasAttribute('download') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

export { isSameTabNavigation }
