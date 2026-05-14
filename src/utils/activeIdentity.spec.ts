import {
  ACTIVE_ADDRESS_KEY,
  SIGN_IN_PENDING_KEY,
  hasValidIdentityFor,
  isRelevantStorageKey,
  markSignInPending,
  readActivePointer,
  resolveActiveAddress,
  resolveActiveIdentity,
  writeActivePointer
} from './activeIdentity'

const mockLocalStorageGetIdentity = jest.fn()

jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: (...args: unknown[]) => mockLocalStorageGetIdentity(...args)
}))

let store: Record<string, string> = {}

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    store = {}
  },
  get length() {
    return Object.keys(store).length
  },
  key: (index: number) => Object.keys(store)[index] ?? null
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
})

function fakeIdentity(address: string, expiration: string) {
  return {
    authChain: [
      { type: 'SIGNER', payload: address },
      {
        type: 'ECDSA_EPHEMERAL',
        payload: `Decentraland Login\nEphemeral address: 0xabc\nExpiration: ${expiration}`
      },
      { type: 'ECDSA_SIGNED_ENTITY', payload: 'sig', signature: 'sig' }
    ],
    ephemeralIdentity: { address: '0xabc', publicKey: 'pk', privateKey: 'sk' },
    expiration: new Date(expiration)
  }
}

function setIdentity(address: string, expiration: string) {
  store[`single-sign-on-${address.toLowerCase()}`] = JSON.stringify(fakeIdentity(address.toLowerCase(), expiration))
}

