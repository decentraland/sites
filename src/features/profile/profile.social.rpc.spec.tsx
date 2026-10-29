import React from 'react'
import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
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
import type { FriendshipAction } from './profile.social.rpc'

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

type HookState = { isLoading: boolean; error: Error | null }
type View<T = HookState> = RenderHookResult<T, unknown>

let walletSequence = 0
const nextWallet = () => `0x${(++walletSequence).toString(16).padStart(40, 'a')}`
const nextAddress = () => `0xVIEWED${(++walletSequence).toString(16).padStart(34, '0')}`
const identityFor = (owner: string) => ({ authChain: [{ payload: owner }] }) as unknown as AuthIdentity
const friend = (address: string) => ({ address, name: address, hasClaimedName: false, profilePictureUrl: '' })

const renderAs = <T,>(owner: AuthIdentity | undefined, hook: () => T) =>
  renderHook(hook, {
    wrapper: function IdentityWrapper({ children }: { children: ReactNode }) {
      return <IdentityContext.Provider value={owner}>{children}</IdentityContext.Provider>
    }
  })
const settle = (view: View<HookState>) => waitFor(() => expect(view.result.current.isLoading).toBe(false))
const renderSettled = async <T extends HookState>(owner: AuthIdentity | undefined, hook: () => T) => {
  const view = renderAs(owner, hook)
  await settle(view)
  return view
}
const statusOf = (address: string) => () => useFriendshipStatus(address)
const failToClose = () => {
  throw new Error('already closed')
}
const deferred = <T,>() => {
  let reject: (reason: unknown) => void = () => undefined
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let identity: AuthIdentity
let viewedAddress: string
beforeEach(() => {
  identity = identityFor(nextWallet())
  viewedAddress = nextAddress()
  jest.mocked(getEnv).mockReturnValue('https://rpc.example.com')
  rpc.connect.mockResolvedValue(undefined)
  rpc.getFriendshipStatus.mockResolvedValue({ status: FriendshipStatus.ACCEPTED })
  rpc.getFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 9 } })
  rpc.getMutualFriends.mockResolvedValue({ friends: [friend('0x1')], paginationData: { total: 9 } })
})

afterEach(() => {
  jest.useRealTimers()
  jest.resetAllMocks()
})

describe.each([
  [FriendshipStatus.REQUEST_SENT, 'request_sent'],
  [FriendshipStatus.REQUEST_RECEIVED, 'request_received'],
  [FriendshipStatus.ACCEPTED, 'accepted'],
  [FriendshipStatus.BLOCKED, 'blocked'],
  [FriendshipStatus.NONE, 'none']
])('when the RPC answers the friendship status %s', (status, expected) => {
  let view: View<ReturnType<typeof useFriendshipStatus>>
  beforeEach(async () => {
    rpc.getFriendshipStatus.mockResolvedValueOnce({ status })
    view = await renderSettled(identity, statusOf(viewedAddress))
  })
  it('should send the viewed address alone, lowercased', () =>
    expect(rpc.getFriendshipStatus).toHaveBeenCalledWith(viewedAddress.toLowerCase()))
  it(`should resolve to ${expected}`, () => expect(view.result.current.status).toBe(expected))
})

describe.each([
  ['closes cleanly', () => undefined],
  ['fails to close', failToClose]
])('when another account views the same profile after the previous connection %s', (_, disconnect) => {
  let other: View<ReturnType<typeof useFriendshipStatus>>
  beforeEach(async () => {
    await renderSettled(identity, statusOf(viewedAddress))
    rpc.disconnect.mockImplementationOnce(disconnect)
    rpc.getFriendshipStatus.mockResolvedValueOnce({ status: FriendshipStatus.BLOCKED })
    other = await renderSettled(identityFor(nextWallet()), statusOf(viewedAddress))
  })
  it('should fetch the status of the second account instead of reusing the first one', () =>
    expect(other.result.current.status).toBe('blocked'))
})

