import { configureStore } from '@reduxjs/toolkit'
import { placesClient } from './placesClient'

describe('placesClient', () => {
  describe('when it is defined', () => {
    it('should expose the placesClient reducer path', () => {
      expect(placesClient.reducerPath).toBe('placesClient')
    })

    it('should register the Place, World, and SceneMetadata tag types', () => {
      const store = configureStore({
        reducer: { [placesClient.reducerPath]: placesClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(placesClient.middleware)
      })
      expect(store.getState()).toHaveProperty('placesClient')
    })
  })
})
