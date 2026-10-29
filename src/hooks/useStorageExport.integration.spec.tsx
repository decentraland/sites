jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../config/env', () => ({ getEnv: () => 'https://storage' }))
jest.mock('./useAuthIdentity', () => ({ useAuthIdentity: jest.fn() }))
jest.mock('./useStorageScope', () => ({ useStorageScope: jest.fn() }))
jest.mock('./useStorageTrack', () => ({ useStorageTrack: jest.fn() }))
jest.mock('../modules/file', () => ({ triggerBlobDownload: jest.fn() }))

import { act, renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import signedFetchLib from 'decentraland-crypto-fetch'
import { triggerBlobDownload } from '../modules/file'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageExport } from './useStorageExport'
import { useStorageScope } from './useStorageScope'
import { useStorageTrack } from './useStorageTrack'

type Hook = RenderHookResult<ReturnType<typeof useStorageExport>, unknown>

const signedFetchMock = signedFetchLib as unknown as jest.Mock
const triggerBlobDownloadMock = triggerBlobDownload as jest.Mock

describe('useStorageExport with the real export client', () => {
  let identity: AuthIdentity
  let file: Blob
  let hook: Hook

  beforeEach(async () => {
    identity = { authChain: [], ephemeralIdentity: {}, expiration: new Date(Date.now() + 60_000) } as unknown as AuthIdentity
    file = new Blob(['scope,player_address,key,value\r\n'], { type: 'text/csv' })
    signedFetchMock.mockResolvedValue({ ok: true, status: 200, blob: async () => file } as unknown as Response)
    ;(useAuthIdentity as jest.Mock).mockReturnValue({ identity })
    ;(useStorageScope as jest.Mock).mockReturnValue({ realm: 'world.dcl.eth', position: '1,2' })
    ;(useStorageTrack as jest.Mock).mockReturnValue(jest.fn())
    hook = renderHook(() => useStorageExport())
    await act(async () => {
      hook.result.current.startExport({ world: { keys: [] }, players: { addresses: ['0xa'] } }, 'csv')
    })
  })

  afterEach(() => {
    hook.unmount()
    jest.resetAllMocks()
  })

  describe('when a CSV export of some players streams back', () => {
    it('should send one signed POST with the selection and the scene scope', () => {
      expect(signedFetchMock.mock.calls).toEqual([
        [
          'https://storage/exports?format=csv',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ world: { keys: [] }, players: { addresses: ['0xa'] } }),
            identity,
            metadata: { realm: { serverName: 'world.dcl.eth' }, realmName: 'world.dcl.eth', parcel: '1,2' }
          })
        ]
      ])
    })

    it('should save the streamed file as storage-export.csv', () => {
      expect(triggerBlobDownloadMock).toHaveBeenCalledWith(file, 'storage-export.csv')
    })
  })
})
