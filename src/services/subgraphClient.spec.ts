jest.mock('../config/env', () => ({
  getEnv: (key: string) => {
    const map: Record<string, string> = {
      LAND_MANAGER_SUBGRAPH: 'https://subgraph.example.test/land',
      MARKETPLACE_SUBGRAPH: 'https://subgraph.example.test/marketplace',
      RENTALS_SUBGRAPH: 'https://subgraph.example.test/rentals'
    }
    return map[key]
  }
}))

import { configureStore } from '@reduxjs/toolkit'
import { getLandManagerSubgraph, getMarketplaceSubgraph, getRentalsSubgraph, subgraphClient } from './subgraphClient'

describe('subgraphClient', () => {
  describe('when it is defined', () => {
    it('should expose the subgraphClient reducer path', () => {
      expect(subgraphClient.reducerPath).toBe('subgraphClient')
    })

    it('should register the subgraph tag types', () => {
      const store = configureStore({
        reducer: { [subgraphClient.reducerPath]: subgraphClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(subgraphClient.middleware)
      })
      expect(store.getState()).toHaveProperty('subgraphClient')
    })
  })

  describe('when env getters are invoked', () => {
    it('should return the resolved LAND_MANAGER_SUBGRAPH', () => {
      expect(getLandManagerSubgraph()).toBe('https://subgraph.example.test/land')
    })

    it('should return the resolved MARKETPLACE_SUBGRAPH', () => {
      expect(getMarketplaceSubgraph()).toBe('https://subgraph.example.test/marketplace')
    })

    it('should return the resolved RENTALS_SUBGRAPH', () => {
      expect(getRentalsSubgraph()).toBe('https://subgraph.example.test/rentals')
    })
  })
})
