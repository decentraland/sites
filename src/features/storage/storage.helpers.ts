import { fromUnixTime } from 'date-fns/fromUnixTime'
import type { AuthIdentity } from '@dcl/crypto'
import signedFetchLib from 'decentraland-crypto-fetch'
import { getEnv } from '../../config/env'
import { LandType, RoleType } from './storage.types'
import type {
  Land,
  LandQueryResult,
  Rental,
  RentalFields,
  RentalsQueryResult,
  StorageContext,
  SubgraphEstate,
  SubgraphParcel,
  WrapSignedFetchError
} from './storage.types'

const MAX_RESULTS = 1000

const getLandRegistryAddress = (): string => {
  const value = getEnv('LAND_REGISTRY_ADDRESS')
  if (!value) throw new Error('LAND_REGISTRY_ADDRESS environment variable is not set')
  return value.toLowerCase()
}

const getEstateRegistryAddress = (): string => {
  const value = getEnv('ESTATE_REGISTRY_ADDRESS')
  if (!value) throw new Error('ESTATE_REGISTRY_ADDRESS environment variable is not set')
  return value.toLowerCase()
}

const storageContextId = ({ realm, position }: StorageContext): string => [realm, position].filter(Boolean).join(':') || ''

const buildSignedFetchMetadata = (realm?: string | null, position?: string | null): Record<string, unknown> => {
  const meta: Record<string, unknown> = {}
  if (realm) {
    meta.realm = { serverName: realm }
    meta.realmName = realm
  }
  if (position) {
    meta.parcel = position
  }
  return meta
}

type SignedFetch = (url: string, init?: RequestInit) => Promise<Response>

const createScopedSignedFetch = (identity: AuthIdentity | undefined, realm?: string | null, position?: string | null): SignedFetch => {
  const metadata = buildSignedFetchMetadata(realm, position)
  return async (url: string, init: RequestInit = {}) => {
    if (!identity) {
      return fetch(url, init)
    }
    return signedFetchLib(url, { ...init, identity, metadata })
  }
}

