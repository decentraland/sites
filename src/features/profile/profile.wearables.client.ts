import { useEffect, useMemo, useState } from 'react'
import { getEnv } from '../../config/env'

interface WearableData {
  category?: string
  bodyShapes?: string[]
  isSmart?: boolean
}

interface CatalogItem {
  id: string
  urn?: string
  name?: string
  thumbnail?: string
  rarity?: string
  /** Top-level category is "wearable" / "emote"; the meaningful sub-category lives under `data.wearable.category` or `data.emote.category`. */
  category?: string
  contractAddress?: string
  itemId?: string
  network?: 'MATIC' | 'ETHEREUM'
  price?: string
  /** Lowest active secondary-market listing price in wei. Most owned wearables in a profile reach this via resales, not primary sale. */
  minListingPrice?: string
  isOnSale?: boolean
  creator?: string
  /** Relative marketplace path (e.g. `/contracts/0x.../items/0`). Concatenate with `MARKETPLACE_URL` to build the full link. */
  url?: string
  data?: {
    wearable?: WearableData
    emote?: WearableData
  }
}

interface CatalogResponse {
  data: CatalogItem[]
  total: number
}

interface CollectibleDetail {
  urn: string
  name: string
  thumbnail: string
  rarity?: string
  /** Wearable sub-category (`upper_body`, `hat`, `eyes`, ...). For emotes this is the emote category. */
  wearableCategory?: string
  /** Short bodyShape labels (e.g. `["BaseMale", "BaseFemale"]`). Both present = unisex. */
  bodyShapes?: string[]
  /** Whether the wearable ships custom logic (smart wearable). */
  isSmart?: boolean
  contractAddress: string
  itemId: string
  network: 'MATIC' | 'ETHEREUM'
  marketplaceUrl: string
  creator: string
  price?: string
  isOnSale: boolean
}

const getMarketplaceApiUrl = (): string => {
  const url = getEnv('MARKETPLACE_API_URL')
  if (!url) throw new Error('MARKETPLACE_API_URL environment variable is not set')
  return url.replace(/\/+$/, '')
}

const getMarketplaceUrl = (): string => {
  const url = getEnv('MARKETPLACE_URL')
  if (!url) return 'https://decentraland.org/marketplace'
  return url.replace(/\/+$/, '')
}

/**
 * Off-chain base avatars are the default body parts every account ships with
 * (poloblacktshirt, beard, eyes_07, etc.) — they are not collectibles and the
 * Figma "Equipped Collectibles" row shows only on-chain items. Profile-viejo
 * applies the same filter via decentraland-dapps `AssetCard`.
 */
function isCollectibleUrn(urn: string): boolean {
  return urn.startsWith('urn:decentraland:matic:collections') || urn.startsWith('urn:decentraland:ethereum:collections')
}

function networkFromUrn(urn: string): 'MATIC' | 'ETHEREUM' {
  return urn.startsWith('urn:decentraland:ethereum') ? 'ETHEREUM' : 'MATIC'
}

// Marketplace returns `"0"` (or omits the field) when an item has no live primary sale
// or no secondary listings — both mean "no price to show".
function nonZeroPrice(wei: string | undefined): string | undefined {
  if (!wei) return undefined
  try {
    return BigInt(wei) === 0n ? undefined : wei
  } catch {
    return undefined
  }
}

function parseCollectibleUrn(urn: string): { contractAddress: string; itemId: string } | null {
  const parts = urn.split(':')
  if (parts.length < 6) return null
  const contractAddress = parts[4]?.toLowerCase()
  const itemId = parts[5]
  if (!contractAddress || !itemId) return null
  return { contractAddress, itemId }
}

// Catalyst returns equipped wearables as TOKEN URNs (trailing `:tokenId`
// segment, e.g. `urn:...collections-v2:0xabc:0:65`). The marketplace catalog
// endpoint indexes ITEM URNs (without tokenId) so we strip the extra segment.
function toItemUrn(urn: string): string {
  const parts = urn.split(':')
  if (parts.length <= 6) return urn
  return parts.slice(0, 6).join(':')
}

