import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

// fakeBaseQuery: all injected endpoints use `queryFn` with raw fetch against
// multiple origins (places-api, worlds-content, decentraland catalyst), so no
// single base URL applies.
const placesClient = createApi({
  reducerPath: 'placesClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Place', 'World', 'SceneMetadata', 'JumpEvent'],
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { placesClient }
