/* eslint-disable @typescript-eslint/naming-convention */
import type { AuthIdentity } from '@dcl/crypto'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../../config/env'
import { getGuestIdentity } from './guestIdentity'

const signedFetch = signedFetchFactory()

interface SceneAdapterCredentials {
  url: string
  token: string
}

// The /social/* LIVE feature reads its data from the realm-provider-ea
// hot-scenes endpoint, which is pinned to prod in every env file (there is
// no dev hot-scenes endpoint). The LiveKit cluster behind the prod hot-scenes
// is comms-gatekeeper.decentraland.org's. If we used the env-default
// GATEKEEPER_URL (.zone on dev/stg), we'd join an empty LiveKit cluster
// while showing prod's "14 people here" counter — split-brain UX.
//
// We always target prod for scene watching so the player counts and presence
// shown on /social match what the watcher actually joins. Same trick as
// HOT_SCENES_URL: hardcoded to the prod origin in every env file.
const PROD_GATEKEEPER_URL = 'https://comms-gatekeeper.decentraland.org'
const PROD_PEER_URL = 'https://peer.decentraland.org'

// `getEnv` can return '' for unset keys (not undefined) so check for truthy.
const getGatekeeperUrl = (): string => getEnv('LIVE_GATEKEEPER_URL') || PROD_GATEKEEPER_URL

const getPeerUrl = (): string => getEnv('LIVE_PEER_URL') || PROD_PEER_URL

