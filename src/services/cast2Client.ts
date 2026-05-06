import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/**
 * Cast2 client — gatekeeper, worlds-content, and presenter-server endpoints
 * for the cast streamer/watcher flows. Endpoints are injected from
 * features/cast2/cast2.client.ts so this module stays free of business logic
 * and avoids a circular dep with shells/store.ts.
 *
 * Auth model: anonymous identity + token-in-URL (no Web3, no signed fetch).
 */
const cast2Client = createApi({
  reducerPath: 'cast2Client',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: ['StreamInfo', 'WorldScenes'],
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { cast2Client }
