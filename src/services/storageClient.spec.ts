jest.mock('../config/env', () => ({
  getEnv: (key: string) => {
    const map: Record<string, string> = {
      STORAGE_API_URL: 'https://storage.example.test',
      WORLDS_CONTENT_SERVER_URL: 'https://worlds.example.test'
    }
    return map[key]
  }
}))

import { configureStore } from '@reduxjs/toolkit'
import { getStorageApiUrl, getWorldsContentServerUrl, storageClient } from './storageClient'

describe('storageClient', () => {
  describe('when it is defined', () => {
    it('should expose the storageClient reducer path', () => {
      expect(storageClient.reducerPath).toBe('storageClient')
    })

    it('should register the storage tag types', () => {
      const store = configureStore({
        reducer: { [storageClient.reducerPath]: storageClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(storageClient.middleware)
      })
      expect(store.getState()).toHaveProperty('storageClient')
    })
  })

  describe('when env getters are invoked', () => {
    it('should return the resolved STORAGE_API_URL', () => {
      expect(getStorageApiUrl()).toBe('https://storage.example.test')
    })

    it('should return the resolved WORLDS_CONTENT_SERVER_URL', () => {
      expect(getWorldsContentServerUrl()).toBe('https://worlds.example.test')
    })
  })
})