// Genesis City scenes deploy under a parcel pointer; the catalyst returns the
// active deployment's entity id (sceneId from the gatekeeper's perspective).
async function resolveSceneIdForParcel(parcel: string): Promise<string | null> {
  try {
    const peer = getPeerUrl()
    const response = await fetch(`${peer}/content/entities/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify({ pointers: [parcel] })
    })
    if (!response.ok) return null
    const entities: Array<{ id: string }> = await response.json()
    return entities?.[0]?.id ?? null
  } catch (error) {
    console.warn('[sceneAdapter] failed to resolve sceneId', { parcel, error })
    return null
  }
}

// Parses the `livekit:wss://host?access_token=jwt` envelope the gatekeeper
// returns into the {url, token} pair `<LiveKitRoom>` expects.
function parseAdapterUrl(adapter: string): SceneAdapterCredentials | null {
  try {
    const stripped = adapter.startsWith('livekit:') ? adapter.slice('livekit:'.length) : adapter
    const parsed = new URL(stripped)
    const token = parsed.searchParams.get('access_token')
    if (!token) return null
    parsed.searchParams.delete('access_token')
    return { url: parsed.toString(), token }
  } catch {
    return null
  }
}

interface FetchSceneAdapterArgs {
  // For Genesis City: pass `parcel` ("-3,-2") only — sceneId is resolved from
  // the catalyst. For worlds: pass `worldName` (an ENS ending in `.eth`).
  // When the world is multi-scene, pass the explicit `sceneId` (entity hash
  // from /world/<name>/scenes) and matching `parcel` to target the right
  // scene's LiveKit room — otherwise the gatekeeper falls back to the
  // world's default scene and watchers miss users in non-default scenes.
  parcel?: string
  worldName?: string
  sceneId?: string
  // When provided, signs the gatekeeper request as the logged-in user so the
  // LiveKit participant identity is the real wallet address. Required for
  // sending chat messages — guest-identity messages show as random 0x… and
  // have no profile lookup. Absent → fall back to ephemeral guest identity.
  identity?: AuthIdentity
}

// Signed-fetch the gatekeeper's /get-scene-adapter. Uses the caller-supplied
// identity (logged-in user) when present, otherwise mints an ephemeral guest
// identity. Returns null on any failure — the caller's job to render an empty
// state. We never throw to keep the scene detail page resilient.
async function fetchSceneAdapter({
  parcel,
  worldName,
  sceneId: explicitSceneId,
  identity: userIdentity
}: FetchSceneAdapterArgs): Promise<SceneAdapterCredentials | null> {
  try {
    let sceneId: string | null
    let realmName: string
    let metadataParcel: string

    if (worldName) {
      // Prefer the caller's explicit sceneId for multi-scene worlds. When
      // absent the gatekeeper resolves via `worlds.fetchWorldSceneId` to the
      // world's default scene — fine for single-scene worlds.
      sceneId = explicitSceneId ?? worldName.toLowerCase()
      realmName = worldName.toLowerCase()
      metadataParcel = parcel ?? '0,0'
    } else if (parcel) {
      sceneId = await resolveSceneIdForParcel(parcel)
      if (!sceneId) return null
      realmName = 'main'
      metadataParcel = parcel
    } else {
      return null
    }

    const identity = userIdentity ?? (await getGuestIdentity())
    const url = `${getGatekeeperUrl()}/get-scene-adapter`

    const response = await signedFetch(url, {
      method: 'POST',
      identity,
      metadata: { sceneId, parcel: metadataParcel, realmName, signer: 'decentraland-kernel-scene' },
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      console.info('[sceneAdapter] gatekeeper rejected guest', { status: response.status })
      return null
    }
    const body = (await response.json()) as { adapter?: string }
    if (!body.adapter) return null
    return parseAdapterUrl(body.adapter)
  } catch (error) {
    console.warn('[sceneAdapter] request failed', error)
    return null
  }
}

// World scene listing — pinned to the prod worlds-content-server for the
// same split-brain reason as the gatekeeper / peer URLs above. Worlds now
// support multi-scene deployments; the LIVE feed surfaces the world name
// but we need to know which scene the user actually wants to join.
const PROD_WORLDS_CONTENT_SERVER_URL = 'https://worlds-content-server.decentraland.org'

interface WorldSceneSummary {
  // Entity hash from the catalyst — the value the gatekeeper expects as
  // `sceneId` in the signed-fetch metadata. NOT the world name.
  entityId: string
  // Display title pulled from `entity.metadata.display.title`. Falls back to
  // the entity hash so the dropdown is never blank.
  title: string
  // Base parcel ("x,y") — required by the gatekeeper's authMetadata.
  base: string
}

async function fetchWorldScenes(worldName: string): Promise<WorldSceneSummary[]> {
  try {
    const url = `${PROD_WORLDS_CONTENT_SERVER_URL}/world/${encodeURIComponent(worldName.toLowerCase())}/scenes`
    const response = await fetch(url)
    if (!response.ok) return []
    const body = (await response.json()) as {
      scenes?: Array<{
        entityId: string
        entity?: { metadata?: { display?: { title?: string }; scene?: { base?: string; parcels?: string[] } } }
        parcels?: string[]
      }>
    }
    return (body.scenes ?? []).map(s => ({
      entityId: s.entityId,
      title: s.entity?.metadata?.display?.title || s.entityId.slice(0, 8),
      base: s.entity?.metadata?.scene?.base ?? s.parcels?.[0] ?? '0,0'
    }))
  } catch (error) {
    console.warn('[sceneAdapter] fetchWorldScenes failed', { worldName, error })
    return []
  }
}

// Cast2 scene-stream-access fallback. Mirrors the body shape of the cast2
// RTK Query mutation, but pinned to the prod gatekeeper for the same
// split-brain reason as fetchSceneAdapter. Returns null on any error.
async function fetchCastWatcherToken(args: {
  location: string
  identity: string
  parcel?: string
}): Promise<{ url: string; token: string } | null> {
  try {
    const url = `${getGatekeeperUrl()}/cast/watcher-token`
    const body = args.parcel
      ? { location: args.location, identity: args.identity, parcel: args.parcel }
      : { location: args.location, identity: args.identity }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!response.ok) return null
    const json = (await response.json()) as { url?: string; token?: string }
    if (!json.url || !json.token) return null
    return { url: json.url, token: json.token }
  } catch (error) {
    console.info('[sceneAdapter] cast fallback failed', error)
    return null
  }
}

// Peer URL for chat/profile lookups. Pinned to prod for the same split-brain
// reason as the gatekeeper / hot-scenes URLs: the LiveKit room we joined IS
// the prod scene-comms cluster, so every other participant is a real prod
// user whose profile lives on `peer.decentraland.org`. Pointing this at the
// env's `.zone` peer would erase names + avatars for everyone in the room
// except the local dev tester. Worth-it trade-off: a dev user whose profile
// only exists on `.zone` won't see their own name in chat, but the rest of
// the participant list resolves correctly.
const getLivePeerUrl = (): string => PROD_PEER_URL

export { fetchCastWatcherToken, fetchSceneAdapter, fetchWorldScenes, getLivePeerUrl }
export type { SceneAdapterCredentials, WorldSceneSummary }