describe.each([
  ['friendship status', 'getFriendshipStatus', () => useFriendshipStatus(viewedAddress)],
  ['friends count', 'getFriends', () => useFriendsCount()],
  ['mutual friends preview', 'getMutualFriends', () => useMutualFriends(viewedAddress)]
] as const)('when a second consumer of the same account reads the %s', (_, method, useQuery) => {
  let first: View
  let second: View
  beforeEach(async () => {
    first = await renderSettled<HookState>(identity, useQuery)
    second = renderAs<HookState>(identity, useQuery)
  })
  it('should serve the cached value', () => expect(second.result.current).toEqual(first.result.current))
  it('should not request it again', () => expect(rpc[method]).toHaveBeenCalledTimes(1))
})

describe.each([
  ['friendship status', 'getFriendshipStatus', () => useFriendshipStatus(viewedAddress)],
  ['friends count', 'getFriends', () => useFriendsCount()],
  ['friends list', 'getFriends', () => useFriendsList()],
  ['mutual friends preview', 'getMutualFriends', () => useMutualFriends(viewedAddress)]
] as const)('when the %s request fails', (_, method, useQuery) => {
  describe.each([
    ['an Error', new Error('rpc down')],
    ['a non-Error value', 'rpc down']
  ])('and it rejects with %s', (__, reason) => {
    let view: View
    beforeEach(async () => {
      rpc[method].mockRejectedValueOnce(reason)
      view = await renderSettled<HookState>(identity, useQuery)
    })
    it('should surface the error message', () => expect(view.result.current.error?.message).toBe('rpc down'))
  })
})

describe.each([
  ['friendship status without a signed-in account', false, () => useFriendshipStatus(viewedAddress), { status: undefined }],
  ['friendship status without an address', true, () => useFriendshipStatus(undefined), { status: undefined }],
  ['friends count without a signed-in account', false, () => useFriendsCount(), { count: undefined }],
  ['disabled friends list', true, () => useFriendsList(false), { friends: [], total: undefined }],
  ['mutual friends preview without an address', true, () => useMutualFriends(undefined), { count: 0, friends: [] }],
  ['mutual friends list without an address', true, () => useMutualFriendsList(undefined), { friends: [], total: undefined }],
  ['disabled mutual friends list', true, () => useMutualFriendsList(viewedAddress, false), { friends: [], total: undefined }]
] as const)('when the %s is read', (_, signedIn, useQuery, empty) => {
  let view: View<unknown>
  beforeEach(() => {
    view = renderAs<unknown>(signedIn ? identity : undefined, useQuery)
  })
  it('should stay idle', () => expect(view.result.current).toEqual({ ...empty, isLoading: false, error: null }))
  it('should not open a connection', () => expect(rpc.connect).not.toHaveBeenCalled())
})

describe('when the social RPC url is not configured', () => {
  let view: View
  beforeEach(async () => {
    jest.mocked(getEnv).mockReturnValue(undefined as unknown as string)
    view = await renderSettled(identity, statusOf(viewedAddress))
  })
  it('should surface the missing configuration', () =>
    expect(view.result.current.error?.message).toBe('SOCIAL_RPC_URL environment variable is not set'))
})

describe('when the identity carries no auth chain owner', () => {
  let view: View<ReturnType<typeof useFriendshipStatus>>
  beforeEach(async () => {
    view = await renderSettled({ authChain: [] } as unknown as AuthIdentity, statusOf(viewedAddress))
  })
  it('should still resolve the status', () => expect(view.result.current.status).toBe('accepted'))
})

describe('when two hooks of the same account connect at once', () => {
  beforeEach(async () => {
    await Promise.all([renderSettled(identity, statusOf(viewedAddress)), renderSettled(identity, statusOf(nextAddress()))])
  })
  it('should open a single connection', () => expect(rpc.connect).toHaveBeenCalledTimes(1))
})

describe('when another account takes over the connection mid-request', () => {
  let first: View<ReturnType<typeof useFriendshipStatus>>
  beforeEach(async () => {
    const pending = deferred<{ status: number }>()
    rpc.getFriendshipStatus.mockReturnValueOnce(pending.promise)
    first = renderAs(identity, statusOf(viewedAddress))
    await waitFor(() => expect(rpc.getFriendshipStatus).toHaveBeenCalledTimes(1))
    await renderSettled(identityFor(nextWallet()), statusOf(nextAddress()))
    await act(async () => pending.reject(new Error('socket closed')))
    await settle(first)
  })
  it('should retry against a fresh connection instead of failing', () => expect(first.result.current.status).toBe('accepted'))
})

