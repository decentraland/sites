import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../../config/env'
import { fetchWithIdentity } from '../../../utils/signedFetch'
import type { EventEntry } from '../../whats-on-events/events.types'
import type {
  AdminEventActionParams,
  AdminListEnvelope,
  AdminProfileSettings,
  AdminProfileSettingsEnvelope,
  IdentityOnlyParams,
  UpdateAdminPermissionsParams
} from './admin.types'

const adminClient = createApi({
  reducerPath: 'adminClient',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['MyAdmin', 'Admins', 'PendingEvents'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getMyProfileSettings: build.query<AdminProfileSettings, IdentityOnlyParams>({
      queryFn: async ({ identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const response = await fetchWithIdentity(`${baseUrl}/profiles/me/settings`, identity, 'GET')
          if (!response.ok) {
            throw new Error(`me/settings ${response.status}`)
          }
          const envelope: AdminProfileSettingsEnvelope = await response.json()
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
          const baseUrl = getEnv('EVENTS_API_URL')!
          const response = await fetchWithIdentity(`${baseUrl}/profiles/settings`, identity, 'GET')
          if (!response.ok) {
            throw new Error(`profiles/settings ${response.status}`)
          }
          const envelope: AdminListEnvelope = await response.json()
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
          const baseUrl = getEnv('EVENTS_API_URL')!
          const body = JSON.stringify({ permissions })
          const response = await fetchWithIdentity(
            `${baseUrl}/profiles/${address.toLowerCase()}/settings`,
            identity,
            'PATCH',
            body,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { 'Content-Type': 'application/json' }
          )
          if (!response.ok) {
            const envelope = await response.json().catch(() => null)
            console.error('[Admin] updateAdminPermissions failed', response.status, envelope)
            return { error: { status: response.status, data: null } }
          }
          const envelope: AdminProfileSettingsEnvelope = await response.json()
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
          const baseUrl = getEnv('EVENTS_API_URL')!
          const response = await fetchWithIdentity(`${baseUrl}/events?list=all`, identity, 'GET')
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
      queryFn: async ({ eventId, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const body = JSON.stringify({ approved: true })
          const response = await fetchWithIdentity(
            `${baseUrl}/events/${encodeURIComponent(eventId)}`,
            identity,
            'PATCH',
            body,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { 'Content-Type': 'application/json' }
          )
          if (!response.ok) {
            const envelope = await response.json().catch(() => null)
            console.error('[Admin] approveEvent failed', response.status, envelope)
            return { error: { status: response.status, data: null } }
          }
          return { data: undefined }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      invalidatesTags: ['PendingEvents']
    }),
    rejectEvent: build.mutation<void, AdminEventActionParams>({
      queryFn: async ({ eventId, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const body = JSON.stringify({ rejected: true })
          const response = await fetchWithIdentity(
            `${baseUrl}/events/${encodeURIComponent(eventId)}`,
            identity,
            'PATCH',
            body,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { 'Content-Type': 'application/json' }
          )
          if (!response.ok) {
            const envelope = await response.json().catch(() => null)
            console.error('[Admin] rejectEvent failed', response.status, envelope)
            return { error: { status: response.status, data: null } }
          }
          return { data: undefined }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
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
