import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../../config/env'
import { fetchWithIdentity } from '../../../utils/signedFetch'
import type { AdminListEnvelope, AdminProfileSettings, AdminProfileSettingsEnvelope, IdentityOnlyParams } from './admin.types'

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
    })
  })
})

const { useGetMyProfileSettingsQuery, useListAdminsQuery } = adminClient

export { adminClient, useGetMyProfileSettingsQuery, useListAdminsQuery }
