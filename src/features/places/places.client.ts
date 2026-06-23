/* eslint-disable @typescript-eslint/naming-convention */
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
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

// Custom RTK Query error status used by getSceneMetadata to signal that an ENS
// realm does not resolve to a real World on the Worlds Content Server. Consumers
// (PlacesPage) match on it via isWorldNotFoundError to redirect to
// /jump/places/invalid.
const WORLD_NOT_FOUND = 'WORLD_NOT_FOUND'

// Narrow a getSceneMetadata error to the WORLD_NOT_FOUND signal. Keeps the
// producer and consumer matching on one shape instead of a structural cast at
// the call site, so the contract stays in a single place.
function isWorldNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { status?: unknown }).status === WORLD_NOT_FOUND
}

function resolveIdentity(address: string | undefined) {
  // Resolving the identity inside queryFn (instead of accepting it as a query
  // arg) keeps the ephemeral key material out of `state.placesClient.queries.*.
  // originalArgs` — only the public wallet address ever lands in Redux.
  if (!address) return undefined
  try {
    return localStorageGetIdentity(address.toLowerCase()) ?? undefined
  } catch (error) {
    // Log only the message — never the raw error object — so internal stack
    // traces don't surface to browser devtools in production.
    const message = error instanceof Error ? error.message : 'unknown error'
    console.error('[placesClient] Failed to resolve identity from localStorage:', message)
    return undefined
  }
}

function buildPlacesUrl(baseUrl: string, { position, realm }: GetPlacesArgs): string {
  if (realm && isEns(realm)) {
    const name = realm.toLowerCase()
    // A World can host multiple scenes. With an explicit position we want the
    // SCENE at that position: scope to the World by name AND filter by position
    // so the API returns only the matching scene (positions in `/places` are
    // World-local when combined with `names`). Without a position we want the
    // World-level record from `/worlds`.
    return position ? `${baseUrl}/places?names=${name}&positions=${position[0]},${position[1]}` : `${baseUrl}/worlds?names=${name}`
  }
  if (position) {
    return `${baseUrl}/places?positions=${position[0]},${position[1]}`
  }
  return `${baseUrl}/places`
}

