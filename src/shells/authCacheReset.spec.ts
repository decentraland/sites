import { getAuthSession } from '../utils/authSession'
import { watchAuthCache } from './authCacheReset'

const mockGetWalletAddress = jest.fn()
const mockSubscribeWalletAddress = jest.fn()
jest.mock('../hooks/useWalletAddress', () => ({
  getWalletAddress: () => mockGetWalletAddress(),
  subscribeWalletAddress: (listener: () => void) => mockSubscribeWalletAddress(listener)
}))

describe('when watching account changes for the lifetime of a store', () => {
  let clear: jest.Mock
  let unsubscribe: jest.Mock
  let notify: () => void
  let dispose: () => void
  let initialSession: number

  beforeEach(() => {
    clear = jest.fn()
    unsubscribe = jest.fn()
    mockGetWalletAddress.mockReturnValue('0xaaa')
    mockSubscribeWalletAddress.mockImplementation(listener => {
      notify = listener
      return unsubscribe
    })
    initialSession = getAuthSession()
    dispose = watchAuthCache(clear)
  })

  afterEach(() => {
    dispose()
    jest.resetAllMocks()
  })

  it('should preserve caches on initial subscription and case-only updates', () => {
    mockGetWalletAddress.mockReturnValue('0xAAA')
    notify()
    expect(clear).not.toHaveBeenCalled()
    expect(getAuthSession()).toBe(initialSession)
  })

  it('should purge and advance the session for each account transition including returning to the first wallet', () => {
    mockGetWalletAddress.mockReturnValue('0xbbb')
    notify()
    mockGetWalletAddress.mockReturnValue('0xaaa')
    notify()
    expect(clear).toHaveBeenCalledTimes(2)
    expect(getAuthSession()).toBe(initialSession + 2)
  })

  it('should purge on logout only once', () => {
    mockGetWalletAddress.mockReturnValue(null)
    notify()
    notify()
    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('should expose cleanup for store disposal without requiring a React mount', () => {
    dispose()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
