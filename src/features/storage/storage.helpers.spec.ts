jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../config/env', () => ({ getEnv: jest.fn(() => '0xfake') }))

import { getStorageErrorKey } from './storage.helpers'

describe('getStorageErrorKey', () => {
  it.each([
    [400, 'component.storage.errors.signed_fetch'],
    [401, 'component.storage.errors.unauthorized'],
    [403, 'component.storage.errors.unauthorized'],
    [404, 'component.storage.errors.not_found'],
    [413, 'component.storage.errors.payload_too_large'],
    [429, 'component.storage.errors.rate_limited'],
    [500, 'component.storage.errors.server'],
    [503, 'component.storage.errors.server']
  ])('maps numeric status %s to %s', (status, expected) => {
    expect(getStorageErrorKey({ status, data: 'whatever' })).toBe(expected)
  })

  it('maps the FETCH_ERROR sentinel to the network key', () => {
    expect(getStorageErrorKey({ status: 'FETCH_ERROR', error: 'offline' })).toBe('component.storage.errors.network')
  })

  it('falls back to the unknown key for unmapped numeric statuses', () => {
    expect(getStorageErrorKey({ status: 418 })).toBe('component.storage.errors.unknown')
  })

  it('falls back to the unknown key for null or non-object errors', () => {
    expect(getStorageErrorKey(null)).toBe('component.storage.errors.unknown')
    expect(getStorageErrorKey('boom')).toBe('component.storage.errors.unknown')
    expect(getStorageErrorKey(undefined)).toBe('component.storage.errors.unknown')
  })

  it('falls back to the unknown key when the status field is missing or non-numeric', () => {
    expect(getStorageErrorKey({})).toBe('component.storage.errors.unknown')
    expect(getStorageErrorKey({ status: 'WAT' as unknown as number })).toBe('component.storage.errors.unknown')
  })
})
