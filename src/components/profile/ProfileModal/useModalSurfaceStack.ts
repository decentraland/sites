import { useCallback, useMemo, useState } from 'react'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import type { ProfileTab } from '../ProfileTabs'
import type { ModalSurface, ModalSurfaceStack, ModalSurfaceVariant } from './ModalSurfaceStack.types'

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

/**
 * In-place navigation HISTORY for modals that swap content instead of stacking dialogs
 * (event modal, profile modal, photo modal). Every `open*` pushes an entry and `pop`
 * unwinds one level at a time, so e.g. event → profile A → photo → profile B backs out
 * through the exact same path instead of jumping straight to the root.
 */
function useModalSurfaceStack(): ModalSurfaceStack {
  const [stack, setStack] = useState<ModalSurface[]>([])

  const openProfile = useCallback((address: string) => {
    if (!ADDRESS_REGEX.test(address)) return
    const normalized = address.toLowerCase()
    setStack(prev => {
      const top = prev[prev.length - 1]
      // Re-opening the surface that is already on top is a no-op, not a new history entry.
      if (top?.kind === 'profile' && top.address === normalized) return prev
      return [...prev, { kind: 'profile', address: normalized, tab: 'overview', hasExplicitTab: false }]
    })
  }, [])

  const openPhoto = useCallback((imageId: string) => {
    if (!imageId) return
    setStack(prev => {
      const top = prev[prev.length - 1]
      if (top?.kind === 'photo' && top.imageId === imageId) return prev
      return [...prev, { kind: 'photo', imageId }]
    })
  }, [])

  const openPlace = useCallback((place: ProfilePlace) => {
    setStack(prev => {
      const top = prev[prev.length - 1]
      if (top?.kind === 'place' && top.place.id === place.id) return prev
      return [...prev, { kind: 'place', place }]
    })
  }, [])

  const openCommunity = useCallback((communityId: string) => {
    if (!communityId) return
    setStack(prev => {
      const top = prev[prev.length - 1]
      if (top?.kind === 'community' && top.communityId === communityId) return prev
      return [...prev, { kind: 'community', communityId }]
    })
  }, [])

  const pop = useCallback(() => setStack(prev => prev.slice(0, -1)), [])
  const reset = useCallback(() => setStack([]), [])

  const setTopProfileTab = useCallback((tab: ProfileTab) => {
    setStack(prev => {
      const top = prev[prev.length - 1]
      if (top?.kind !== 'profile') return prev
      return [...prev.slice(0, -1), { ...top, tab, hasExplicitTab: true }]
    })
  }, [])

  const exitTopProfileTab = useCallback(() => {
    setStack(prev => {
      const top = prev[prev.length - 1]
      if (top?.kind !== 'profile') return prev
      return [...prev.slice(0, -1), { ...top, tab: 'overview', hasExplicitTab: false }]
    })
  }, [])

  const top = stack.length > 0 ? stack[stack.length - 1] : null
  const variant: ModalSurfaceVariant | undefined = top?.kind

  return useMemo(
    () => ({ top, variant, openProfile, openPhoto, openPlace, openCommunity, pop, reset, setTopProfileTab, exitTopProfileTab }),
    [top, variant, openProfile, openPhoto, openPlace, openCommunity, pop, reset, setTopProfileTab, exitTopProfileTab]
  )
}

export { useModalSurfaceStack }
