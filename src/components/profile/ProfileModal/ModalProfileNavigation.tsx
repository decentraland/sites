import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

type OpenProfileFn = (address: string) => void
type OpenPhotoFn = (imageId: string) => void

interface ModalNavigationValue {
  openProfile: OpenProfileFn
  openPhoto?: OpenPhotoFn
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const ModalProfileNavigationContext = createContext<ModalNavigationValue | null>(null)

interface ModalProfileNavigationProviderProps {
  /** Called when a child requests opening a profile while this provider is mounted. Lets the host modal swap content instead of opening a separate ProfileModal on top. */
  onOpenProfile: OpenProfileFn
  /** Called when a child requests opening a photo while this provider is mounted. Lets the host modal swap to the photo surface instead of stacking a PhotoModal on top. */
  onOpenPhoto?: OpenPhotoFn
  children: ReactNode
}

function ModalProfileNavigationProvider({ onOpenProfile, onOpenPhoto, children }: ModalProfileNavigationProviderProps) {
  const value = useMemo<ModalNavigationValue>(() => ({ openProfile: onOpenProfile, openPhoto: onOpenPhoto }), [onOpenProfile, onOpenPhoto])
  return <ModalProfileNavigationContext.Provider value={value}>{children}</ModalProfileNavigationContext.Provider>
}

function useModalProfileNavigation(): OpenProfileFn | null {
  return useContext(ModalProfileNavigationContext)?.openProfile ?? null
}

function useModalPhotoNavigation(): OpenPhotoFn | null {
  return useContext(ModalProfileNavigationContext)?.openPhoto ?? null
}

export { ModalProfileNavigationProvider, useModalPhotoNavigation, useModalProfileNavigation }
