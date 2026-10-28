import { act, renderHook } from '@testing-library/react'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useModalSurfaceStack, useStackDialogClose } from './useModalSurfaceStack'
import type { ModalSurface } from './ModalSurfaceStack.types'

const PROFILE_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const PROFILE_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const makePlace = (id: string): ProfilePlace => ({ id }) as ProfilePlace

describe('useModalSurfaceStack', () => {
  describe('when navigating event → profile → photo → another profile', () => {
    it('should unwind one level at a time instead of jumping to the root', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openProfile(PROFILE_A))
      act(() => result.current.openPhoto('photo-1'))
      act(() => result.current.openProfile(PROFILE_B))

      expect(result.current.top).toEqual({ kind: 'profile', address: PROFILE_B, tab: 'overview', hasExplicitTab: false })

      act(() => result.current.pop())
      expect(result.current.top).toEqual({ kind: 'photo', imageId: 'photo-1' })

      act(() => result.current.pop())
      expect(result.current.top).toEqual({ kind: 'profile', address: PROFILE_A, tab: 'overview', hasExplicitTab: false })

      act(() => result.current.pop())
      expect(result.current.top).toBeNull()
      expect(result.current.variant).toBeUndefined()
    })
  })

  describe('when re-opening the surface that is already on top', () => {
    it('should not create a duplicate history entry', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openProfile(PROFILE_A))
      act(() => result.current.openProfile(PROFILE_A.toUpperCase().replace('0X', '0x')))

      act(() => result.current.pop())
      expect(result.current.top).toBeNull()
    })
  })

  describe('when changing the tab of the top profile entry', () => {
    it('should keep the tab state per history entry', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openProfile(PROFILE_A))
      act(() => result.current.setTopProfileTab('photos'))
      act(() => result.current.openProfile(PROFILE_B))

      expect(result.current.top).toEqual({ kind: 'profile', address: PROFILE_B, tab: 'overview', hasExplicitTab: false })

      act(() => result.current.pop())
      expect(result.current.top).toEqual({ kind: 'profile', address: PROFILE_A, tab: 'photos', hasExplicitTab: true })

      act(() => result.current.exitTopProfileTab())
      expect(result.current.top).toEqual({ kind: 'profile', address: PROFILE_A, tab: 'overview', hasExplicitTab: false })
    })
  })

  describe('when an invalid address is pushed', () => {
    it('should ignore it', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openProfile('not-an-address'))

      expect(result.current.top).toBeNull()
    })
  })

  describe('when opening the friends list as a surface', () => {
    it('should push a friends entry and unwind back through it', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openFriends('0xAaaaAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaaAAAA'))
      expect(result.current.top).toEqual({ kind: 'friends', mutualOf: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })

      act(() => result.current.openProfile('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'))
      expect(result.current.top?.kind).toBe('profile')

      act(() => result.current.pop())
      expect(result.current.top).toEqual({ kind: 'friends', mutualOf: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    })

    it('should dedupe re-opening the same friends list and ignore invalid mutual addresses', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openFriends())
      act(() => result.current.openFriends())
      expect(result.current.top).toEqual({ kind: 'friends', mutualOf: undefined })

      act(() => result.current.openFriends('not-an-address'))
      expect(result.current.top).toEqual({ kind: 'friends', mutualOf: undefined })
    })
  })

  describe('when the stack is reset', () => {
    it('should return to the root surface', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openProfile(PROFILE_A))
      act(() => result.current.openPhoto('photo-1'))
      act(() => result.current.reset())

      expect(result.current.top).toBeNull()
    })
  })

  describe('when opening a place surface', () => {
    it('should push a place entry and dedupe re-opening the same place', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openPlace(makePlace('place-1')))
      expect(result.current.top).toEqual({ kind: 'place', place: { id: 'place-1' } })
      expect(result.current.variant).toBe('place')

      // Re-opening the same place id is a no-op (no duplicate history entry).
      act(() => result.current.openPlace(makePlace('place-1')))
      act(() => result.current.pop())
      expect(result.current.top).toBeNull()
    })

    it('should stack distinct places and unwind one level at a time', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openPlace(makePlace('place-1')))
      act(() => result.current.openPlace(makePlace('place-2')))
      expect(result.current.top).toEqual({ kind: 'place', place: { id: 'place-2' } })

      act(() => result.current.pop())
      expect(result.current.top).toEqual({ kind: 'place', place: { id: 'place-1' } })
    })
  })

  describe('when opening a community surface', () => {
    it('should push a community entry and dedupe re-opening the same community', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openCommunity('community-1'))
      expect(result.current.top).toEqual({ kind: 'community', communityId: 'community-1' })
      expect(result.current.variant).toBe('community')

      act(() => result.current.openCommunity('community-1'))
      act(() => result.current.pop())
      expect(result.current.top).toBeNull()
    })

    it('should ignore an empty community id', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openCommunity(''))

      expect(result.current.top).toBeNull()
    })
  })

  describe('when opening a photo surface', () => {
    it('should ignore an empty image id', () => {
      const { result } = renderHook(() => useModalSurfaceStack())

      act(() => result.current.openPhoto(''))

      expect(result.current.top).toBeNull()
    })
  })
})

describe('useStackDialogClose', () => {
  describe('when Escape is pressed and a surface is on top', () => {
    it('should pop one surface instead of closing the dialog', () => {
      const pop = jest.fn()
      const onClose = jest.fn()
      const top: ModalSurface = { kind: 'photo', imageId: 'photo-1' }
      const { result } = renderHook(() => useStackDialogClose(top, pop, onClose))

      act(() => result.current({}, 'escapeKeyDown'))

      expect(pop).toHaveBeenCalledTimes(1)
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('when Escape is pressed at the root surface', () => {
    it('should close the dialog because there is nothing to pop', () => {
      const pop = jest.fn()
      const onClose = jest.fn()
      const { result } = renderHook(() => useStackDialogClose(null, pop, onClose))

      act(() => result.current({}, 'escapeKeyDown'))

      expect(pop).not.toHaveBeenCalled()
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('when closed for any other reason', () => {
    it('should dismiss the dialog outright even with a surface on top', () => {
      const pop = jest.fn()
      const onClose = jest.fn()
      const top: ModalSurface = { kind: 'photo', imageId: 'photo-1' }
      const { result } = renderHook(() => useStackDialogClose(top, pop, onClose))

      act(() => result.current({}, 'backdropClick'))

      expect(pop).not.toHaveBeenCalled()
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})
