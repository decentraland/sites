import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { adminClient } from '../features/whats-on/admin'
import { eventsClient } from '../features/whats-on-events/events.client'
import { cmsClient } from '../services/blogClient'

jest.mock('../config/env', () => ({
  getEnv: () => undefined
}))

jest.mock('../utils/signedFetch', () => ({
  fetchWithIdentity: jest.fn(),
  fetchWithOptionalIdentity: jest.fn()
}))

jest.mock('../services/blogClient', () => {
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
      [cmsClient.reducerPath]: cmsClient.reducer
    })
    const store = configureStore({
      reducer: rootReducer,
      middleware: getDefault => getDefault().concat(eventsClient.middleware, adminClient.middleware, cmsClient.middleware)
    })
    state = store.getState() as Record<string, unknown>
  })

  it('should register the events RTK Query reducer', () => {
    expect(state).toHaveProperty('eventsClient')
  })

  it('should register the admin RTK Query reducer', () => {
    expect(state).toHaveProperty('adminClient')
  })
})

describe('when inspecting the store source file', () => {
  let source: string

  beforeEach(() => {
    source = readFileSync(resolve(__dirname, 'store.ts'), 'utf-8')
  })

  it('should import the admin client', () => {
    expect(source).toMatch(/from '\.\.\/features\/whats-on\/admin'/)
  })

  it('should register adminClient.reducer in the reducer map', () => {
    expect(source).toContain('[adminClient.reducerPath]: adminClient.reducer')
  })

  it('should concatenate adminClient.middleware in the middleware chain', () => {
    expect(source).toContain('adminClient.middleware')
  })
})
