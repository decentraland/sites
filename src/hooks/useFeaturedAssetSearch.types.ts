/** Which marketplace surface an option came from — also drives the dropdown's section headers. */
type FeaturedAssetKind = 'item' | 'collection'

/** One selectable row in the featured-asset dropdown. */
interface FeaturedAssetOption {
  /** The value persisted on the event's `featured_item`. Unique, so it doubles as the React key. */
  urn: string
  name: string
  kind: FeaturedAssetKind
  /** One thumbnail for an item; up to four for a collection's tiled preview. May be empty. */
  thumbnails: string[]
  /** Creator wallet address, lowercased. Empty when the asset is an unresolved pasted URN. */
  creator: string
  /** Resolved profile name, when the creator has a deployed profile. */
  creatorName?: string
}

interface FeaturedAssetSearchResult {
  options: FeaturedAssetOption[]
  isLoading: boolean
  /** True once a search ran for the current input and produced nothing selectable. */
  isEmpty: boolean
}

export type { FeaturedAssetKind, FeaturedAssetOption, FeaturedAssetSearchResult }
