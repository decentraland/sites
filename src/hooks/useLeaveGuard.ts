import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

const busyOwners = new Set<object>()
let pending: (() => void) | null = null
const listeners = new Set<() => void>()

function emitChange(): void {
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setPending(next: (() => void) | null): void {
  pending = next
  emitChange()
}

function release(owner: object): void {
  busyOwners.delete(owner)
  if (busyOwners.size === 0) pending = null
  emitChange()
}

const isPromptOpen = (): boolean => pending !== null
const isAnyBusy = (): boolean => busyOwners.size > 0

function preventUnload(event: BeforeUnloadEvent): void {
  event.preventDefault()
  event.returnValue = ''
}

/**
 * Registers this instance as busy while `busy` is true.
 * @returns `confirmLeave(go)`: runs `go` at once when nothing is busy, otherwise holds it for the leave prompt.
 */
function useLeaveGuard(busy: boolean): (go: () => void) => void {
  const owner = useRef({}).current

  useEffect(() => {
    if (!busy) return
    busyOwners.add(owner)
    emitChange()
    return () => release(owner)
  }, [busy, owner])

  return useCallback((go: () => void) => {
    if (isAnyBusy()) {
      setPending(go)
      return
    }
    go()
  }, [])
}

/** Leave prompt state for held navigations; also arms `beforeunload` while any guard is busy. */
function useLeavePrompt(): { open: boolean; stay: () => void; leave: () => void } {
  const open = useSyncExternalStore(subscribe, isPromptOpen, isPromptOpen)
  const busy = useSyncExternalStore(subscribe, isAnyBusy, isAnyBusy)

  useEffect(() => () => setPending(null), [])

  useEffect(() => {
    if (!busy) return
    window.addEventListener('beforeunload', preventUnload)
    return () => window.removeEventListener('beforeunload', preventUnload)
  }, [busy])

  const stay = useCallback(() => setPending(null), [])

  const leave = useCallback(() => {
    const go = pending
    if (!go) return
    setPending(null)
    go()
  }, [])

  return { open, stay, leave }
}

export { useLeaveGuard, useLeavePrompt }
