jest.mock('../utils/authRedirect', () => ({
  redirectToAuth: jest.fn()
}))
jest.mock('./useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))
jest.mock('./useStorageScope', () => ({
  useStorageScope: jest.fn()
}))
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn()
}))

import { useLocation } from 'react-router-dom'
import { renderHook } from '@testing-library/react'
import { redirectToAuth } from '../utils/authRedirect'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageRedirect } from './useStorageRedirect'
import { useStorageScope } from './useStorageScope'

const mockedRedirect = redirectToAuth as jest.MockedFunction<typeof redirectToAuth>
const mockedAuth = useAuthIdentity as jest.MockedFunction<typeof useAuthIdentity>
const mockedScope = useStorageScope as jest.MockedFunction<typeof useStorageScope>
const mockedLocation = useLocation as jest.MockedFunction<typeof useLocation>

describe('useStorageRedirect', () => {
  beforeEach(() => {
    mockedLocation.mockReturnValue({ pathname: '/storage/env', search: '', state: null, hash: '', key: 'k' })
    mockedScope.mockReturnValue({ realm: 'foo', position: '0,0', isResolving: false, unresolved: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the identity is missing and the wallet is disconnected', () => {
    it('should redirect to auth preserving realm and position', () => {
      mockedAuth.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
      renderHook(() => useStorageRedirect())
      expect(mockedRedirect).toHaveBeenCalledWith('/storage/env', { realm: 'foo', position: '0,0' })
    })
  })

  describe('when there is an address but no valid identity (half-signed-in)', () => {
    it('should redirect to auth so signed-fetch operations can succeed (issue #505)', () => {
      mockedAuth.mockReturnValue({
        identity: undefined,
        hasValidIdentity: false,
        address: '0xabc' as `0x${string}`
      })
      renderHook(() => useStorageRedirect())
      expect(mockedRedirect).toHaveBeenCalledWith('/storage/env', { realm: 'foo', position: '0,0' })
    })
  })

  describe('when the identity is present', () => {
    it('should not redirect and report ready', () => {
      mockedAuth.mockReturnValue({ identity: {} as never, hasValidIdentity: true, address: '0xabc' as `0x${string}` })
      const { result } = renderHook(() => useStorageRedirect())
      expect(mockedRedirect).not.toHaveBeenCalled()
      expect(result.current.isReady).toBe(true)
    })
  })
})
