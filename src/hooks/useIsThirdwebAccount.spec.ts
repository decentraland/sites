import { renderHook } from '@testing-library/react'
import { useIsThirdwebAccount } from './useIsThirdwebAccount'

describe('useIsThirdwebAccount', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('should be true when a thirdweb user email is stored', () => {
    window.localStorage.setItem('dcl_thirdweb_user_email', 'jane.doe@example.com')

    const { result } = renderHook(() => useIsThirdwebAccount())

    expect(result.current).toBe(true)
  })

  it('should be false when no thirdweb email is stored (self-custodial / Magic login)', () => {
    const { result } = renderHook(() => useIsThirdwebAccount())

    expect(result.current).toBe(false)
  })
})
