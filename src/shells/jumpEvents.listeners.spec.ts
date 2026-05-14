import { configureStore } from '@reduxjs/toolkit'
import type { Middleware, UnknownAction } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../config/env'
import { eventsClient } from '../features/events/events.client'
import { placesClient } from '../services/placesClient'
import { fetchWithIdentity } from '../utils/signedFetch'
import { createJumpEventsListenerMiddleware } from './jumpEvents.listeners'

jest.mock('../config/env')
jest.mock('../utils/signedFetch', () => ({
  fetchWithIdentity: jest.fn(),
  fetchWithOptionalIdentity: jest.fn()
}))

const mockGetEnv = jest.mocked(getEnv)
const mockFetchWithIdentity = jest.mocked(fetchWithIdentity)

type TestStore = ReturnType<typeof createTestStore>

function createTestStore(onAction: (action: UnknownAction) => void) {
  const listenerMiddleware = createJumpEventsListenerMiddleware()
  const recordActions: Middleware = () => next => action => {
    onAction(action as UnknownAction)
    return next(action)
  }

  return configureStore({
    reducer: {
      [eventsClient.reducerPath]: eventsClient.reducer,
      [placesClient.reducerPath]: placesClient.reducer
    },
    middleware: getDefault =>
      getDefault().prepend(recordActions, listenerMiddleware.middleware).concat(eventsClient.middleware, placesClient.middleware)
  })
}

function isJumpEventTag(tag: unknown): boolean {
  return tag === 'JumpEvent' || (typeof tag === 'object' && tag !== null && 'type' in tag && tag.type === 'JumpEvent')
}

function hasJumpEventInvalidation(actions: UnknownAction[]): boolean {
  return actions.some(action => {
    return (
      typeof action.type === 'string' &&
      action.type.includes('invalidateTags') &&
      Array.isArray(action.payload) &&
      action.payload.some(isJumpEventTag)
    )
  })
}

describe('createJumpEventsListenerMiddleware', () => {
  let actions: UnknownAction[]
  let identity: AuthIdentity
  let store: TestStore

  beforeEach(() => {
    actions = []
    identity = { authChain: [{ type: 'SIGNER', payload: '0xabc', signature: '' }] } as unknown as AuthIdentity
    mockGetEnv.mockReturnValue('https://events.test')
    mockFetchWithIdentity.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: { event_id: 'ev-1', user: '0xabc' } })
    } as unknown as Response)
    store = createTestStore(action => actions.push(action))
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a toggleAttendee mutation fulfils', () => {
    beforeEach(async () => {
      await store.dispatch(eventsClient.endpoints.toggleAttendee.initiate({ eventId: 'ev-1', attending: true, identity }))
    })

    it('should invalidate the JumpEvent tag so /jump/events refetches with the updated attending state', () => {
      expect(hasJumpEventInvalidation(actions)).toBe(true)
    })
  })

  describe('when a toggleAttendee mutation fails', () => {
    beforeEach(async () => {
      mockFetchWithIdentity.mockRejectedValueOnce(new Error('boom'))
      await store.dispatch(eventsClient.endpoints.toggleAttendee.initiate({ eventId: 'ev-1', attending: true, identity }))
    })

    it('should not invalidate JumpEvent — the server state did not change', () => {
      expect(hasJumpEventInvalidation(actions)).toBe(false)
    })
  })
})
