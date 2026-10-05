import React from 'react'
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { FriendshipStatus } from '@dcl/social-rpc-client/dist/protobuff-types/decentraland/social_service/v2/social_service_v2.gen'
import { getEnv } from '../../config/env'
import {
  useBlockUser,
  useFriendsCount,
  useFriendsList,
  useFriendshipStatus,
  useMutualFriends,
  useMutualFriendsList,
  useUpsertFriendship
} from './profile.social.rpc'

const rpc = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getFriendshipStatus: jest.fn(),
  getFriends: jest.fn(),
  getMutualFriends: jest.fn(),
  requestFriendship: jest.fn(),
  cancelFriendshipRequest: jest.fn(),
  acceptFriendshipRequest: jest.fn(),
  rejectFriendshipRequest: jest.fn(),
  removeFriendship: jest.fn(),
  blockUser: jest.fn(),
  unblockUser: jest.fn()
}

const IdentityContext = React.createContext<AuthIdentity | undefined>(undefined)

jest.mock('@dcl/social-rpc-client', () => ({
  createSocialClientV2: () => Object.fromEntries(Object.entries(rpc).map(([name, fn]) => [name, (...args: unknown[]) => fn(...args)]))
}))

jest.mock('../../hooks/useAuthIdentity', () => ({
  useAuthIdentity: () => ({ identity: React.useContext(IdentityContext) })
}))

jest.mock('../../config/env', () => ({ getEnv: jest.fn() }))

let walletSequence = 0
const nextWallet = () => `0x${(++walletSequence).toString(16).padStart(40, 'a')}`
const nextAddress = () => `0xVIEWED${(++walletSequence).toString(16).padStart(34, '0')}`

const identityFor = (owner: string) => ({ authChain: [{ payload: owner }] }) as unknown as AuthIdentity

const asIdentity = (identity: AuthIdentity | undefined) =>
  function IdentityWrapper({ children }: { children: ReactNode }) {
    return <IdentityContext.Provider value={identity}>{children}</IdentityContext.Provider>
  }

const renderAs = <T,>(identity: AuthIdentity | undefined, hook: () => T) => renderHook(hook, { wrapper: asIdentity(identity) })

const statusOf = (address: string) => () => useFriendshipStatus(address)
const mutualOf = (address: string) => () => useMutualFriends(address)

const friend = (address: string) => ({ address, name: address, hasClaimedName: false, profilePictureUrl: '' })

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  jest.mocked(getEnv).mockReturnValue('https://rpc.example.com')
  rpc.connect.mockResolvedValue(undefined)
  rpc.getFriendshipStatus.mockResolvedValue({ status: FriendshipStatus.ACCEPTED })
})

afterEach(() => {
  jest.useRealTimers()
  jest.resetAllMocks()
})

describe('when two accounts view the same profile in one session', () => {
  const viewedAddress = nextAddress()

  beforeEach(() => {
    rpc.getFriendshipStatus
      .mockResolvedValueOnce({ status: FriendshipStatus.BLOCKED })
      .mockResolvedValueOnce({ status: FriendshipStatus.ACCEPTED })
  })

  it('should fetch the status again for the second account instead of reusing the first one', async () => {
    const first = renderAs(identityFor(nextWallet()), () => useFriendshipStatus(viewedAddress))
    await waitFor(() => expect(first.result.current.status).toBe('blocked'))
    first.unmount()

    const second = renderAs(identityFor(nextWallet()), () => useFriendshipStatus(viewedAddress))

    await waitFor(() => expect(second.result.current.status).toBe('accepted'))
  })

  describe('and the previous connection fails to close', () => {
    it('should still connect the second account', async () => {
      rpc.disconnect.mockImplementation(() => {
        throw new Error('already closed')
      })
      const first = renderAs(identityFor(nextWallet()), () => useFriendshipStatus(viewedAddress))
      await waitFor(() => expect(first.result.current.status).toBe('blocked'))

      const second = renderAs(identityFor(nextWallet()), () => useFriendshipStatus(viewedAddress))

      await waitFor(() => expect(second.result.current.status).toBe('accepted'))
    })
  })
})

