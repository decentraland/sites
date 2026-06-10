/* eslint-disable @typescript-eslint/naming-convention */
import { gatekeeperClient } from '../../services/gatekeeperClient'
import { fetchErrorOf, getGatekeeperUrl, sceneMetadata, sceneSignedFetch } from './sceneGatekeeper.helpers'
import type { GatekeeperError, SceneScope } from './sceneGatekeeper.helpers'
import type { SceneAdmin, SceneAdminTarget } from './sceneGatekeeper.types'

// comms-gatekeeper scene admins: `/scene-admin` (GET list, POST add, DELETE
// remove). Same `validate()` realm-object signed metadata as /scene-bans.
const adminsEndpoints = gatekeeperClient.injectEndpoints({
  endpoints: build => ({
    getSceneAdmins: build.query<SceneAdmin[], SceneScope>({
      queryFn: async ({ identity, sceneId, realmName, parcel }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as GatekeeperError }
        try {
          const response = await sceneSignedFetch(`${getGatekeeperUrl()}/scene-admin`, {
            method: 'GET',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel })
          })
          if (!response.ok) return { error: { status: response.status } as GatekeeperError }
          const json = (await response.json()) as SceneAdmin[] | { admins?: SceneAdmin[] }
          return { data: Array.isArray(json) ? json : json.admins ?? [] }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      providesTags: ['SceneAdmins' as const]
    }),

    addSceneAdmin: build.mutation<void, SceneScope & SceneAdminTarget>({
      queryFn: async ({ identity, sceneId, realmName, parcel, admin, name }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as GatekeeperError }
        try {
          const response = await sceneSignedFetch(`${getGatekeeperUrl()}/scene-admin`, {
            method: 'POST',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel }),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(admin ? { admin } : { name })
          })
          if (!response.ok) return { error: { status: response.status } as GatekeeperError }
          return { data: undefined }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      invalidatesTags: ['SceneAdmins' as const]
    }),

    removeSceneAdmin: build.mutation<void, SceneScope & { admin: string }>({
      queryFn: async ({ identity, sceneId, realmName, parcel, admin }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as GatekeeperError }
        try {
          const response = await sceneSignedFetch(`${getGatekeeperUrl()}/scene-admin`, {
            method: 'DELETE',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel }),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin })
          })
          if (!response.ok) return { error: { status: response.status } as GatekeeperError }
          return { data: undefined }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      invalidatesTags: ['SceneAdmins' as const]
    })
  })
})

const { useGetSceneAdminsQuery, useAddSceneAdminMutation, useRemoveSceneAdminMutation } = adminsEndpoints

export { adminsEndpoints, useAddSceneAdminMutation, useGetSceneAdminsQuery, useRemoveSceneAdminMutation }