describe('activeIdentity', () => {
  beforeEach(() => {
    store = {}
    mockLocalStorageGetIdentity.mockReset()
    mockLocalStorageGetIdentity.mockImplementation((address: string) => {
      const raw = store[`single-sign-on-${address.toLowerCase()}`]
      return raw ? JSON.parse(raw) : null
    })
  })

  describe('resolveActiveAddress', () => {
    describe('when no identities exist', () => {
      it('should return null', () => {
        expect(resolveActiveAddress()).toBeNull()
      })

      it('should not write the pointer', () => {
        resolveActiveAddress()
        expect(store[ACTIVE_ADDRESS_KEY]).toBeUndefined()
      })
    })

    describe('when exactly one identity exists', () => {
      beforeEach(() => {
        setIdentity('0xonly', '2030-01-01T00:00:00Z')
      })

      it('should return its address', () => {
        expect(resolveActiveAddress()).toBe('0xonly')
      })

      it('should auto-promote the only identity to the pointer', () => {
        resolveActiveAddress()
        expect(store[ACTIVE_ADDRESS_KEY]).toBe('0xonly')
      })
    })

    describe('when multiple identities exist and no pointer is set', () => {
      beforeEach(() => {
        setIdentity('0xolder', '2026-06-03T13:56:58.962Z')
        setIdentity('0xnewer', '2026-06-07T22:40:52.233Z')
      })

      it('should fall back to the latest-expiration identity', () => {
        expect(resolveActiveAddress()).toBe('0xnewer')
      })

      it('should NOT persist the heuristic fallback as the pointer', () => {
        resolveActiveAddress()
        expect(store[ACTIVE_ADDRESS_KEY]).toBeUndefined()
      })
    })

    describe('when the pointer is set and its identity is valid', () => {
      beforeEach(() => {
        setIdentity('0xolder', '2026-06-03T13:56:58.962Z')
        setIdentity('0xnewer', '2026-06-07T22:40:52.233Z')
        writeActivePointer('0xolder')
      })

      it('should return the pointer address instead of the max-expiration one', () => {
        expect(resolveActiveAddress()).toBe('0xolder')
      })
    })

    describe('when the pointer references a missing identity', () => {
      beforeEach(() => {
        setIdentity('0xother', '2030-01-01T00:00:00Z')
        writeActivePointer('0xgone')
      })

      it('should fall through to the heuristic', () => {
        expect(resolveActiveAddress()).toBe('0xother')
      })

      it('should replace the stale pointer with the auto-promoted single valid identity', () => {
        resolveActiveAddress()
        expect(store[ACTIVE_ADDRESS_KEY]).toBe('0xother')
      })
    })

    describe('when the pointer is stored with mixed case', () => {
      beforeEach(() => {
        setIdentity('0xabc', '2030-01-01T00:00:00Z')
        store[ACTIVE_ADDRESS_KEY] = '0xABC'
      })

      it('should resolve case-insensitively', () => {
        expect(resolveActiveAddress()).toBe('0xabc')
      })
    })

    describe('when a sign-in is pending', () => {
      beforeEach(() => {
        setIdentity('0xprevious', '2026-06-03T13:56:58.962Z')
        setIdentity('0xfresh', '2026-07-01T00:00:00.000Z')
        writeActivePointer('0xprevious')
        markSignInPending()
      })

      it('should promote the latest-expiration identity over the stale pointer', () => {
        expect(resolveActiveAddress()).toBe('0xfresh')
        expect(store[ACTIVE_ADDRESS_KEY]).toBe('0xfresh')
      })

      it('should clear the pending flag after consuming it', () => {
        resolveActiveAddress()
        expect(store[SIGN_IN_PENDING_KEY]).toBeUndefined()
      })
    })

    describe('when a sign-in is pending but expired', () => {
      beforeEach(() => {
        setIdentity('0xprevious', '2026-06-03T13:56:58.962Z')
        setIdentity('0xfresh', '2026-07-01T00:00:00.000Z')
        writeActivePointer('0xprevious')
        store[SIGN_IN_PENDING_KEY] = String(Date.now() - 60 * 60 * 1000)
      })

      it('should ignore the expired flag and honor the existing pointer', () => {
        expect(resolveActiveAddress()).toBe('0xprevious')
      })

      it('should still consume the stale flag so it does not leak into future resolutions', () => {
        resolveActiveAddress()
        expect(store[SIGN_IN_PENDING_KEY]).toBeUndefined()
      })
    })

    describe('when a sign-in is pending but no identity was written', () => {
      beforeEach(() => {
        setIdentity('0xprevious', '2030-01-01T00:00:00Z')
        writeActivePointer('0xprevious')
        markSignInPending()
        // Auth failed mid-flow: pending flag set, but no new identity appears.
      })

      it('should fall back to the existing pointer instead of clearing the user', () => {
        expect(resolveActiveAddress()).toBe('0xprevious')
      })
    })
  })

  describe('markSignInPending', () => {
    it('should write a recent timestamp to the pending key', () => {
      const before = Date.now()
      markSignInPending()
      const written = Number(store[SIGN_IN_PENDING_KEY])
      expect(written).toBeGreaterThanOrEqual(before)
      expect(written).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('resolveActiveIdentity', () => {
    beforeEach(() => {
      setIdentity('0xolder', '2026-06-03T13:56:58.962Z')
      setIdentity('0xnewer', '2026-06-07T22:40:52.233Z')
    })

    it('should return the identity referenced by the pointer', () => {
      writeActivePointer('0xolder')
      const identity = resolveActiveIdentity()
      expect(identity?.authChain?.[0]?.payload).toBe('0xolder')
    })

    it('should fall back to the latest-expiration identity when no pointer is set', () => {
      const identity = resolveActiveIdentity()
      expect(identity?.authChain?.[0]?.payload).toBe('0xnewer')
    })

    it('should clear a stale pointer and return the fallback identity', () => {
      writeActivePointer('0xgone')
      const identity = resolveActiveIdentity()
      expect(identity?.authChain?.[0]?.payload).toBe('0xnewer')
    })
  })

  describe('readActivePointer', () => {
    it('should return null when unset', () => {
      expect(readActivePointer()).toBeNull()
    })

    it('should return the value lowercased', () => {
      store[ACTIVE_ADDRESS_KEY] = '0xABC'
      expect(readActivePointer()).toBe('0xabc')
    })
  })

  describe('writeActivePointer', () => {
    it('should write a lowercased address', () => {
      writeActivePointer('0xABC')
      expect(store[ACTIVE_ADDRESS_KEY]).toBe('0xabc')
    })

    it('should remove the pointer when called with null', () => {
      store[ACTIVE_ADDRESS_KEY] = '0xabc'
      writeActivePointer(null)
      expect(store[ACTIVE_ADDRESS_KEY]).toBeUndefined()
    })
  })

  describe('hasValidIdentityFor', () => {
    it('should return true when an identity is stored for the address', () => {
      setIdentity('0xabc', '2030-01-01T00:00:00Z')
      expect(hasValidIdentityFor('0xabc')).toBe(true)
    })

    it('should return false when no identity is stored for the address', () => {
      expect(hasValidIdentityFor('0xmissing')).toBe(false)
    })

    it('should be case-insensitive', () => {
      setIdentity('0xabc', '2030-01-01T00:00:00Z')
      expect(hasValidIdentityFor('0xABC')).toBe(true)
    })
  })

  describe('isRelevantStorageKey', () => {
    it('should return true for null (storage cleared)', () => {
      expect(isRelevantStorageKey(null)).toBe(true)
    })

    it('should return true for the active-address pointer', () => {
      expect(isRelevantStorageKey(ACTIVE_ADDRESS_KEY)).toBe(true)
    })

    it('should return true for address-shaped single-sign-on keys', () => {
      expect(isRelevantStorageKey('single-sign-on-0xabc')).toBe(true)
    })

    it('should return false for non-address single-sign-on keys', () => {
      // The scanner only processes `single-sign-on-0x*` entries, so reacting to
      // other shapes (e.g. `single-sign-on-meta`) would trigger no-op re-resolves.
      expect(isRelevantStorageKey('single-sign-on-meta')).toBe(false)
    })

    it('should return false for unrelated keys', () => {
      expect(isRelevantStorageKey('wagmi.store')).toBe(false)
      expect(isRelevantStorageKey('decentraland-connect-storage-key')).toBe(false)
      expect(isRelevantStorageKey('dcl_magic_user_email')).toBe(false)
      expect(isRelevantStorageKey('random-app-key')).toBe(false)
    })
  })
})
