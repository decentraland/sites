jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../config/env', () => ({ getEnv: () => 'https://storage' }))
jest.mock('../features/storage', () => ({
  ...jest.requireActual('../features/storage'),
  fetchExportFile: jest.fn()
}))
jest.mock('../modules/file', () => ({ triggerBlobDownload: jest.fn() }))
jest.mock('./useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('./useStorageScope', () => ({ useStorageScope: jest.fn() }))
jest.mock('./useStorageTrack', () => ({ useStorageTrack: jest.fn() }))

import { act, renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { fetchExportFile } from '../features/storage'
import type { ExportSelection } from '../features/storage'
import { triggerBlobDownload } from '../modules/file'
import { SegmentEvent } from '../modules/segment.types'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageExport } from './useStorageExport'
import { useStorageScope } from './useStorageScope'
import { useStorageTrack } from './useStorageTrack'

type Hook = RenderHookResult<ReturnType<typeof useStorageExport>, unknown>
type Deferred = { resolve: (blob: Blob) => void; reject: (error: unknown) => void }

const fetchExportFileMock = fetchExportFile as jest.Mock
const triggerBlobDownloadMock = triggerBlobDownload as jest.Mock
const useAuthIdentityMock = useAuthIdentity as jest.Mock
const useStorageScopeMock = useStorageScope as jest.Mock
const useStorageTrackMock = useStorageTrack as jest.Mock

describe('useStorageExport', () => {
  let identity: AuthIdentity
  let selection: ExportSelection
  let file: Blob
  let trackMock: jest.Mock
  let pending: Deferred
  let hook: Hook

  const start = async (format: 'json' | 'csv' = 'json'): Promise<void> => {
    await act(async () => {
      hook.result.current.startExport(selection, format)
    })
  }
  const settle = async (outcome: (deferred: Deferred) => void): Promise<void> => {
    await act(async () => {
      outcome(pending)
    })
  }

  beforeEach(() => {
    identity = { authChain: [], ephemeralIdentity: {}, expiration: new Date(Date.now() + 60_000) } as unknown as AuthIdentity
    selection = { world: { keys: [] }, players: { addresses: ['0xa'] } }
    file = new Blob(['{}'])
    trackMock = jest.fn()
    fetchExportFileMock.mockImplementation(
      () =>
        new Promise<Blob>((resolve, reject) => {
          pending = { resolve, reject }
        })
    )
    useAuthIdentityMock.mockReturnValue({ identity })
    useStorageScopeMock.mockReturnValue({ realm: 'world.dcl.eth', position: '0,0' })
    useStorageTrackMock.mockReturnValue(trackMock)
    hook = renderHook(() => useStorageExport())
  })

  afterEach(() => {
    hook.unmount()
    jest.resetAllMocks()
  })

  describe('when nothing has been started', () => {
    it('should be idle with no error', () => {
      expect({ busy: hook.result.current.busy, errorKey: hook.result.current.errorKey }).toEqual({ busy: false, errorKey: null })
    })
  })

  describe('when an export is started', () => {
    beforeEach(async () => {
      await start('csv')
    })

    it('should request the file for the selection in the current scope with an abort signal', () => {
      expect(fetchExportFileMock).toHaveBeenCalledWith({
        identity,
        realm: 'world.dcl.eth',
        position: '0,0',
        format: 'csv',
        selection,
        signal: expect.any(AbortSignal)
      })
    })

    it('should be busy while the file streams', () => {
      expect(hook.result.current.busy).toBe(true)
    })

    describe('and it is started again before the file arrives', () => {
      beforeEach(async () => {
        await start('json')
      })

      it('should not send a second request', () => {
        expect(fetchExportFileMock).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the file arrives', () => {
      beforeEach(async () => {
        await settle(({ resolve }) => resolve(file))
      })

      it('should save it as storage-export with the chosen format', () => {
        expect(triggerBlobDownloadMock).toHaveBeenCalledWith(file, 'storage-export.csv')
      })

      it('should track the success with the format', () => {
        expect(trackMock).toHaveBeenCalledWith(SegmentEvent.STORAGE_EXPORT_SUCCESS, { format: 'csv' })
      })

      it('should be idle again', () => {
        expect(hook.result.current.busy).toBe(false)
      })
    })

    describe('and another export of the scene is already streaming', () => {
      beforeEach(async () => {
        await settle(({ reject }) => reject({ status: 429 }))
      })

      it('should show the rate limit message', () => {
        expect(hook.result.current.errorKey).toBe('component.storage.errors.rate_limited')
      })

      it('should track the failure with the status', () => {
        expect(trackMock).toHaveBeenCalledWith(SegmentEvent.STORAGE_EXPORT_FAILURE, { format: 'csv', errorStatus: 429 })
      })

      it('should not save anything and be idle again', () => {
        expect({ saved: triggerBlobDownloadMock.mock.calls.length, busy: hook.result.current.busy }).toEqual({ saved: 0, busy: false })
      })

      describe('and the error is dismissed', () => {
        beforeEach(() => {
          act(() => hook.result.current.clearError())
        })

        it('should clear the message', () => {
          expect(hook.result.current.errorKey).toBeNull()
        })
      })
    })

    describe('and the stream breaks', () => {
      beforeEach(async () => {
        await settle(({ reject }) => reject({ status: 'FETCH_ERROR', error: 'network error' }))
      })

      it('should show the export failed message', () => {
        expect(hook.result.current.errorKey).toBe('component.storage.errors.export_failed')
      })
    })

    describe('and the server rejects the signature', () => {
      beforeEach(async () => {
        await settle(({ reject }) => reject({ status: 401 }))
      })

      it('should show the mapped storage error', () => {
        expect(hook.result.current.errorKey).toBe('component.storage.errors.unauthorized')
      })
    })

    describe('and the scope changes before the file arrives', () => {
      let signal: AbortSignal

      beforeEach(async () => {
        signal = (fetchExportFileMock.mock.calls[0][0] as { signal: AbortSignal }).signal
        useStorageScopeMock.mockReturnValue({ realm: 'other.dcl.eth', position: '1,1' })
        await act(async () => {
          hook.rerender()
        })
      })

      it('should abort the in-flight export', () => {
        expect(signal.aborted).toBe(true)
      })

      it('should be idle again', () => {
        expect(hook.result.current.busy).toBe(false)
      })
    })

    describe('and the hook unmounts before the file arrives', () => {
      let signal: AbortSignal

      beforeEach(async () => {
        signal = (fetchExportFileMock.mock.calls[0][0] as { signal: AbortSignal }).signal
        hook.unmount()
        await settle(({ reject }) => reject({ status: 'FETCH_ERROR', error: 'aborted' }))
      })

      it('should abort the request', () => {
        expect(signal.aborted).toBe(true)
      })

      it('should neither save nor track anything', () => {
        expect({ saved: triggerBlobDownloadMock.mock.calls.length, tracked: trackMock.mock.calls.length }).toEqual({ saved: 0, tracked: 0 })
      })
    })
  })

  describe('when there is no identity', () => {
    beforeEach(async () => {
      useAuthIdentityMock.mockReturnValue({ identity: undefined })
      hook.rerender()
      await start()
    })

    it('should not request anything', () => {
      expect(fetchExportFileMock).not.toHaveBeenCalled()
    })
  })
})
