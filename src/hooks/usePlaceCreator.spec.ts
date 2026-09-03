import { renderHook } from '@testing-library/react'
import type { DiscoverPlace } from '../features/discover'
import { useGetProfileQuery } from '../features/profile/profile.client'
import { getSyntheticAvatarUrl } from '../utils/avatarColor'
import { usePlaceCreator } from './usePlaceCreator'

jest.mock('../features/profile/profile.client', () => ({
  useGetProfileQuery: jest.fn()
}))

const mockUseGetProfileQuery = useGetProfileQuery as jest.Mock

const OWNER_ADDRESS = '0x1111111111111111111111111111111111111111'
const CREATOR_ADDRESS = '0x2222222222222222222222222222222222222222'
const FACE_URL = 'https://peer.example.com/face256.png'

// A land owner with a full profile: this is the shape that used to take the
// credit away from the scene's author.
const OWNER_PROFILE = {
  data: { avatars: [{ name: 'ExampleLandOwner', hasClaimedName: true, avatar: { snapshots: { face256: FACE_URL } } }] }
}

function buildPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'place-1',
    title: 'Genesis Plaza',
    owner: OWNER_ADDRESS,
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

  describe('and the places-api reports the wallet that deployed the scene', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it('should resolve the profile from that wallet rather than from the land owner', () => {
      renderHook(() => usePlaceCreator(buildPlace({ creator_address: CREATOR_ADDRESS })))

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(CREATOR_ADDRESS, { skip: false })
    })

    it('should show that creator real face next to the contact the scene declares', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ creator_address: CREATOR_ADDRESS })))

      expect(result.current.creatorName).toBe('Alice')
      expect(result.current.creatorAvatar).toBe(FACE_URL)
    })

    it('should trim the reported address', () => {
      renderHook(() => usePlaceCreator(buildPlace({ creator_address: `  ${CREATOR_ADDRESS}  ` })))

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(CREATOR_ADDRESS, { skip: false })
    })

    it('should fall back to the profile name when the scene declares no usable contact', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ creator_address: CREATOR_ADDRESS, contact_name: 'SDK' })))

      expect(result.current.creatorName).toBe('ExampleLandOwner')
      expect(result.current.creatorAvatar).toBe(FACE_URL)
    })
  })

  describe('and the reported creator address is a free-text label rather than a wallet', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it('should fall back to the land owner instead of trusting the label as an address', () => {
      renderHook(() => usePlaceCreator(buildPlace({ creator_address: 'Example Studio' })))

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(OWNER_ADDRESS, { skip: false })
    })

    it('should keep hiding the owner face behind the credited contact', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ creator_address: 'Example Studio' })))

      expect(result.current.creatorAvatar).toBe(getSyntheticAvatarUrl('Alice'))
    })
  })

  describe('and the scene declares a contact name with only a land owner to fall back on', () => {
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
      const withoutOwner = renderHook(() => usePlaceCreator(buildPlace({ owner: null })))

      // Same contact, so the same color whoever holds the land.
      expect(result.current.avatarBg).toBe(withoutOwner.result.current.avatarBg)
      expect(result.current.avatarBg).toEqual(expect.stringMatching(/^#/))
    })

    it('should trim the contact name', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: '  Alice  ' })))

      expect(result.current.creatorName).toBe('Alice')
    })
  })

  describe('and the owner is a free-text label rather than a wallet', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it('should skip the profile query instead of asking catalyst for a display name', () => {
      renderHook(() => usePlaceCreator(buildPlace({ owner: 'Digital Fashion Week' })))

      expect(mockUseGetProfileQuery).toHaveBeenCalledWith(undefined, { skip: true })
    })
  })

  describe('and the scene declares no contact name', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it('should fall back to the owner profile, face included', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: undefined })))

      expect(result.current.creatorName).toBe('ExampleLandOwner')
      expect(result.current.creatorAvatar).toBe(FACE_URL)
    })
  })

  describe('and the contact name is the sdk-commands default', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue(OWNER_PROFILE)
    })

    it.each(['SDK', 'sdk', ' Sdk '])('should treat %s as no contact at all', contactName => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: contactName })))

      expect(result.current.creatorName).toBe('ExampleLandOwner')
    })

    it.each(['', '   '])('should treat an empty contact (%p) as no contact at all', contactName => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: contactName })))

      expect(result.current.creatorName).toBe('ExampleLandOwner')
    })
  })

  describe('and the contact name is not ASCII', () => {
    it('should credit it and still derive an avatar from it', () => {
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ contact_name: 'Ñoño' })))

      expect(result.current.creatorName).toBe('Ñoño')
      expect(result.current.creatorAvatar).toBe(getSyntheticAvatarUrl('Ñoño'))
      expect(result.current.avatarBg).toEqual(expect.stringMatching(/^#/))
    })
  })

  describe('and the owner profile carries a snapshot but no name', () => {
    beforeEach(() => {
      mockUseGetProfileQuery.mockReturnValue({
        data: { avatars: [{ hasClaimedName: false, avatar: { snapshots: { face256: FACE_URL } } }] }
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
      const { result } = renderHook(() => usePlaceCreator(buildPlace({ owner: null, contact_name: undefined })))

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
