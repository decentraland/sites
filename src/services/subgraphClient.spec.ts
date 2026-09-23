const envMap: Record<string, string | undefined> = {
  LAND_MANAGER_SUBGRAPH: 'https://subgraph.example.test/land',
  MARKETPLACE_SUBGRAPH: 'https://subgraph.example.test/marketplace',
  RENTALS_SUBGRAPH: 'https://subgraph.example.test/rentals'
}

jest.mock('../config/env', () => ({
  getEnv: (key: string) => envMap[key]
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

  describe('when a subgraph env var is missing', () => {
    afterEach(() => {
      envMap.LAND_MANAGER_SUBGRAPH = 'https://subgraph.example.test/land'
      envMap.MARKETPLACE_SUBGRAPH = 'https://subgraph.example.test/marketplace'
      envMap.RENTALS_SUBGRAPH = 'https://subgraph.example.test/rentals'
    })

    it('should throw for a missing LAND_MANAGER_SUBGRAPH', () => {
      envMap.LAND_MANAGER_SUBGRAPH = undefined
      expect(() => getLandManagerSubgraph()).toThrow('LAND_MANAGER_SUBGRAPH environment variable is not set')
    })

    it('should throw for a missing MARKETPLACE_SUBGRAPH', () => {
      envMap.MARKETPLACE_SUBGRAPH = undefined
      expect(() => getMarketplaceSubgraph()).toThrow('MARKETPLACE_SUBGRAPH environment variable is not set')
    })

    it('should throw for a missing RENTALS_SUBGRAPH', () => {
      envMap.RENTALS_SUBGRAPH = undefined
      expect(() => getRentalsSubgraph()).toThrow('RENTALS_SUBGRAPH environment variable is not set')
    })
  })
})