describe('when the last consumer unmounts', () => {
  beforeEach(async () => {
    const view = await renderSettled(identity, statusOf(viewedAddress))
    rpc.disconnect.mockClear()
    rpc.connect.mockClear()
    jest.useFakeTimers()
    view.unmount()
  })

  describe('and the grace period has not ended', () => {
    beforeEach(() => jest.advanceTimersByTime(59_000))
    it('should keep the connection', () => expect(rpc.disconnect).not.toHaveBeenCalled())
  })

  describe('and the grace period ends', () => {
    beforeEach(() => jest.advanceTimersByTime(60_000))
    it('should close the connection', () => expect(rpc.disconnect).toHaveBeenCalledTimes(1))
  })

  describe('and a new consumer mounts before the grace period ends', () => {
    beforeEach(() => {
      renderAs(identity, statusOf(viewedAddress))
      jest.advanceTimersByTime(60_000)
    })
    it('should keep the connection open', () => expect(rpc.disconnect).not.toHaveBeenCalled())
  })

  describe('and the connection fails to close before the account reads again', () => {
    beforeEach(async () => {
      rpc.disconnect.mockImplementationOnce(failToClose)
      jest.advanceTimersByTime(60_000)
      jest.useRealTimers()
      await renderSettled(identity, statusOf(nextAddress()))
    })
    it('should reconnect', () => expect(rpc.connect).toHaveBeenCalledTimes(1))
  })
})

describe.each([
  ['carries a total', { friends: [friend('0x1')], paginationData: { total: 42 } }, 42],
  ['has no total', { friends: [friend('0x1'), friend('0x2')] }, 2],
  ['is empty', {}, 0]
])('when the friends count response %s', (_, response, expected) => {
  let view: View<ReturnType<typeof useFriendsCount>>
  beforeEach(async () => {
    rpc.getFriends.mockResolvedValueOnce(response)
    view = await renderSettled(identity, () => useFriendsCount())
  })
  it('should ask for a single friend', () => expect(rpc.getFriends).toHaveBeenCalledWith({ limit: 1, offset: 0 }))
  it(`should count ${expected} friends`, () => expect(view.result.current.count).toBe(expected))
})

describe.each([
  ['carries a total', { friends: [friend('0x1')], paginationData: { total: 5 } }, 5],
  ['has no total', { friends: [friend('0x1')] }, 1]
])('when the friends list response %s', (_, response, expected) => {
  let view: View<ReturnType<typeof useFriendsList>>
  beforeEach(async () => {
    rpc.getFriends.mockResolvedValueOnce(response)
    view = await renderSettled(identity, () => useFriendsList())
  })
  it('should return the friends', () => expect(view.result.current.friends).toEqual([friend('0x1')]))
  it(`should report a total of ${expected}`, () => expect(view.result.current.total).toBe(expected))
})

describe('when the friends list spans more than one page', () => {
  let view: View<ReturnType<typeof useFriendsList>>
  beforeEach(async () => {
    rpc.getFriends
      .mockResolvedValueOnce({ friends: Array.from({ length: 200 }, (_, i) => friend(`0x${i}`)), paginationData: { total: 201 } })
      .mockResolvedValueOnce({ friends: [friend('0xlast')] })
    view = await renderSettled(identity, () => useFriendsList())
  })
  it('should load every page', () => expect(view.result.current.friends).toHaveLength(201))
  it('should request the next page from the following offset', () =>
    expect(rpc.getFriends).toHaveBeenLastCalledWith({ limit: 200, offset: 200 }))
  it('should keep the total reported by the first page', () => expect(view.result.current.total).toBe(201))
})

describe('when the friends list consumer unmounts before the page arrives', () => {
  let view: View<ReturnType<typeof useFriendsList>>
  beforeEach(async () => {
    const pending = deferred<{ friends: ReturnType<typeof friend>[] }>()
    rpc.getFriends.mockReturnValueOnce(pending.promise)
    view = renderAs(identity, () => useFriendsList())
    await waitFor(() => expect(rpc.getFriends).toHaveBeenCalledTimes(1))
    view.unmount()
    await act(async () => pending.resolve({ friends: [friend('0x1')] }))
  })
  it('should drop the late response', () => expect(view.result.current.friends).toEqual([]))
})

