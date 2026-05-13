import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

type OpenProfileFn = (address: string) => void

// eslint-disable-next-line @typescript-eslint/naming-convention
const ModalProfileNavigationContext = createContext<OpenProfileFn | null>(null)

interface ModalProfileNavigationProviderProps {
  /** Called when a child requests opening the profile while this provider is mounted. Lets the host modal swap content instead of opening a separate ProfileModal on top. */
  onOpenProfile: OpenProfileFn
  children: ReactNode
}

function ModalProfileNavigationProvider({ onOpenProfile, children }: ModalProfileNavigationProviderProps) {
  const value = useMemo(() => onOpenProfile, [onOpenProfile])
  return <ModalProfileNavigationContext.Provider value={value}>{children}</ModalProfileNavigationContext.Provider>
}

function useModalProfileNavigation(): OpenProfileFn | null {
  return useContext(ModalProfileNavigationContext)
}

export { ModalProfileNavigationProvider, useModalProfileNavigation }
