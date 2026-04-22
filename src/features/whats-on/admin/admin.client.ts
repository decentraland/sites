import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../../config/env'
import { fetchWithIdentity } from '../../../utils/signedFetch'
import type { EventEntry } from '../../whats-on-events/events.types'
import type { AdminEventActionParams, AdminProfileSettings, IdentityOnlyParams, UpdateAdminPermissionsParams } from './admin.types'

// eslint-disable-next-line @typescript-eslint/naming-convention
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const

const getEventsApiUrl = (): string => {
  const url = getEnv('EVENTS_API_URL')
  if (!url) throw new Error('[adminClient] EVENTS_API_URL is required')
  return url
}

const buildEventActionQueryFn =
  (key: 'approved' | 'rejected') =>
  async ({ eventId, identity }: AdminEventActionParams) => {
    try {
      const body = JSON.stringify({ [key]: true })
      const response = await fetchWithIdentity(
        `${getEventsApiUrl()}/events/${encodeURIComponent(eventId)}`,
        identity,
        'PATCH',
        body,
        JSON_HEADERS
      )
      if (!response.ok) {
        console.error(`[Admin] ${key}Event failed`, response.status)
        return { error: { status: response.status, data: null } }
      }
      return { data: undefined as void }
    } catch (error) {
      return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

const adminClient = createApi({
  reducerPath: 'adminClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['MyAdmin', 'Admins', 'PendingEvents'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getMyProfileSettings: build.query<AdminProfileSettings, IdentityOnlyParams>({
      queryFn: async ({ identity }) => {
        try {
          const response = await fetchWithIdentity(`${getEventsApiUrl()}/profiles/me/settings`, identity, 'GET')
          if (!response.ok) {
            throw new Error(`me/settings ${response.status}`)
          }
          const envelope: { ok: boolean; data: AdminProfileSettings } = await response.json()
          return { data: envelope.data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['MyAdmin']
    }),
    listAdmins: build.query<AdminProfileSettings[], IdentityOnlyParams>({
      queryFn: async ({ identity }) => {
        try {
          const response = await fetchWithIdentity(`${getEventsApiUrl()}/profiles/settings`, identity, 'GET')
          if (!response.ok) {
            throw new Error(`profiles/settings ${response.status}`)
          }
          const envelope: { ok: boolean; data: AdminProfileSettings[] } = await response.json()
          return { data: envelope.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['Admins']
    }),
    updateAdminPermissions: build.mutation<AdminProfileSettings, UpdateAdminPermissionsParams>({
      queryFn: async ({ address, permissions, identity }) => {
        try {
          const body = JSON.stringify({ permissions })
          const response = await fetchWithIdentity(
            `${getEventsApiUrl()}/profiles/${address.toLowerCase()}/settings`,
            identity,
            'PATCH',
            body,
            JSON_HEADERS
          )
          if (!response.ok) {
            console.error('[Admin] updateAdminPermissions failed', response.status)
            return { error: { status: response.status, data: null } }
          }
          const envelope: { ok: boolean; data: AdminProfileSettings } = await response.json()
          return { data: envelope.data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      invalidatesTags: ['Admins', 'MyAdmin']
    }),
    getAdminEvents: build.query<EventEntry[], IdentityOnlyParams>({
      queryFn: async ({ identity }) => {
        try {
          const response = await fetchWithIdentity(`${getEventsApiUrl()}/events?list=all`, identity, 'GET')
          if (!response.ok) {
            throw new Error(`admin events ${response.status}`)
          }
          const envelope: { data?: EventEntry[] } = await response.json()
          return { data: envelope.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['PendingEvents']
    }),
    approveEvent: build.mutation<void, AdminEventActionParams>({
      queryFn: buildEventActionQueryFn('approved'),
      invalidatesTags: ['PendingEvents']
    }),
    rejectEvent: build.mutation<void, AdminEventActionParams>({
      queryFn: buildEventActionQueryFn('rejected'),
      invalidatesTags: ['PendingEvents']
    })
  })
})

const {
  useApproveEventMutation,
  useGetAdminEventsQuery,
  useGetMyProfileSettingsQuery,
  useListAdminsQuery,
  useRejectEventMutation,
  useUpdateAdminPermissionsMutation
} = adminClient

export {
  adminClient,
  useApproveEventMutation,
  useGetAdminEventsQuery,
  useGetMyProfileSettingsQuery,
  useListAdminsQuery,
  useRejectEventMutation,
  useUpdateAdminPermissionsMutation
}
