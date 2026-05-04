import { renderHook } from '@testing-library/react'
import { useCreatorProfile } from './useCreatorProfile'

const mockUseProfileAvatar = jest.fn()
const defaultProfileAvatar = {
  avatar: undefined,
  avatarForCard: undefined,
  avatarFace: undefined,
  name: undefined,
  backgroundColor: '#ffffff'
}
jest.mock('./useProfileAvatar', () => ({
  useProfileAvatar: (...args: unknown[]) => mockUseProfileAvatar(...(args as []))
}))

describe('useCreatorProfile', () => {
  beforeEach(() => {
    mockUseProfileAvatar.mockReturnValue(defaultProfileAvatar)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the event creator is Decentraland Foundation', () => {
    beforeEach(() => {
      mockUseProfileAvatar.mockReturnValue({
        avatar: undefined,
        avatarForCard: undefined,
        avatarFace: 'https://example.com/baybackner.png',
        name: 'BayBackner',
        backgroundColor: '#cafe00'
      })
    })

    it('should flag the event as Foundation', () => {
      const { result } = renderHook(() => useCreatorProfile('0xAddress', 'Decentraland Foundation'))

      expect(result.current.isDclFoundation).toBe(true)
    })

    it('should override the creator name even when the Catalyst profile returns a different name', () => {
      const { result } = renderHook(() => useCreatorProfile('0xAddress', 'Decentraland Foundation'))

      expect(result.current.creatorName).toBe('Decentraland Foundation')
    })

    it('should override the avatar face with the Foundation logo', () => {
      const { result } = renderHook(() => useCreatorProfile('0xAddress', 'Decentraland Foundation'))

      expect(result.current.avatarFace).toBe('/dcl-logo.svg')
    })

    it('should override the background color with the Foundation brand color', () => {
      const { result } = renderHook(() => useCreatorProfile('0xAddress', 'Decentraland Foundation'))

      expect(result.current.backgroundColor).toBe('#9d76e3')
    })

    it('should skip the profile fetch', () => {
      renderHook(() => useCreatorProfile('0xAddress', 'Decentraland Foundation'))

      expect(mockUseProfileAvatar).toHaveBeenCalledWith('0xAddress', expect.objectContaining({ skip: true }))
    })

    it('should match case-insensitively', () => {
      const { result } = renderHook(() => useCreatorProfile('0xAddress', 'decentraland foundation'))

      expect(result.current.creatorName).toBe('Decentraland Foundation')
    })
  })

  describe('when the event creator is a regular user', () => {
    beforeEach(() => {
      mockUseProfileAvatar.mockReturnValue({
        avatar: undefined,
        avatarForCard: undefined,
        avatarFace: 'https://example.com/avatar.png',
        name: 'CatalystName',
        backgroundColor: '#123456'
      })
    })

    it('should return the Catalyst profile name', () => {
      const { result } = renderHook(() => useCreatorProfile('0xUser', 'RawName'))

      expect(result.current.creatorName).toBe('CatalystName')
    })

    it('should return the Catalyst avatar face', () => {
      const { result } = renderHook(() => useCreatorProfile('0xUser', 'RawName'))

      expect(result.current.avatarFace).toBe('https://example.com/avatar.png')
    })

    it('should not flag the event as Foundation', () => {
      const { result } = renderHook(() => useCreatorProfile('0xUser', 'RawName'))

      expect(result.current.isDclFoundation).toBe(false)
    })

    it('should propagate the catalyst-derived background color', () => {
      const { result } = renderHook(() => useCreatorProfile('0xUser', 'RawName'))

      expect(result.current.backgroundColor).toBe('#123456')
    })
  })

  describe('when the Catalyst profile has no name', () => {
    it('should fall back to the raw user_name', () => {
      const { result } = renderHook(() => useCreatorProfile('0xUser', 'RawName'))

      expect(result.current.creatorName).toBe('RawName')
    })

    it('should fall back to the provided fallback when user_name is empty', () => {
      const { result } = renderHook(() => useCreatorProfile('0xUser', null, 'Unknown'))

      expect(result.current.creatorName).toBe('Unknown')
    })

    it('should return undefined creatorName when no fallback is provided', () => {
      const { result } = renderHook(() => useCreatorProfile('0xUser', null))

      expect(result.current.creatorName).toBeUndefined()
    })
  })

  describe('when no address is provided', () => {
    it('should skip the profile fetch', () => {
      renderHook(() => useCreatorProfile(undefined, 'RawName'))

      expect(mockUseProfileAvatar).toHaveBeenCalledWith(undefined, expect.objectContaining({ skip: true }))
    })
  })
})
