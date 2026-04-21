import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

// fakeBaseQuery: all injected endpoints use `queryFn` with raw fetch, so
// no base query is exercised — same pattern as algoliaClient.
const placesClient = createApi({
  reducerPath: 'placesClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Place', 'World', 'SceneMetadata'],
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { placesClient }
