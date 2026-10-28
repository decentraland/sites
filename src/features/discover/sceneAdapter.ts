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

// The discover LIVE watcher reads its gatekeeper / peer URLs from the env
// file (`dev.json` → prod, `stg.json` → zone, `prd.json` → prod). The
// LiveKit cluster, the catalyst we query for profiles, and the hot-scenes
// counts must all line up to the same cluster — otherwise we'd join an
// empty LiveKit room while displaying another cluster's "14 people here"
// counter. Fallback constants are last-resort defaults if the env key
// is missing entirely.
const FALLBACK_GATEKEEPER_URL = 'https://comms-gatekeeper.decentraland.org'
const FALLBACK_PEER_URL = 'https://peer.decentraland.org'

// `getEnv` can return '' for unset keys (not undefined) so check for truthy.
const getGatekeeperUrl = (): string => getEnv('GATEKEEPER_URL') || FALLBACK_GATEKEEPER_URL

const getPeerUrl = (): string => getEnv('PEER_URL') || FALLBACK_PEER_URL

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
async function fetchSceneAdapter(args: FetchSceneAdapterArgs): Promise<SceneAdapterCredentials | null> {
  const { parcel, worldName, sceneId: explicitSceneId, identity: userIdentity } = args
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

// World scene listing — follows the env's `WORLDS_CONTENT_SERVER_URL`
// so the dropdown shows scenes from the same cluster the watcher will
// join. Worlds support multi-scene deployments; the LIVE feed surfaces
// the world name but we need to know which scene the user actually
// wants to join.
const FALLBACK_WORLDS_CONTENT_SERVER_URL = 'https://worlds-content-server.decentraland.org'
const getWorldsContentServerUrl = (): string => getEnv('WORLDS_CONTENT_SERVER_URL') || FALLBACK_WORLDS_CONTENT_SERVER_URL

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

// Returns `null` on a TRANSIENT failure (non-OK / network error) so callers
// can tell "worlds-content-server is down" apart from "this world genuinely
// has no scenes" — collapsing both to `[]` made a valid live world render as
// not-found during an outage.
async function fetchWorldScenes(worldName: string): Promise<WorldSceneSummary[] | null> {
  try {
    const url = `${getWorldsContentServerUrl()}/world/${encodeURIComponent(worldName.toLowerCase())}/scenes`
    const response = await fetch(url)
    if (!response.ok) {
      console.warn('[sceneAdapter] fetchWorldScenes non-ok', { worldName, status: response.status })
      return null
    }
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
    return null
  }
}

// Cast2 scene-stream-access fallback. Mirrors the body shape of the cast2
// RTK Query mutation, hitting the same env-driven gatekeeper as
// fetchSceneAdapter. Returns null on any error.
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

// Peer URL for chat/profile lookups inside the LIVE watcher. Same source
// as the gatekeeper above — env-driven so the catalyst we query for
// profiles is the same cluster the LiveKit room is bound to.
const getLivePeerUrl = (): string => getPeerUrl()

export { fetchCastWatcherToken, fetchSceneAdapter, fetchWorldScenes, getLivePeerUrl, getWorldsContentServerUrl }
export type { SceneAdapterCredentials, WorldSceneSummary }
