import { getEnv } from '../../config/env'
import { placesClient } from '../../services/placesClient'

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

async function fetchOwned(path: 'places' | 'worlds', address: string, limit: number, offset: number) {
  const baseUrl = getPlacesApiUrl()
  const url = `${baseUrl}/${path}?owner=${encodeURIComponent(address.toLowerCase())}&limit=${limit}&offset=${offset}`
  const response = await fetch(url)
  if (!response.ok) return { ok: false as const, status: response.status, body: await response.text() }
  const data = (await response.json()) as ProfilePlacesResponse
  return { ok: true as const, data }
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
    })
  })
})

const { useGetProfilePlacesQuery } = profilePlacesApi

export { profilePlacesApi, useGetProfilePlacesQuery }
export type { ProfilePlace, ProfilePlacesResponse }
