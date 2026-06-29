import { renderHook } from '@testing-library/react'
import { useIsMagicAccount } from './useIsMagicAccount'

describe('useIsMagicAccount', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('should be true when a magic user email is stored', () => {
    window.localStorage.setItem('dcl_magic_user_email', 'jane.doe@example.com')

    const { result } = renderHook(() => useIsMagicAccount())

    expect(result.current).toBe(true)
  })

  it('should be false when no magic email is stored (self-custodial / thirdweb login)', () => {
    const { result } = renderHook(() => useIsMagicAccount())

    expect(result.current).toBe(false)
  })
})
