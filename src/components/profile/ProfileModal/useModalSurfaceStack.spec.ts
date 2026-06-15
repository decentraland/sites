import { act, renderHook } from '@testing-library/react'
import { useModalSurfaceStack } from './useModalSurfaceStack'

const PROFILE_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const PROFILE_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

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
})
