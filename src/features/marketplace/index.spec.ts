/**
 * @jest-environment node
 */
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => `https://${key.toLowerCase()}.test`
}))

import * as marketplaceIndex from './index'

describe('features/marketplace barrel', () => {
  it('should re-export every public symbol from the underlying modules', () => {
    expect(marketplaceIndex.marketplaceSearchApi).toBeDefined()
    expect(marketplaceIndex.useSearchMarketplaceItemsQuery).toBeDefined()
    expect(marketplaceIndex.useSearchMarketplaceCollectionsQuery).toBeDefined()
    expect(marketplaceIndex.useGetMarketplaceItemsByContractQuery).toBeDefined()
    expect(marketplaceIndex.useGetMarketplaceItemsByUrnQuery).toBeDefined()
    expect(marketplaceIndex.useGetMarketplaceCollectionByUrnQuery).toBeDefined()
  })
})
