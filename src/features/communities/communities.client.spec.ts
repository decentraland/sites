/**
 * @jest-environment node
 */
/* eslint-disable import/order */
import { configureStore } from '@reduxjs/toolkit'

const signedFetchMock = jest.fn()

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => signedFetchMock
}))

jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: () => undefined
}))

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => {
    if (key === 'SOCIAL_API_URL') return 'https://social-api.test'
    if (key === 'EVENTS_API_URL') return 'https://events-api.test'
    return undefined
  }
}))

const fakeStorage = (() => {
  const store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => undefined
  }
})()
;(globalThis as unknown as { localStorage: Storage }).localStorage = fakeStorage as unknown as Storage

import { socialClient } from '../../services/socialClient'
import { communitiesApi } from './communities.client'
import { Privacy, RequestStatus, RequestType, Role } from './communities.types'
/* eslint-enable import/order */

type QueuedResponse = { body?: unknown; status?: number }

const buildStore = () =>
  configureStore({
    reducer: { [socialClient.reducerPath]: socialClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(socialClient.middleware)
  })

const buildCommunity = () => ({
  id: 'c-1',
  name: 'a community',
  description: 'about it',
  ownerAddress: '0xowner',
  privacy: Privacy.PUBLIC,
  visibility: 'all',
  active: true,
  membersCount: 3,
  role: Role.NONE
})

const buildMembersPage = (addresses: string[], page: number) => ({
  data: {
    results: addresses.map(memberAddress => ({
      communityId: 'c-1',
      memberAddress,
      role: Role.MEMBER,
      joinedAt: '2026-01-01T00:00:00Z'
    })),
    total: 4,
    page,
    pages: 2,
    limit: 2
  }
})

const buildEventsPage = (ids: string[], total: number) => ({
  ok: true,
  data: {
    events: ids.map(id => ({
      id,
      name: `event ${id}`,
      ['start_at']: '2026-01-01T00:00:00Z',
      ['finish_at']: '2026-01-01T01:00:00Z',
      ['total_attendees']: 0,
      ['latest_attendees']: [],
      approved: true,
      rejected: false
    })),
    total
  }
})

const buildMemberRequestsPage = () => ({
  data: {
    results: [{ ...buildCommunity(), id: 'r-1', communityId: 'c-1', type: RequestType.REQUEST_TO_JOIN, status: RequestStatus.PENDING }],
    total: 1,
    page: 1,
    pages: 1,
    limit: 10
  }
})

describe('communitiesApi', () => {
  let responses: QueuedResponse[]

  beforeEach(() => {
    responses = []
    signedFetchMock.mockReset()
    global.fetch = jest.fn(async () => {
      const next = responses.shift() ?? {}
      return new Response(JSON.stringify(next.body ?? { data: {} }), {
        status: next.status ?? 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }) as unknown as typeof fetch
  })

  const readRequest = (index = 0) => {
    const called = (global.fetch as jest.Mock).mock.calls[index][0]
    return typeof called === 'string' ? { url: called, method: 'GET' } : { url: called.url, method: called.method }
  }

  const selectCommunity = (store: ReturnType<typeof buildStore>) =>
    communitiesApi.endpoints.getCommunityById.select({ id: 'c-1', isSigned: true })(store.getState()).data?.data

  const selectMemberRequests = (store: ReturnType<typeof buildStore>) =>
    communitiesApi.endpoints.getMemberRequests.select({ address: '0xabc', type: RequestType.REQUEST_TO_JOIN })(store.getState()).data?.data

  describe('when reading a single community', () => {
    it('should call the address-only v2 endpoint with the id encoded', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getCommunityById.initiate({ id: 'weird id?#', isSigned: false }))

      expect(readRequest().url).toBe('https://social-api.test/v2/communities/weird%20id%3F%23')
    })
  })

  describe('when reading community members', () => {
    it('should call the address-only v2 endpoint with the pagination params', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getCommunityMembers.initiate({ id: 'c-1', limit: 10, offset: 20 }))

      expect(readRequest().url).toBe('https://social-api.test/v2/communities/c-1/members?limit=10&offset=20')
    })

    it('should omit the query string when no pagination is supplied', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getCommunityMembers.initiate({ id: 'c-1' }))

      expect(readRequest().url).toBe('https://social-api.test/v2/communities/c-1/members')
    })
  })

  describe('and a second members page is requested', () => {
    beforeEach(() => {
      responses = [{ body: buildMembersPage(['0xAAA', '0xBBB'], 1) }, { body: buildMembersPage(['0xCCC', '0xDDD'], 2) }]
    })

    it('should append the new results to the cached ones', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getCommunityMembers.initiate({ id: 'c-1', limit: 2, offset: 0 }))
      const result = await store.dispatch(communitiesApi.endpoints.getCommunityMembers.initiate({ id: 'c-1', limit: 2, offset: 2 }))

      expect(result.data?.data.results.map(member => member.memberAddress)).toEqual(['0xAAA', '0xBBB', '0xCCC', '0xDDD'])
    })
  })

  describe('and an empty members page comes back', () => {
    beforeEach(() => {
      responses = [{ body: buildMembersPage(['0xAAA'], 1) }, { body: buildMembersPage([], 2) }]
    })

    it('should keep the cached results untouched', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getCommunityMembers.initiate({ id: 'c-1', limit: 2, offset: 0 }))
      const result = await store.dispatch(communitiesApi.endpoints.getCommunityMembers.initiate({ id: 'c-1', limit: 2, offset: 2 }))

      expect(result.data?.data.results.map(member => member.memberAddress)).toEqual(['0xAAA'])
    })
  })

  describe('when reading the member requests', () => {
    it('should call the address-only v2 endpoint with the type filter', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getMemberRequests.initiate({ address: '0xabc', type: RequestType.REQUEST_TO_JOIN }))

      expect(readRequest().url).toBe('https://social-api.test/v2/members/0xabc/requests?type=request_to_join')
    })

    it('should omit the query string when no type filter is supplied', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getMemberRequests.initiate({ address: '0xabc' }))

      expect(readRequest().url).toBe('https://social-api.test/v2/members/0xabc/requests')
    })
  })

  describe('when a read fails', () => {
    beforeEach(() => {
      responses = [{ status: 500 }, { status: 500 }, { status: 500 }]
    })

    it('should surface the error without caching data for any of the v2 reads', async () => {
      const store = buildStore()

      const community = await store.dispatch(communitiesApi.endpoints.getCommunityById.initiate({ id: 'c-1', isSigned: false }))
      const members = await store.dispatch(communitiesApi.endpoints.getCommunityMembers.initiate({ id: 'c-2' }))
      const requests = await store.dispatch(communitiesApi.endpoints.getMemberRequests.initiate({ address: '0xdead' }))

      expect([community.data, members.data, requests.data]).toEqual([undefined, undefined, undefined])
      expect([community.isError, members.isError, requests.isError]).toEqual([true, true, true])
    })
  })

  describe('when reading the community events', () => {
    beforeEach(() => {
      responses = [{ body: buildEventsPage(['e-1'], 2) }, { body: buildEventsPage(['e-2'], 2) }]
    })

    it('should hit the events API instead of the social API', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getCommunityEvents.initiate({ communityId: 'c-1', limit: 12, offset: 0 }))

      expect(readRequest().url).toBe('https://events-api.test/events?community_id=c-1&limit=12&offset=0')
    })

    it('should camel-case the events and append later pages', async () => {
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.getCommunityEvents.initiate({ communityId: 'c-1', limit: 1, offset: 0 }))
      const result = await store.dispatch(communitiesApi.endpoints.getCommunityEvents.initiate({ communityId: 'c-1', limit: 1, offset: 1 }))

      expect(result.data?.data.events.map(event => event.id)).toEqual(['e-1', 'e-2'])
      expect(result.data?.data.events[0].startAt).toBe('2026-01-01T00:00:00Z')
    })
  })

  describe('when joining a community', () => {
    beforeEach(async () => {
      responses = [{ body: { data: buildCommunity() } }]
    })

    it('should keep posting to the v1 endpoint, which has no v2 counterpart', async () => {
      responses = []
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.joinCommunity.initiate('c-1'))

      expect(readRequest()).toEqual({ url: 'https://social-api.test/v1/communities/c-1/members', method: 'POST' })
    })

    it('should optimistically promote the cached role to member', async () => {
      const store = buildStore()
      const seeded = store.dispatch(communitiesApi.endpoints.getCommunityById.initiate({ id: 'c-1', isSigned: true }))
      await seeded

      // Read before awaiting: the patch lands synchronously, the tag invalidation
      // that follows a successful join would refetch the entry away.
      const pending = store.dispatch(communitiesApi.endpoints.joinCommunity.initiate('c-1'))
      const optimisticRole = selectCommunity(store)?.role
      await pending
      seeded.unsubscribe()

      expect(optimisticRole).toBe(Role.MEMBER)
    })

    it('should undo the optimistic role when the request fails', async () => {
      responses.push({ status: 500 })
      const store = buildStore()
      const seeded = store.dispatch(communitiesApi.endpoints.getCommunityById.initiate({ id: 'c-1', isSigned: true }))
      await seeded

      await store.dispatch(communitiesApi.endpoints.joinCommunity.initiate('c-1'))
      seeded.unsubscribe()

      expect(selectCommunity(store)?.role).toBe(Role.NONE)
    })
  })

  describe('when creating a join request', () => {
    beforeEach(() => {
      responses = [{ body: buildMemberRequestsPage() }]
    })

    it('should keep posting to the v1 endpoint, which has no v2 counterpart', async () => {
      responses = []
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.createCommunityRequest.initiate({ communityId: 'c-1', targetedAddress: '0xabc' }))

      expect(readRequest()).toEqual({ url: 'https://social-api.test/v1/communities/c-1/requests', method: 'POST' })
    })

    it('should optimistically prepend a pending request', async () => {
      const store = buildStore()
      const seeded = store.dispatch(
        communitiesApi.endpoints.getMemberRequests.initiate({ address: '0xabc', type: RequestType.REQUEST_TO_JOIN })
      )
      await seeded

      const pending = store.dispatch(
        communitiesApi.endpoints.createCommunityRequest.initiate({ communityId: 'c-1', targetedAddress: '0xabc' })
      )
      const optimistic = selectMemberRequests(store)
      await pending
      seeded.unsubscribe()

      expect(optimistic?.total).toBe(2)
      expect(optimistic?.results[0].status).toBe(RequestStatus.PENDING)
    })

    it('should undo the optimistic request when the call fails', async () => {
      responses.push({ status: 500 })
      const store = buildStore()
      const seeded = store.dispatch(
        communitiesApi.endpoints.getMemberRequests.initiate({ address: '0xabc', type: RequestType.REQUEST_TO_JOIN })
      )
      await seeded

      await store.dispatch(communitiesApi.endpoints.createCommunityRequest.initiate({ communityId: 'c-1', targetedAddress: '0xabc' }))
      seeded.unsubscribe()

      expect(selectMemberRequests(store)?.total).toBe(1)
    })
  })

  describe('when cancelling a join request', () => {
    beforeEach(() => {
      responses = [{ body: buildMemberRequestsPage() }]
    })

    it('should keep patching the v1 endpoint, which has no v2 counterpart', async () => {
      responses = []
      const store = buildStore()

      await store.dispatch(communitiesApi.endpoints.cancelCommunityRequest.initiate({ communityId: 'c-1', requestId: 'r-1' }))

      expect(readRequest()).toEqual({ url: 'https://social-api.test/v1/communities/c-1/requests/r-1', method: 'PATCH' })
    })

    it('should optimistically drop the cancelled request', async () => {
      const store = buildStore()
      const seeded = store.dispatch(
        communitiesApi.endpoints.getMemberRequests.initiate({ address: '0xabc', type: RequestType.REQUEST_TO_JOIN })
      )
      await seeded

      const pending = store.dispatch(
        communitiesApi.endpoints.cancelCommunityRequest.initiate({ communityId: 'c-1', requestId: 'r-1', address: '0xabc' })
      )
      const optimistic = selectMemberRequests(store)
      await pending
      seeded.unsubscribe()

      expect(optimistic?.results).toEqual([])
      expect(optimistic?.total).toBe(0)
    })

    it('should restore the request when the call fails', async () => {
      responses.push({ status: 500 })
      const store = buildStore()
      const seeded = store.dispatch(
        communitiesApi.endpoints.getMemberRequests.initiate({ address: '0xabc', type: RequestType.REQUEST_TO_JOIN })
      )
      await seeded

      await store.dispatch(
        communitiesApi.endpoints.cancelCommunityRequest.initiate({ communityId: 'c-1', requestId: 'r-1', address: '0xabc' })
      )
      seeded.unsubscribe()

      expect(selectMemberRequests(store)?.results.map(request => request.id)).toEqual(['r-1'])
    })
  })
})