// The Places API's `/places` endpoint reports a contaminated `user_count` for
// World records reached via `?names=&positions=`: it returns the live occupancy
// of the Genesis City parcel at that position (e.g. Genesis Plaza at 0,0), not
// the World's own occupancy. The `/worlds` endpoint reports the correct count.
// Launcher deep-links always carry `position=0,0` for Worlds, so without this
// overlay every World card shows the busy Genesis Plaza count instead of the
// real one. A `undefined` return (network error, non-OK, or missing record)
// leaves the `/places` value untouched — never worse than today's behaviour.
async function fetchWorldUserCount(worldsUrl: string): Promise<number | undefined> {
  try {
    const response = await fetch(worldsUrl)
    if (!response.ok) return undefined
    const envelope: JumpPlacesResponse = await response.json()
    return envelope.data?.[0]?.user_count
  } catch {
    return undefined
  }
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

// Worlds live on the Worlds Content Server, which exposes the active scene
// entity (carrying `metadata.owner`) under `/entities/active` keyed by the world
// name — note the path has no `/content` prefix, unlike the main Catalyst's
// `fetchPeerSceneEntity`.
//
// A `null` return is meaningful: it means the server answered 200 with no
// active entity, i.e. the world does not exist on the WCS. A non-OK response
// (outage, 5xx) THROWS instead, so callers can tell "world doesn't exist" apart
// from "couldn't reach the server" and avoid treating a transient outage as a
// missing world.
async function fetchWorldSceneEntity(worldsUrl: string, worldName: string): Promise<PeerSceneEntity | null> {
  const response = await fetch(`${worldsUrl}/entities/active`, {
    method: 'POST',
    headers: { Accept: '*/*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointers: [worldName] })
  })
  if (!response.ok) throw new Error(`Worlds Content Server responded ${response.status}`)
  const entities: PeerSceneEntity[] = await response.json()
  return entities?.[0] ?? null
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

// Resolve a Catalyst profile into the card's creator slot. Returns null when the
// address has no profile name — curated scenes (e.g. Genesis Plaza) and some
// world owners are deployed by / owned by addresses with no Catalyst user
// profile, and returning null lets the Card fall back to the Places API's
// contact_name instead of overriding it with a placeholder like "Unknown".
async function resolveDeployerInfo(peerUrl: string, address: string): Promise<SceneDeployerInfo | null> {
  const profile = await fetchPeerProfile(peerUrl, address)
  const avatar = profile?.avatars?.[0]
  const deployerName = avatar?.name || avatar?.realName
  if (!deployerName) return null
  return {
    deployerAddress: address,
    deployerName,
    deployerAvatar: avatar?.avatar?.snapshots?.face256
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
          const places = envelope.data ?? []
          // A World jump WITH a position resolves the scene via
          // `/places?names=&positions=`, but that endpoint's `user_count`
          // reflects the Genesis City parcel at the position, not the World.
          // Overlay the reliable count from `/worlds` so the card shows the
          // World's real occupancy (see fetchWorldUserCount).
          if (places.length > 0 && args.realm && isEns(args.realm) && args.position) {
            // NOTE: buildPlacesUrl with no position resolves an ENS realm to the
            // `/worlds?names=` record, whose user_count is the reliable one. This
            // depends on buildPlacesUrl's no-position branch staying `/worlds`.
            const worldUserCount = await fetchWorldUserCount(buildPlacesUrl(baseUrl, { realm: args.realm }))
            if (worldUserCount !== undefined) {
              return { data: [{ ...places[0], user_count: worldUserCount }, ...places.slice(1)] }
            }
          }
          return { data: places }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_result, _err, args) => [{ type: 'Place', id: args.realm ?? args.position?.join(',') ?? 'root' }]
    }),
    getJumpEvents: build.query<JumpEvent[], GetEventsArgs>({
      // Identity-bound responses must not share a cache slot across wallets —
      // the server fills `attending` and `total_attendees` per-user. Key by
      // address (lowercased) so each wallet gets its own slot, and use an
      // explicit allowlist so future fields on GetEventsArgs never leak in.
      serializeQueryArgs: ({ queryArgs: { position, realm, address } }) => ({
        position,
        realm,
        address: address?.toLowerCase() ?? null
      }),
      queryFn: async (args, { signal }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')
          if (!baseUrl) throw new Error('EVENTS_API_URL is not set')
          const identity = resolveIdentity(args.address)
          const response = await fetchWithOptionalIdentity(buildEventsUrl(baseUrl, args), identity, signal)
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
      serializeQueryArgs: ({ queryArgs: { id, address } }) => ({ id, address: address?.toLowerCase() ?? null }),
      queryFn: async ({ id, address }, { signal }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')
          if (!baseUrl) throw new Error('EVENTS_API_URL is not set')
          const identity = resolveIdentity(address)
          const response = await fetchWithOptionalIdentity(`${baseUrl}/events/${encodeURIComponent(id)}`, identity, signal)
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
      queryFn: async ({ position, realm }) => {
        try {
          const peerUrl = getEnv('PEER_URL')
          if (!peerUrl) throw new Error('PEER_URL is not set')

          // Worlds aren't on the main Catalyst at `position` — their scene lives
          // on the Worlds Content Server keyed by the world name. Resolve the
          // owner from the scene entity's `metadata.owner` and look that profile
          // up on the Catalyst lambdas.
          if (realm && isEns(realm)) {
            const worldsUrl = getEnv('WORLDS_CONTENT_SERVER_URL')
            if (!worldsUrl) throw new Error('WORLDS_CONTENT_SERVER_URL is not set')

            const entity = await fetchWorldSceneEntity(worldsUrl, realm.toLowerCase())
            // No active scene entity means the realm is not a real World on the
            // WCS — even when the Places API still serves a stale record for it.
            // Surface a typed not-found so the page can redirect to
            // /jump/places/invalid; this is distinct from a FETCH_ERROR raised on
            // a WCS outage (fetchWorldSceneEntity throws), which must NOT redirect.
            if (!entity) return { error: { status: WORLD_NOT_FOUND } }

            const ownerAddress = entity.metadata?.owner
            if (!ownerAddress) return { data: null }

            return { data: await resolveDeployerInfo(peerUrl, ownerAddress) }
          }

          const entity = await fetchPeerSceneEntity(peerUrl, position)
          if (!entity) return { data: null }

          const deployment = await fetchPeerDeployment(peerUrl, entity.id)
          if (!deployment) return { data: null }

          return { data: await resolveDeployerInfo(peerUrl, deployment.deployedBy) }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_result, _err, args) => [{ type: 'SceneMetadata', id: args.realm ? args.realm.toLowerCase() : args.position }]
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
  isWorldNotFoundError,
  placesEndpoints,
  useGetJumpEventByIdQuery,
  useGetJumpEventsQuery,
  useGetJumpPlacesQuery,
  useGetProfileCreatorQuery,
  useGetSceneMetadataQuery
}
