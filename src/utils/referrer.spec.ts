import { REFERRER_STORAGE_KEY, parseReferrer, readStoredReferrer, resolveReferrer, storeReferrer } from './referrer'

const VALID = '0x24e5f44999c151f08609f8e27b2238c773c4d020'
const OTHER = '0x1111111111111111111111111111111111111111'

const setSearch = (search: string) => {
  Object.defineProperty(window, 'location', { value: { ...window.location, search }, writable: true })
}

describe('when parsing a referrer', () => {
  it('should return the lowercased address for valid input', () => {
    expect(parseReferrer('0x24E5F44999C151F08609F8E27B2238C773C4D020')).toBe(VALID)
  })

  it.each(['', '0x123', 'not-an-address', 'javascript:alert(1)', ` ${VALID}`, undefined, null])(
    'should return null for invalid input %p',
    value => {
      expect(parseReferrer(value)).toBeNull()
    }
  )
})

describe('when storing and reading a referrer', () => {
  beforeEach(() => window.sessionStorage.clear())
  afterEach(() => window.sessionStorage.clear())

  it('should persist a valid address lowercased and read it back', () => {
    storeReferrer('0x24E5F44999C151F08609F8E27B2238C773C4D020')
    expect(window.sessionStorage.getItem(REFERRER_STORAGE_KEY)).toBe(VALID)
    expect(readStoredReferrer()).toBe(VALID)
  })

  it('should not persist an invalid value', () => {
    storeReferrer('not-an-address')
    expect(readStoredReferrer()).toBeNull()
  })

  it('should clear a previously stored referrer when given an invalid/absent value', () => {
    storeReferrer(VALID)
    expect(readStoredReferrer()).toBe(VALID)
    storeReferrer(undefined)
    expect(readStoredReferrer()).toBeNull()
    storeReferrer(VALID)
    storeReferrer('not-an-address')
    expect(readStoredReferrer()).toBeNull()
  })

  it('should return null when the stored value was tampered with', () => {
    window.sessionStorage.setItem(REFERRER_STORAGE_KEY, 'garbage')
    expect(readStoredReferrer()).toBeNull()
  })
})

describe('when resolving the referrer for a download', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    setSearch('')
  })
  afterEach(() => {
    window.sessionStorage.clear()
    setSearch('')
    jest.clearAllMocks()
  })

  it('should use the URL referrer, taking precedence over sessionStorage', () => {
    storeReferrer(OTHER)
    setSearch(`?referrer=${VALID}`)
    expect(resolveReferrer()).toBe(VALID)
  })

  it('should not fall back to the stored referrer when the URL one is present but invalid', () => {
    storeReferrer(OTHER)
    setSearch('?referrer=not-an-address')
    // An explicit param is authoritative: falling back here would attribute this
    // download to the previous referral.
    expect(resolveReferrer()).toBeNull()
  })

  it('should clear the stale stored referrer when the URL one is present but invalid', () => {
    storeReferrer(OTHER)
    setSearch('?referrer=not-an-address')
    resolveReferrer()
    expect(readStoredReferrer()).toBeNull()
  })

  it('should fall back to the stored referrer only when the URL param is absent', () => {
    storeReferrer(VALID)
    setSearch('')
    expect(resolveReferrer()).toBe(VALID)
  })

  it('should return null for an empty referrer param without using storage', () => {
    storeReferrer(OTHER)
    setSearch('?referrer=')
    expect(resolveReferrer()).toBeNull()
  })

  it('should return null when neither source has a valid referrer', () => {
    setSearch('?referrer=garbage')
    expect(resolveReferrer()).toBeNull()
  })
})
