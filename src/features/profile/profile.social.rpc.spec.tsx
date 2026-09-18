import { renderHook, waitFor } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { FriendshipStatus } from '@dcl/social-rpc-client/dist/protobuff-types/decentraland/social_service/v2/social_service_v2.gen'
import { useFriendshipStatus } from './profile.social.rpc'

const getFriendshipStatusMock = jest.fn()
const connectMock = jest.fn()
const disconnectMock = jest.fn()
const useAuthIdentityMock = jest.fn()

jest.mock('@dcl/social-rpc-client', () => ({
  createSocialClientV2: () => ({
    connect: (...args: unknown[]) => connectMock(...args),
    disconnect: () => disconnectMock(),
    getFriendshipStatus: (address: string) => getFriendshipStatusMock(address)
  })
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => useAuthIdentityMock()
}))

jest.mock('../../config/env', () => ({
  getEnv: () => 'https://rpc.example.com'
}))

const identityFor = (owner: string) => ({ authChain: [{ payload: owner }] }) as unknown as AuthIdentity

// The status cache lives at module scope and outlives each test, so every case uses its own
// viewed address to stay independent of execution order.
describe('when two accounts view the same profile in one session', () => {
  const viewedAddress = '0xVIEWED0000000000000000000000000000000001'
  const walletA = '0xAAAA000000000000000000000000000000000001'
  const walletB = '0xBBBB000000000000000000000000000000000002'

  beforeEach(() => {
    connectMock.mockResolvedValue(undefined)
    useAuthIdentityMock.mockReturnValue({ identity: identityFor(walletA) })
    getFriendshipStatusMock
      .mockResolvedValueOnce({ status: FriendshipStatus.BLOCKED })
      .mockResolvedValueOnce({ status: FriendshipStatus.ACCEPTED })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should fetch the status again for the second account instead of reusing the first one', async () => {
    const first = renderHook(() => useFriendshipStatus(viewedAddress))
    await waitFor(() => expect(first.result.current.status).toBe('blocked'))
    first.unmount()

    useAuthIdentityMock.mockReturnValue({ identity: identityFor(walletB) })
    const second = renderHook(() => useFriendshipStatus(viewedAddress))

    await waitFor(() => expect(second.result.current.status).toBe('accepted'))
    expect(getFriendshipStatusMock).toHaveBeenCalledTimes(2)
  })
})

describe('when requesting a friendship status over the RPC client', () => {
  const viewedAddress = '0xVIEWED0000000000000000000000000000000002'
  const wallet = '0xCCCC000000000000000000000000000000000003'

  beforeEach(() => {
    connectMock.mockResolvedValue(undefined)
    useAuthIdentityMock.mockReturnValue({ identity: identityFor(wallet) })
    getFriendshipStatusMock.mockResolvedValue({ status: FriendshipStatus.BLOCKED })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should send the viewed address alone, without the account that keys the cache', async () => {
    const { result } = renderHook(() => useFriendshipStatus(viewedAddress))

    await waitFor(() => expect(result.current.status).toBe('blocked'))
    expect(getFriendshipStatusMock).toHaveBeenCalledWith(viewedAddress.toLowerCase())
  })
})

describe('when the same account views the same profile twice', () => {
  const viewedAddress = '0xVIEWED0000000000000000000000000000000003'
  const wallet = '0xDDDD000000000000000000000000000000000004'

  beforeEach(() => {
    connectMock.mockResolvedValue(undefined)
    useAuthIdentityMock.mockReturnValue({ identity: identityFor(wallet) })
    getFriendshipStatusMock.mockResolvedValue({ status: FriendshipStatus.ACCEPTED })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should serve the cached status without a second request', async () => {
    const first = renderHook(() => useFriendshipStatus(viewedAddress))
    await waitFor(() => expect(first.result.current.status).toBe('accepted'))
    first.unmount()

    const second = renderHook(() => useFriendshipStatus(viewedAddress))

    expect(second.result.current.status).toBe('accepted')
    expect(getFriendshipStatusMock).toHaveBeenCalledTimes(1)
  })
})
