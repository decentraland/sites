import type { AuthIdentity } from '@dcl/crypto'

// Scene-context identification for the signed-fetch metadata that
// comms-gatekeeper uses to scope a ban to a specific scene. Mirrors the shape
// `/get-scene-adapter` expects (see features/discover/sceneAdapter.ts).
interface SceneContext {
  // Catalyst entity hash of the active deployment (gatekeeper's `sceneId`).
  sceneId: string
  // World ENS name (worlds) — the realm the scene lives in.
  realmName: string
  // Base parcel ("x,y"); required by the gatekeeper's auth metadata.
  parcel: string
}

interface SceneBanScope extends SceneContext {
  identity?: AuthIdentity
}

// One banned entry — comms-gatekeeper returns the address plus the resolved
// DCL/profile name (may be empty when unresolved).
interface SceneBan {
  bannedAddress: string
  name: string
}

interface ListSceneBansResponse {
  results: SceneBan[]
  total: number
  page: number
  pages: number
  limit: number
}

// Add/remove a ban by wallet address OR by DCL name (the gatekeeper resolves a
// name to its owner). Exactly one is provided.
interface SceneBanTarget {
  address?: string
  name?: string
}

export type { ListSceneBansResponse, SceneBan, SceneBanScope, SceneBanTarget, SceneContext }