describe('when requesting a friendship status over the RPC client', () => {
  it('should send the viewed address alone, lowercased', async () => {
    const viewedAddress = nextAddress()
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendshipStatus(viewedAddress))

    await waitFor(() => expect(result.current.status).toBe('accepted'))
    expect(rpc.getFriendshipStatus).toHaveBeenCalledWith(viewedAddress.toLowerCase())
  })

  it.each([
    [FriendshipStatus.REQUEST_SENT, 'request_sent'],
    [FriendshipStatus.REQUEST_RECEIVED, 'request_received'],
    [FriendshipStatus.BLOCKED, 'blocked'],
    [FriendshipStatus.NONE, 'none']
  ])('should map the RPC status %s to %s', async (rpcStatus, expected) => {
    rpc.getFriendshipStatus.mockResolvedValue({ status: rpcStatus })
    const viewedAddress = nextAddress()
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendshipStatus(viewedAddress))

    await waitFor(() => expect(result.current.status).toBe(expected))
  })
})

describe('when the same account views the same profile twice', () => {
  it('should serve the cached status without a second request', async () => {
    const identity = identityFor(nextWallet())
    const viewedAddress = nextAddress()
    const first = renderAs(identity, () => useFriendshipStatus(viewedAddress))
    await waitFor(() => expect(first.result.current.status).toBe('accepted'))
    first.unmount()

    const second = renderAs(identity, () => useFriendshipStatus(viewedAddress))

    expect(second.result.current.status).toBe('accepted')
    expect(rpc.getFriendshipStatus).toHaveBeenCalledTimes(1)
  })
})

describe('when the friendship status has nothing to look up', () => {
  it('should stay idle without an address', () => {
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendshipStatus(undefined))

    expect(result.current).toEqual({ status: undefined, isLoading: false, error: null })
  })

  it('should stay idle without a signed-in account', () => {
    const { result } = renderAs(undefined, statusOf(nextAddress()))

    expect(result.current).toEqual({ status: undefined, isLoading: false, error: null })
  })

  it('should not open a connection', () => {
    renderAs(undefined, statusOf(nextAddress()))

    expect(rpc.connect).not.toHaveBeenCalled()
  })
})

describe('when the friendship status request fails', () => {
  it('should surface the error', async () => {
    rpc.getFriendshipStatus.mockRejectedValue(new Error('rpc down'))
    const { result } = renderAs(identityFor(nextWallet()), statusOf(nextAddress()))

    await waitFor(() => expect(result.current.error?.message).toBe('rpc down'))
  })

  it('should wrap a non-Error rejection', async () => {
    rpc.getFriendshipStatus.mockRejectedValue('plain failure')
    const { result } = renderAs(identityFor(nextWallet()), statusOf(nextAddress()))

    await waitFor(() => expect(result.current.error?.message).toBe('plain failure'))
  })

  it('should stop loading', async () => {
    rpc.getFriendshipStatus.mockRejectedValue(new Error('rpc down'))
    const { result } = renderAs(identityFor(nextWallet()), statusOf(nextAddress()))

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.isLoading).toBe(false)
  })
})

describe('when the social RPC url is not configured', () => {
  it('should surface the missing configuration', async () => {
    jest.mocked(getEnv).mockReturnValue(undefined as unknown as string)
    const { result } = renderAs(identityFor(nextWallet()), statusOf(nextAddress()))

    await waitFor(() => expect(result.current.error?.message).toBe('SOCIAL_RPC_URL environment variable is not set'))
  })
})

describe('when the identity carries no auth chain owner', () => {
  it('should still resolve the status', async () => {
    const { result } = renderAs({ authChain: [] } as unknown as AuthIdentity, statusOf(nextAddress()))

    await waitFor(() => expect(result.current.status).toBe('accepted'))
  })
})

