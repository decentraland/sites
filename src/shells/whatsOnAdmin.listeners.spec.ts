import { configureStore } from '@reduxjs/toolkit'
import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../config/env'
import { adminClient } from '../features/experiences/events/admin'
import { eventsClient } from '../features/experiences/events/events.client'
import { fetchWithIdentity } from '../utils/signedFetch'
import { createWhatsOnAdminListenerMiddleware } from './whatsOnAdmin.listeners'

jest.mock('../config/env')
jest.mock('../utils/signedFetch', () => ({
  fetchWithIdentity: jest.fn(),
  fetchWithOptionalIdentity: jest.fn()
}))

const mockGetEnv = jest.mocked(getEnv)
const mockFetchWithIdentity = jest.mocked(fetchWithIdentity)

type TestStore = ReturnType<typeof createTestStore>

function createTestStore(onAction: (action: UnknownAction) => void) {
  const listenerMiddleware = createWhatsOnAdminListenerMiddleware()
  const recordActions: Middleware = () => next => action => {
    onAction(action as UnknownAction)
    return next(action)
  }

  return configureStore({
    reducer: {
      [eventsClient.reducerPath]: eventsClient.reducer,
      [adminClient.reducerPath]: adminClient.reducer
    },
    middleware: getDefault =>
      getDefault().prepend(recordActions, listenerMiddleware.middleware).concat(eventsClient.middleware, adminClient.middleware)
  })
}

function isPendingEventsTag(tag: unknown): boolean {
  return tag === 'PendingEvents' || (typeof tag === 'object' && tag !== null && 'type' in tag && tag.type === 'PendingEvents')
}

function hasPendingEventsInvalidation(actions: UnknownAction[]): boolean {
  return actions.some(action => {
    return (
      typeof action.type === 'string' &&
      action.type.includes('invalidateTags') &&
      Array.isArray(action.payload) &&
      action.payload.some(isPendingEventsTag)
    )
  })
}

describe('createWhatsOnAdminListenerMiddleware', () => {
  let actions: UnknownAction[]
  let identity: AuthIdentity
  let store: TestStore

  beforeEach(() => {
    actions = []
    identity = { authChain: [{ type: 'SIGNER', payload: '0xabc', signature: '' }] } as unknown as AuthIdentity
    mockGetEnv.mockReturnValue('https://events.test')
    mockFetchWithIdentity.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { id: 'ev-1' } })
    } as unknown as Response)
    store = createTestStore(action => actions.push(action))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a createEvent mutation fulfills', () => {
    beforeEach(async () => {
      await store.dispatch(
        eventsClient.endpoints.createEvent.initiate({
          payload: {} as never,
          identity
        })
      )
    })

    it('should invalidate PendingEvents for admin views', () => {
      expect(hasPendingEventsInvalidation(actions)).toBe(true)
    })
  })

  describe('when an updateEvent mutation fulfills', () => {
    beforeEach(async () => {
      await store.dispatch(
        eventsClient.endpoints.updateEvent.initiate({
          eventId: 'ev-42',
          payload: {} as never,
          identity
        })
      )
    })

    it('should invalidate PendingEvents for admin views', () => {
      expect(hasPendingEventsInvalidation(actions)).toBe(true)
    })
  })

  describe('when a createEvent mutation fails', () => {
    beforeEach(async () => {
      mockFetchWithIdentity.mockRejectedValueOnce(new Error('boom'))
      await store.dispatch(
        eventsClient.endpoints.createEvent.initiate({
          payload: {} as never,
          identity
        })
      )
    })

    it('should not invalidate PendingEvents', () => {
      expect(hasPendingEventsInvalidation(actions)).toBe(false)
    })
  })
})