describe.each([
  ['mutual friends list', () => useMutualFriendsList(viewedAddress), 200],
  ['mutual friends preview', () => useMutualFriends(viewedAddress), 3]
])('when the %s is requested', (_, useQuery, limit) => {
  beforeEach(() => renderSettled<HookState>(identity, useQuery))
  it(`should ask for ${limit} mutual friends of the lowercased address`, () =>
    expect(rpc.getMutualFriends).toHaveBeenCalledWith(viewedAddress.toLowerCase(), { limit, offset: 0 }))
})

describe.each([
  ['carries a total', { friends: [friend('0x1')], paginationData: { total: 9 } }, 9],
  ['has no total', { friends: [friend('0x1')] }, 1]
])('when the mutual friends preview response %s', (_, response, expected) => {
  let view: View<ReturnType<typeof useMutualFriends>>
  beforeEach(async () => {
    rpc.getMutualFriends.mockResolvedValueOnce(response)
    view = await renderSettled(identity, () => useMutualFriends(viewedAddress))
  })
  it('should return the preview friends', () => expect(view.result.current.friends).toEqual([friend('0x1')]))
  it(`should count ${expected} mutual friends`, () => expect(view.result.current.count).toBe(expected))
})

type Mutation = HookState & { run: (address: string) => Promise<void> }

const upsertWith = (action: FriendshipAction) => (): Mutation => {
  const { upsert, ...state } = useUpsertFriendship()
  return { ...state, run: address => upsert({ address, action }) }
}
const blockWith = (blocked: boolean) => (): Mutation => {
  const { setBlocked, ...state } = useBlockUser()
  return { ...state, run: address => setBlocked({ address, blocked }) }
}

describe.each([
  ['request', upsertWith('request'), 'requestFriendship'],
  ['cancel', upsertWith('cancel'), 'cancelFriendshipRequest'],
  ['accept', upsertWith('accept'), 'acceptFriendshipRequest'],
  ['reject', upsertWith('reject'), 'rejectFriendshipRequest'],
  ['remove', upsertWith('remove'), 'removeFriendship'],
  ['block', blockWith(true), 'blockUser'],
  ['unblock', blockWith(false), 'unblockUser']
] as const)('when the %s action runs', (_, useMutation, method) => {
  let mutation: View<Mutation>
  beforeEach(() => {
    mutation = renderAs(identity, useMutation)
  })

  describe('and it succeeds', () => {
    let status: View<ReturnType<typeof useFriendshipStatus>>
    beforeEach(async () => {
      status = await renderSettled(identity, statusOf(viewedAddress))
      rpc.getFriendshipStatus.mockResolvedValueOnce({ status: FriendshipStatus.REQUEST_SENT })
      await act(() => mutation.result.current.run(viewedAddress))
    })
    it(`should call ${method} with the lowercased address`, () => expect(rpc[method]).toHaveBeenCalledWith(viewedAddress.toLowerCase()))
    it('should refresh the friendship status shown for that profile', () => expect(status.result.current.status).toBe('request_sent'))
    it('should finish without loading', () => expect(mutation.result.current.isLoading).toBe(false))
  })

  describe.each([
    ['an Error', new Error('rpc down')],
    ['a non-Error value', 'rpc down']
  ])('and it fails with %s', (__, reason) => {
    let rejection: unknown
    beforeEach(async () => {
      rpc[method].mockRejectedValueOnce(reason)
      await act(() => mutation.result.current.run(viewedAddress).catch(err => void (rejection = err)))
    })
    it('should reject with the error', () => expect(rejection).toEqual(new Error('rpc down')))
    it('should expose the error', () => expect(mutation.result.current.error?.message).toBe('rpc down'))
  })
})

describe.each([
  ['friendship', upsertWith('request')],
  ['block', blockWith(true)]
])('when the %s mutation runs without a signed-in account', (_, useMutation) => {
  let rejection: Promise<void>
  beforeEach(() => {
    rejection = renderAs(undefined, useMutation).result.current.run(viewedAddress)
  })
  it('should require authentication', () => expect(rejection).rejects.toThrow('Authentication required'))
})
