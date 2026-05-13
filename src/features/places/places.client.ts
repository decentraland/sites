/* eslint-disable @typescript-eslint/naming-convention */
import { getEnv } from '../../config/env'
import { placesClient } from '../../services/placesClient'
import { fetchWithOptionalIdentity } from '../../utils/signedFetch'
import { isEns } from './places.helpers'
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
} from './places.types'

function buildPlacesUrl(baseUrl: string, { position, realm }: GetPlacesArgs): string {
  if (realm && isEns(realm)) {
    return `${baseUrl}/worlds?names=${realm.toLowerCase()}`
  }
  if (position) {
    return `${baseUrl}/places?positions=${position[0]},${position[1]}`
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

function toCreator(address: string, profile: PeerProfile | null): Creator | null {
  const avatar = profile?.avatars?.[0]
  const userName = avatar?.name || avatar?.realName
  if (!userName) return null
  return {
    user: address,
    user_name: userName,
    avatar: avatar?.avatar?.snapshots?.face256
  }
}

const placesEndpoints = placesClient.injectEndpoints({
  endpoints: build => ({
    getJumpPlaces: build.query<JumpPlace[], GetPlacesArgs>({
      queryFn: async args => {
        try {
          const baseUrl = getEnv('PLACES_API_URL')
          if (!baseUrl) throw new Error('PLACES_API_URL is not set')
          const response = await fetch(buildPlacesUrl(baseUrl, args))
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text().catch(() => null) } }
          }
          const envelope: JumpPlacesResponse = await response.json()
          return { data: envelope.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_result, _err, args) => [{ type: 'Place', id: args.realm ?? args.position?.join(',') ?? 'root' }]
    }),
    getJumpEvents: build.query<JumpEvent[], GetEventsArgs>({
      // Identity-bound responses must not share a cache slot with the anonymous
      // ones — the server fills `attending` and `total_attendees` based on who
      // is signing the request.
      serializeQueryArgs: ({ queryArgs: { identity, ...rest } }) => ({ ...rest, authenticated: Boolean(identity) }),
      queryFn: async args => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')
          if (!baseUrl) throw new Error('EVENTS_API_URL is not set')
          const response = await fetchWithOptionalIdentity(buildEventsUrl(baseUrl, args), args.identity)
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text().catch(() => null) } }
          }
          const envelope: JumpEventsResponse = await response.json()
          return { data: envelope.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['JumpEvent']
    }),
    getJumpEventById: build.query<JumpEvent | null, GetEventByIdArgs>({
      serializeQueryArgs: ({ queryArgs: { id, identity } }) => ({ id, authenticated: Boolean(identity) }),
      queryFn: async ({ id, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')
          if (!baseUrl) throw new Error('EVENTS_API_URL is not set')
          const response = await fetchWithOptionalIdentity(`${baseUrl}/events/${encodeURIComponent(id)}`, identity)
          if (response.status === 404) return { data: null }
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text().catch(() => null) } }
          }
          const envelope: JumpEventResponse = await response.json()
          return { data: envelope.ok ? envelope.data : null }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_result, _error, { id }) => [{ type: 'JumpEvent', id }]
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
          const deployerName = avatar?.name || avatar?.realName
          // Curated scenes (e.g. Genesis Plaza) are deployed by addresses that
          // have no Catalyst user profile. Returning null here lets the Card
          // fall back to the Places API's contact_name instead of overriding
          // it with a placeholder like "Unknown".
          if (!deployerName) return { data: null }

          const info: SceneDeployerInfo = {
            deployerAddress: deployment.deployedBy,
            deployerName,
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
          return { data: toCreator(address, profile) }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    })
  }),
  overrideExisting: false
})

// Attendee toggling reuses `useToggleAttendeeMutation` from `features/events`
// via the shared `useRemindMe` hook — no places-specific mutation is needed here.
const { useGetJumpEventByIdQuery, useGetJumpEventsQuery, useGetJumpPlacesQuery, useGetProfileCreatorQuery, useGetSceneMetadataQuery } =
  placesEndpoints

export {
  placesEndpoints,
  useGetJumpEventByIdQuery,
  useGetJumpEventsQuery,
  useGetJumpPlacesQuery,
  useGetProfileCreatorQuery,
  useGetSceneMetadataQuery
}
