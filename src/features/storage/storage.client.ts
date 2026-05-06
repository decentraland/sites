import { getStorageApiUrl, getWorldsContentServerUrl, storageClient } from '../../services/storageClient'
import { createScopedSignedFetch, sendSignedFetch, storageContextId, wrapSignedFetch } from './storage.helpers'
import type {
  AuthParams,
  ClearPlayerParams,
  ContributableDomain,
  ContributableDomainsResponse,
  DeleteEnvParams,
  DeletePlayerValueParams,
  DeleteSceneValueParams,
  EnvKey,
  GetPlayerValueParams,
  GetSceneValueParams,
  ListEnvKeysResponse,
  ListPlayerKeysParams,
  ListPlayersResponse,
  ListStorageItemsResponse,
  PlayerKey,
  PlayerValue,
  SceneKey,
  SceneValue,
  SetEnvParams,
  SetPlayerValueParams,
  SetSceneValueParams,
  StorageContext,
  StorageValueResponse,
  WorldScene,
  WorldScenesResponse,
  WrapSignedFetchError
} from './storage.types'

// eslint-disable-next-line @typescript-eslint/naming-convention
const ALL_DELETE_HEADERS = { 'X-Confirm-Delete-All': 'true' }
// eslint-disable-next-line @typescript-eslint/naming-convention
const JSON_HEADERS = { 'Content-Type': 'application/json' }

