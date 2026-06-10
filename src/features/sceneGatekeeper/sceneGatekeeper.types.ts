// One scene admin — a wallet allowed to moderate the scene. `canBeRemoved` is
// false for implicit admins (world owner, land-lease owners) the gatekeeper
// derives automatically.
interface SceneAdmin {
  admin: string
  name: string
  canBeRemoved: boolean
}

// Add a scene admin by wallet address OR DCL name (the gatekeeper resolves a
// name to its owner). Remove is always by address.
interface SceneAdminTarget {
  admin?: string
  name?: string
}

// OBS/RTMP streaming credentials for a scene. The key expires `ends_at`
// (created_at + 4 days, epoch milliseconds from the gatekeeper).
interface SceneStreamAccess {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  streaming_url: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  streaming_key: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  created_at?: number
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ends_at?: number
}

export type { SceneAdmin, SceneAdminTarget, SceneStreamAccess }
