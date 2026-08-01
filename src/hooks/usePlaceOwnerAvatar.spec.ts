import { renderHook } from '@testing-library/react'
import type { DiscoverPlace } from '../features/discover'
import { useGetProfileQuery } from '../features/profile/profile.client'
import { getSyntheticAvatarUrl } from '../utils/avatarColor'
import { usePlaceOwnerAvatar } from './usePlaceOwnerAvatar'

jest.mock('../features/profile/profile.client', () => ({
  useGetProfileQuery: jest.fn()
}))

const mockUseGetProfileQuery = useGetProfileQuery as jest.Mock

function buildPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'place-1',
    title: 'Genesis Plaza',
    owner: '0xabc',
    user_name: 'Alice',
    ...overrides
  } as DiscoverPlace
}

describe('when resolving the owner avatar for a place', () => {
  beforeEach(() => {
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the owner has a deployed profile with a face256 snapshot', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ name: 'RealOwner', hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer/face256.png' } } }] }
      })
    })

    it('should return the real snapshot and prefer the profile name over scene metadata', () => {
      const { result } = renderHook(() => usePlaceOwnerAvatar(buildPlace()))
      expect(result.current.ownerAvatar).toBe('https://peer/face256.png')
      expect(result.current.ownerName).toBe('RealOwner')
      expect(result.current.avatarBg).toEqual(expect.stringMatching(/^#/))
    })
  })

  describe('and the owner profile has no name (only a snapshot)', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ hasClaimedName: false, avatar: { snapshots: { face256: 'https://peer/face256.png' } } }] }
      })
    })

    it('should fall back to the scene metadata name', () => {
      const { result } = renderHook(() => usePlaceOwnerAvatar(buildPlace()))
      expect(result.current.ownerName).toBe('Alice')
    })
  })

  describe('and the owner has no deployed profile', () => {
    it('should fall back to the synthetic avatar derived from the name', () => {
      const { result } = renderHook(() => usePlaceOwnerAvatar(buildPlace()))
      expect(result.current.ownerAvatar).toBe(getSyntheticAvatarUrl('Alice'))
    })
  })

  describe('and the place has no user_name but a contact_name', () => {
    it('should use the contact name', () => {
      const { result } = renderHook(() => usePlaceOwnerAvatar(buildPlace({ user_name: undefined, contact_name: 'Bob' })))
      expect(result.current.ownerName).toBe('Bob')
    })
  })

  describe('and the place has no owner information at all', () => {
    it('should return undefined for every field and skip the profile query', () => {
      const { result } = renderHook(() =>
        usePlaceOwnerAvatar(buildPlace({ owner: undefined, user_name: undefined, contact_name: undefined }))
      )
      expect(result.current).toEqual({ ownerName: undefined, ownerAvatar: undefined, avatarBg: undefined })
      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
    })
  })

  describe('and the place is undefined (page still resolving)', () => {
    it('should return undefined fields without crashing', () => {
      const { result } = renderHook(() => usePlaceOwnerAvatar(undefined))
      expect(result.current.ownerName).toBeUndefined()
      expect(result.current.ownerAvatar).toBeUndefined()
    })
  })
})
