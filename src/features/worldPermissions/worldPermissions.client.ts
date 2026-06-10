import { getWorldsContentServerUrl, storageClient } from '../../services/storageClient'
import { createScopedSignedFetch, sendSignedFetch } from '../storage/storage.helpers'
import type { WrapSignedFetchError } from '../storage/storage.types'
import type { WorldPermissionMutationArgs, WorldPermissionsResponse } from './worldPermissions.types'

function permissionUrl(worldName: string, permission: string, address: string): string {
  return `${getWorldsContentServerUrl()}/world/${encodeURIComponent(worldName.toLowerCase())}/permissions/${permission}/${encodeURIComponent(address)}`
}

// worlds-content-server world ACL: who can deploy / stream / access the world.
// GET is public; PUT/DELETE on an address are signed-fetch (wallet identity, no
// scene metadata — wallet-scoped like /wallet/contribute in storage.client).
const worldPermissionsEndpoints = storageClient.injectEndpoints({
  endpoints: build => ({
    getWorldPermissions: build.query<WorldPermissionsResponse, { worldName: string }>({
      queryFn: async ({ worldName }) => {
        try {
          const response = await fetch(`${getWorldsContentServerUrl()}/world/${encodeURIComponent(worldName.toLowerCase())}/permissions`)
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text().catch(() => undefined) } }
          }
          return { data: (await response.json()) as WorldPermissionsResponse }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR' as const, error: error instanceof Error ? error.message : String(error) } }
        }
      },
      providesTags: (_result, _error, { worldName }) => [{ type: 'WorldPermissions' as const, id: worldName.toLowerCase() }]
    }),

    addWorldPermission: build.mutation<void, WorldPermissionMutationArgs>({
      queryFn: async ({ identity, worldName, permission, address }) => {
        try {
          await sendSignedFetch(createScopedSignedFetch(identity), permissionUrl(worldName, permission, address), { method: 'PUT' })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, { worldName }) => [{ type: 'WorldPermissions' as const, id: worldName.toLowerCase() }]
    }),

    removeWorldPermission: build.mutation<void, WorldPermissionMutationArgs>({
      queryFn: async ({ identity, worldName, permission, address }) => {
        try {
          await sendSignedFetch(createScopedSignedFetch(identity), permissionUrl(worldName, permission, address), { method: 'DELETE' })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, { worldName }) => [{ type: 'WorldPermissions' as const, id: worldName.toLowerCase() }]
    })
  })
})

const { useGetWorldPermissionsQuery, useAddWorldPermissionMutation, useRemoveWorldPermissionMutation } = worldPermissionsEndpoints

export { useAddWorldPermissionMutation, useGetWorldPermissionsQuery, useRemoveWorldPermissionMutation, worldPermissionsEndpoints }
