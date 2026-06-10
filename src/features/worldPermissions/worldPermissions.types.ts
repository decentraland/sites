import type { AuthIdentity } from '@dcl/crypto'

// The three world-level permissions worlds-content-server exposes. Each is an
// allow-list of wallets (access can also be unrestricted / nft / shared-secret,
// in which case `wallets` is absent).
type PermissionName = 'deployment' | 'streaming' | 'access'

interface PermissionEntry {
  type: string
  wallets?: string[]
}

interface WorldPermissions {
  deployment: PermissionEntry
  streaming: PermissionEntry
  access: PermissionEntry
}

interface WorldPermissionsResponse {
  permissions: WorldPermissions
  owner: string
}

interface WorldPermissionMutationArgs {
  identity?: AuthIdentity
  worldName: string
  permission: PermissionName
  address: string
}

export type { PermissionEntry, PermissionName, WorldPermissionMutationArgs, WorldPermissions, WorldPermissionsResponse }
