/* eslint-disable @typescript-eslint/naming-convention */
import { gatekeeperClient } from '../../services/gatekeeperClient'
import { fetchErrorOf, getGatekeeperUrl, sceneMetadata, sceneSignedFetch } from '../sceneGatekeeper/sceneGatekeeper.helpers'
import type { GatekeeperError } from '../sceneGatekeeper/sceneGatekeeper.helpers'
import type { ListSceneBansResponse, SceneBanScope, SceneBanTarget } from './bans.types'

const signedFetch = sceneSignedFetch
type BanError = GatekeeperError

// Build the comms-gatekeeper ban body — ban by wallet address or by DCL name.
function banBody(target: SceneBanTarget): string {
  if (target.address) return JSON.stringify({ banned_address: target.address })
  return JSON.stringify({ banned_name: target.name })
}

const bansEndpoints = gatekeeperClient.injectEndpoints({
  endpoints: build => ({
    // List the addresses banned from a scene. Signed as the connected wallet;
    // the gatekeeper authorizes based on scene ownership / admin rights.
    getSceneBans: build.query<ListSceneBansResponse, SceneBanScope & { limit?: number; offset?: number }>({
      queryFn: async ({ identity, sceneId, realmName, parcel, limit = 50, offset = 0 }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as BanError }
        try {
          const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
          const response = await signedFetch(`${getGatekeeperUrl()}/scene-bans?${params.toString()}`, {
            method: 'GET',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel })
          })
          if (!response.ok) return { error: { status: response.status } as BanError }
          return { data: (await response.json()) as ListSceneBansResponse }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      providesTags: ['SceneBans' as const]
    }),

    addSceneBan: build.mutation<void, SceneBanScope & SceneBanTarget>({
      queryFn: async ({ identity, sceneId, realmName, parcel, address, name }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as BanError }
        try {
          const response = await signedFetch(`${getGatekeeperUrl()}/scene-bans`, {
            method: 'POST',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel }),
            headers: { 'Content-Type': 'application/json' },
            body: banBody({ address, name })
          })
          if (!response.ok) return { error: { status: response.status } as BanError }
          return { data: undefined }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      invalidatesTags: ['SceneBans' as const]
    }),

    removeSceneBan: build.mutation<void, SceneBanScope & SceneBanTarget>({
      queryFn: async ({ identity, sceneId, realmName, parcel, address, name }) => {
        if (!identity) return { error: { status: 'NO_IDENTITY' } as BanError }
        try {
          const response = await signedFetch(`${getGatekeeperUrl()}/scene-bans`, {
            method: 'DELETE',
            identity,
            metadata: sceneMetadata({ identity, sceneId, realmName, parcel }),
            headers: { 'Content-Type': 'application/json' },
            body: banBody({ address, name })
          })
          if (!response.ok) return { error: { status: response.status } as BanError }
          return { data: undefined }
        } catch (error) {
          return fetchErrorOf(error)
        }
      },
      invalidatesTags: ['SceneBans' as const]
    })
  })
})

const { useGetSceneBansQuery, useAddSceneBanMutation, useRemoveSceneBanMutation } = bansEndpoints

export { banBody, bansEndpoints, useAddSceneBanMutation, useGetSceneBansQuery, useRemoveSceneBanMutation }