const wrapSignedFetch = async <T>(signedFetch: SignedFetch, url: string, init: RequestInit = { method: 'GET' }): Promise<T> => {
  try {
    const response = await signedFetch(url, init)
    if (!response.ok) {
      throw {
        status: response.status,
        data: await response.text().catch(() => undefined)
      }
    }
    return (await response.json()) as T
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) throw error
    throw {
      status: 'FETCH_ERROR' as const,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

const sendSignedFetch = async (signedFetch: SignedFetch, url: string, init: RequestInit): Promise<void> => {
  try {
    const response = await signedFetch(url, init)
    if (!response.ok) {
      throw {
        status: response.status,
        data: await response.text().catch(() => undefined)
      }
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) throw error
    throw {
      status: 'FETCH_ERROR' as const,
      error: error instanceof Error ? error.message : String(error)
    } satisfies WrapSignedFetchError
  }
}

const parcelToLand = (parcel: SubgraphParcel, role: RoleType): Land => ({
  id: `parcel-${parcel.x}-${parcel.y}`,
  tokenId: parcel.tokenId,
  type: LandType.PARCEL,
  role,
  x: parseInt(parcel.x, 10),
  y: parseInt(parcel.y, 10),
  name: parcel.data?.name ?? `Parcel (${parcel.x}, ${parcel.y})`,
  description: parcel.data?.description ?? null,
  owner: parcel.owner.address,
  operators: parcel.updateOperator ? [parcel.updateOperator] : []
})

const estateToLand = (estate: SubgraphEstate, role: RoleType): Land => ({
  id: `estate-${estate.id}`,
  tokenId: estate.tokenId,
  type: LandType.ESTATE,
  role,
  parcels: estate.parcels.map(p => ({
    x: parseInt(p.x, 10),
    y: parseInt(p.y, 10),
    id: p.id
  })),
  size: estate.size,
  name: estate.data?.name ?? `Estate #${estate.id}`,
  description: estate.data?.description ?? null,
  owner: estate.owner.address,
  operators: estate.updateOperator ? [estate.updateOperator] : []
})

const mergeLandsIntoMap = (landsMap: Map<string, Land>, parcels: SubgraphParcel[], estates: SubgraphEstate[], role: RoleType): void => {
  for (const parcel of parcels) {
    const land = parcelToLand(parcel, role)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }
  for (const estate of estates) {
    const land = estateToLand(estate, role)
    if (!landsMap.has(land.id)) {
      landsMap.set(land.id, land)
    }
  }
}

const transformLandQueryResult = (data: LandQueryResult): Land[] => {
  const landsMap = new Map<string, Land>()
  for (const parcel of data.ownerParcels) {
    const land = parcelToLand(parcel, RoleType.OWNER)
    landsMap.set(land.id, land)
  }
  for (const estate of data.ownerEstates) {
    const land = estateToLand(estate, RoleType.OWNER)
    landsMap.set(land.id, land)
  }
  mergeLandsIntoMap(landsMap, data.updateOperatorParcels, data.updateOperatorEstates, RoleType.OPERATOR)
  mergeLandsIntoMap(landsMap, data.tenantParcels, data.tenantEstates, RoleType.TENANT)
  mergeLandsIntoMap(landsMap, data.lessorParcels, data.lessorEstates, RoleType.LESSOR)
  return Array.from(landsMap.values())
}

const getLandQuery = (skip = 0): string => `
  query GetLands($address: Bytes, $tenantTokenIds: [String!], $lessorTokenIds: [String!]) {
    tenantParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { tokenId_in: $tenantTokenIds }) {
      ...parcelFields
    }
    tenantEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { id_in: $tenantTokenIds }) {
      ...estateFields
    }
    lessorParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { tokenId_in: $lessorTokenIds }) {
      ...parcelFields
    }
    lessorEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { id_in: $lessorTokenIds }) {
      ...estateFields
    }
    ownerParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { estate: null, owner: $address }) {
      ...parcelFields
    }
    ownerEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { owner: $address }) {
      ...estateFields
    }
    updateOperatorParcels: parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { updateOperator: $address }) {
      ...parcelFields
    }
    updateOperatorEstates: estates(first: ${MAX_RESULTS}, skip: ${skip}, where: { updateOperator: $address }) {
      ...estateFields
    }
    ownerAuthorizations: authorizations(first: ${MAX_RESULTS}, skip: ${skip}, where: { owner: $address, type: "UpdateManager" }) {
      operator
      isApproved
      tokenAddress
    }
    operatorAuthorizations: authorizations(first: ${MAX_RESULTS}, skip: ${skip}, where: { operator: $address, type: "UpdateManager" }) {
      owner {
        address
        parcels(first: ${MAX_RESULTS}, skip: ${skip}, where: { estate: null }) {
          ...parcelFields
        }
        estates(first: ${MAX_RESULTS}) {
          ...estateFields
        }
      }
      isApproved
      tokenAddress
    }
  }

  fragment parcelFields on Parcel {
    x
    y
    tokenId
    owner {
      address
    }
    updateOperator
    data {
      name
      description
    }
  }

  fragment estateFields on Estate {
    id
    owner {
      address
    }
    updateOperator
    size
    parcels(first: 1000) {
      x
      y
      tokenId
    }
    data {
      name
      description
    }
  }
`

const getRentalsQuery = (): string => `
  query Rentals($address: Bytes) {
    tenantRentals: rentals(where: { tenant: $address, isActive: true }) {
      ...rentalFields
    }
    lessorRentals: rentals(where: { lessor: $address, isActive: true }) {
      ...rentalFields
    }
  }

  fragment rentalFields on Rental {
    id
    contractAddress
    tokenId
    lessor
    tenant
    operator
    startedAt
    endsAt
  }
`

const getLandTypeFromContract = (contractAddress: string): LandType => {
  const lower = contractAddress.toLowerCase()
  if (lower === getLandRegistryAddress()) return LandType.PARCEL
  if (lower === getEstateRegistryAddress()) return LandType.ESTATE
  throw new Error(`Could not derive land type from contract address "${contractAddress}"`)
}

const fromRentalFields = (fields: RentalFields): Rental => ({
  id: fields.id,
  type: getLandTypeFromContract(fields.contractAddress),
  tokenId: fields.tokenId,
  lessor: fields.lessor,
  tenant: fields.tenant,
  operator: fields.operator,
  startedAt: fromUnixTime(+fields.startedAt),
  endsAt: fromUnixTime(+fields.endsAt)
})

const transformRentalsQueryResult = (data: RentalsQueryResult): { lessorRentals: Rental[]; tenantRentals: Rental[] } => ({
  lessorRentals: data.lessorRentals.map(fromRentalFields),
  tenantRentals: data.tenantRentals.map(fromRentalFields)
})

const getLandPosition = (land: Land): string | null => {
  if (land.type === LandType.PARCEL && land.x !== undefined && land.y !== undefined) {
    return `${land.x},${land.y}`
  }
  if (land.type === LandType.ESTATE && land.parcels && land.parcels.length > 0) {
    return `${land.parcels[0].x},${land.parcels[0].y}`
  }
  return null
}

const getRoleLabelKey = (role: RoleType): string => {
  switch (role) {
    case RoleType.OWNER:
      return 'owner'
    case RoleType.OPERATOR:
      return 'operator'
    case RoleType.TENANT:
      return 'tenant'
    case RoleType.LESSOR:
      return 'lessor'
    default:
      return 'unknown'
  }
}

const truncateAddress = (address: string): string => {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export {
  buildSignedFetchMetadata,
  createScopedSignedFetch,
  estateToLand,
  fromRentalFields,
  getEstateRegistryAddress,
  getLandPosition,
  getLandQuery,
  getLandRegistryAddress,
  getLandTypeFromContract,
  getRentalsQuery,
  getRoleLabelKey,
  parcelToLand,
  sendSignedFetch,
  storageContextId,
  transformLandQueryResult,
  transformRentalsQueryResult,
  truncateAddress,
  wrapSignedFetch
}
export type { SignedFetch }
