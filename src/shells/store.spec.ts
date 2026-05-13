import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { adminClient } from '../features/events/events.admin.client'
import { eventsClient } from '../features/events/events.client'
import { cast2Client } from '../services/cast2Client'
import { cmsClient } from '../services/cmsClient'
import { marketplaceClient } from '../services/marketplaceClient'
import { placesClient } from '../services/placesClient'
import { referralClient } from '../services/referralClient'

jest.mock('../config/env', () => ({
  getEnv: () => undefined
}))

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 })
}))

jest.mock('../utils/signedFetch', () => ({
  fetchWithIdentity: jest.fn(),
  fetchWithOptionalIdentity: jest.fn()
}))

jest.mock('../services/cmsClient', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createApi, fetchBaseQuery } = require('@reduxjs/toolkit/query/react')
  const cmsClient = createApi({
    reducerPath: 'cmsClient',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }),
    endpoints: () => ({})
  })
  return { cmsClient }
})

describe('when building the DappsShell store', () => {
  let state: Record<string, unknown>

  beforeEach(() => {
    const rootReducer = combineReducers({
      [eventsClient.reducerPath]: eventsClient.reducer,
      [adminClient.reducerPath]: adminClient.reducer,
      [cmsClient.reducerPath]: cmsClient.reducer,
      [placesClient.reducerPath]: placesClient.reducer,
      [cast2Client.reducerPath]: cast2Client.reducer,
      [marketplaceClient.reducerPath]: marketplaceClient.reducer,
      [referralClient.reducerPath]: referralClient.reducer
    })
    const store = configureStore({
      reducer: rootReducer,
      middleware: getDefault =>
        getDefault().concat(
          eventsClient.middleware,
          adminClient.middleware,
          cmsClient.middleware,
          placesClient.middleware,
          cast2Client.middleware,
          marketplaceClient.middleware,
          referralClient.middleware
        )
    })
    state = store.getState() as Record<string, unknown>
  })

  it('should register the events RTK Query reducer', () => {
    expect(state).toHaveProperty('eventsClient')
  })

  it('should register the admin RTK Query reducer', () => {
    expect(state).toHaveProperty('adminClient')
  })

  it('should register the places RTK Query reducer', () => {
    expect(state).toHaveProperty('placesClient')
  })

  it('should register the cast2 RTK Query reducer', () => {
    expect(state).toHaveProperty('cast2Client')
  })

  it('should register the marketplace RTK Query reducer', () => {
    expect(state).toHaveProperty('marketplaceClient')
  })

  it('should register the referral RTK Query reducer', () => {
    expect(state).toHaveProperty('referralClient')
  })
})

describe('when inspecting the store source file', () => {
  let source: string

  beforeEach(() => {
    source = readFileSync(resolve(__dirname, 'store.ts'), 'utf-8')
  })

  it('should import the admin client', () => {
    expect(source).toMatch(/from '\.\.\/features\/events\/events\.admin\.client'/)
  })

  it('should register adminClient.reducer in the reducer map', () => {
    expect(source).toContain('[adminClient.reducerPath]: adminClient.reducer')
  })

  it('should concatenate adminClient.middleware in the middleware chain', () => {
    expect(source).toContain('adminClient.middleware')
  })

  it('should import the cast2 client', () => {
    expect(source).toMatch(/from '\.\.\/services\/cast2Client'/)
  })

  it('should register cast2Client.reducer in the reducer map', () => {
    expect(source).toContain('[cast2Client.reducerPath]: cast2Client.reducer')
  })

  it('should concatenate cast2Client.middleware in the middleware chain', () => {
    expect(source).toContain('cast2Client.middleware')
  })

  it('should import the marketplace client', () => {
    expect(source).toMatch(/from '\.\.\/services\/marketplaceClient'/)
  })

  it('should register marketplaceClient.reducer in the reducer map', () => {
    expect(source).toContain('[marketplaceClient.reducerPath]: marketplaceClient.reducer')
  })

  it('should concatenate marketplaceClient.middleware in the middleware chain', () => {
    expect(source).toContain('marketplaceClient.middleware')
  })

  it('should import the referral client', () => {
    expect(source).toMatch(/from '\.\.\/services\/referralClient'/)
  })

  it('should register referralClient.reducer in the reducer map', () => {
    expect(source).toContain('[referralClient.reducerPath]: referralClient.reducer')
  })

  it('should concatenate referralClient.middleware in the middleware chain', () => {
    expect(source).toContain('referralClient.middleware')
  })
})
