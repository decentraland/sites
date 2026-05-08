import type { AuthIdentity } from '@dcl/crypto'
import type { Avatar } from '@dcl/schemas'

interface AuthParams {
  identity?: AuthIdentity
}

interface StorageContext {
  realm?: string | null
  position?: string | null
}

interface EnvKey {
  key: string
}

interface SetEnvParams {
  key: string
  value: string
}

interface DeleteEnvParams {
  key: string
}

interface SceneKey {
  key: string
}

interface SceneValue {
  key: string
  value: unknown
}

interface GetSceneValueParams {
  key: string
}

interface SetSceneValueParams {
  key: string
  value: unknown
}

interface DeleteSceneValueParams {
  key: string
}

interface PlayerKey {
  key: string
}

interface PlayerValue {
  key: string
  value: unknown
}

interface ListPlayerKeysParams {
  address: string
}

interface GetPlayerValueParams {
  address: string
  key: string
}

interface SetPlayerValueParams {
  address: string
  key: string
  value: unknown
}

interface DeletePlayerValueParams {
  address: string
  key: string
}

interface ClearPlayerParams {
  address: string
}

interface PlayerProfile {
  address: string
  displayName: string
  avatarUrl: string | undefined
  hasClaimedName: boolean
  avatar: Avatar | undefined
}

interface ContributableDomainRaw {
  name: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  user_permissions: string[]
  size: string
  owner: string
}

interface ContributableDomain {
  name: string
  userPermissions: string[]
  size: string
  owner: string
}

interface WorldSceneEntity {
  metadata: {
    display?: { title?: string }
    scene: { parcels: string[]; base: string }
  }
  pointers: string[]
}

interface WorldSceneItem {
  entity: WorldSceneEntity
  parcels: string[]
}

interface WorldScenesResponse {
  scenes: WorldSceneItem[]
  total: number
}

interface WorldScene {
  title: string
  baseParcel: string
}

interface World {
  name: string
  role: 'owner' | 'collaborator'
}

enum LandType {
  PARCEL = 'parcel',
  ESTATE = 'estate'
}

enum RoleType {
  OWNER = 1,
  LESSOR = 2,
  TENANT = 3,
  OPERATOR = 4
}

interface Land {
  id: string
  tokenId: string
  type: LandType
  role: RoleType
  x?: number
  y?: number
  parcels?: { x: number; y: number; id: string }[]
  size?: number
  name: string
  description: string | null
  owner: string
  operators: string[]
}

interface SubgraphParcel {
  x: string
  y: string
  tokenId: string
  owner: { address: string }
  updateOperator: string | null
  data: { name: string | null; description: string | null } | null
}

interface SubgraphEstate {
  id: string
  tokenId: string
  owner: { address: string }
  updateOperator: string | null
  size: number
  parcels: { x: string; y: string; id: string }[]
  data: { name: string | null; description: string | null } | null
}

interface SubgraphAuthorization {
  operator: string
  isApproved: boolean
  tokenAddress: string
}

interface LandQueryResult {
  ownerParcels: SubgraphParcel[]
  ownerEstates: SubgraphEstate[]
  updateOperatorParcels: SubgraphParcel[]
  updateOperatorEstates: SubgraphEstate[]
  tenantParcels: SubgraphParcel[]
  tenantEstates: SubgraphEstate[]
  lessorParcels: SubgraphParcel[]
  lessorEstates: SubgraphEstate[]
  ownerAuthorizations: SubgraphAuthorization[]
  operatorAuthorizations: SubgraphAuthorization[]
}

interface LandQueryResponse {
  data: LandQueryResult
}

interface RentalFields {
  id: string
  contractAddress: string
  tokenId: string
  lessor: string
  tenant: string
  operator: string
  startedAt: string
  endsAt: string
}

interface Rental {
  id: string
  type: LandType
  tokenId: string
  lessor: string
  tenant: string
  operator: string
  startedAt: Date
  endsAt: Date
}

interface RentalsQueryResult {
  tenantRentals: RentalFields[]
  lessorRentals: RentalFields[]
}

interface RentalsQueryResponse {
  data: RentalsQueryResult
}

interface DCLNamesResponse {
  data: {
    nfts: { ens: { subdomain: string } }[]
  }
}

interface ListStorageItemsResponse {
  data: Array<{ key: string; value: unknown }>
  pagination: { limit: number; offset: number; total: number }
}

interface ListEnvKeysResponse {
  data: string[]
  pagination: { limit: number; offset: number; total: number }
}

interface ListPlayersResponse {
  data: string[]
  pagination: { limit: number; offset: number; total: number }
}

interface StorageValueResponse {
  value: unknown
}

interface ContributableDomainsResponse {
  domains: ContributableDomainRaw[]
}

type WrapSignedFetchError = { status: number; data?: unknown } | { status: 'FETCH_ERROR'; error: string }

export { LandType, RoleType }
export type {
  AuthParams,
  ClearPlayerParams,
  ContributableDomain,
  ContributableDomainRaw,
  ContributableDomainsResponse,
  DCLNamesResponse,
  DeleteEnvParams,
  DeletePlayerValueParams,
  DeleteSceneValueParams,
  EnvKey,
  GetPlayerValueParams,
  GetSceneValueParams,
  Land,
  LandQueryResponse,
  LandQueryResult,
  ListEnvKeysResponse,
  ListPlayerKeysParams,
  ListPlayersResponse,
  ListStorageItemsResponse,
  PlayerKey,
  PlayerProfile,
  PlayerValue,
  Rental,
  RentalFields,
  RentalsQueryResponse,
  RentalsQueryResult,
  SceneKey,
  SceneValue,
  SetEnvParams,
  SetPlayerValueParams,
  SetSceneValueParams,
  StorageContext,
  StorageValueResponse,
  SubgraphAuthorization,
  SubgraphEstate,
  SubgraphParcel,
  World,
  WorldScene,
  WorldSceneEntity,
  WorldSceneItem,
  WorldScenesResponse,
  WrapSignedFetchError
}
