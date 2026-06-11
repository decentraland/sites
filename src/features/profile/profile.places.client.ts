import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../../config/env'
import { placesClient } from '../../services/placesClient'
import { resolveActiveIdentity } from '../../utils/activeIdentity'
import { fetchWithIdentity } from '../../utils/signedFetch'

type OwnerAvatar = NonNullable<Profile['avatars']>[number]

const getPlacesApiUrl = (): string => {
  const url = getEnv('PLACES_API_URL')
  if (!url) throw new Error('PLACES_API_URL environment variable is not set')
  return url.replace(/\/+$/, '')
}

/* eslint-disable @typescript-eslint/naming-convention -- places-api uses snake_case in its JSON response */
interface ProfilePlace {
  id: string
  title: string
  description?: string
  image?: string
  positions?: string[]
  likes?: number
  user_count?: number
  base_position?: string
  // `/worlds` adds this; absent on `/places`.
  world?: boolean
  world_name?: string
  // Owner metadata — places-api returns these on `/places?owner=` and `/worlds?owner=`; needed by
  // the shared PlaceDetailModal Hero ("By {creator}" creator row + profile-modal click-through).
  owner?: string
  contact_name?: string
  favorites?: number
}
/* eslint-enable @typescript-eslint/naming-convention */

interface ProfilePlacesResponse {
  ok: boolean
  data: ProfilePlace[]
  total?: number
}

/* eslint-disable @typescript-eslint/naming-convention -- keep snake_case consistent with ProfilePlace */
type ProfileFavoritePlace = ProfilePlace & {
  /** Resolved catalyst avatar of the place owner — populated by a single batch lambdas request. */
  owner_avatar?: OwnerAvatar
}
/* eslint-enable @typescript-eslint/naming-convention */

interface ProfileFavoritePlacesResponse {
  ok: boolean
  data: ProfileFavoritePlace[]
  total?: number
}

async function fetchOwned(path: 'places' | 'worlds', address: string, limit: number, offset: number) {
  const baseUrl = getPlacesApiUrl()
  const url = `${baseUrl}/${path}?owner=${encodeURIComponent(address.toLowerCase())}&limit=${limit}&offset=${offset}`
  const response = await fetch(url)
  if (!response.ok) return { ok: false as const, status: response.status, body: await response.text() }
  const data = (await response.json()) as ProfilePlacesResponse
  return { ok: true as const, data }
}

// Favorites belong to the signed caller (places-api scopes `only_favorites=true` to the
// authenticated user), so this endpoint is own-profile only and requires an identity.
async function fetchFavorites(path: 'places' | 'worlds', identity: AuthIdentity, limit: number, offset: number) {
  const baseUrl = getPlacesApiUrl()
  const url = `${baseUrl}/${path}?only_favorites=true&limit=${limit}&offset=${offset}`
  const response = await fetchWithIdentity(url, identity, 'GET')
  if (!response.ok) return { ok: false as const, status: response.status, body: await response.text() }
  const data = (await response.json()) as ProfilePlacesResponse
  return { ok: true as const, data }
}

