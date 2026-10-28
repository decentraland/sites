/** Top-level asset kind the marketplace exposes for a collection item. */
type MarketplaceItemCategory = 'wearable' | 'emote'

/** A single collection item (wearable/emote) as returned by `/v1/items`. */
interface MarketplaceItem {
  id: string
  name: string
  /** Absolute catalyst thumbnail URL. */
  thumbnail: string
  urn: string
  /** `string & {}` keeps editor autocomplete for the known literals while still accepting new API values. */
  category: MarketplaceItemCategory | (string & {})
  contractAddress: string
  itemId: string
  /** Wallet address of the item's creator — resolve to a name with `useGetProfileNames`. */
  creator: string
  network: 'ETHEREUM' | 'MATIC'
  rarity?: string
}

/** A collection as returned by `/v1/collections`. Note it carries no thumbnail of its own. */
interface MarketplaceCollection {
  urn: string
  name: string
  creator: string
  contractAddress: string
  /** Number of items in the collection. */
  size: number
  network: 'ETHEREUM' | 'MATIC'
  isOnSale: boolean
}

interface MarketplaceItemsResponse {
  data: MarketplaceItem[]
  total: number
}

interface MarketplaceCollectionsResponse {
  data: MarketplaceCollection[]
  total: number
}

interface SearchMarketplaceQuery {
  search: string
  first?: number
}

interface ItemsByContractQuery {
  contractAddresses: string[]
  first?: number
}

interface ItemsByUrnQuery {
  urns: string[]
}

interface CollectionsByUrnQuery {
  urn: string
}

export type {
  CollectionsByUrnQuery,
  ItemsByContractQuery,
  ItemsByUrnQuery,
  MarketplaceCollection,
  MarketplaceCollectionsResponse,
  MarketplaceItem,
  MarketplaceItemCategory,
  MarketplaceItemsResponse,
  SearchMarketplaceQuery
}