describe('when two hooks of the same account connect at once', () => {
  it('should open a single connection', async () => {
    const identity = identityFor(nextWallet())
    const first = renderAs(identity, statusOf(nextAddress()))
    const second = renderAs(identity, statusOf(nextAddress()))

    await waitFor(() => expect(first.result.current.status).toBe('accepted'))
    await waitFor(() => expect(second.result.current.status).toBe('accepted'))
    expect(rpc.connect).toHaveBeenCalledTimes(1)
  })
})

describe('when another account takes over the connection mid-request', () => {
  it('should retry against a fresh connection instead of failing', async () => {
    const pending = deferred<{ status: number }>()
    rpc.getFriendshipStatus.mockReturnValueOnce(pending.promise)
    const first = renderAs(identityFor(nextWallet()), statusOf(nextAddress()))
    await waitFor(() => expect(rpc.getFriendshipStatus).toHaveBeenCalledTimes(1))

    const second = renderAs(identityFor(nextWallet()), statusOf(nextAddress()))
    await waitFor(() => expect(second.result.current.status).toBe('accepted'))
    await act(async () => {
      pending.reject(new Error('socket closed'))
    })

    await waitFor(() => expect(first.result.current.status).toBe('accepted'))
  })
})

describe('when the last consumer unmounts', () => {
  let identity: AuthIdentity
  let viewedAddress: string

  beforeEach(async () => {
    identity = identityFor(nextWallet())
    viewedAddress = nextAddress()
    const view = renderAs(identity, statusOf(viewedAddress))
    await waitFor(() => expect(view.result.current.status).toBe('accepted'))
    rpc.disconnect.mockClear()
    rpc.connect.mockClear()
    jest.useFakeTimers()
    view.unmount()
  })

  it('should keep the connection during the grace period', () => {
    jest.advanceTimersByTime(59_000)

    expect(rpc.disconnect).not.toHaveBeenCalled()
  })

  it('should close the connection once the grace period ends', () => {
    jest.advanceTimersByTime(60_000)

    expect(rpc.disconnect).toHaveBeenCalledTimes(1)
  })

  describe('and the connection fails to close', () => {
    it('should reconnect on the next use', async () => {
      rpc.disconnect.mockImplementation(() => {
        throw new Error('already closed')
      })
      jest.advanceTimersByTime(60_000)
      jest.useRealTimers()

      const { result } = renderAs(identity, statusOf(nextAddress()))

      await waitFor(() => expect(result.current.status).toBe('accepted'))
      expect(rpc.connect).toHaveBeenCalledTimes(1)
    })
  })

  describe('and a new consumer mounts before the grace period ends', () => {
    it('should keep the connection open', () => {
      renderAs(identity, statusOf(viewedAddress))
      jest.advanceTimersByTime(60_000)

      expect(rpc.disconnect).not.toHaveBeenCalled()
    })
  })
})

describe('when the friends count is requested', () => {
  it('should read the total from the pagination data', async () => {
    rpc.getFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 42 } })
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsCount())

    await waitFor(() => expect(result.current.count).toBe(42))
  })

  it('should ask for a single friend', async () => {
    rpc.getFriends.mockResolvedValue({ friends: [], paginationData: { total: 0 } })
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsCount())

    await waitFor(() => expect(result.current.count).toBe(0))
    expect(rpc.getFriends).toHaveBeenCalledWith({ limit: 1, offset: 0 })
  })

  it('should fall back to the number of friends returned', async () => {
    rpc.getFriends.mockResolvedValue({ friends: [friend('0x1'), friend('0x2')] })
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsCount())

    await waitFor(() => expect(result.current.count).toBe(2))
  })

  it('should fall back to zero when the response is empty', async () => {
    rpc.getFriends.mockResolvedValue({})
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsCount())

    await waitFor(() => expect(result.current.count).toBe(0))
  })

  it('should serve a second consumer of the same account from the cache', async () => {
    rpc.getFriends.mockResolvedValue({ friends: [], paginationData: { total: 7 } })
    const identity = identityFor(nextWallet())
    const first = renderAs(identity, () => useFriendsCount())
    await waitFor(() => expect(first.result.current.count).toBe(7))

    const second = renderAs(identity, () => useFriendsCount())

    expect(second.result.current.count).toBe(7)
    expect(rpc.getFriends).toHaveBeenCalledTimes(1)
  })

  it('should stay idle without a signed-in account', () => {
    const { result } = renderAs(undefined, () => useFriendsCount())

    expect(result.current).toEqual({ count: undefined, isLoading: false, error: null })
  })

  it('should surface a failure', async () => {
    rpc.getFriends.mockRejectedValue(new Error('count failed'))
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsCount())

    await waitFor(() => expect(result.current.error?.message).toBe('count failed'))
  })

  it('should wrap a non-Error failure', async () => {
    rpc.getFriends.mockRejectedValue(404)
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsCount())

    await waitFor(() => expect(result.current.error?.message).toBe('404'))
  })
})

