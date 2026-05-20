jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../config/env', () => ({ getEnv: jest.fn(() => 'https://example.invalid') }))
import { act, renderHook } from '@testing-library/react'
import { useDialogError } from './useDialogError'

describe('useDialogError', () => {
  it('starts with no error and exposes a setter that maps an HTTP status to a key', () => {
    const { result } = renderHook(() => useDialogError([true]))
    expect(result.current.errorKey).toBeNull()
    act(() => result.current.setErrorFrom({ status: 401, data: 'nope' }))
    expect(result.current.errorKey).toBe('component.storage.errors.unauthorized')
  })

  it('clears the error when clearError is called', () => {
    const { result } = renderHook(() => useDialogError([true]))
    act(() => result.current.setErrorFrom({ status: 500 }))
    expect(result.current.errorKey).toBe('component.storage.errors.server')
    act(() => result.current.clearError())
    expect(result.current.errorKey).toBeNull()
  })

  it('resets the error whenever a reset dependency changes (dialog re-open, key swap)', () => {
    const { result, rerender } = renderHook(({ open }) => useDialogError([open]), { initialProps: { open: true } })
    act(() => result.current.setErrorFrom({ status: 'FETCH_ERROR', error: 'down' }))
    expect(result.current.errorKey).toBe('component.storage.errors.network')
    rerender({ open: false })
    expect(result.current.errorKey).toBeNull()
  })

  it('maps unrecognised errors to the unknown key', () => {
    const { result } = renderHook(() => useDialogError([true]))
    act(() => result.current.setErrorFrom('boom'))
    expect(result.current.errorKey).toBe('component.storage.errors.unknown')
  })
})
