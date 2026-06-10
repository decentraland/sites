import type { AuthIdentity } from '@dcl/crypto'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../../config/env'

// Shared by every scene-scoped comms-gatekeeper feature (bans, scene admins,
// streaming access). One signed-fetch instance + one metadata builder so all
// three agree on the exact shape the gatekeeper's `validate()` expects.
const sceneSignedFetch = signedFetchFactory()

const FALLBACK_GATEKEEPER_URL = 'https://comms-gatekeeper.decentraland.org'
const FALLBACK_WORLDS_CONTENT_SERVER_URL = 'https://worlds-content-server.decentraland.org'
// Lazy getters with fallbacks — never throw at import (these files are reachable
// from the shell chunk via the gatekeeperClient injection, pre-PR rule 16).
const getGatekeeperUrl = (): string => getEnv('GATEKEEPER_URL') || FALLBACK_GATEKEEPER_URL
const getWorldsContentServerUrl = (): string => getEnv('WORLDS_CONTENT_SERVER_URL') || FALLBACK_WORLDS_CONTENT_SERVER_URL

const SIGNER = 'decentraland-kernel-scene'

// Scene-context identification. The gatekeeper's `validate()` (used by
// /scene-bans, /scene-admin, /scene-stream-access) reads a `realm` OBJECT from
// the signed metadata — it derives the world name from `realm.serverName` and
// `isWorld` from `realm.hostname` containing "worlds-content-server". This is
// NOT the `realmName` string `/get-scene-adapter` uses.
interface SceneScope {
  identity?: AuthIdentity
  // Catalyst entity hash of the active deployment (gatekeeper's `sceneId`).
  sceneId: string
  // World ENS name — becomes `realm.serverName`.
  realmName: string
  // Base parcel ("x,y") required by the auth metadata.
  parcel: string
}

function sceneMetadata(scope: SceneScope) {
  return {
    realm: { serverName: scope.realmName, hostname: getWorldsContentServerUrl(), protocol: 'v3' },
    sceneId: scope.sceneId,
    parcel: scope.parcel,
    signer: SIGNER
  }
}

// Error shape returned by every gatekeeper queryFn. Raw server bodies are never
// attached (rule 10) — callers map status → a generic localized message.
type GatekeeperError = { status: number | 'FETCH_ERROR' | 'NO_IDENTITY' }

// Log the raw error, return a generic status (rule 10 — never surface raw
// server/exception detail to the UI).
function fetchErrorOf(error: unknown): { error: GatekeeperError } {
  console.warn('[sceneGatekeeper] request failed', error)
  return { error: { status: 'FETCH_ERROR' } }
}

export { fetchErrorOf, getGatekeeperUrl, sceneMetadata, sceneSignedFetch }
export type { GatekeeperError, SceneScope }