describe('when the friends list is requested', () => {
  it('should return the friends and their total', async () => {
    rpc.getFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 1 } })
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList())

    await waitFor(() => expect(result.current.total).toBe(1))
    expect(result.current.friends).toEqual([friend('0x1')])
  })

  it('should fall back to the number of friends when there is no total', async () => {
    rpc.getFriends.mockResolvedValue({ friends: [friend('0x1'), friend('0x2')] })
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList())

    await waitFor(() => expect(result.current.total).toBe(2))
  })

  describe('and the friends span more than one page', () => {
    const fullPage = Array.from({ length: 200 }, (_, i) => friend(`0x${i}`))

    beforeEach(() => {
      rpc.getFriends
        .mockResolvedValueOnce({ friends: fullPage, paginationData: { total: 201 } })
        .mockResolvedValueOnce({ friends: [friend('0xlast')] })
    })

    it('should load every page', async () => {
      const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList())

      await waitFor(() => expect(result.current.friends).toHaveLength(201))
    })

    it('should request the next page from the following offset', async () => {
      const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList())

      await waitFor(() => expect(result.current.friends).toHaveLength(201))
      expect(rpc.getFriends).toHaveBeenLastCalledWith({ limit: 200, offset: 200 })
    })

    it('should keep the total reported by the first page', async () => {
      const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList())

      await waitFor(() => expect(result.current.total).toBe(201))
    })
  })

  it('should stay empty when disabled', () => {
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList(false))

    expect(result.current).toEqual({ friends: [], total: undefined, isLoading: false, error: null })
  })

  it('should surface a failure', async () => {
    rpc.getFriends.mockRejectedValue(new Error('list failed'))
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList())

    await waitFor(() => expect(result.current.error?.message).toBe('list failed'))
  })

  it('should wrap a non-Error failure', async () => {
    rpc.getFriends.mockRejectedValue('nope')
    const { result } = renderAs(identityFor(nextWallet()), () => useFriendsList())

    await waitFor(() => expect(result.current.error?.message).toBe('nope'))
  })

  describe('and the consumer unmounts before the page arrives', () => {
    it('should drop the late response', async () => {
      const pending = deferred<{ friends: ReturnType<typeof friend>[] }>()
      rpc.getFriends.mockReturnValue(pending.promise)
      const { result, unmount } = renderAs(identityFor(nextWallet()), () => useFriendsList())
      await waitFor(() => expect(rpc.getFriends).toHaveBeenCalledTimes(1))
      unmount()

      await act(async () => {
        pending.resolve({ friends: [friend('0x1')] })
      })

      expect(result.current.friends).toEqual([])
    })
  })
})

