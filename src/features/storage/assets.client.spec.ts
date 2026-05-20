// eslint-disable-next-line @typescript-eslint/no-require-imports
const undici = require('undici') as { Request: typeof Request; Response: typeof Response; Headers: typeof Headers; fetch: typeof fetch }
if (typeof globalThis.Request === 'undefined') globalThis.Request = undici.Request
if (typeof globalThis.Response === 'undefined') globalThis.Response = undici.Response
if (typeof globalThis.Headers === 'undefined') globalThis.Headers = undici.Headers
if (typeof globalThis.fetch === 'undefined') globalThis.fetch = undici.fetch
jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../config/env', () => ({
  getEnv: jest.fn((k: string) => {
    switch (k) {
      case 'LAND_MANAGER_SUBGRAPH':
        return 'https://lands'
      case 'MARKETPLACE_SUBGRAPH':
        return 'https://market'
      case 'RENTALS_SUBGRAPH':
        return 'https://rentals'
      case 'LAND_REGISTRY_ADDRESS':
        return '0xLAND'
      case 'ESTATE_REGISTRY_ADDRESS':
        return '0xESTATE'
      default:
        return undefined
    }
  })
}))
import { configureStore } from '@reduxjs/toolkit'
import { subgraphClient } from '../../services/subgraphClient'
import { assetsEndpoints } from './assets.client'

const fetchSpy = jest.spyOn(globalThis, 'fetch') as unknown as jest.Mock

const makeResponse = (body: unknown, init: { status?: number } = {}): Response =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' }
  })

const setupStore = () =>
  configureStore({
    reducer: { [subgraphClient.reducerPath]: subgraphClient.reducer },
    middleware: g => g({ serializableCheck: false }).concat(subgraphClient.middleware)
  })

describe('assets.client endpoints', () => {
  beforeEach(() => fetchSpy.mockReset())
  afterAll(() => fetchSpy.mockRestore())

  it('getUserDCLNames flattens nfts to subdomain strings', async () => {
    fetchSpy.mockResolvedValue(
      makeResponse({
        data: {
          nfts: [{ ens: { subdomain: 'vitsky' } }, { ens: { subdomain: 'foo' } }]
        }
      })
    )
    const store = setupStore()
    const result = await store.dispatch(assetsEndpoints.endpoints.getUserDCLNames.initiate({ address: '0xMe' }))
    expect(result.data).toEqual(['vitsky.dcl.eth', 'foo.dcl.eth'])
  })

  it('getUserRentals transforms rental subgraph fields into Rental entities', async () => {
    fetchSpy.mockResolvedValue(
      makeResponse({
        data: {
          tenantRentals: [
            {
              id: 'r-1',
              contractAddress: '0xLAND',
              tokenId: '1',
              lessor: '0xowner',
              tenant: '0xMe',
              operator: '0xop',
              startedAt: '1700000000',
              endsAt: '1800000000'
            }
          ],
          lessorRentals: []
        }
      })
    )
    const store = setupStore()
    const result = await store.dispatch(assetsEndpoints.endpoints.getUserRentals.initiate({ address: '0xMe' }))
    expect(result.data?.tenantRentals).toHaveLength(1)
    expect(result.data?.tenantRentals[0].startedAt).toBeInstanceOf(Date)
  })

  it('getUserLands merges owner/operator/tenant/lessor results into a Land[]', async () => {
    fetchSpy.mockResolvedValue(
      makeResponse({
        data: {
          tenantParcels: [],
          tenantEstates: [],
          lessorParcels: [],
          lessorEstates: [],
          ownerParcels: [
            {
              x: '10',
              y: '20',
              tokenId: '1',
              owner: { address: '0xMe' },
              updateOperator: null,
              data: null
            }
          ],
          ownerEstates: [],
          updateOperatorParcels: [],
          updateOperatorEstates: [],
          ownerAuthorizations: [],
          operatorAuthorizations: []
        }
      })
    )
    const store = setupStore()
    const result = await store.dispatch(assetsEndpoints.endpoints.getUserLands.initiate({ address: '0xMe' }))
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0].id).toBe('parcel-10-20')
  })
})
