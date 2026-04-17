import { renderHook } from '@testing-library/react'
import { usePageNotifications } from './usePageNotifications'

const mockHandleNotificationsOpen = jest.fn()
const mockHandleOnBegin = jest.fn()
const mockHandleOnChangeModalTab = jest.fn()

jest.mock('@dcl/hooks', () => ({
  useNotifications: () => ({
    notifications: [],
    isLoading: false,
    isModalOpen: false,
    isNotificationsOnboarding: false,
    modalActiveTab: 'newest',
    handleNotificationsOpen: mockHandleNotificationsOpen,
    handleOnBegin: mockHandleOnBegin,
    handleOnChangeModalTab: mockHandleOnChangeModalTab
  })
}))

jest.mock('decentraland-ui2', () => ({
  NotificationActiveTab: { NEWEST: 'newest' }
}))

describe('usePageNotifications', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when identity is undefined and not connected', () => {
    it('should return undefined notificationProps', () => {
      const { result } = renderHook(() =>
        usePageNotifications({
          identity: undefined,
          isConnected: false
        })
      )

      expect(result.current.notificationProps).toBeUndefined()
    })
  })

  describe('when identity is provided and connected', () => {
    let mockIdentity: { authChain: never[] }

    beforeEach(() => {
      mockIdentity = { authChain: [] }
    })

    it('should return notificationProps', () => {
      const { result } = renderHook(() =>
        usePageNotifications({
          identity: mockIdentity as never,
          isConnected: true
        })
      )

      expect(result.current.notificationProps).toBeDefined()
    })

    it('should include locale in props', () => {
      const { result } = renderHook(() =>
        usePageNotifications({
          identity: mockIdentity as never,
          isConnected: true,
          locale: 'en'
        })
      )

      expect(result.current.notificationProps?.locale).toBe('en')
    })

    it('should include isLoading in props', () => {
      const { result } = renderHook(() =>
        usePageNotifications({
          identity: mockIdentity as never,
          isConnected: true
        })
      )

      expect(result.current.notificationProps?.isLoading).toBe(false)
    })

    it('should include onClick handler', () => {
      const { result } = renderHook(() =>
        usePageNotifications({
          identity: mockIdentity as never,
          isConnected: true
        })
      )

      expect(typeof result.current.notificationProps?.onClick).toBe('function')
    })

    it('should include onChangeTab handler', () => {
      const { result } = renderHook(() =>
        usePageNotifications({
          identity: mockIdentity as never,
          isConnected: true
        })
      )

      expect(typeof result.current.notificationProps?.onChangeTab).toBe('function')
    })
  })

  describe('when locale defaults to en', () => {
    let mockIdentity: { authChain: never[] }

    beforeEach(() => {
      mockIdentity = { authChain: [] }
    })

    it('should use en as default locale', () => {
      const { result } = renderHook(() =>
        usePageNotifications({
          identity: mockIdentity as never,
          isConnected: true
        })
      )

      expect(result.current.notificationProps?.locale).toBe('en')
    })
  })
})