const storageEndpoints = storageClient.injectEndpoints({
  endpoints: build => ({
    listEnvKeys: build.query<EnvKey[], AuthParams & StorageContext>({
      queryFn: async ({ identity, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<ListEnvKeysResponse>(signedFetch, `${getStorageApiUrl()}/env`)
          return { data: response.data.map(key => ({ key })) }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        storageContext: storageContextId(queryArgs)
      }),
      providesTags: (_result, _error, args) => [{ type: 'Env' as const, id: storageContextId(args) }]
    }),

    setEnv: build.mutation<void, SetEnvParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, key, value, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(signedFetch, `${getStorageApiUrl()}/env/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: JSON_HEADERS,
            body: JSON.stringify({ value })
          })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Env' as const, id: storageContextId(args) }]
    }),

    deleteEnv: build.mutation<void, DeleteEnvParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, key, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(signedFetch, `${getStorageApiUrl()}/env/${encodeURIComponent(key)}`, { method: 'DELETE' })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Env' as const, id: storageContextId(args) }]
    }),

    clearEnv: build.mutation<void, AuthParams & StorageContext>({
      queryFn: async ({ identity, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(signedFetch, `${getStorageApiUrl()}/env`, { method: 'DELETE', headers: ALL_DELETE_HEADERS })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Env' as const, id: storageContextId(args) }]
    }),

    listSceneKeys: build.query<SceneKey[], AuthParams & StorageContext>({
      queryFn: async ({ identity, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<ListStorageItemsResponse>(signedFetch, `${getStorageApiUrl()}/values`)
          return { data: response.data.map(({ key }) => ({ key })) }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        storageContext: storageContextId(queryArgs)
      }),
      providesTags: (_result, _error, args) => [{ type: 'Scene' as const, id: storageContextId(args) }]
    }),

    getSceneValue: build.query<SceneValue, GetSceneValueParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, key, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(
            signedFetch,
            `${getStorageApiUrl()}/values/${encodeURIComponent(key)}`
          )
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        key: queryArgs.key,
        storageContext: storageContextId(queryArgs)
      }),
      providesTags: (_result, _error, args) => [
        { type: 'Scene' as const, id: storageContextId(args) },
        { type: 'Scene' as const, id: `${storageContextId(args)}-${args.key}` }
      ]
    }),

    setSceneValue: build.mutation<SceneValue, SetSceneValueParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, key, value, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(
            signedFetch,
            `${getStorageApiUrl()}/values/${encodeURIComponent(key)}`,
            {
              method: 'PUT',
              headers: JSON_HEADERS,
              body: JSON.stringify({ value })
            }
          )
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Scene' as const, id: storageContextId(args) }]
    }),

    deleteSceneValue: build.mutation<void, DeleteSceneValueParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, key, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(signedFetch, `${getStorageApiUrl()}/values/${encodeURIComponent(key)}`, { method: 'DELETE' })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Scene' as const, id: storageContextId(args) }]
    }),

    clearScene: build.mutation<void, AuthParams & StorageContext>({
      queryFn: async ({ identity, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(signedFetch, `${getStorageApiUrl()}/values`, { method: 'DELETE', headers: ALL_DELETE_HEADERS })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Scene' as const, id: storageContextId(args) }]
    }),

    listPlayers: build.query<string[], AuthParams & StorageContext>({
      queryFn: async ({ identity, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<ListPlayersResponse>(signedFetch, `${getStorageApiUrl()}/players`)
          return { data: response.data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        storageContext: storageContextId(queryArgs)
      }),
      providesTags: (_result, _error, args) => [{ type: 'Player' as const, id: storageContextId(args) }]
    }),

    listPlayerKeys: build.query<PlayerKey[], ListPlayerKeysParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, address, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<ListStorageItemsResponse>(
            signedFetch,
            `${getStorageApiUrl()}/players/${encodeURIComponent(address)}/values`
          )
          return { data: response.data.map(({ key }) => ({ key })) }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        address: queryArgs.address,
        storageContext: storageContextId(queryArgs)
      }),
      providesTags: (result, _error, args) => [
        { type: 'PlayerKeys' as const, id: `${storageContextId(args)}-${args.address}` },
        ...(result?.map(({ key }) => ({
          type: 'PlayerKeys' as const,
          id: `${storageContextId(args)}-${args.address}-${key}`
        })) ?? [])
      ]
    }),

    getPlayerValue: build.query<PlayerValue, GetPlayerValueParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, address, key, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(
            signedFetch,
            `${getStorageApiUrl()}/players/${encodeURIComponent(address)}/values/${encodeURIComponent(key)}`
          )
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        address: queryArgs.address,
        key: queryArgs.key,
        storageContext: storageContextId(queryArgs)
      }),
      providesTags: (_result, _error, args) => [
        { type: 'PlayerKeys' as const, id: `${storageContextId(args)}-${args.address}-${args.key}` }
      ]
    }),

    setPlayerValue: build.mutation<PlayerValue, SetPlayerValueParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, address, key, value, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          const response = await wrapSignedFetch<StorageValueResponse>(
            signedFetch,
            `${getStorageApiUrl()}/players/${encodeURIComponent(address)}/values/${encodeURIComponent(key)}`,
            {
              method: 'PUT',
              headers: JSON_HEADERS,
              body: JSON.stringify({ value })
            }
          )
          return { data: { key, value: response.value } }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: 'Player' as const, id: storageContextId(args) },
        { type: 'PlayerKeys' as const, id: `${storageContextId(args)}-${args.address}-${args.key}` },
        { type: 'PlayerKeys' as const, id: `${storageContextId(args)}-${args.address}` }
      ]
    }),

    deletePlayerValue: build.mutation<void, DeletePlayerValueParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, address, key, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(
            signedFetch,
            `${getStorageApiUrl()}/players/${encodeURIComponent(address)}/values/${encodeURIComponent(key)}`,
            { method: 'DELETE' }
          )
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [
        { type: 'Player' as const, id: storageContextId(args) },
        { type: 'PlayerKeys' as const, id: `${storageContextId(args)}-${args.address}-${args.key}` },
        { type: 'PlayerKeys' as const, id: `${storageContextId(args)}-${args.address}` }
      ]
    }),

    clearPlayer: build.mutation<void, ClearPlayerParams & AuthParams & StorageContext>({
      queryFn: async ({ identity, address, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(signedFetch, `${getStorageApiUrl()}/players/${encodeURIComponent(address)}/values`, {
            method: 'DELETE',
            headers: ALL_DELETE_HEADERS
          })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Player' as const, id: storageContextId(args) }, 'PlayerKeys' as const]
    }),

    clearAllPlayers: build.mutation<void, AuthParams & StorageContext>({
      queryFn: async ({ identity, realm, position }) => {
        const signedFetch = createScopedSignedFetch(identity, realm, position)
        try {
          await sendSignedFetch(signedFetch, `${getStorageApiUrl()}/players`, {
            method: 'DELETE',
            headers: ALL_DELETE_HEADERS
          })
          return { data: undefined }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      invalidatesTags: (_result, _error, args) => [{ type: 'Player' as const, id: storageContextId(args) }, 'PlayerKeys' as const]
    }),

    getContributableDomains: build.query<ContributableDomain[], AuthParams>({
      queryFn: async ({ identity }) => {
        const signedFetch = createScopedSignedFetch(identity)
        try {
          const response = await wrapSignedFetch<ContributableDomainsResponse>(
            signedFetch,
            `${getWorldsContentServerUrl()}/wallet/contribute`
          )
          const data: ContributableDomain[] = response.domains.map(domain => ({
            name: domain.name,
            userPermissions: domain.user_permissions,
            size: domain.size,
            owner: domain.owner
          }))
          return { data }
        } catch (error) {
          return { error: error as WrapSignedFetchError }
        }
      },
      providesTags: ['ContributableDomains' as const]
    }),

    getWorldScenes: build.query<WorldScene[], { worldName: string }>({
      queryFn: async ({ worldName }) => {
        try {
          const response = await fetch(`${getWorldsContentServerUrl()}/world/${encodeURIComponent(worldName)}/scenes`)
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text().catch(() => undefined) } }
          }
          const json: WorldScenesResponse = await response.json()
          const data: WorldScene[] = json.scenes
            .map(item => ({
              title: item.entity.metadata.display?.title ?? item.entity.metadata.scene.base,
              baseParcel: item.entity.metadata.scene.base
            }))
            .sort((a, b) => a.title.localeCompare(b.title))
          return { data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR' as const, error: error instanceof Error ? error.message : String(error) } }
        }
      },
      providesTags: (_result, _error, { worldName }) => [{ type: 'WorldScenes' as const, id: worldName }]
    })
  })
})

const {
  useClearAllPlayersMutation,
  useClearEnvMutation,
  useClearPlayerMutation,
  useClearSceneMutation,
  useDeleteEnvMutation,
  useDeletePlayerValueMutation,
  useDeleteSceneValueMutation,
  useGetContributableDomainsQuery,
  useGetPlayerValueQuery,
  useGetSceneValueQuery,
  useGetWorldScenesQuery,
  useListEnvKeysQuery,
  useListPlayerKeysQuery,
  useListPlayersQuery,
  useListSceneKeysQuery,
  useSetEnvMutation,
  useSetPlayerValueMutation,
  useSetSceneValueMutation
} = storageEndpoints

export {
  storageEndpoints,
  useClearAllPlayersMutation,
  useClearEnvMutation,
  useClearPlayerMutation,
  useClearSceneMutation,
  useDeleteEnvMutation,
  useDeletePlayerValueMutation,
  useDeleteSceneValueMutation,
  useGetContributableDomainsQuery,
  useGetPlayerValueQuery,
  useGetSceneValueQuery,
  useGetWorldScenesQuery,
  useListEnvKeysQuery,
  useListPlayerKeysQuery,
  useListPlayersQuery,
  useListSceneKeysQuery,
  useSetEnvMutation,
  useSetPlayerValueMutation,
  useSetSceneValueMutation
}
