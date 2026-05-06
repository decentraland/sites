jest.mock('@dcl/hooks', () => ({
  useAnalytics: jest.fn()
}))
jest.mock('./useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))
jest.mock('./useStorageScope', () => ({
  useStorageScope: jest.fn()
}))

import { renderHook } from '@testing-library/react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../modules/segment.types'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageScope } from './useStorageScope'
import { useStorageTrack } from './useStorageTrack'

const mockedAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>
const mockedAuth = useAuthIdentity as jest.MockedFunction<typeof useAuthIdentity>
const mockedScope = useStorageScope as jest.MockedFunction<typeof useStorageScope>

describe('useStorageTrack', () => {
  describe('when invoked', () => {
    it('should call analytics.track with realm, parcel and address', () => {
      const track = jest.fn()
      mockedAnalytics.mockReturnValue({ track, isInitialized: true } as unknown as ReturnType<typeof useAnalytics>)
      mockedScope.mockReturnValue({ realm: 'foo', position: '0,0' })
      mockedAuth.mockReturnValue({ identity: undefined, hasValidIdentity: true, address: '0xabc' as `0x${string}` })

      const { result } = renderHook(() => useStorageTrack())
      result.current(SegmentEvent.STORAGE_ENV_SET_SUCCESS, { extra: 'x' })

      expect(track).toHaveBeenCalledWith(SegmentEvent.STORAGE_ENV_SET_SUCCESS, {
        realmName: 'foo',
        parcel: '0,0',
        address: '0xabc',
        extra: 'x'
      })
    })
  })
})
