jest.mock('../config/env', () => ({
  getEnv: () => 'https://test'
}))

jest.mock('../utils/signedFetch', () => ({
  fetchWithIdentity: jest.fn(),
  fetchWithOptionalIdentity: jest.fn()
}))

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 })
}))

jest.mock('../services/blogClient', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createApi, fetchBaseQuery } = require('@reduxjs/toolkit/query/react')
  const cmsClient = createApi({
    reducerPath: 'cmsClient',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }),
    endpoints: () => ({})
  })
  return { cmsClient, getCmsBaseUrl: () => 'https://test' }
})

jest.mock('../shells/store', () => ({
  store: { getState: jest.fn().mockReturnValue({}), dispatch: jest.fn() }
}))

jest.mock('@dcl/hooks', () => ({
  useNotifications: jest.fn().mockReturnValue({}),
  useAnalytics: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('decentraland-ui2', () => ({
  NotificationActiveTab: { all: 'all' }
}))

import * as legacyBlog from './blog/blog.client'
import * as legacyBlogSlice from './blog/blog.slice'
import * as legacyCast from './cast2'
import * as legacyCommunities from './communities'
import * as targetBlog from './content/blog/blog.client'
import * as targetBlogSlice from './content/blog/blog.slice'
import * as targetSearch from './content/search/search.client'
import * as legacyDiscoveryClient from './events/events.client'
import * as targetDiscoveryClient from './experiences/discovery/events.client'
import * as targetEvents from './experiences/events'
import * as targetAdmin from './experiences/events/admin'
import * as targetJump from './experiences/jump'
import * as legacyJump from './jump'
import * as targetCast from './media/cast'
import * as targetReels from './media/reels'
import * as legacyNotifications from './notifications/usePageNotifications'
import * as targetNotifications from './platform/notifications/usePageNotifications'
import * as legacyProfile from './profile/profile.client'
import * as legacyReels from './reels'
import * as legacyReport from './report/report.helpers'
import * as targetReport from './safety/report/report.helpers'
import * as legacySearch from './search/search.client'
import * as targetCommunities from './social/communities'
import * as targetProfile from './social/profile/profile.client'
import * as legacyStorage from './storage'
import * as legacyAdmin from './whats-on/admin'
import * as legacyEvents from './whats-on-events'
import * as targetStorage from './world/storage'

describe('feature domain refactor compatibility', () => {
  it('keeps the legacy and target events exports wired to the same runtime objects', () => {
    expect(targetDiscoveryClient.useGetWhatsOnDataQuery).toBe(legacyDiscoveryClient.useGetWhatsOnDataQuery)
    expect(targetEvents.eventsClient).toBe(legacyEvents.eventsClient)
    expect(targetEvents.useGetEventsQuery).toBe(legacyEvents.useGetEventsQuery)
    expect(targetEvents.useGetLiveNowCardsQuery).toBe(legacyEvents.useGetLiveNowCardsQuery)
    expect(targetEvents.useToggleAttendeeMutation).toBe(legacyEvents.useToggleAttendeeMutation)
    expect(targetAdmin.adminClient).toBe(legacyAdmin.adminClient)
    expect(targetAdmin.useGetAdminEventsQuery).toBe(legacyAdmin.useGetAdminEventsQuery)
    expect(targetAdmin.useApproveEventMutation).toBe(legacyAdmin.useApproveEventMutation)
  })

  it('keeps legacy jump and storage exports wired to the same runtime objects', () => {
    expect(targetJump.jumpClient).toBe(legacyJump.jumpClient)
    expect(targetJump.useGetJumpPlacesQuery).toBe(legacyJump.useGetJumpPlacesQuery)
    expect(targetJump.useGetJumpEventsQuery).toBe(legacyJump.useGetJumpEventsQuery)
    expect(targetStorage.storageEndpoints).toBe(legacyStorage.storageEndpoints)
    expect(targetStorage.useListEnvKeysQuery).toBe(legacyStorage.useListEnvKeysQuery)
    expect(targetStorage.useSetPlayerValueMutation).toBe(legacyStorage.useSetPlayerValueMutation)
  })

  it('keeps content blog and search exports wired to the same runtime objects', () => {
    expect(targetBlog.blogClient).toBe(legacyBlog.blogClient)
    expect(targetBlog.useGetBlogPostsQuery).toBe(legacyBlog.useGetBlogPostsQuery)
    expect(targetBlog.useGetBlogPostBySlugQuery).toBe(legacyBlog.useGetBlogPostBySlugQuery)
    expect(targetBlogSlice.blogReducer).toBe(legacyBlogSlice.blogReducer)
    expect(targetSearch.searchClient).toBe(legacySearch.searchClient)
    expect(targetSearch.useSearchBlogQuery).toBe(legacySearch.useSearchBlogQuery)
  })

  it('keeps social profile and communities exports wired to the same runtime objects', () => {
    expect(targetProfile.useGetProfileQuery).toBe(legacyProfile.useGetProfileQuery)
    expect(targetProfile.useGetProfileNames).toBe(legacyProfile.useGetProfileNames)
    expect(targetCommunities.communitiesApi).toBe(legacyCommunities.communitiesApi)
    expect(targetCommunities.useGetCommunityByIdQuery).toBe(legacyCommunities.useGetCommunityByIdQuery)
  })

  it('keeps media cast and reels exports wired to the same runtime objects', () => {
    expect(targetCast.useGetStreamInfoQuery).toBe(legacyCast.useGetStreamInfoQuery)
    expect(targetCast.useGetWorldScenesQuery).toBe(legacyCast.useGetWorldScenesQuery)
    expect(targetReels.fetchImageById).toBe(legacyReels.fetchImageById)
    expect(targetReels.fetchImagesByUser).toBe(legacyReels.fetchImagesByUser)
  })

  it('keeps safety report and platform notifications exports wired to the same runtime objects', () => {
    expect(targetReport.getReportApiUrl).toBe(legacyReport.getReportApiUrl)
    expect(targetReport.buildSubmitPayload).toBe(legacyReport.buildSubmitPayload)
    expect(targetNotifications.usePageNotifications).toBe(legacyNotifications.usePageNotifications)
  })

  it.each([
    ['discovery', legacyDiscoveryClient, targetDiscoveryClient],
    ['events', legacyEvents, targetEvents],
    ['admin', legacyAdmin, targetAdmin],
    ['jump', legacyJump, targetJump],
    ['storage', legacyStorage, targetStorage],
    ['blog client', legacyBlog, targetBlog],
    ['blog slice', legacyBlogSlice, targetBlogSlice],
    ['search', legacySearch, targetSearch],
    ['profile', legacyProfile, targetProfile],
    ['communities', legacyCommunities, targetCommunities],
    ['cast', legacyCast, targetCast],
    ['reels', legacyReels, targetReels],
    ['report', legacyReport, targetReport],
    ['notifications', legacyNotifications, targetNotifications]
  ])('keeps every public export of %s shimmed by name', (_name, legacy, target) => {
    expect(Object.keys(target).sort()).toEqual(Object.keys(legacy).sort())
    for (const key of Object.keys(legacy)) {
      expect((target as Record<string, unknown>)[key]).toBe((legacy as Record<string, unknown>)[key])
    }
  })
})
