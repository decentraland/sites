import { renderHook } from '@testing-library/react'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import { useGetProfileCreationsQuery } from '../../../features/profile/profile.creations.client'
import { useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import { useGetProfileCommunitiesQuery } from '../../../features/profile/profile.social.client'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'
import { useProfileTabAvailability } from './useProfileTabAvailability'

jest.mock('../../../features/profile/profile.assets.client', () => ({ useGetProfileAssetsQuery: jest.fn() }))
jest.mock('../../../features/profile/profile.creations.client', () => ({ useGetProfileCreationsQuery: jest.fn() }))
jest.mock('../../../features/profile/profile.places.client', () => ({ useGetProfilePlacesQuery: jest.fn() }))
jest.mock('../../../features/profile/profile.social.client', () => ({ useGetProfileCommunitiesQuery: jest.fn() }))
jest.mock('../../../hooks/useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('../../../hooks/useReelImagesByUser', () => ({ useReelImagesByUser: jest.fn() }))

const mockedUsePlaces = useGetProfilePlacesQuery as jest.MockedFunction<typeof useGetProfilePlacesQuery>
const mockedUseCreations = useGetProfileCreationsQuery as jest.MockedFunction<typeof useGetProfileCreationsQuery>
const mockedUseAssets = useGetProfileAssetsQuery as jest.MockedFunction<typeof useGetProfileAssetsQuery>
const mockedUseCommunities = useGetProfileCommunitiesQuery as jest.MockedFunction<typeof useGetProfileCommunitiesQuery>
const mockedUseAuthIdentity = useAuthIdentity as jest.MockedFunction<typeof useAuthIdentity>
const mockedUseReelImages = useReelImagesByUser as jest.MockedFunction<typeof useReelImagesByUser>

const ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

const emptyQueryResult = { isSuccess: true, isLoading: false, data: { total: 0, data: [] } }
const emptyPhotosResult = { images: [], total: 0, isLoading: false, error: null }

describe('useProfileTabAvailability', () => {
  beforeEach(() => {
    mockedUseAuthIdentity.mockReturnValue({ identity: undefined } as unknown as ReturnType<typeof useAuthIdentity>)
    mockedUsePlaces.mockReturnValue(emptyQueryResult as unknown as ReturnType<typeof useGetProfilePlacesQuery>)
    mockedUseCreations.mockReturnValue(emptyQueryResult as unknown as ReturnType<typeof useGetProfileCreationsQuery>)
    mockedUseAssets.mockReturnValue(emptyQueryResult as unknown as ReturnType<typeof useGetProfileAssetsQuery>)
    mockedUseCommunities.mockReturnValue({
      isSuccess: true,
      isLoading: false,
      data: { data: { results: [], total: 0 } }
    } as unknown as ReturnType<typeof useGetProfileCommunitiesQuery>)
    mockedUseReelImages.mockReturnValue(emptyPhotosResult as unknown as ReturnType<typeof useReelImagesByUser>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when viewing a member profile', () => {
    describe('and the member has no publicly visible communities', () => {
      it('should keep the communities tab hidden', () => {
        const { result } = renderHook(() => useProfileTabAvailability(ADDRESS, false))

        expect(result.current.hidden.has('communities')).toBe(true)
        expect(result.current.isReady).toBe(true)
      })
    })

    describe('and the member has publicly visible communities', () => {
      beforeEach(() => {
        mockedUseCommunities.mockReturnValue({
          isSuccess: true,
          isLoading: false,
          data: { data: { results: [{ id: 'community-1', name: 'Public Community' }], total: 2 } }
        } as unknown as ReturnType<typeof useGetProfileCommunitiesQuery>)
      })

      it('should reveal the communities tab', () => {
        const { result } = renderHook(() => useProfileTabAvailability(ADDRESS, false))

        expect(result.current.hidden.has('communities')).toBe(false)
      })

      it('should run the communities probe without skipping it', () => {
        renderHook(() => useProfileTabAvailability(ADDRESS, false))

        expect(mockedUseCommunities).toHaveBeenCalledWith({ address: ADDRESS, limit: 1, offset: 0 })
      })
    })

    describe('and the communities probe fails', () => {
      beforeEach(() => {
        mockedUseCommunities.mockReturnValue({
          isSuccess: false,
          isLoading: false,
          data: undefined
        } as unknown as ReturnType<typeof useGetProfileCommunitiesQuery>)
      })

      it('should keep the communities tab hidden and still report the probes as ready', () => {
        const { result } = renderHook(() => useProfileTabAvailability(ADDRESS, false))

        expect(result.current.hidden.has('communities')).toBe(true)
        expect(result.current.isReady).toBe(true)
      })
    })

    describe('and the communities probe is still loading', () => {
      beforeEach(() => {
        mockedUseCommunities.mockReturnValue({
          isSuccess: false,
          isLoading: true,
          data: undefined
        } as unknown as ReturnType<typeof useGetProfileCommunitiesQuery>)
      })

      it('should not report the probes as ready', () => {
        const { result } = renderHook(() => useProfileTabAvailability(ADDRESS, false))

        expect(result.current.isReady).toBe(false)
      })
    })
  })

  describe('when viewing the own profile', () => {
    it('should keep every tab visible regardless of counts', () => {
      const { result } = renderHook(() => useProfileTabAvailability(ADDRESS, true))

      expect(result.current.hidden.size).toBe(0)
    })
  })
})
