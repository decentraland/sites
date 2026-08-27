import { useMemo } from 'react'
import {
  useGetMarketplaceCollectionByUrnQuery,
  useGetMarketplaceItemsByContractQuery,
  useGetMarketplaceItemsByUrnQuery,
  useSearchMarketplaceCollectionsQuery,
  useSearchMarketplaceItemsQuery
} from '../features/marketplace'
import { useGetProfileNames } from '../features/profile/profile.client'
import { isValidFeaturedItemUrn } from './useCreateEventForm.helpers'
import { useDebouncedValue } from './useDebouncedValue'
import {
  MAX_COLLECTION_THUMBNAILS,
  MIN_SEARCH_LENGTH,
  collectionToOption,
  groupThumbnailsByContract,
  isCollectionUrn,
  itemToOption,
  urnToOption
} from './useFeaturedAssetSearch.helpers'
import type { FeaturedAssetOption, FeaturedAssetSearchResult } from './useFeaturedAssetSearch.types'

const SEARCH_DEBOUNCE_MS = 300
/**
 * Over-fetch the collection previews: the batched `/v1/items` call is bounded by a single `first`
 * shared across every requested contract, so a large collection can crowd out a small one. Asking
 * for double the tiles the design shows makes that rare, and a short-changed row just renders fewer
 * tiles rather than failing.
 */
const PREVIEW_OVERFETCH = 2

const EMPTY_OPTIONS: FeaturedAssetOption[] = []

/**
 * Backs the event form's featured-asset picker: debounced free-text search across marketplace items
 * and collections, plus direct resolution of a pasted URN.
 *
 * Only assets whose URN the events backend accepts are returned, so a row can never be picked and
 * then rejected by the form's own validation.
 */
function useFeaturedAssetSearch(query: string): FeaturedAssetSearchResult {
  const search = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)
  const isUrn = isValidFeaturedItemUrn(search)
  const isTextSearch = !isUrn && search.length >= MIN_SEARCH_LENGTH
  const urnIsCollection = isUrn && isCollectionUrn(search)

  const itemSearch = useSearchMarketplaceItemsQuery({ search }, { skip: !isTextSearch })
  const collectionSearch = useSearchMarketplaceCollectionsQuery({ search }, { skip: !isTextSearch })
  const itemByUrn = useGetMarketplaceItemsByUrnQuery({ urns: [search] }, { skip: !isUrn || urnIsCollection })
  const collectionByUrn = useGetMarketplaceCollectionByUrnQuery({ urn: search }, { skip: !isUrn || !urnIsCollection })

  const items = useMemo(() => {
    const found = isUrn ? itemByUrn.data?.data : itemSearch.data?.data
    return (found ?? []).filter(item => isValidFeaturedItemUrn(item.urn))
  }, [isUrn, itemByUrn.data, itemSearch.data])

  const collections = useMemo(() => {
    const found = isUrn ? collectionByUrn.data?.data : collectionSearch.data?.data
    return (found ?? []).filter(collection => isValidFeaturedItemUrn(collection.urn))
  }, [isUrn, collectionByUrn.data, collectionSearch.data])

  const contractAddresses = useMemo(() => collections.map(collection => collection.contractAddress.toLowerCase()), [collections])
  const previews = useGetMarketplaceItemsByContractQuery(
    { contractAddresses, first: contractAddresses.length * MAX_COLLECTION_THUMBNAILS * PREVIEW_OVERFETCH },
    { skip: contractAddresses.length === 0 }
  )

  const creatorAddresses = useMemo(
    () => [
      ...new Set([...items.map(item => item.creator.toLowerCase()), ...collections.map(collection => collection.creator.toLowerCase())])
    ],
    [items, collections]
  )
  const creatorNames = useGetProfileNames(creatorAddresses)

  const thumbnailsByContract = useMemo(() => groupThumbnailsByContract(previews.data?.data ?? []), [previews.data])

  // Collection previews are deliberately excluded: they only fill in the tiles, so waiting on them
  // would hide item rows that are already selectable.
  const isLoading = isTextSearch
    ? itemSearch.isFetching || collectionSearch.isFetching
    : isUrn
      ? itemByUrn.isFetching || collectionByUrn.isFetching
      : false

  const options = useMemo(() => {
    if (!isTextSearch && !isUrn) return EMPTY_OPTIONS
    // Items first so the Autocomplete's `groupBy` emits the ITEMS section above COLLECTIONS.
    const built = [
      ...items.map(item => itemToOption(item, creatorNames)),
      ...collections.map(collection => collectionToOption(collection, thumbnailsByContract, creatorNames))
    ]
    if (built.length === 0 && isUrn && !isLoading) return [urnToOption(search)]
    return built
  }, [isTextSearch, isUrn, isLoading, items, collections, creatorNames, thumbnailsByContract, search])

  return { options, isLoading, isEmpty: !isLoading && (isTextSearch || isUrn) && options.length === 0 }
}

export { SEARCH_DEBOUNCE_MS, useFeaturedAssetSearch }
