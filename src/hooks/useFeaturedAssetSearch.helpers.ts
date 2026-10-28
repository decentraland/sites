import type { MarketplaceCollection, MarketplaceItem } from '../features/marketplace'
import type { FeaturedAssetOption } from './useFeaturedAssetSearch.types'

/** Rows the design tiles a collection preview with (2x2). */
const MAX_COLLECTION_THUMBNAILS = 4
/** Below this, a free-text search matches too much to be useful (a pasted URN is exempt). */
const MIN_SEARCH_LENGTH = 2

/**
 * A collection URN has no trailing item id; an item URN does. Lets the hook resolve a pasted URN
 * against the right endpoint instead of querying both.
 */
function isCollectionUrn(urn: string): boolean {
  return !/:\d+$/.test(urn)
}

/**
 * Buckets the single batched `/v1/items` response back onto the collections that asked for it,
 * keeping at most the four thumbnails the tile can show.
 */
function groupThumbnailsByContract(items: readonly MarketplaceItem[]): Map<string, string[]> {
  const byContract = new Map<string, string[]>()
  for (const item of items) {
    if (!item.thumbnail) continue
    const key = item.contractAddress.toLowerCase()
    const thumbnails = byContract.get(key) ?? []
    if (thumbnails.length >= MAX_COLLECTION_THUMBNAILS) continue
    thumbnails.push(item.thumbnail)
    byContract.set(key, thumbnails)
  }
  return byContract
}

function itemToOption(item: MarketplaceItem, creatorNames: Map<string, string | undefined>): FeaturedAssetOption {
  const creator = item.creator.toLowerCase()
  return {
    urn: item.urn,
    name: item.name,
    kind: 'item',
    thumbnails: item.thumbnail ? [item.thumbnail] : [],
    creator,
    creatorName: creatorNames.get(creator)
  }
}

function collectionToOption(
  collection: MarketplaceCollection,
  thumbnailsByContract: Map<string, string[]>,
  creatorNames: Map<string, string | undefined>
): FeaturedAssetOption {
  const creator = collection.creator.toLowerCase()
  return {
    urn: collection.urn,
    name: collection.name,
    kind: 'collection',
    thumbnails: thumbnailsByContract.get(collection.contractAddress.toLowerCase()) ?? [],
    creator,
    creatorName: creatorNames.get(creator)
  }
}

/**
 * Fallback for a URN that passes validation but that the marketplace can't resolve (an unindexed or
 * very fresh collection). Without it, pasting such a URN would be rejected outright — which the
 * plain text field this replaced used to allow.
 */
function urnToOption(urn: string): FeaturedAssetOption {
  return { urn, name: urn, kind: isCollectionUrn(urn) ? 'collection' : 'item', thumbnails: [], creator: '' }
}

export {
  MAX_COLLECTION_THUMBNAILS,
  MIN_SEARCH_LENGTH,
  collectionToOption,
  groupThumbnailsByContract,
  isCollectionUrn,
  itemToOption,
  urnToOption
}
