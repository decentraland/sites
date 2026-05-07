import { getEnv } from '../../../config/env'
import type { FetchListOptions, FetchListResult, Image, ImageUser, Rarity, WearableParsed } from './reels.types'

const FETCH_TIMEOUT_MS = 5000
const MATIC_NETWORK_TOKENS = ['matic', 'amoy']

const imageCache = new Map<string, Image>()

const getReelServiceUrl = (): string => {
  const url = getEnv('REEL_SERVICE_URL')
  if (!url) throw new Error('REEL_SERVICE_URL is required to fetch reel images')
  return url
}

async function fetchImageById(id: string, signal?: AbortSignal): Promise<Image> {
  const cached = imageCache.get(id)
  if (cached) return cached
  const response = await fetch(`${getReelServiceUrl()}/api/images/${id}/metadata`, {
    signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!response.ok) throw new Error(`Image ${id} not found`)
  const image = (await response.json()) as Image
  imageCache.set(id, image)
  return image
}

async function fetchImagesByUser(address: string, options: FetchListOptions, signal?: AbortSignal): Promise<FetchListResult> {
  const params = new URLSearchParams({ limit: String(options.limit), offset: String(options.offset) })
  const response = await fetch(`${getReelServiceUrl()}/api/users/${address}/images?${params.toString()}`, {
    signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS)
  })
  if (!response.ok) throw new Error(`Cannot fetch images for ${address}`)
  return (await response.json()) as FetchListResult
}

const isMaticUrn = (urn: string): boolean => {
  const lower = urn.toLowerCase()
  return MATIC_NETWORK_TOKENS.some(token => lower.includes(`:${token}:`))
}

// camera-reel-service emits URNs that include the per-NFT tokenId (last segment), but the
// subgraph indexes items at the asset URN (no tokenId). For 8-segment matic URNs whose last
// segment is purely numeric, drop it so the item lookup hits.
const stripTokenId = (urn: string): string => {
  const parts = urn.split(':')
  if (parts.length < 7) return urn
  const last = parts[parts.length - 1]
  return /^\d+$/.test(last) ? parts.slice(0, -1).join(':') : urn
}

interface GraphQLItem {
  id: string
  collection: { id: string }
  blockchainId: string
  image: string
  urn: string
  metadata: {
    wearable?: { name: string; rarity: string }
    emote?: { name: string; rarity: string }
  }
}

const WEARABLE_QUERY = `
  query Items($urns: [String!]) {
    items(where: { urn_in: $urns }) {
      id
      blockchainId
      image
      urn
      collection { id }
      metadata { wearable { name rarity } emote { name rarity } }
    }
  }
`

async function fetchGraph(url: string | undefined, urns: string[], signal?: AbortSignal): Promise<GraphQLItem[]> {
  if (!url || urns.length === 0) return []
  try {
    const response = await fetch(url, {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: WEARABLE_QUERY, variables: { urns } }),
      signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })
    if (!response.ok) return []
    const json = (await response.json()) as { data?: { items?: GraphQLItem[] } }
    return json.data?.items ?? []
  } catch {
    return []
  }
}

async function enrichWearables(users: ImageUser[], signal?: AbortSignal): Promise<ImageUser[]> {
  const allUrns = users.flatMap(user => user.wearables ?? [])
  if (allUrns.length === 0) return users

  const originalToAsset = new Map<string, string>()
  for (const urn of allUrns) originalToAsset.set(urn, stripTokenId(urn))

  const ethAssetUrns = new Set<string>()
  const maticAssetUrns = new Set<string>()
  for (const [original, asset] of originalToAsset) {
    if (isMaticUrn(original)) maticAssetUrns.add(asset)
    else ethAssetUrns.add(asset)
  }

  const [ethItems, maticItems] = await Promise.all([
    fetchGraph(getEnv('THE_GRAPH_API_ETH_URL'), [...ethAssetUrns], signal),
    fetchGraph(getEnv('THE_GRAPH_API_MATIC_URL'), [...maticAssetUrns], signal)
  ])

  const itemByAssetUrn = new Map<string, GraphQLItem>()
  for (const item of [...ethItems, ...maticItems]) itemByAssetUrn.set(item.urn, item)

  return users.map(user => ({
    ...user,
    wearablesParsed: (user.wearables ?? [])
      .map(originalUrn => {
        const assetUrn = originalToAsset.get(originalUrn)
        const item = assetUrn ? itemByAssetUrn.get(assetUrn) : undefined
        if (!item) return undefined
        const meta = item.metadata.wearable ?? item.metadata.emote
        return {
          id: item.id,
          urn: originalUrn,
          name: meta?.name ?? '',
          image: item.image,
          rarity: (meta?.rarity ?? 'common') as Rarity,
          collectionId: item.collection.id,
          blockchainId: item.blockchainId
        } satisfies WearableParsed
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }))
}

interface ProfileResponse {
  avatars?: Array<{
    userId?: string
    ethAddress?: string
    avatar?: {
      snapshots?: { face256?: string; face?: string }
    }
  }>
}

async function fetchProfileFaces(addresses: string[], signal?: AbortSignal): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const uniqueIds = Array.from(new Set(addresses.filter(Boolean).map(addr => addr.toLowerCase())))
  if (uniqueIds.length === 0) return result

  const peerUrl = getEnv('PEER_URL')
  if (!peerUrl) return result

  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles`, {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: uniqueIds }),
      signal: signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS)
    })
    if (!response.ok) return result
    const profiles = (await response.json()) as ProfileResponse[]
    for (const profile of profiles) {
      const avatar = profile.avatars?.[0]
      const id = (avatar?.userId ?? avatar?.ethAddress ?? '').toLowerCase()
      const face = avatar?.avatar?.snapshots?.face256 ?? avatar?.avatar?.snapshots?.face
      if (id && face) result.set(id, face)
    }
  } catch {
    // Ignore — fall back to no faces.
  }
  return result
}

function clearImageCache(): void {
  imageCache.clear()
}

export { clearImageCache, enrichWearables, fetchImageById, fetchImagesByUser, fetchProfileFaces, isMaticUrn }
