// `socialClient` and the discover client walk through `decentraland-crypto-fetch`,
// `config/env` and `@dcl/single-sign-on-client` at import time — stub them so
// the barrel can evaluate under Jest.
jest.mock('decentraland-crypto-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
  signedFetchFactory: () => jest.fn()
}))
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => `https://${key.toLowerCase()}.test`
}))
jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: jest.fn()
}))

import * as discoverIndex from './index'

describe('features/discover barrel', () => {
  it('should re-export every public query hook', () => {
    expect(discoverIndex.useGetCommunitiesListQuery).toBeDefined()
    expect(discoverIndex.useGetDiscoverDestinationsQuery).toBeDefined()
    expect(discoverIndex.useGetDiscoverFavoritesQuery).toBeDefined()
    expect(discoverIndex.useGetHotScenesQuery).toBeDefined()
    expect(discoverIndex.useGetLiveWorldsQuery).toBeDefined()
    expect(discoverIndex.useGetDiscoverPlaceByPositionQuery).toBeDefined()
    expect(discoverIndex.useGetDiscoverPlacesQuery).toBeDefined()
    expect(discoverIndex.useGetDiscoverWorldByNameQuery).toBeDefined()
    expect(discoverIndex.useGetDiscoverWorldsByNamesQuery).toBeDefined()
  })

  it('should re-export every public helper', () => {
    expect(discoverIndex.DISCOVER_CATEGORIES).toBeDefined()
    expect(discoverIndex.buildDetailPath).toBeDefined()
    expect(discoverIndex.buildJumpLandingHref).toBeDefined()
    expect(discoverIndex.discoverPlacePayload).toBeDefined()
    expect(discoverIndex.isHiddenPlace).toBeDefined()
    expect(discoverIndex.parsePositionParam).toBeDefined()
    expect(discoverIndex.placeCoordsLabel).toBeDefined()
    expect(discoverIndex.placeCoverImage).toBeDefined()
    expect(discoverIndex.placeIsFeatured).toBeDefined()
    expect(discoverIndex.placePlayers).toBeDefined()
  })
})
