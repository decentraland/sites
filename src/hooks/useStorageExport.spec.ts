jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../config/env', () => ({ getEnv: () => 'https://storage' }))
jest.mock('../features/storage', () => ({
  ...jest.requireActual('../features/storage'),
  useCreateExportMutation: jest.fn(),
  useGetExportQuery: jest.fn(),
  fetchExportFile: jest.fn()
}))
jest.mock('../utils/gunzipBlob', () => ({ gunzipBlob: jest.fn() }))
jest.mock('../modules/file', () => ({ triggerBlobDownload: jest.fn() }))
jest.mock('./useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('./useStorageScope', () => ({ useStorageScope: jest.fn() }))
jest.mock('./useStorageTrack', () => ({ useStorageTrack: jest.fn() }))

import { skipToken } from '@reduxjs/toolkit/query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { fetchExportFile, getStorageErrorKey, useCreateExportMutation, useGetExportQuery } from '../features/storage'
import { triggerBlobDownload } from '../modules/file'
import { SegmentEvent } from '../modules/segment.types'
import { gunzipBlob } from '../utils/gunzipBlob'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageExport } from './useStorageExport'
import { useStorageScope } from './useStorageScope'
import { useStorageTrack } from './useStorageTrack'

type Hook = RenderHookResult<ReturnType<typeof useStorageExport>, unknown>
type PollData = { id: string; status: string } | undefined

const useCreateExportMutationMock = useCreateExportMutation as jest.Mock
const useGetExportQueryMock = useGetExportQuery as jest.Mock
const fetchExportFileMock = fetchExportFile as jest.Mock
const gunzipBlobMock = gunzipBlob as jest.Mock
const triggerBlobDownloadMock = triggerBlobDownload as jest.Mock
const useAuthIdentityMock = useAuthIdentity as jest.Mock
const useStorageScopeMock = useStorageScope as jest.Mock
const useStorageTrackMock = useStorageTrack as jest.Mock

