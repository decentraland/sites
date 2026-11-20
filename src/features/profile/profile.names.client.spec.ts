import { configureStore } from '@reduxjs/toolkit'
import { getEnv } from '../../config/env'
import { profileNamesApi } from './profile.names.client'

jest.mock('../../config/env')

function createTestStore() {
  return configureStore({
    reducer: { [profileNamesApi.reducerPath]: profileNamesApi.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(profileNamesApi.middleware)
  })
}

describe('when resolving a registered profile name', () => {
  let store: ReturnType<typeof createTestStore>
  let fetchSpy: jest.SpyInstance
  let wallet: string

  beforeEach(() => {
    store = createTestStore()
    wallet = '0xd9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd'
    jest.mocked(getEnv).mockReturnValue('https://subgraph.test/marketplace-sepolia')
    fetchSpy = jest.spyOn(global, 'fetch')
  })

  afterEach(() => {
    store.dispatch(profileNamesApi.util.resetApiState())
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  describe('and the subgraph resolves the exact name', () => {
    let result: string | null | undefined
    let request: Request
    let body: { query: string; variables: { name: string } }

    beforeEach(async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ data: { nfts: [{ name: 'Brai', owner: { address: wallet } }] } })))
      result = (await store.dispatch(profileNamesApi.endpoints.getProfileAddressByName.initiate('brai'))).data
      request = fetchSpy.mock.calls[0][0] as Request
      body = (await request.json()) as typeof body
    })
    it('should return the normalized owner address', () => {
      expect(result).toBe(wallet.toLowerCase())
    })
    it('should use the configured environment subgraph', () => {
      expect(request.url).toBe('https://subgraph.test/marketplace-sepolia')
    })
    it('should pass the name as a GraphQL variable', () => {
      expect(body.variables).toEqual({ name: 'brai' })
    })
    it('should constrain the query to registered names', () => {
      expect(body.query).toContain('category: ens')
    })
    it('should reuse the existing subgraph reducer', () => {
      expect(Object.keys(store.getState())).toEqual(['subgraphClient'])
    })
    it('should reuse a cached lookup without another request', async () => {
      await store.dispatch(profileNamesApi.endpoints.getProfileAddressByName.initiate('brai'))
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe.each([
    ['no results', []],
    ['a partial name', [{ name: 'braibrai', owner: { address: '0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd' } }]]
  ])('and the subgraph returns %s', (_label, nfts) => {
    let result: string | null | undefined
    beforeEach(async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ data: { nfts } })))
      result = (await store.dispatch(profileNamesApi.endpoints.getProfileAddressByName.initiate('brai'))).data
    })
    it('should not resolve an unrelated or missing name', () => {
      expect(result).toBeNull()
    })
  })

  describe.each([
    ['GraphQL errors', { errors: [{ message: 'internal upstream details' }] }, 200],
    ['a missing data field', {}, 200],
    ['an invalid owner', { data: { nfts: [{ name: 'brai', owner: { address: 'not-a-wallet' } }] } }, 200],
    ['a missing owner', { data: { nfts: [{ name: 'brai' }] } }, 200],
    ['an array owner', { data: { nfts: [{ name: 'brai', owner: { address: ['0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'] } }] } }, 200],
    ['an HTTP failure', {}, 503],
    ['a null response', null, 200]
  ])('and the subgraph returns %s', (_label, response, status) => {
    let isError: boolean | undefined
    beforeEach(async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(response), { status: status }))
      isError = (await store.dispatch(profileNamesApi.endpoints.getProfileAddressByName.initiate('brai'))).isError
    })
    it('should distinguish an unavailable lookup from a missing name', () => {
      expect(isError).toBe(true)
    })
  })

  describe('and the network request fails', () => {
    let isError: boolean | undefined
    beforeEach(async () => {
      fetchSpy.mockRejectedValueOnce(new Error('offline'))
      isError = (await store.dispatch(profileNamesApi.endpoints.getProfileAddressByName.initiate('brai'))).isError
    })
    it('should expose a retryable error', () => {
      expect(isError).toBe(true)
    })
  })
})
