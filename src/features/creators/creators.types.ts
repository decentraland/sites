// A world the connected wallet can manage. Mirrors the storage feature's
// `World` shape (owner vs. collaborator), plus optional places-api enrichment
// for the Creations grid (thumbnail + live user count).
interface CreatorWorld {
  name: string
  role: 'owner' | 'collaborator'
  // Places-api enrichment (batch-fetched for the whole grid in one call).
  thumbnail?: string
  liveUserCount?: number
}

// Raw `/world/{name}/scenes` shape — the active deployment(s) for the world.
// worlds-content-server keeps only the current deployment per scene (there is
// no deploy-history endpoint), so this is the source for both the overview and
// the Deploys tab.
interface WorldSceneRaw {
  worldName?: string
  deployer?: string
  entityId?: string
  entity?: {
    timestamp?: number
    content?: Array<{ file: string; hash: string }>
    metadata?: {
      display?: { title?: string; description?: string; navmapThumbnail?: string }
      scene?: { base?: string; parcels?: string[] }
      requiredPermissions?: string[]
      runtimeVersion?: string
      // scene.json opt-in for server-side authoritative storage / multiplayer.
      // The scene/player storage service only works when this is true.
      authoritativeMultiplayer?: boolean
    }
  }
}

interface WorldScenesRawResponse {
  scenes?: WorldSceneRaw[]
}

// A single active deployment, derived from one scene entity.
interface WorldDeployment {
  entityId: string
  deployer?: string
  title: string
  description?: string
  baseParcel?: string
  parcelCount: number
  contentFileCount: number
  thumbnailUrl?: string
  sdkVersion?: string
  requiredPermissions: string[]
  // True when scene.json sets `authoritativeMultiplayer` — gates the Storage tab
  // (the scene/player storage service only works for authoritative scenes).
  authoritativeMultiplayer: boolean
  // Epoch millis from the catalyst entity, when present.
  deployedAt?: number
}

export type { CreatorWorld, WorldDeployment, WorldSceneRaw, WorldScenesRawResponse }
