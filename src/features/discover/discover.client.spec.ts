import { configureStore } from '@reduxjs/toolkit'
import { placesClient } from '../../services/placesClient'
import { socialClient } from '../../services/socialClient'
// `socialClient` and the discover endpoint file walk through a chain of
// modules — `decentraland-crypto-fetch` (needs browser fetch), `config/env`
// (uses `import.meta.env` which Jest can't parse), and `@dcl/single-sign-on-client`
// (touches `localStorage` at import). Stub all three so the spec only
// exercises the RTK Query injection layer.
jest.mock('decentraland-crypto-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
  signedFetchFactory: () => jest.fn()
}))
jest.mock('../../config/env', () => ({
  getEnv: jest.fn(() => 'https://stub.test')
}))
jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: jest.fn()
}))
import {
  useGetCommunitiesListQuery,
  useGetDiscoverPlaceByPositionQuery,
  useGetDiscoverPlacesQuery,
  useGetDiscoverWorldByNameQuery,
  useGetDiscoverWorldsByNamesQuery,
  useGetDiscoverWorldsQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery
} from './discover.client'

// Side-effect import: the client file itself injects endpoints into
// `placesClient` and `socialClient` at module-eval time. Importing the
// hooks above triggers that injection, but we also assert it explicitly
// so a future refactor that splits the file can't silently drop endpoints.
describe('discover.client', () => {
  describe('when the store is built with the discover-bearing base clients', () => {
    it('boots with both base clients' + ' reducerPath registered', () => {
      const store = configureStore({
        reducer: {
          [placesClient.reducerPath]: placesClient.reducer,
          [socialClient.reducerPath]: socialClient.reducer
        },
        middleware: getDefault => getDefault().concat(placesClient.middleware, socialClient.middleware)
      })

      expect(store.getState()).toHaveProperty(placesClient.reducerPath)
      expect(store.getState()).toHaveProperty(socialClient.reducerPath)
    })
  })

  describe('when querying the injected endpoint registry', () => {
    it('exposes every places-tier endpoint the discover pages consume', () => {
      // `injectEndpoints({overrideExisting:false})` patches the same `placesClient`
      // instance. The endpoints registry is the source of truth.
      expect(placesClient.endpoints).toHaveProperty('getDiscoverPlaces')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverWorlds')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverWorldsByNames')
      expect(placesClient.endpoints).toHaveProperty('getHotScenes')
      expect(placesClient.endpoints).toHaveProperty('getLiveWorlds')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverPlaceByPosition')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverWorldByName')
    })

    it('exposes the communities list endpoint on the social-api client', () => {
      expect(socialClient.endpoints).toHaveProperty('getCommunitiesList')
    })
  })

  describe('when callers import the generated hooks', () => {
    it('returns a defined hook for every endpoint exposed by the barrel', () => {
      // We treat the hook identities as opaque — only assert they exist and are
      // functions. RTK Query's generator builds these from endpoint names; if
      // any endpoint stops being injected the hook becomes undefined.
      expect(typeof useGetDiscoverPlacesQuery).toBe('function')
      expect(typeof useGetDiscoverWorldsQuery).toBe('function')
      expect(typeof useGetDiscoverWorldsByNamesQuery).toBe('function')
      expect(typeof useGetHotScenesQuery).toBe('function')
      expect(typeof useGetLiveWorldsQuery).toBe('function')
      expect(typeof useGetDiscoverPlaceByPositionQuery).toBe('function')
      expect(typeof useGetDiscoverWorldByNameQuery).toBe('function')
      expect(typeof useGetCommunitiesListQuery).toBe('function')
    })
  })
})
