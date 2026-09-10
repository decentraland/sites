import { renderHook } from '@testing-library/react'
import { useOpenProfileModal } from './useOpenProfileModal'

const navigateMock = jest.fn()
let mockLocation = { pathname: '/', search: '' }
jest.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => mockLocation
}))

let inModalNavigation: ((address: string) => void) | null = null
jest.mock('./ModalProfileNavigation', () => ({
  useModalProfileNavigation: () => inModalNavigation
}))

let hostAvailable = false
jest.mock('./ProfileModalHostContext', () => ({
  useProfileModalHostAvailable: () => hostAvailable
}))

describe('useOpenProfileModal', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    inModalNavigation = null
    hostAvailable = false
    mockLocation = { pathname: '/', search: '' }
  })

  describe('when no address is provided', () => {
    it('should do nothing', () => {
      const { result } = renderHook(() => useOpenProfileModal())
      result.current('')
      expect(navigateMock).not.toHaveBeenCalled()
    })
  })

  describe('when rendered inside a ModalProfileNavigationProvider', () => {
    it('should delegate to the host modal and never navigate', () => {
      const delegate = jest.fn()
      inModalNavigation = delegate
      hostAvailable = true
      const { result } = renderHook(() => useOpenProfileModal())
      result.current('0xABC')
      expect(delegate).toHaveBeenCalledWith('0xABC')
      expect(navigateMock).not.toHaveBeenCalled()
    })
  })

  describe('when a ProfileModalHost is available', () => {
    it('should open the overlay by adding ?profile=<address> to the current path', () => {
      hostAvailable = true
      mockLocation = { pathname: '/events', search: '?foo=bar' }
      const { result } = renderHook(() => useOpenProfileModal())
      result.current('0xABC')
      expect(navigateMock).toHaveBeenCalledWith({ pathname: '/events', search: '?foo=bar&profile=0xabc' })
    })
  })

  describe('when no ProfileModalHost is available (lightweight route)', () => {
    it('should navigate to the full /profile/<address> page', () => {
      hostAvailable = false
      mockLocation = { pathname: '/reels/img-1', search: '' }
      const { result } = renderHook(() => useOpenProfileModal())
      result.current('0xABC')
      expect(navigateMock).toHaveBeenCalledWith('/profile/0xabc')
    })
  })
})
