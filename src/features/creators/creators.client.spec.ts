const mockGetEnv = jest.fn((..._args: unknown[]) => 'https://wcs.test')
jest.mock('../../config/env', () => ({
  getEnv: (...args: unknown[]) => mockGetEnv(...args)
}))

import { configureStore } from '@reduxjs/toolkit'
import { placesClient } from '../../services/placesClient'
import { creatorsEndpoints, toDeployment, toDeployments, useGetWorldDeploymentsQuery } from './creators.client'
import type { WorldSceneRaw } from './creators.types'

function makeStore() {
  return configureStore({
    reducer: { [placesClient.reducerPath]: placesClient.reducer },
    middleware: getDefault => getDefault().concat(placesClient.middleware)
  })
}

function mockFetch(handler: { ok: boolean; status?: number; body?: unknown }) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: handler.ok,
      status: handler.status ?? (handler.ok ? 200 : 404),
      json: () => Promise.resolve(handler.body),
      text: () => Promise.resolve('error body')
    } as Response)
  ) as unknown as typeof fetch
}

describe('creators.client', () => {
  afterEach(() => {
    jest.resetAllMocks()
    mockGetEnv.mockReturnValue('https://wcs.test')
  })

  describe('endpoint registration', () => {
    it('should register getWorldDeployments on the places client', () => {
      expect(placesClient.endpoints).toHaveProperty('getWorldDeployments')
    })

    it('should expose the generated hook', () => {
      expect(typeof useGetWorldDeploymentsQuery).toBe('function')
    })

    it('should build a store with the places reducerPath', () => {
      expect(makeStore().getState()).toHaveProperty(placesClient.reducerPath)
    })
  })

  describe('toDeployment', () => {
    it('should return null without an entity id', () => {
      expect(toDeployment({})).toBeNull()
      expect(toDeployment({ entity: {} })).toBeNull()
    })

    it('should map a full scene entity', () => {
      const scene: WorldSceneRaw = {
        deployer: '0xabc',
        entityId: 'bafyentity123456789',
        entity: {
          timestamp: 1700000000000,
          content: [
            { file: 'scene.json', hash: 'h1' },
            { file: 'thumb.png', hash: 'h2' }
          ],
          metadata: {
            display: { title: 'My World', description: 'desc', navmapThumbnail: 'thumb.png' },
            scene: { base: '0,0', parcels: ['0,0', '0,1'] },
            requiredPermissions: ['ALLOW_TO_MOVE_PLAYER_INSIDE_SCENE'],
            runtimeVersion: '7',
            authoritativeMultiplayer: true
          }
        }
      }
      const result = toDeployment(scene)
      expect(result).toMatchObject({
        entityId: 'bafyentity123456789',
        deployer: '0xabc',
        title: 'My World',
        baseParcel: '0,0',
        parcelCount: 2,
        contentFileCount: 2,
        sdkVersion: 'SDK 7',
        requiredPermissions: ['ALLOW_TO_MOVE_PLAYER_INSIDE_SCENE'],
        authoritativeMultiplayer: true,
        deployedAt: 1700000000000
      })
      expect(result?.thumbnailUrl).toBe('https://wcs.test/contents/h2')
    })

    it('should fall back to a truncated entity id title and empty defaults', () => {
      const result = toDeployment({ entityId: 'bafy1234567890' })
      expect(result?.title).toBe('bafy123456')
      expect(result?.parcelCount).toBe(0)
      expect(result?.contentFileCount).toBe(0)
      expect(result?.requiredPermissions).toEqual([])
    })
  })

  describe('toDeployments', () => {
    it('should return an empty array for an empty/undefined response', () => {
      expect(toDeployments(undefined)).toEqual([])
      expect(toDeployments({ scenes: [] })).toEqual([])
    })

    it('should drop entity-less scenes and sort newest first', () => {
      const result = toDeployments({
        scenes: [{ entityId: 'old', entity: { timestamp: 1000 } }, { entity: {} }, { entityId: 'new', entity: { timestamp: 2000 } }]
      })
      expect(result.map(deployment => deployment.entityId)).toEqual(['new', 'old'])
    })
  })

  describe('getWorldDeployments queryFn', () => {
    it('should return deployments on success', async () => {
      mockFetch({
        ok: true,
        body: { scenes: [{ entityId: 'e1', entity: { timestamp: 1, metadata: { scene: { base: '0,0', parcels: ['0,0'] } } } }] }
      })
      const store = makeStore()
      const result = await store.dispatch(creatorsEndpoints.endpoints.getWorldDeployments.initiate({ worldName: 'W.dcl.eth' }))
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].entityId).toBe('e1')
    })

    it('should error on a non-ok response', async () => {
      mockFetch({ ok: false, status: 404 })
      const store = makeStore()
      const result = await store.dispatch(creatorsEndpoints.endpoints.getWorldDeployments.initiate({ worldName: 'gone.dcl.eth' }))
      expect(result.isError).toBe(true)
    })

    it('should error when fetch throws', async () => {
      global.fetch = jest.fn(() => {
        throw new Error('network down')
      }) as unknown as typeof fetch
      const store = makeStore()
      const result = await store.dispatch(creatorsEndpoints.endpoints.getWorldDeployments.initiate({ worldName: 'boom.dcl.eth' }))
      expect(result.isError).toBe(true)
    })
  })
})