async function fetchOnePerNetwork(
  apiUrl: string,
  urns: readonly string[],
  network: 'MATIC' | 'ETHEREUM',
  signal?: AbortSignal
): Promise<CatalogItem[]> {
  if (urns.length === 0) return []
  const params = new URLSearchParams()
  params.set('network', network)
  for (const urn of urns) params.append('urn', urn)
  const response = await fetch(`${apiUrl}/v2/catalog?${params.toString()}`, { signal })
  if (!response.ok) throw new Error(`Failed to fetch collectibles (${response.status})`)
  const body = (await response.json()) as CatalogResponse
  return body.data ?? []
}

async function fetchCollectibleDetails(urns: readonly string[], signal?: AbortSignal): Promise<CollectibleDetail[]> {
  if (urns.length === 0) return []
  const apiUrl = getMarketplaceApiUrl()
  const marketplaceUrl = getMarketplaceUrl()
  // marketplace-api /v2/catalog is the live profile's endpoint. It is scoped
  // per network so split URNs by chain before firing the requests in parallel.
  const matic = urns.filter(urn => networkFromUrn(urn) === 'MATIC')
  const ethereum = urns.filter(urn => networkFromUrn(urn) === 'ETHEREUM')
  const [maticItems, ethereumItems] = await Promise.all([
    fetchOnePerNetwork(apiUrl, matic, 'MATIC', signal),
    fetchOnePerNetwork(apiUrl, ethereum, 'ETHEREUM', signal)
  ])
  const all = [...maticItems, ...ethereumItems]
  return all.map(item => {
    const urn = item.urn ?? item.id
    const parsed = parseCollectibleUrn(urn)
    const contractAddress = parsed?.contractAddress ?? item.contractAddress ?? ''
    const itemId = parsed?.itemId ?? item.itemId ?? ''
    const wearableData = item.data?.wearable ?? item.data?.emote
    // Prefer the relative path the API ships (`/contracts/.../items/N`) so we
    // stay aligned with the marketplace's canonical URL; only synthesise it as
    // a fallback when the field is missing.
    const itemPath = item.url ?? `/contracts/${contractAddress}/items/${itemId}`
    return {
      urn,
      name: item.name ?? urn,
      thumbnail: item.thumbnail ?? '',
      rarity: item.rarity,
      wearableCategory: wearableData?.category,
      bodyShapes: wearableData?.bodyShapes,
      isSmart: wearableData?.isSmart ?? false,
      contractAddress,
      itemId,
      network: item.network ?? networkFromUrn(urn),
      marketplaceUrl: `${marketplaceUrl}${itemPath}`,
      creator: item.creator ?? '',
      // Prefer the secondary-market floor (`minListingPrice`) because equipped wearables
      // on a profile usually circulate via resales — primary `price` is zero/empty by then.
      price: nonZeroPrice(item.minListingPrice) ?? nonZeroPrice(item.price),
      isOnSale: Boolean(item.isOnSale)
    }
  })
}

interface UseEquippedCollectiblesResult {
  collectibles: CollectibleDetail[]
  isLoading: boolean
}

const cache = new Map<string, CollectibleDetail>()

function useEquippedCollectibles(allWearableUrns: readonly string[]): UseEquippedCollectiblesResult {
  const collectibleUrns = useMemo(() => Array.from(new Set(allWearableUrns.filter(isCollectibleUrn).map(toItemUrn))), [allWearableUrns])
  const stableKey = useMemo(() => collectibleUrns.slice().sort().join('|'), [collectibleUrns])
  const [collectibles, setCollectibles] = useState<CollectibleDetail[]>(() => [])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (collectibleUrns.length === 0) {
      setCollectibles([])
      return undefined
    }
    const missing = collectibleUrns.filter(urn => !cache.has(urn))
    const seeded = collectibleUrns.map(urn => cache.get(urn)).filter((item): item is CollectibleDetail => item !== undefined)
    setCollectibles(seeded)
    if (missing.length === 0) return undefined

    const controller = new AbortController()
    setIsLoading(true)
    void (async () => {
      try {
        const fetched = await fetchCollectibleDetails(missing, controller.signal)
        if (controller.signal.aborted) return
        for (const detail of fetched) cache.set(detail.urn, detail)
        const next = collectibleUrns.map(urn => cache.get(urn)).filter((item): item is CollectibleDetail => item !== undefined)
        setCollectibles(next)
      } catch (error) {
        if (controller.signal.aborted) return
        console.error('[useEquippedCollectibles] failed to load:', error)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [stableKey, collectibleUrns])

  return { collectibles, isLoading }
}

export { useEquippedCollectibles, isCollectibleUrn, parseCollectibleUrn }
export type { CollectibleDetail }