describe('when the mutual friends list is requested', () => {
  it('should query the mutual friends of the lowercased address', async () => {
    const viewedAddress = nextAddress()
    rpc.getMutualFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 1 } })
    const { result } = renderAs(identityFor(nextWallet()), () => useMutualFriendsList(viewedAddress))

    await waitFor(() => expect(result.current.total).toBe(1))
    expect(rpc.getMutualFriends).toHaveBeenCalledWith(viewedAddress.toLowerCase(), { limit: 200, offset: 0 })
  })

  it('should stay empty without an address', () => {
    const { result } = renderAs(identityFor(nextWallet()), () => useMutualFriendsList(undefined))

    expect(result.current.friends).toEqual([])
  })

  it('should stay empty when disabled', () => {
    const viewedAddress = nextAddress()
    renderAs(identityFor(nextWallet()), () => useMutualFriendsList(viewedAddress, false))

    expect(rpc.getMutualFriends).not.toHaveBeenCalled()
  })
})

describe('when the mutual friends preview is requested', () => {
  it('should return the total count', async () => {
    rpc.getMutualFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 9 } })
    const { result } = renderAs(identityFor(nextWallet()), mutualOf(nextAddress()))

    await waitFor(() => expect(result.current.count).toBe(9))
  })

  it('should return the preview friends', async () => {
    rpc.getMutualFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 9 } })
    const { result } = renderAs(identityFor(nextWallet()), mutualOf(nextAddress()))

    await waitFor(() => expect(result.current.friends).toEqual([friend('0x1')]))
  })

  it('should ask for three friends only', async () => {
    const viewedAddress = nextAddress()
    rpc.getMutualFriends.mockResolvedValue({ friends: [] })
    const { result } = renderAs(identityFor(nextWallet()), () => useMutualFriends(viewedAddress))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(rpc.getMutualFriends).toHaveBeenCalledWith(viewedAddress.toLowerCase(), { limit: 3, offset: 0 })
  })

  it('should count the returned friends when there is no total', async () => {
    rpc.getMutualFriends.mockResolvedValue({ friends: [friend('0x1'), friend('0x2')] })
    const { result } = renderAs(identityFor(nextWallet()), mutualOf(nextAddress()))

    await waitFor(() => expect(result.current.count).toBe(2))
  })

  it('should serve a second consumer from the cache', async () => {
    rpc.getMutualFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 4 } })
    const identity = identityFor(nextWallet())
    const viewedAddress = nextAddress()
    const first = renderAs(identity, () => useMutualFriends(viewedAddress))
    await waitFor(() => expect(first.result.current.count).toBe(4))

    const second = renderAs(identity, () => useMutualFriends(viewedAddress))

    expect(second.result.current.count).toBe(4)
    expect(rpc.getMutualFriends).toHaveBeenCalledTimes(1)
  })

  it('should stay empty without an address', () => {
    const { result } = renderAs(identityFor(nextWallet()), () => useMutualFriends(undefined))

    expect(result.current).toEqual({ count: 0, friends: [], isLoading: false, error: null })
  })

  it('should surface a failure', async () => {
    rpc.getMutualFriends.mockRejectedValue(new Error('mutual failed'))
    const { result } = renderAs(identityFor(nextWallet()), mutualOf(nextAddress()))

    await waitFor(() => expect(result.current.error?.message).toBe('mutual failed'))
  })

  it('should wrap a non-Error failure', async () => {
    rpc.getMutualFriends.mockRejectedValue('mutual nope')
    const { result } = renderAs(identityFor(nextWallet()), mutualOf(nextAddress()))

    await waitFor(() => expect(result.current.error?.message).toBe('mutual nope'))
  })
})

