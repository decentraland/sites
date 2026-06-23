/**
 * @jest-environment node
 */
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => `https://${key.toLowerCase()}.test`
}))

import * as eventsIndex from './index'

describe('features/events barrel', () => {
  it('should re-export every public symbol from the underlying modules', () => {
    expect(eventsIndex.eventsClient).toBeDefined()
    expect(eventsIndex.useCreateEventMutation).toBeDefined()
    expect(eventsIndex.useDeleteEventMutation).toBeDefined()
    expect(eventsIndex.useGetCommunitiesQuery).toBeDefined()
    expect(eventsIndex.useGetEventByIdQuery).toBeDefined()
    expect(eventsIndex.useGetEventsQuery).toBeDefined()
    expect(eventsIndex.useGetLiveNowCardsQuery).toBeDefined()
    expect(eventsIndex.useGetUpcomingEventsQuery).toBeDefined()
    expect(eventsIndex.useGetWorldNamesQuery).toBeDefined()
    expect(eventsIndex.useToggleAttendeeMutation).toBeDefined()
    expect(eventsIndex.useUpdateEventMutation).toBeDefined()
    expect(eventsIndex.useUploadPosterMutation).toBeDefined()
    expect(eventsIndex.useUploadPosterVerticalMutation).toBeDefined()

    expect(eventsIndex.bucketEventsByDay).toBeDefined()
    expect(eventsIndex.DCL_FOUNDATION_LOGO_URL).toBeDefined()
    expect(eventsIndex.DCL_FOUNDATION_NAME).toBeDefined()
    expect(eventsIndex.isDclFoundationCreator).toBeDefined()
    expect(eventsIndex.isDeleted).toBeDefined()
    expect(eventsIndex.isPubliclyVisibleEvent).toBeDefined()

    expect(eventsIndex.adminClient).toBeDefined()
    expect(eventsIndex.useApproveEventMutation).toBeDefined()
    expect(eventsIndex.useGetAdminEventsQuery).toBeDefined()
    expect(eventsIndex.useGetMyProfileSettingsQuery).toBeDefined()
    expect(eventsIndex.useListAdminsQuery).toBeDefined()
    expect(eventsIndex.useRejectEventMutation).toBeDefined()
    expect(eventsIndex.useUpdateAdminPermissionsMutation).toBeDefined()

    expect(eventsIndex.hasAnyAdminPermission).toBeDefined()
    expect(eventsIndex.isValidWalletAddress).toBeDefined()

    expect(eventsIndex.AdminPermission).toBeDefined()
    expect(eventsIndex.REJECT_REASONS).toBeDefined()
    expect(eventsIndex.REJECTION_REASON_MAX_LENGTH).toBeDefined()
    expect(eventsIndex.UPDATEABLE_PERMISSIONS).toBeDefined()

    expect(eventsIndex.useGetWhatsOnDataQuery).toBeDefined()
    expect(eventsIndex.buildExploreCards).toBeDefined()
    expect(eventsIndex.buildPlazaCard).toBeDefined()
    expect(eventsIndex.coordsKey).toBeDefined()
    expect(eventsIndex.findEventAtCoords).toBeDefined()

    expect(eventsIndex.ExploreCardType).toBeDefined()
    expect(eventsIndex.ExploreCardType.PLACE).toBe('place')
    expect(eventsIndex.ExploreCardType.EVENT).toBe('event')
  })
})
