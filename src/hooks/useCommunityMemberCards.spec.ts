import { renderHook } from '@testing-library/react'
import { Role } from '../features/communities/communities.types'
import type { CommunityMember } from '../features/communities/communities.types'
import type { ProfileSummary } from '../features/profile/profile.types'
import { useCommunityMemberCards } from './useCommunityMemberCards'

const useProfilesMock = jest.fn()

jest.mock('./useProfiles', () => ({
  useProfiles: (...args: unknown[]) => useProfilesMock(...args)
}))

jest.mock('../config/env', () => ({
  getEnv: () => undefined
}))

const buildMember = (memberAddress: string): CommunityMember => ({
  communityId: 'c-1',
  memberAddress,
  role: Role.MEMBER,
  joinedAt: '2026-01-01T00:00:00Z'
})

// A settled address always has an entry; `name` is undefined for one that settled
// without a deployed profile (or whose batch failed).
const buildProfiles = (entries: Array<[string, string | undefined]>): Map<string, ProfileSummary> =>
  new Map(entries.map(([address, name]) => [address, { address, name, hasClaimedName: Boolean(name) }]))

describe('useCommunityMemberCards', () => {
  let members: CommunityMember[]

  beforeEach(() => {
    members = [buildMember('0xAAA'), buildMember('0xBBB')]
    useProfilesMock.mockReturnValue({ profiles: new Map(), isLoading: true, error: null })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the members arrived but the profile batch has not', () => {
    it('should list every member right away', () => {
      const { result } = renderHook(() => useCommunityMemberCards(members))

      expect(result.current.map(card => card.memberAddress)).toEqual(['0xAAA', '0xBBB'])
    })

    it('should flag each row as still loading its profile', () => {
      const { result } = renderHook(() => useCommunityMemberCards(members))

      expect(result.current.map(card => card.isLoadingProfile)).toEqual([true, true])
    })

    it('should ask for exactly those members profiles', () => {
      renderHook(() => useCommunityMemberCards(members))

      expect(useProfilesMock).toHaveBeenCalledWith(['0xAAA', '0xBBB'])
    })
  })

  describe('when the profile batch covers every member', () => {
    beforeEach(() => {
      useProfilesMock.mockReturnValue({
        profiles: buildProfiles([
          ['0xaaa', 'alice'],
          ['0xbbb', 'bob']
        ]),
        isLoading: false,
        error: null
      })
    })

    it('should expose the resolved names', () => {
      const { result } = renderHook(() => useCommunityMemberCards(members))

      expect(result.current.map(card => card.name)).toEqual(['alice', 'bob'])
    })

    it('should clear the loading flag on every row', () => {
      const { result } = renderHook(() => useCommunityMemberCards(members))

      expect(result.current.map(card => card.isLoadingProfile)).toEqual([false, false])
    })
  })

  describe('when a later page is appended to a resolved list', () => {
    beforeEach(() => {
      useProfilesMock.mockReturnValue({
        profiles: buildProfiles([
          ['0xaaa', 'alice'],
          ['0xbbb', 'bob']
        ]),
        isLoading: true,
        error: null
      })
    })

    it('should keep the earlier rows named and flag only the new one, holding nothing back', () => {
      const { result, rerender } = renderHook(({ list }) => useCommunityMemberCards(list), { initialProps: { list: members } })

      rerender({ list: [...members, buildMember('0xCCC')] })

      expect(result.current.map(card => [card.name, card.isLoadingProfile])).toEqual([
        ['alice', false],
        ['bob', false],
        ['0xCCC', true]
      ])
    })
  })

  describe('when the profile batch failed', () => {
    beforeEach(() => {
      useProfilesMock.mockReturnValue({
        profiles: buildProfiles([
          ['0xaaa', undefined],
          ['0xbbb', undefined]
        ]),
        isLoading: false,
        error: new Error('offline')
      })
    })

    it('should fall back to the address on every row', () => {
      const { result } = renderHook(() => useCommunityMemberCards(members))

      expect(result.current.map(card => card.name)).toEqual(['0xAAA', '0xBBB'])
    })

    it('should stop the skeletons rather than wait on a batch that will not come', () => {
      const { result } = renderHook(() => useCommunityMemberCards(members))

      expect(result.current.map(card => card.isLoadingProfile)).toEqual([false, false])
    })
  })

  describe('when the community has no members', () => {
    it('should return an empty list', () => {
      const { result } = renderHook(() => useCommunityMemberCards([]))

      expect(result.current).toEqual([])
    })
  })
})
