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

const buildMember = (memberAddress: string, communityId = 'c-1'): CommunityMember => ({
  communityId,
  memberAddress,
  role: Role.MEMBER,
  joinedAt: '2026-01-01T00:00:00Z'
})

const buildProfiles = (entries: Array<[string, string]>): Map<string, ProfileSummary> =>
  new Map(entries.map(([address, name]) => [address, { address, name, hasClaimedName: true }]))

describe('useCommunityMemberCards', () => {
  let members: CommunityMember[]

  beforeEach(() => {
    members = [buildMember('0xAAA'), buildMember('0xBBB')]
    useProfilesMock.mockReturnValue({ profiles: new Map(), isLoading: false, error: null })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the members arrived but the profile batch has not', () => {
    it('should report that profiles are still resolving', () => {
      const { result } = renderHook(() => useCommunityMemberCards('c-1', members))

      expect(result.current.isResolvingProfiles).toBe(true)
    })

    it('should expose no cards yet, since the caller renders the skeleton instead', () => {
      const { result } = renderHook(() => useCommunityMemberCards('c-1', members))

      expect(result.current.memberCards).toEqual([])
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

    it('should stop resolving', () => {
      const { result } = renderHook(() => useCommunityMemberCards('c-1', members))

      expect(result.current.isResolvingProfiles).toBe(false)
    })

    it('should expose the resolved names', () => {
      const { result } = renderHook(() => useCommunityMemberCards('c-1', members))

      expect(result.current.memberCards.map(card => card.name)).toEqual(['alice', 'bob'])
    })
  })

  describe('when a later page is appended to an already-resolved community', () => {
    it('should keep rendering instead of blanking the list behind a skeleton', () => {
      useProfilesMock.mockReturnValue({
        profiles: buildProfiles([
          ['0xaaa', 'alice'],
          ['0xbbb', 'bob']
        ]),
        isLoading: false,
        error: null
      })
      const { result, rerender } = renderHook(({ list }) => useCommunityMemberCards('c-1', list), {
        initialProps: { list: members }
      })
      expect(result.current.isResolvingProfiles).toBe(false)

      rerender({ list: [...members, buildMember('0xCCC')] })

      expect(result.current.isResolvingProfiles).toBe(false)
    })

    it('should hold back the rows whose profiles are still in flight', () => {
      useProfilesMock.mockReturnValue({
        profiles: buildProfiles([
          ['0xaaa', 'alice'],
          ['0xbbb', 'bob']
        ]),
        isLoading: false,
        error: null
      })
      const { result, rerender } = renderHook(({ list }) => useCommunityMemberCards('c-1', list), {
        initialProps: { list: members }
      })

      rerender({ list: [...members, buildMember('0xCCC')] })

      expect(result.current.memberCards.map(card => card.name)).toEqual(['alice', 'bob'])
    })
  })

  describe('when returning to a community that already resolved earlier', () => {
    it('should not treat it as unresolved again while a later page is pending', () => {
      useProfilesMock.mockReturnValue({
        profiles: buildProfiles([
          ['0xaaa', 'alice'],
          ['0xbbb', 'bob']
        ]),
        isLoading: false,
        error: null
      })
      const { result, rerender } = renderHook(({ id, list }) => useCommunityMemberCards(id, list), {
        initialProps: { id: 'c-1', list: members }
      })
      const otherMembers = [buildMember('0xZZZ', 'c-2')]

      // c-1 resolves, the user visits c-2, then comes back to c-1 with a page appended.
      rerender({ id: 'c-2', list: otherMembers })
      rerender({ id: 'c-1', list: [...members, buildMember('0xCCC')] })

      expect(result.current.isResolvingProfiles).toBe(false)
    })
  })

  describe('when switching to a community whose members overlap the previous one', () => {
    it('should wait rather than render the non-overlapping members as raw addresses', () => {
      useProfilesMock.mockReturnValue({
        profiles: buildProfiles([
          ['0xaaa', 'alice'],
          ['0xbbb', 'bob']
        ]),
        isLoading: false,
        error: null
      })
      const { result, rerender } = renderHook(({ id, list }) => useCommunityMemberCards(id, list), {
        initialProps: { id: 'c-1', list: members }
      })
      expect(result.current.isResolvingProfiles).toBe(false)

      // c-2 shares 0xAAA with c-1, so the shared cache already covers one member.
      rerender({ id: 'c-2', list: [buildMember('0xAAA', 'c-2'), buildMember('0xZZZ', 'c-2')] })

      expect(result.current.isResolvingProfiles).toBe(true)
    })
  })

  describe('when the profile batch failed', () => {
    beforeEach(() => {
      useProfilesMock.mockReturnValue({ profiles: new Map(), isLoading: false, error: new Error('offline') })
    })

    it('should stop waiting and fall through to the address fallback', () => {
      const { result } = renderHook(() => useCommunityMemberCards('c-1', members))

      expect(result.current.isResolvingProfiles).toBe(false)
    })

    it('should keep every member visible rather than hiding rows it cannot resolve', () => {
      const { result } = renderHook(() => useCommunityMemberCards('c-1', members))

      expect(result.current.memberCards.map(card => card.name)).toEqual(['0xAAA', '0xBBB'])
    })
  })

  describe('when the community has no members', () => {
    it('should not gate the empty state behind a skeleton', () => {
      const { result } = renderHook(() => useCommunityMemberCards('c-1', []))

      expect(result.current.isResolvingProfiles).toBe(false)
      expect(result.current.memberCards).toEqual([])
    })
  })
})