// Resolve every distinct favorite-place owner with ONE batch lambdas request (rule 12:
// no per-card profile fetches). A failed batch degrades to cards without the "by" row.
async function fetchOwnerAvatars(owners: string[]): Promise<Map<string, OwnerAvatar>> {
  const result = new Map<string, OwnerAvatar>()
  const peerUrl = getEnv('PEER_URL')
  if (!peerUrl || owners.length === 0) return result
  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles`, {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: owners })
    })
    if (!response.ok) return result
    const profiles = (await response.json()) as Profile[]
    for (const profile of profiles ?? []) {
      const avatar = profile?.avatars?.[0]
      if (avatar?.ethAddress) result.set(avatar.ethAddress.toLowerCase(), avatar)
    }
  } catch (error) {
    console.error('[ProfilePlaces] owner avatars batch failed', error)
  }
  return result
}

const profilePlacesApi = placesClient.injectEndpoints({
  endpoints: builder => ({
    getProfilePlaces: builder.query<ProfilePlacesResponse, { address: string; limit?: number; offset?: number }>({
      // Places-api ships two separate owner-scoped endpoints: `/places` (LAND scenes) and `/worlds`
      // (NAME-bound Worlds Content Server scenes). The profile must surface BOTH — owners frequently
      // have worlds without owning LAND (or vice versa). We fan-out in parallel and merge.
      async queryFn({ address, limit = 24, offset = 0 }) {
        try {
          const [places, worlds] = await Promise.all([
            fetchOwned('places', address, limit, offset),
            fetchOwned('worlds', address, limit, offset)
          ])
          // Log the raw upstream body for ops/Sentry but DO NOT propagate it through
          // RTK Query's `error.data` — review rule 10 forbids surfacing raw server bodies to
          // the UI (and reaching `error.data` is undocumented anyway).
          if (!places.ok) {
            console.error('[ProfilePlaces] /places failed', places.status, places.body)
            return { error: { status: places.status, error: 'Places fetch failed' } }
          }
          if (!worlds.ok) {
            console.error('[ProfilePlaces] /worlds failed', worlds.status, worlds.body)
            return { error: { status: worlds.status, error: 'Worlds fetch failed' } }
          }
          const merged: ProfilePlace[] = [
            ...(worlds.data.data ?? []).map(w => ({ ...w, world: true as const })),
            ...(places.data.data ?? [])
          ]
          return {
            data: {
              ok: true,
              data: merged,
              total: (places.data.total ?? 0) + (worlds.data.total ?? 0)
            }
          }
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR' as const,
              error: error instanceof Error ? error.message : 'Network request failed'
            }
          }
        }
      },
      providesTags: (_result, _error, { address }) => [{ type: 'Place', id: `owner-${address.toLowerCase()}` }, 'Place']
    }),
    getProfileFavoritePlaces: builder.query<ProfileFavoritePlacesResponse, { limit?: number; offset?: number } | void>({
      // Same fan-out as `getProfilePlaces` (places + worlds both support favorites) but signed:
      // places-api resolves `only_favorites=true` against the caller's identity, never a path
      // address — which is why this powers the own-profile Favourites view only.
      async queryFn(args) {
        const { limit = 24, offset = 0 } = args ?? {}
        try {
          const identity = resolveActiveIdentity()
          if (!identity) {
            return { error: { status: 401, error: 'Favorites require an authenticated identity' } }
          }
          const [places, worlds] = await Promise.all([
            fetchFavorites('places', identity, limit, offset),
            fetchFavorites('worlds', identity, limit, offset)
          ])
          if (!places.ok) {
            console.error('[ProfilePlaces] favorite /places failed', places.status, places.body)
            return { error: { status: places.status, error: 'Favorite places fetch failed' } }
          }
          if (!worlds.ok) {
            console.error('[ProfilePlaces] favorite /worlds failed', worlds.status, worlds.body)
            return { error: { status: worlds.status, error: 'Favorite worlds fetch failed' } }
          }
          const merged: ProfileFavoritePlace[] = [
            ...(worlds.data.data ?? []).map(w => ({ ...w, world: true as const })),
            ...(places.data.data ?? [])
          ]
          const owners = Array.from(new Set(merged.map(place => place.owner?.toLowerCase()).filter((o): o is string => Boolean(o))))
          const avatars = await fetchOwnerAvatars(owners)
          for (const place of merged) {
            const avatar = place.owner ? avatars.get(place.owner.toLowerCase()) : undefined
            if (avatar) place.owner_avatar = avatar
          }
          return {
            data: {
              ok: true,
              data: merged,
              total: (places.data.total ?? 0) + (worlds.data.total ?? 0)
            }
          }
        } catch (error) {
          return {
            error: {
              status: 'FETCH_ERROR' as const,
              error: error instanceof Error ? error.message : 'Network request failed'
            }
          }
        }
      },
      providesTags: [{ type: 'Place', id: 'favorites' }, 'Place']
    })
  })
})

const { useGetProfilePlacesQuery, useGetProfileFavoritePlacesQuery } = profilePlacesApi

export { profilePlacesApi, useGetProfileFavoritePlacesQuery, useGetProfilePlacesQuery }
export type { ProfileFavoritePlace, ProfilePlace, ProfilePlacesResponse }