describe('when a friendship action is applied', () => {
  it.each([
    ['request', 'requestFriendship'],
    ['cancel', 'cancelFriendshipRequest'],
    ['accept', 'acceptFriendshipRequest'],
    ['reject', 'rejectFriendshipRequest'],
    ['remove', 'removeFriendship']
  ] as const)('should send %s through %s with the lowercased address', async (action, method) => {
    const viewedAddress = nextAddress()
    const { result } = renderAs(identityFor(nextWallet()), () => useUpsertFriendship())

    await act(() => result.current.upsert({ address: viewedAddress, action }))

    expect(rpc[method]).toHaveBeenCalledWith(viewedAddress.toLowerCase())
  })

  it('should refresh the friendship status shown for that profile', async () => {
    const identity = identityFor(nextWallet())
    const viewedAddress = nextAddress()
    rpc.getFriendshipStatus.mockResolvedValueOnce({ status: FriendshipStatus.NONE })
    const status = renderAs(identity, () => useFriendshipStatus(viewedAddress))
    await waitFor(() => expect(status.result.current.status).toBe('none'))
    rpc.getFriendshipStatus.mockResolvedValue({ status: FriendshipStatus.REQUEST_SENT })
    const { result } = renderAs(identity, () => useUpsertFriendship())

    await act(() => result.current.upsert({ address: viewedAddress, action: 'request' }))

    expect(status.result.current.status).toBe('request_sent')
  })

  it('should finish without loading', async () => {
    const { result } = renderAs(identityFor(nextWallet()), () => useUpsertFriendship())

    await act(() => result.current.upsert({ address: nextAddress(), action: 'accept' }))

    expect(result.current.isLoading).toBe(false)
  })

  it('should require a signed-in account', async () => {
    const { result } = renderAs(undefined, () => useUpsertFriendship())

    await expect(result.current.upsert({ address: nextAddress(), action: 'request' })).rejects.toThrow('Authentication required')
  })

  describe('and the action fails', () => {
    it('should reject with the error', async () => {
      rpc.requestFriendship.mockRejectedValue(new Error('upsert failed'))
      const { result } = renderAs(identityFor(nextWallet()), () => useUpsertFriendship())

      await act(() => expect(result.current.upsert({ address: nextAddress(), action: 'request' })).rejects.toThrow('upsert failed'))
    })

    it('should expose the error', async () => {
      rpc.requestFriendship.mockRejectedValue('upsert nope')
      const { result } = renderAs(identityFor(nextWallet()), () => useUpsertFriendship())

      await act(() => result.current.upsert({ address: nextAddress(), action: 'request' }).catch(() => undefined))

      expect(result.current.error?.message).toBe('upsert nope')
    })
  })
})

describe('when a user is blocked or unblocked', () => {
  it('should block through the block call', async () => {
    const viewedAddress = nextAddress()
    const { result } = renderAs(identityFor(nextWallet()), () => useBlockUser())

    await act(() => result.current.setBlocked({ address: viewedAddress, blocked: true }))

    expect(rpc.blockUser).toHaveBeenCalledWith(viewedAddress.toLowerCase())
  })

  it('should unblock through the unblock call', async () => {
    const viewedAddress = nextAddress()
    const { result } = renderAs(identityFor(nextWallet()), () => useBlockUser())

    await act(() => result.current.setBlocked({ address: viewedAddress, blocked: false }))

    expect(rpc.unblockUser).toHaveBeenCalledWith(viewedAddress.toLowerCase())
  })

  it('should finish without loading', async () => {
    const { result } = renderAs(identityFor(nextWallet()), () => useBlockUser())

    await act(() => result.current.setBlocked({ address: nextAddress(), blocked: true }))

    expect(result.current.isLoading).toBe(false)
  })

  it('should require a signed-in account', async () => {
    const { result } = renderAs(undefined, () => useBlockUser())

    await expect(result.current.setBlocked({ address: nextAddress(), blocked: true })).rejects.toThrow('Authentication required')
  })

  describe('and the call fails', () => {
    it('should reject with the error', async () => {
      rpc.blockUser.mockRejectedValue(new Error('block failed'))
      const { result } = renderAs(identityFor(nextWallet()), () => useBlockUser())

      await act(() => expect(result.current.setBlocked({ address: nextAddress(), blocked: true })).rejects.toThrow('block failed'))
    })

    it('should expose the error', async () => {
      rpc.unblockUser.mockRejectedValue('unblock nope')
      const { result } = renderAs(identityFor(nextWallet()), () => useBlockUser())

      await act(() => result.current.setBlocked({ address: nextAddress(), blocked: false }).catch(() => undefined))

      expect(result.current.error?.message).toBe('unblock nope')
    })
  })
})
