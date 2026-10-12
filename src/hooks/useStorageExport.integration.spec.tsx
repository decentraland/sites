jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../config/env', () => ({ getEnv: () => 'https://storage' }))
jest.mock('./useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('./useStorageScope', () => ({ useStorageScope: jest.fn() }))
jest.mock('./useStorageTrack', () => ({ useStorageTrack: jest.fn() }))
jest.mock('../modules/file', () => ({ triggerBlobDownload: jest.fn() }))
jest.mock('../utils/gunzipBlob', () => ({ gunzipBlob: jest.fn() }))

import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import signedFetchLib from 'decentraland-crypto-fetch'
import { triggerBlobDownload } from '../modules/file'
import { storageClient } from '../services/storageClient'
import { gunzipBlob } from '../utils/gunzipBlob'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageExport } from './useStorageExport'
import { useStorageScope } from './useStorageScope'
import { useStorageTrack } from './useStorageTrack'

type Hook = RenderHookResult<ReturnType<typeof useStorageExport>, unknown>

const JOB_URL = 'https://storage/exports/job-1'
const DOWNLOAD_URL = `${JOB_URL}/download`

const signedFetchMock = signedFetchLib as unknown as jest.Mock
const triggerBlobDownloadMock = triggerBlobDownload as jest.Mock
const gunzipBlobMock = gunzipBlob as jest.Mock

const makeResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
    blob: async () => (body instanceof Blob ? body : new Blob([JSON.stringify(body)]))
  }) as unknown as Response

const setupStore = () =>
  configureStore({
    reducer: { [storageClient.reducerPath]: storageClient.reducer },
    middleware: g => g({ serializableCheck: false }).concat(storageClient.middleware)
  })

const callsTo = (url: string): number => signedFetchMock.mock.calls.filter(([calledUrl]) => calledUrl === url).length

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms)
  })
}

describe('useStorageExport with the real storage client', () => {
  let store: ReturnType<typeof setupStore>
  let jobStatuses: string[]
  let hook: Hook

  beforeEach(async () => {
    jest.useFakeTimers()
    store = setupStore()
    jobStatuses = ['running', 'done']
    const identity = { authChain: [], ephemeralIdentity: {}, expiration: new Date(Date.now() + 600_000) } as unknown as AuthIdentity
    ;(useAuthIdentity as jest.Mock).mockReturnValue({ identity })
    ;(useStorageScope as jest.Mock).mockReturnValue({ realm: 'world.dcl.eth', position: '1,2' })
    ;(useStorageTrack as jest.Mock).mockReturnValue(jest.fn())
    gunzipBlobMock.mockImplementation(async (blob: Blob) => blob)
    signedFetchMock.mockImplementation(async (url: string) => {
      if (url === DOWNLOAD_URL) return makeResponse(new Blob(['gz']))
      if (url === JOB_URL) return makeResponse({ id: 'job-1', status: jobStatuses.length > 1 ? jobStatuses.shift() : jobStatuses[0] })
      return makeResponse({ id: 'job-1', status: 'pending' })
    })
    hook = renderHook(() => useStorageExport(), {
      wrapper: ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
    })
    await act(async () => {
      hook.result.current.startExport({}, 'json')
    })
  })

  afterEach(() => {
    hook.unmount()
    store.dispatch(storageClient.util.resetApiState())
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when the job finishes after polling', () => {
    beforeEach(async () => {
      await advance(1000)
    })

    it('should poll the job at least twice', () => {
      expect(callsTo(JOB_URL)).toBeGreaterThanOrEqual(2)
    })

    it('should download the file exactly once', () => {
      expect(callsTo(DOWNLOAD_URL)).toBe(1)
    })

    it('should save the file exactly once', () => {
      expect(triggerBlobDownloadMock).toHaveBeenCalledTimes(1)
    })

    describe('and more time passes', () => {
      let pollsAtSave: number

      beforeEach(async () => {
        pollsAtSave = callsTo(JOB_URL)
        await advance(5000)
      })

      it('should not poll the job again', () => {
        expect(callsTo(JOB_URL)).toBe(pollsAtSave)
      })
    })
  })

  describe('when the component unmounts after the first poll', () => {
    let pollsAtUnmount: number

    beforeEach(async () => {
      jobStatuses = ['running']
      await advance(1000)
      pollsAtUnmount = callsTo(JOB_URL)
      hook.unmount()
      await advance(5000)
    })

    it('should not poll the job again', () => {
      expect(callsTo(JOB_URL)).toBe(pollsAtUnmount)
    })
  })
})
