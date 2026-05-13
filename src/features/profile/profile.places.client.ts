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
}
/* eslint-enable @typescript-eslint/naming-convention */

interface ProfilePlacesResponse {
  ok: boolean
  data: ProfilePlace[]
  total?: number
}

const profilePlacesApi = placesClient.injectEndpoints({
  endpoints: builder => ({
    getProfilePlaces: builder.query<ProfilePlacesResponse, { address: string; limit?: number; offset?: number }>({
      async queryFn({ address, limit = 24, offset = 0 }) {
        try {
          const baseUrl = getPlacesApiUrl()
          const url = `${baseUrl}/places?owner=${encodeURIComponent(address.toLowerCase())}&limit=${limit}&offset=${offset}`
          const response = await fetch(url)
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text() } }
          }
          const data = (await response.json()) as ProfilePlacesResponse
          return { data }
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
