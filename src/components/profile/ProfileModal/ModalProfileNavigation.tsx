import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'

type OpenProfileFn = (address: string) => void
type OpenPhotoFn = (imageId: string) => void
type OpenPlaceFn = (place: ProfilePlace) => void
type OpenCommunityFn = (communityId: string) => void
type OpenFriendsFn = (mutualOf?: string) => void

interface ModalNavigationValue {
  openProfile: OpenProfileFn
  openPhoto?: OpenPhotoFn
  openPlace?: OpenPlaceFn
  openCommunity?: OpenCommunityFn
  openFriends?: OpenFriendsFn
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const ModalProfileNavigationContext = createContext<ModalNavigationValue | null>(null)

interface ModalProfileNavigationProviderProps {
  /** Called when a child requests opening a profile while this provider is mounted. Lets the host modal swap content instead of opening a separate ProfileModal on top. */
  onOpenProfile: OpenProfileFn
  /** Called when a child requests opening a photo while this provider is mounted. Lets the host modal swap to the photo surface instead of stacking a PhotoModal on top. */
  onOpenPhoto?: OpenPhotoFn
  /** Called when a child requests opening a place/world while this provider is mounted. Same anti-stacking pattern. */
  onOpenPlace?: OpenPlaceFn
  /** Called when a child requests opening a community while this provider is mounted. Same anti-stacking pattern. */
  onOpenCommunity?: OpenCommunityFn
  /** Called when a child requests opening the friends / mutual-friends list. Renders as a stack surface instead of a dialog-on-dialog. */
  onOpenFriends?: OpenFriendsFn
  children: ReactNode
}

function ModalProfileNavigationProvider({
  onOpenProfile,
  onOpenPhoto,
  onOpenPlace,
  onOpenCommunity,
  onOpenFriends,
  children
}: ModalProfileNavigationProviderProps) {
  const value = useMemo<ModalNavigationValue>(
    () => ({
      openProfile: onOpenProfile,
      openPhoto: onOpenPhoto,
      openPlace: onOpenPlace,
      openCommunity: onOpenCommunity,
      openFriends: onOpenFriends
    }),
    [onOpenProfile, onOpenPhoto, onOpenPlace, onOpenCommunity, onOpenFriends]
  )
  return <ModalProfileNavigationContext.Provider value={value}>{children}</ModalProfileNavigationContext.Provider>
}

function useModalProfileNavigation(): OpenProfileFn | null {
  return useContext(ModalProfileNavigationContext)?.openProfile ?? null
}

function useModalPhotoNavigation(): OpenPhotoFn | null {
  return useContext(ModalProfileNavigationContext)?.openPhoto ?? null
}

function useModalPlaceNavigation(): OpenPlaceFn | null {
  return useContext(ModalProfileNavigationContext)?.openPlace ?? null
}

function useModalCommunityNavigation(): OpenCommunityFn | null {
  return useContext(ModalProfileNavigationContext)?.openCommunity ?? null
}

function useModalFriendsNavigation(): OpenFriendsFn | null {
  return useContext(ModalProfileNavigationContext)?.openFriends ?? null
}

export {
  ModalProfileNavigationProvider,
  useModalCommunityNavigation,
  useModalFriendsNavigation,
  useModalPhotoNavigation,
  useModalPlaceNavigation,
  useModalProfileNavigation
}
