const envMap: Record<string, string | undefined> = {
  STORAGE_API_URL: 'https://storage.example.test',
  WORLDS_CONTENT_SERVER_URL: 'https://worlds.example.test'
}

jest.mock('../config/env', () => ({
  getEnv: (key: string) => envMap[key]
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
    beforeEach(() => {
      envMap.STORAGE_API_URL = 'https://storage.example.test'
      envMap.WORLDS_CONTENT_SERVER_URL = 'https://worlds.example.test'
    })

    it('should return the resolved STORAGE_API_URL', () => {
      expect(getStorageApiUrl()).toBe('https://storage.example.test')
    })

    it('should return the resolved WORLDS_CONTENT_SERVER_URL', () => {
      expect(getWorldsContentServerUrl()).toBe('https://worlds.example.test')
    })
  })

  describe('when STORAGE_API_URL is not configured', () => {
    beforeEach(() => {
      envMap.STORAGE_API_URL = undefined
    })

    afterEach(() => {
      envMap.STORAGE_API_URL = 'https://storage.example.test'
    })

    it('should throw an explanatory error', () => {
      expect(() => getStorageApiUrl()).toThrow('STORAGE_API_URL environment variable is not set')
    })
  })

  describe('when WORLDS_CONTENT_SERVER_URL is not configured', () => {
    beforeEach(() => {
      envMap.WORLDS_CONTENT_SERVER_URL = undefined
    })

    afterEach(() => {
      envMap.WORLDS_CONTENT_SERVER_URL = 'https://worlds.example.test'
    })

    it('should throw an explanatory error', () => {
      expect(() => getWorldsContentServerUrl()).toThrow('WORLDS_CONTENT_SERVER_URL environment variable is not set')
    })
  })
})
