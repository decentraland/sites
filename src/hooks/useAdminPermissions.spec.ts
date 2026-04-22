import { AdminPermission } from '../features/whats-on/admin'
import { useAdminPermissions } from './useAdminPermissions'

jest.mock('./useAuthIdentity', () => ({
  useAuthIdentity: jest.fn()
}))
jest.mock('../features/whats-on/admin/admin.client', () => ({
  useGetMyProfileSettingsQuery: jest.fn()
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuthIdentity } = require('./useAuthIdentity') as { useAuthIdentity: jest.Mock }
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useGetMyProfileSettingsQuery } = require('../features/whats-on/admin/admin.client') as {
  useGetMyProfileSettingsQuery: jest.Mock
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderHook } = require('@testing-library/react') as typeof import('@testing-library/react')

describe('when the user has no valid identity', () => {
  beforeEach(() => {
    useAuthIdentity.mockReturnValue({ identity: undefined, hasValidIdentity: false, address: undefined })
    useGetMyProfileSettingsQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should report isAdmin=false', () => {
    const { result } = renderHook(() => useAdminPermissions())
    expect(result.current.isAdmin).toBe(false)
  })

  it('should report hasIdentity=false', () => {
    const { result } = renderHook(() => useAdminPermissions())
    expect(result.current.hasIdentity).toBe(false)
  })

  it('should skip the profile settings query', () => {
    renderHook(() => useAdminPermissions())
    expect(useGetMyProfileSettingsQuery).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ skip: true }))
  })
})

describe('when the user has a valid identity and admin permissions', () => {
  beforeEach(() => {
    useAuthIdentity.mockReturnValue({
      identity: { authChain: [{ payload: '0xabc' }] },
      hasValidIdentity: true,
      address: '0xabc'
    })
    useGetMyProfileSettingsQuery.mockReturnValue({
      data: { user: '0xabc', email: null, permissions: [AdminPermission.EDIT_ANY_PROFILE, AdminPermission.APPROVE_ANY_EVENT] },
      isLoading: false
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should report isAdmin=true', () => {
    const { result } = renderHook(() => useAdminPermissions())
    expect(result.current.isAdmin).toBe(true)
  })

  it('should derive canEditAnyProfile=true', () => {
    const { result } = renderHook(() => useAdminPermissions())
    expect(result.current.canEditAnyProfile).toBe(true)
  })

  it('should derive canApproveAnyEvent=true', () => {
    const { result } = renderHook(() => useAdminPermissions())
    expect(result.current.canApproveAnyEvent).toBe(true)
  })

  it('should derive canEditAnyEvent=false when the permission is not granted', () => {
    const { result } = renderHook(() => useAdminPermissions())
    expect(result.current.canEditAnyEvent).toBe(false)
  })
})
