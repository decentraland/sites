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

/**
 * What the dropdown should say right now. A single discriminant rather than a bag of booleans,
 * because the states are mutually exclusive and were previously indistinguishable: "nothing typed
 * yet", "still typing" and "searched and found nothing" all read as empty, so the field showed the
 * no-results copy before any search had run.
 */
type FeaturedAssetSearchStatus =
  /** Nothing typed — the dropdown has nothing to say and should stay shut. */
  | 'idle'
  /** Typed, but too short to search on. */
  | 'too-short'
  /** Debounce pending or a request in flight. */
  | 'loading'
  /** The marketplace could not be reached — distinct from "nothing matched". */
  | 'error'
  /** A search completed and matched nothing. */
  | 'empty'
  /** `options` holds at least one row. */
  | 'results'

interface FeaturedAssetSearchResult {
  options: FeaturedAssetOption[]
  status: FeaturedAssetSearchStatus
}

export type { FeaturedAssetKind, FeaturedAssetOption, FeaturedAssetSearchResult, FeaturedAssetSearchStatus }
