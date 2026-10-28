jest.mock('../../config/env', () => ({
  getEnv: jest.fn((key: string) => (key === 'MANA_ETHEREUM_SUBGRAPH' ? 'https://eth.subgraph' : 'https://matic.subgraph'))
}))

import { configureStore } from '@reduxjs/toolkit'
import { subgraphClient } from '../../services/subgraphClient'
import { accountWalletApi } from './account-wallet.client'

const USER = '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'
const PREDICATE = '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf'
const ZERO = '0x0000000000000000000000000000000000000000'
const OTHER = '0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce'

// 1e18 as a BigInt literal — `10n ** 18n` is transpiled to Math.pow() by ts-jest, which rejects BigInt.
const manaWei = (units: number): string => (BigInt(units) * 1000000000000000000n).toString()

const gqlOk = (logs: unknown[]): Response => ({ ok: true, status: 200, json: async () => ({ data: { logs } }) }) as unknown as Response

const setupStore = () =>
  configureStore({
    reducer: { [subgraphClient.reducerPath]: subgraphClient.reducer },
    middleware: getDefault => getDefault({ serializableCheck: false }).concat(subgraphClient.middleware)
  })

let fetchMock: jest.Mock

// NOTE: no jest.resetAllMocks() here — it would wipe the getEnv mock from the jest.mock factory
// (the subgraph URL getters would then throw). fetchMock is recreated fresh in beforeEach instead.
beforeEach(() => {
  fetchMock = jest.fn()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('getManaTransfers', () => {
  it('should query both subgraphs and build a confirmed swap (L2 mint suppressed)', async () => {
    fetchMock.mockImplementation((url: string) =>
      url === 'https://eth.subgraph'
        ? Promise.resolve(gqlOk([{ txHash: '0xdep', from: USER, to: PREDICATE, value: manaWei(306), time: '1000' }]))
        : Promise.resolve(gqlOk([{ txHash: '0xcre', from: ZERO, to: USER, value: manaWei(306), time: '3000' }]))
    )
    const store = setupStore()
    const result = await store.dispatch(accountWalletApi.endpoints.getManaTransfers.initiate({ address: USER }))
    expect(result.data).toEqual([
      { hash: '0xdep', type: 'swap', network: 'ethereum', amount: 306, timestamp: 1000000, status: 'confirmed' }
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('should send the involved_contains filter with the lowercased address', async () => {
    fetchMock.mockResolvedValue(gqlOk([]))
    const store = setupStore()
    await store.dispatch(accountWalletApi.endpoints.getManaTransfers.initiate({ address: USER.toUpperCase() }))
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)
    expect(body.variables).toEqual({ involved: USER })
    expect(body.query).toContain('involved_contains')
  })

  it('should pass plain sends/receiveds through', async () => {
    fetchMock.mockImplementation((url: string) =>
      url === 'https://eth.subgraph'
        ? Promise.resolve(gqlOk([{ txHash: '0xsend', from: USER, to: OTHER, value: manaWei(5), time: '2000' }]))
        : Promise.resolve(gqlOk([{ txHash: '0xrec', from: OTHER, to: USER, value: manaWei(7), time: '1000' }]))
    )
    const store = setupStore()
    const result = await store.dispatch(accountWalletApi.endpoints.getManaTransfers.initiate({ address: USER }))
    expect(result.data?.map(transaction => transaction.type)).toEqual(['send', 'received'])
  })

  it('should surface an error when a subgraph responds non-ok', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502 } as Response)
    const store = setupStore()
    const result = await store.dispatch(accountWalletApi.endpoints.getManaTransfers.initiate({ address: USER }))
    expect(result.error).toBeDefined()
  })

  it('should surface an error when the subgraph returns GraphQL errors', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ errors: [{ message: 'boom' }] }) } as unknown as Response)
    const store = setupStore()
    const result = await store.dispatch(accountWalletApi.endpoints.getManaTransfers.initiate({ address: USER }))
    expect(result.error).toBeDefined()
  })
})
