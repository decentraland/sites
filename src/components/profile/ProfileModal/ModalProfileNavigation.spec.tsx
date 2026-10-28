import { renderHook } from '@testing-library/react'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import {
  ModalProfileNavigationProvider,
  useModalCommunityNavigation,
  useModalFriendsNavigation,
  useModalPhotoNavigation,
  useModalPlaceNavigation,
  useModalProfileNavigation
} from './ModalProfileNavigation'

const makePlace = (id: string): ProfilePlace => ({ id }) as ProfilePlace

describe('ModalProfileNavigation', () => {
  describe('when no provider is mounted', () => {
    it('should return null from every navigation hook', () => {
      expect(renderHook(() => useModalProfileNavigation()).result.current).toBeNull()
      expect(renderHook(() => useModalPhotoNavigation()).result.current).toBeNull()
      expect(renderHook(() => useModalPlaceNavigation()).result.current).toBeNull()
      expect(renderHook(() => useModalCommunityNavigation()).result.current).toBeNull()
      expect(renderHook(() => useModalFriendsNavigation()).result.current).toBeNull()
    })
  })

  describe('when the provider wires every handler', () => {
    const onOpenProfile = jest.fn()
    const onOpenPhoto = jest.fn()
    const onOpenPlace = jest.fn()
    const onOpenCommunity = jest.fn()
    const onOpenFriends = jest.fn()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ModalProfileNavigationProvider
        onOpenProfile={onOpenProfile}
        onOpenPhoto={onOpenPhoto}
        onOpenPlace={onOpenPlace}
        onOpenCommunity={onOpenCommunity}
        onOpenFriends={onOpenFriends}
      >
        {children}
      </ModalProfileNavigationProvider>
    )

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should expose the profile handler and forward its argument', () => {
      const { result } = renderHook(() => useModalProfileNavigation(), { wrapper })
      result.current?.('0xabc')
      expect(onOpenProfile).toHaveBeenCalledWith('0xabc')
    })

    it('should expose the photo handler and forward its argument', () => {
      const { result } = renderHook(() => useModalPhotoNavigation(), { wrapper })
      result.current?.('photo-1')
      expect(onOpenPhoto).toHaveBeenCalledWith('photo-1')
    })

    it('should expose the place handler and forward its argument', () => {
      const place = makePlace('place-1')
      const { result } = renderHook(() => useModalPlaceNavigation(), { wrapper })
      result.current?.(place)
      expect(onOpenPlace).toHaveBeenCalledWith(place)
    })

    it('should expose the community handler and forward its argument', () => {
      const { result } = renderHook(() => useModalCommunityNavigation(), { wrapper })
      result.current?.('community-1')
      expect(onOpenCommunity).toHaveBeenCalledWith('community-1')
    })

    it('should expose the friends handler and forward its argument', () => {
      const { result } = renderHook(() => useModalFriendsNavigation(), { wrapper })
      result.current?.('0xmutual')
      expect(onOpenFriends).toHaveBeenCalledWith('0xmutual')
    })
  })

  describe('when the provider only wires the required profile handler', () => {
    const onOpenProfile = jest.fn()

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ModalProfileNavigationProvider onOpenProfile={onOpenProfile}>{children}</ModalProfileNavigationProvider>
    )

    it('should expose the profile handler but leave the optional handlers undefined', () => {
      expect(renderHook(() => useModalProfileNavigation(), { wrapper }).result.current).toBe(onOpenProfile)
      // Optional handlers default to `?? null` when the provider omitted them.
      expect(renderHook(() => useModalPhotoNavigation(), { wrapper }).result.current).toBeNull()
      expect(renderHook(() => useModalPlaceNavigation(), { wrapper }).result.current).toBeNull()
      expect(renderHook(() => useModalCommunityNavigation(), { wrapper }).result.current).toBeNull()
      expect(renderHook(() => useModalFriendsNavigation(), { wrapper }).result.current).toBeNull()
    })
  })
})
