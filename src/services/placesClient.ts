import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const placesClient = createApi({
  reducerPath: 'placesClient',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Place', 'World', 'SceneMetadata'],
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { placesClient }