describe('useStorageExport', () => {
  let identity: AuthIdentity
  let createMock: jest.Mock
  let unwrapMock: jest.Mock
  let trackMock: jest.Mock
  let pollData: PollData
  let file: Blob
  let unzipped: Blob
  let hook: Hook

  const renderExportHook = (): Hook => renderHook(() => useStorageExport())
  const startJson = async (): Promise<void> => {
    await act(async () => {
      hook.result.current.startExport({}, 'json')
    })
  }
  const poll = async (data: PollData): Promise<void> => {
    pollData = data
    await act(async () => {
      hook.rerender()
    })
  }

  beforeEach(() => {
    identity = { authChain: [], ephemeralIdentity: {}, expiration: new Date(Date.now() + 60_000) } as unknown as AuthIdentity
    file = new Blob(['gz'])
    unzipped = new Blob(['{}'])
    pollData = undefined
    unwrapMock = jest.fn().mockResolvedValue({ id: 'job-1', status: 'pending' })
    createMock = jest.fn().mockReturnValue({ unwrap: unwrapMock })
    trackMock = jest.fn()
    useCreateExportMutationMock.mockReturnValue([createMock, { isLoading: false }])
    useGetExportQueryMock.mockImplementation((arg: unknown) => ({ currentData: arg === skipToken ? undefined : pollData }))
    fetchExportFileMock.mockResolvedValue(file)
    gunzipBlobMock.mockResolvedValue(unzipped)
    useAuthIdentityMock.mockReturnValue({ identity })
    useStorageScopeMock.mockReturnValue({ realm: 'world.dcl.eth', position: '1,2' })
    useStorageTrackMock.mockReturnValue(trackMock)
    hook = renderExportHook()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when an export is started', () => {
    beforeEach(async () => {
      await startJson()
    })

    it('should create the export with the identity, scope, format and selection', () => {
      expect(createMock).toHaveBeenCalledWith({ identity, realm: 'world.dcl.eth', position: '1,2', format: 'json', selection: {} })
    })

    it('should report busy', () => {
      expect(hook.result.current.busy).toBe(true)
    })

    it('should poll the created job every second', () => {
      expect(useGetExportQueryMock).toHaveBeenLastCalledWith(
        { identity, realm: 'world.dcl.eth', position: '1,2', id: 'job-1' },
        expect.objectContaining({ pollingInterval: 1000 })
      )
    })

    describe('and the poll returns running', () => {
      beforeEach(async () => {
        await poll({ id: 'job-1', status: 'running' })
      })

      it('should stay busy without saving anything', () => {
        expect({ busy: hook.result.current.busy, saved: triggerBlobDownloadMock.mock.calls.length }).toEqual({ busy: true, saved: 0 })
      })
    })

    describe('and the poll returns done', () => {
      beforeEach(async () => {
        await poll({ id: 'job-1', status: 'done' })
        await waitFor(() => expect(hook.result.current.busy).toBe(false))
      })

      it('should fetch the job file with the identity and scope', () => {
        expect(fetchExportFileMock).toHaveBeenCalledWith({ identity, realm: 'world.dcl.eth', position: '1,2', id: 'job-1' })
      })

      it('should unzip the fetched file', () => {
        expect(gunzipBlobMock).toHaveBeenCalledWith(file)
      })

      it('should save the unzipped file named after the format', () => {
        expect(triggerBlobDownloadMock).toHaveBeenCalledWith(unzipped, 'storage-export.json')
      })

      it('should track the export success with the format', () => {
        expect(trackMock).toHaveBeenCalledWith(SegmentEvent.STORAGE_EXPORT_SUCCESS, { format: 'json' })
      })

      describe('and the component re-renders with the same done data', () => {
        beforeEach(async () => {
          await poll({ id: 'job-1', status: 'done' })
        })

        it('should fetch and save the file exactly once', () => {
          expect([fetchExportFileMock.mock.calls.length, triggerBlobDownloadMock.mock.calls.length]).toEqual([1, 1])
        })
      })

      describe('and the same export is started again and the server returns the same job id', () => {
        beforeEach(async () => {
          await startJson()
          await waitFor(() => expect(triggerBlobDownloadMock).toHaveBeenCalledTimes(2))
          await waitFor(() => expect(hook.result.current.busy).toBe(false))
        })

        it('should save the file once per click', () => {
          expect(fetchExportFileMock).toHaveBeenCalledTimes(2)
        })

        it('should end the second export not busy', () => {
          expect(hook.result.current.busy).toBe(false)
        })
      })
    })

    describe('and the poll returns failed', () => {
      beforeEach(async () => {
        await poll({ id: 'job-1', status: 'failed' })
      })

      it('should set the export failed error key', () => {
        expect(hook.result.current.errorKey).toBe('component.storage.errors.export_failed')
      })

      it('should stop being busy', () => {
        expect(hook.result.current.busy).toBe(false)
      })

      it('should not save anything', () => {
        expect(triggerBlobDownloadMock).not.toHaveBeenCalled()
      })

      it('should track the export failure', () => {
        expect(trackMock).toHaveBeenCalledWith(SegmentEvent.STORAGE_EXPORT_FAILURE, expect.objectContaining({ format: 'json' }))
      })

      describe('and the error is cleared', () => {
        beforeEach(() => {
          act(() => hook.result.current.clearError())
        })

        it('should reset the error key to null', () => {
          expect(hook.result.current.errorKey).toBeNull()
        })
      })
    })

    describe('and the poll returns another job id', () => {
      beforeEach(async () => {
        await poll({ id: 'job-2', status: 'done' })
      })

      it('should ignore it', () => {
        expect(fetchExportFileMock).not.toHaveBeenCalled()
      })
    })

    describe('and another export is started while busy', () => {
      beforeEach(async () => {
        await startJson()
      })

      it('should ignore the second request', () => {
        expect(createMock).toHaveBeenCalledTimes(1)
      })
    })

    describe('and the file download fails with a 409', () => {
      beforeEach(async () => {
        fetchExportFileMock.mockRejectedValueOnce({ status: 409 })
        await poll({ id: 'job-1', status: 'done' })
        await waitFor(() => expect(hook.result.current.busy).toBe(false))
      })

      it('should set the error key mapped from the status', () => {
        expect(hook.result.current.errorKey).toBe(getStorageErrorKey({ status: 409 }))
      })

      it('should not save anything', () => {
        expect(triggerBlobDownloadMock).not.toHaveBeenCalled()
      })

      it('should track the export failure with the status', () => {
        expect(trackMock).toHaveBeenCalledWith(SegmentEvent.STORAGE_EXPORT_FAILURE, { format: 'json', errorStatus: 409 })
      })
    })

    describe('and the component unmounts while the file is being fetched', () => {
      let resolveFile: (blob: Blob) => void

      beforeEach(async () => {
        fetchExportFileMock.mockReturnValueOnce(
          new Promise<Blob>(resolve => {
            resolveFile = resolve
          })
        )
        await poll({ id: 'job-1', status: 'done' })
        hook.unmount()
        await act(async () => {
          resolveFile(file)
        })
      })

      it('should not save the file', () => {
        expect(triggerBlobDownloadMock).not.toHaveBeenCalled()
      })
    })
  })

  describe('when creating the export is rate limited', () => {
    beforeEach(async () => {
      unwrapMock.mockRejectedValueOnce({ status: 429 })
      await startJson()
    })

    it('should set the rate limited error key', () => {
      expect(hook.result.current.errorKey).toBe('component.storage.errors.rate_limited')
    })

    it('should not be busy', () => {
      expect(hook.result.current.busy).toBe(false)
    })

    it('should track the export failure with the status', () => {
      expect(trackMock).toHaveBeenCalledWith(SegmentEvent.STORAGE_EXPORT_FAILURE, { format: 'json', errorStatus: 429 })
    })
  })

  describe('when there is no identity', () => {
    beforeEach(async () => {
      useAuthIdentityMock.mockReturnValue({ identity: undefined })
      hook.rerender()
      await startJson()
    })

    it('should not create an export', () => {
      expect(createMock).not.toHaveBeenCalled()
    })
  })
})
