/* eslint-disable @typescript-eslint/naming-convention */
import { gatekeeperClient } from '../../services/gatekeeperClient'
import { fetchErrorOf, getGatekeeperUrl, sceneMetadata, sceneSignedFetch } from './sceneGatekeeper.helpers'
import type { GatekeeperError, SceneScope } from './sceneGatekeeper.helpers'
import type { SceneStreamAccess } from './sceneGatekeeper.types'

const STREAM_URL = (): string => `${getGatekeeperUrl()}/scene-stream-access`

// comms-gatekeeper OBS/RTMP streaming credentials for a scene:
// GET (current key), POST (create/get), PUT (reset → new key), DELETE (revoke).
// Same `validate()` realm-object signed metadata as /scene-bans.
const streamingEndpoints = gatekeeperClient.injectEndpoints({
  endpoints: build => ({
    // Current streaming key, or null when none has been generated yet.
    getSceneStream: build.query<SceneStreamAccess | null, SceneScope>({
      queryFn: async ({ identity, sceneId, realmName, parcel }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as GatekeeperError }
        try {
          const response = await sceneSignedFetch(STREAM_URL(), {
            method: 'GET',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel })
          })
          if (response.status === 404) return { data: null }
          if (!response.ok) return { error: { status: response.status } as GatekeeperError }
          return { data: (await response.json()) as SceneStreamAccess }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      providesTags: ['SceneStream' as const]
    }),

    createSceneStream: build.mutation<SceneStreamAccess, SceneScope>({
      queryFn: scope => streamMutation('POST', scope),
      invalidatesTags: ['SceneStream' as const]
    }),

    resetSceneStream: build.mutation<SceneStreamAccess, SceneScope>({
      queryFn: scope => streamMutation('PUT', scope),
      invalidatesTags: ['SceneStream' as const]
    }),

    revokeSceneStream: build.mutation<void, SceneScope>({
      queryFn: async ({ identity, sceneId, realmName, parcel }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as GatekeeperError }
        try {
          const response = await sceneSignedFetch(STREAM_URL(), {
            method: 'DELETE',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel })
          })
          if (!response.ok) return { error: { status: response.status } as GatekeeperError }
          return { data: undefined }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      invalidatesTags: ['SceneStream' as const]
    })
  })
})

// POST/PUT share the same flow (mint or reset the key), differing only by verb.
async function streamMutation(method: 'POST' | 'PUT', scope: SceneScope) {
  const { identity, sceneId, realmName, parcel } = scope
  if (!identity) return { error: { status: 'NO_IDENTITY' } as GatekeeperError }
  try {
    const response = await sceneSignedFetch(STREAM_URL(), {
      method,
      identity,
      metadata: sceneMetadata({ identity, sceneId, realmName, parcel })
    })
    if (!response.ok) return { error: { status: response.status } as GatekeeperError }
    return { data: (await response.json()) as SceneStreamAccess }
  } catch (error) {
    return fetchErrorOf(error)
  }
}

const { useGetSceneStreamQuery, useCreateSceneStreamMutation, useResetSceneStreamMutation, useRevokeSceneStreamMutation } =
  streamingEndpoints

export {
  streamingEndpoints,
  useCreateSceneStreamMutation,
  useGetSceneStreamQuery,
  useResetSceneStreamMutation,
  useRevokeSceneStreamMutation
}
