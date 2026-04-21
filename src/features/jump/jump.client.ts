/* eslint-disable @typescript-eslint/naming-convention */
import { getEnv } from '../../config/env'
import { placesClient } from '../../services/placesClient'
import { isEns } from './jump.helpers'
import type {
  Creator,
  GetEventByIdArgs,
  GetEventsArgs,
  GetPlacesArgs,
  GetSceneMetadataArgs,
  JumpEvent,
  JumpEventResponse,
  JumpEventsResponse,
  JumpPlace,
  JumpPlacesResponse,
  PeerDeployment,
  PeerProfile,
  PeerSceneEntity,
  SceneDeployerInfo
} from './jump.types'

function buildPlacesUrl(baseUrl: string, { position, realm }: GetPlacesArgs): string {
  if (realm && isEns(realm)) {
    return `${baseUrl}/worlds?names=${realm.toLowerCase()}`
  }
  if (position) {
    return `${baseUrl}/places/?positions=${position[0]},${position[1]}`
  }
  return `${baseUrl}/places`
}

function buildEventsUrl(baseUrl: string, { position, realm }: GetEventsArgs): string {
  const params = new URLSearchParams()
  if (position) params.set('position', `${position[0]},${position[1]}`)
  if (realm) params.set('world_names[]', realm)
  const query = params.toString()
  return query ? `${baseUrl}/events?${query}` : `${baseUrl}/events`
}

async function fetchPeerSceneEntity(peerUrl: string, position: string): Promise<PeerSceneEntity | null> {
  const response = await fetch(`${peerUrl}/content/entities/active`, {
    method: 'POST',
    headers: { Accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointers: [position] })
  })
  if (!response.ok) return null
  const entities: PeerSceneEntity[] = await response.json()
  return entities?.[0] ?? null
}

async function fetchPeerDeployment(peerUrl: string, entityId: string): Promise<PeerDeployment | null> {
  const response = await fetch(`${peerUrl}/content/deployments/?entityId=${encodeURIComponent(entityId)}`, {
    method: 'GET',
    headers: { Accept: '*/*' }
  })
  if (!response.ok) return null
  const body = (await response.json()) as { deployments?: PeerDeployment[] }
  return body.deployments?.[0] ?? null
}

async function fetchPeerProfile(peerUrl: string, address: string): Promise<PeerProfile | null> {
  const response = await fetch(`${peerUrl}/lambdas/profiles`, {
    method: 'POST',
    headers: { Accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: [address] })
  })
  if (!response.ok) return null
  const profiles: PeerProfile[] = await response.json()
  return profiles?.[0] ?? null
}

function toCreator(address: string, profile: PeerProfile | null): Creator {
  const avatar = profile?.avatars?.[0]
  return {
    user: address,
    user_name: avatar?.name || avatar?.realName || 'Unknown',
    avatar: avatar?.avatar?.snapshots?.face256
  }
}

const jumpClient = placesClient.injectEndpoints({
  endpoints: build => ({
    getJumpPlaces: build.query<JumpPlace[], GetPlacesArgs>({
      queryFn: async args => {
        try {
          const baseUrl = getEnv('PLACES_API_URL')
          if (!baseUrl) throw new Error('PLACES_API_URL is not set')
          const response = await fetch(buildPlacesUrl(baseUrl, args))
          if (!response.ok) throw new Error(`Places API error: ${response.status}`)
          const envelope: JumpPlacesResponse = await response.json()
          return { data: envelope.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_result, _err, args) => [{ type: 'Place', id: args.realm ?? args.position?.join(',') ?? 'root' }]
    }),
    getJumpEvents: build.query<JumpEvent[], GetEventsArgs>({
      queryFn: async args => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')
          if (!baseUrl) throw new Error('EVENTS_API_URL is not set')
          const response = await fetch(buildEventsUrl(baseUrl, args))
          if (!response.ok) throw new Error(`Events API error: ${response.status}`)
          const envelope: JumpEventsResponse = await response.json()
          return { data: envelope.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),
    getJumpEventById: build.query<JumpEvent | null, GetEventByIdArgs>({
      queryFn: async ({ id }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')
          if (!baseUrl) throw new Error('EVENTS_API_URL is not set')
          const response = await fetch(`${baseUrl}/events/${encodeURIComponent(id)}`)
          if (response.status === 404) return { data: null }
          if (!response.ok) throw new Error(`Event API error: ${response.status}`)
          const envelope: JumpEventResponse = await response.json()
          return { data: envelope.ok ? envelope.data : null }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),
    getSceneMetadata: build.query<SceneDeployerInfo | null, GetSceneMetadataArgs>({
      queryFn: async ({ position }) => {
        try {
          const peerUrl = getEnv('PEER_URL')
          if (!peerUrl) throw new Error('PEER_URL is not set')

          const entity = await fetchPeerSceneEntity(peerUrl, position)
          if (!entity) return { data: null }

          const deployment = await fetchPeerDeployment(peerUrl, entity.id)
          if (!deployment) return { data: null }

          const profile = await fetchPeerProfile(peerUrl, deployment.deployedBy)
          const avatar = profile?.avatars?.[0]

          const info: SceneDeployerInfo = {
            deployerAddress: deployment.deployedBy,
            deployerName: avatar?.name || avatar?.realName || 'Unknown',
            deployerAvatar: avatar?.avatar?.snapshots?.face256
          }
          return { data: info }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_result, _err, args) => [{ type: 'SceneMetadata', id: args.position }]
    }),
    getProfileCreator: build.query<Creator | null, { address: string }>({
      queryFn: async ({ address }) => {
        try {
          const peerUrl = getEnv('PEER_URL')
          if (!peerUrl) throw new Error('PEER_URL is not set')
          const profile = await fetchPeerProfile(peerUrl, address)
          if (!profile) return { data: null }
          return { data: toCreator(address, profile) }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    })
  }),
  overrideExisting: false
})

// Attendee toggling reuses the `useToggleAttendeeMutation` from
// `features/whats-on-events` via the shared `useRemindMe` hook — no jump-
// specific mutation is needed here.
const { useGetJumpEventByIdQuery, useGetJumpEventsQuery, useGetJumpPlacesQuery, useGetProfileCreatorQuery, useGetSceneMetadataQuery } =
  jumpClient

export {
  jumpClient,
  useGetJumpEventByIdQuery,
  useGetJumpEventsQuery,
  useGetJumpPlacesQuery,
  useGetProfileCreatorQuery,
  useGetSceneMetadataQuery
}
