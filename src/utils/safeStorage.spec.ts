import { readStorageItem, removeStorageItems } from './safeStorage'

const withLocalStorage = (value: unknown): void => {
  Object.defineProperty(window, 'localStorage', { value, configurable: true, writable: true })
}

const realLocalStorage = window.localStorage

afterEach(() => {
  withLocalStorage(realLocalStorage)
  window.localStorage.clear()
  jest.restoreAllMocks()
})

describe('when storage works', () => {
  it('should read a stored value', () => {
    window.localStorage.setItem('anon', 'abc')

    expect(readStorageItem('anon')).toBe('abc')
  })

  it('should return null for a key that was never written', () => {
    expect(readStorageItem('missing')).toBeNull()
  })

  it('should remove only the keys the predicate matches', () => {
    window.localStorage.setItem('single-sign-on-a', '1')
    window.localStorage.setItem('single-sign-on-b', '2')
    window.localStorage.setItem('dcl-locale', 'es')

    removeStorageItems(key => key.startsWith('single-sign-on-'))

    expect(window.localStorage.getItem('single-sign-on-a')).toBeNull()
    expect(window.localStorage.getItem('single-sign-on-b')).toBeNull()
    expect(window.localStorage.getItem('dcl-locale')).toBe('es')
  })

  // Removing while walking the index shifts the remaining entries, which used to
  // skip every other match.
  it('should remove every match rather than every other one', () => {
    window.localStorage.setItem('wagmi.a', '1')
    window.localStorage.setItem('wagmi.b', '2')
    window.localStorage.setItem('wagmi.c', '3')

    removeStorageItems(key => key.startsWith('wagmi'))

    expect(window.localStorage.length).toBe(0)
  })
})

// Some Android WebViews hand back a null `localStorage` (SITES-2RR, SITES-2RY).
describe('when localStorage is null', () => {
  beforeEach(() => withLocalStorage(null))

  it('should read as null instead of throwing', () => {
    expect(() => readStorageItem('anon')).not.toThrow()
    expect(readStorageItem('anon')).toBeNull()
  })

  it('should skip the removal instead of throwing', () => {
    expect(() => removeStorageItems(() => true)).not.toThrow()
  })
})

// A document denied storage access throws on the property itself (SITES-2RS).
describe('when reading localStorage throws', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Access is denied for this document.', 'SecurityError')
      }
    })
  })

  it('should read as null instead of throwing', () => {
    expect(readStorageItem('anon')).toBeNull()
  })

  it('should skip the removal instead of throwing', () => {
    expect(() => removeStorageItems(() => true)).not.toThrow()
  })
})

describe('when the read itself throws', () => {
  it('should return null rather than propagate', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })

    expect(readStorageItem('anon')).toBeNull()
  })
})

describe('when a single removal throws', () => {
  it('should stop rather than propagate', () => {
    window.localStorage.setItem('wagmi.a', '1')
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => removeStorageItems(key => key.startsWith('wagmi'))).not.toThrow()
  })
})
