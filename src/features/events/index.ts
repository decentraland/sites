export {
  eventsClient,
  useCreateEventMutation,
  useGetCommunitiesQuery,
  useGetEventByIdQuery,
  useGetEventsQuery,
  useGetLiveNowCardsQuery,
  useGetUpcomingEventsQuery,
  useGetWorldNamesQuery,
  useToggleAttendeeMutation,
  useUpdateEventMutation,
  useUploadPosterMutation,
  useUploadPosterVerticalMutation
} from './events.client'
export { bucketEventsByDay, DCL_FOUNDATION_LOGO_URL, DCL_FOUNDATION_NAME, isDclFoundationCreator } from './events.helpers'
export type { EnrichmentConfig, LiveNowCard } from './events.helpers'
export type { CommunityAttributes, EventEntry, EventListType, EventsQueryParams, EventsResponse, RecurrentFrequency } from './events.types'

export {
  adminClient,
  useApproveEventMutation,
  useGetAdminEventsQuery,
  useGetMyProfileSettingsQuery,
  useListAdminsQuery,
  useRejectEventMutation,
  useUpdateAdminPermissionsMutation
} from './events.admin.client'
export { hasAnyAdminPermission, isValidWalletAddress } from './events.admin.helpers'
export { AdminPermission, REJECT_REASONS, REJECTION_REASON_MAX_LENGTH, UPDATEABLE_PERMISSIONS } from './events.admin.types'
export type {
  AdminEventActionParams,
  AdminProfileSettings,
  AdminRejectEventParams,
  IdentityOnlyParams,
  RejectReasonCode,
  UpdateAdminPermissionsParams
} from './events.admin.types'

export { useGetWhatsOnDataQuery } from './events.discovery'
export { buildExploreCards, buildPlazaCard, coordsKey, findEventAtCoords } from './events.discovery.helpers'
export { ExploreCardType } from './events.discovery.types'
export type { ActiveEntity, ExploreItem, HotScene } from './events.discovery.types'
