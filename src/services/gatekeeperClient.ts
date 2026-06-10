import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

// RTK Query base for comms-gatekeeper scene moderation. Endpoints use `queryFn`
// with a signed-fetch against the env's GATEKEEPER_URL — the scene is identified
// entirely by the signed-fetch metadata, so no single base URL applies.
// Endpoints are injected from `features/bans/` (scene bans) and
// `features/sceneGatekeeper/` (scene admins + OBS streaming access).
const gatekeeperClient = createApi({
  reducerPath: 'gatekeeperClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['SceneBans', 'SceneAdmins', 'SceneStream'],
  keepUnusedDataFor: 30,
  endpoints: () => ({})
})

export { gatekeeperClient }
