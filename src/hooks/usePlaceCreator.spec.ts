import { renderHook } from '@testing-library/react'
import type { DiscoverPlace } from '../features/discover'
import { useGetProfileQuery } from '../features/profile/profile.client'
import { getSyntheticAvatarUrl } from '../utils/avatarColor'
import { usePlaceCreator } from './usePlaceCreator'

jest.mock('../features/profile/profile.client', () => ({
  useGetProfileQuery: jest.fn()
}))

const mockUseGetProfileQuery = useGetProfileQuery as jest.Mock

// A land owner with a full profile: this is the shape that used to take the
// credit away from the scene's author.
const OWNER_PROFILE = {
  data: { avatars: [{ name: 'LandOwner', hasClaimedName: true, avatar: { snapshots: { face256: 'https://peer/face256.png' } } }] }
}

function buildPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'place-1',
    title: 'Genesis Plaza',
    owner: '0xabc',
    contact_name: 'Alice',
    ...overrides
  } as DiscoverPlace
}

describe('when resolving the creator credited on a place', () => {
  beforeEach(() => {
    mockUseGetProfileQuery.mockReturnValue({ data: undefined })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the scene declares a contact name', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it('should credit the contact rather than whoever owns the land', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace()))

      expect(result.current.creatorName).toBe('Alice')
    })

    it('should NOT show the land owner face next to somebody else name', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace()))

      expect(result.current.creatorAvatar).toBe(getSyntheticAvatarUrl('Alice'))
    })

    it('should colour the avatar after the credited contact, not the owner address', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace()))
      const withoutOwner = renderHook(() => usePlaceCreator(buildPlace({ owner: undefined })))

      // Same contact, so the same color whoever holds the land.
      expect(result.current.avatarBg).toBe(withoutOwner.result.current.avatarBg)
      expect(result.current.avatarBg).toEqual(expect.stringMatching(/^#/))
    })

    it('should trim the contact name', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: '  Alice  ' })))

      expect(result.current.creatorName).toBe('Alice')
    })
  })

  describe('and the scene declares no contact name', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it('should fall back to the owner profile, face included', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: undefined })))

      expect(result.current.creatorName).toBe('LandOwner')
      expect(result.current.creatorAvatar).toBe('https://peer/face256.png')
    })
  })

  describe('and the contact name is the sdk-commands default', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it.each(['SDK', 'sdk', ' Sdk '])('should treat %s as no contact at all', contactName => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: contactName })))

      expect(result.current.creatorName).toBe('LandOwner')
    })
  })

  describe('and the owner profile carries a snapshot but no name', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ hasClaimedName: false, avatar: { snapshots: { face256: 'https://peer/face256.png' } } }] }
      })
    })

    it('should credit the contact and still keep its own avatar', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace()))

      expect(result.current.creatorName).toBe('Alice')
      expect(result.current.creatorAvatar).toBe(getSyntheticAvatarUrl('Alice'))
    })

    it('should render no by-line when there is no contact either', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: undefined })))

      expect(result.current.creatorName).toBeUndefined()
    })
  })

  describe('and the owner has no deployed profile', () => {
    it('should derive the avatar from the contact name', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace()))

      expect(result.current.creatorAvatar).toBe(getSyntheticAvatarUrl('Alice'))
    })
  })

  describe('and the place carries no identity at all', () => {
    it('should return undefined for every field and skip the profile query', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ owner: undefined, contact_name: undefined })))

      expect(result.current).toEqual({ creatorName: undefined, creatorAvatar: undefined, avatarBg: undefined })
      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
    })
  })

  describe('and the place is undefined (page still resolving)', () => {
    it('should return undefined fields without crashing', () => {
      const { result } = renderHook(() => usePlaceCreator(undefined))

      expect(result.current.creatorName).toBeUndefined()
      expect(result.current.creatorAvatar).toBeUndefined()
    })
  })
})
