import { configureStore } from '@reduxjs/toolkit'
import { waitFor } from '@testing-library/react'
import { cast2Client } from '../../services/cast2Client'
import { cast2Endpoints } from './cast2.client'

jest.mock('./cast2.helpers', () => ({
  getPresenterServerUrl: () => 'https://presenter.test',
  getGatekeeperUrl: () => 'https://gk.test',
  getWorldsContentUrl: () => 'https://wc.test'
}))

const createTestStore = () =>
  configureStore({
    reducer: { [cast2Client.reducerPath]: cast2Client.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cast2Client.middleware)
  })

type TestStore = ReturnType<typeof createTestStore>
type Subscription = PromiseLike<unknown> & { unsubscribe: () => void }

const { endpoints } = cast2Endpoints
const LIVEKIT = { livekitToken: 'lk-token', livekitUrl: 'wss://lk.test' }
const DECK_URL = 'https://docs.test/deck.pdf'

describe('cast2Endpoints', () => {
  let fetchSpy: jest.SpyInstance
  let store: TestStore
  let request: Request

  beforeEach(() => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(() => Promise.resolve(new Response('{}', { headers: { 'Content-Type': 'application/json' } })))
    store = createTestStore()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe.each<[string, (store: TestStore) => PromiseLike<unknown>, string, Record<string, unknown>]>([
    [
      'getStreamerToken',
      s => s.dispatch(endpoints.getStreamerToken.initiate({ token: 'stream-key', identity: 'stream:p:1' })),
      'https://gk.test/cast/streamer-token',
      { token: 'stream-key', identity: 'stream:p:1' }
    ],
    [
      'getWatcherToken with a parcel',
      s => s.dispatch(endpoints.getWatcherToken.initiate({ location: 'myworld.dcl.eth', identity: 'watch:1', parcel: '10,20' })),
      'https://gk.test/cast/watcher-token',
      { location: 'myworld.dcl.eth', identity: 'watch:1', parcel: '10,20' }
    ],
    [
      'getWatcherToken without a parcel',
      s => s.dispatch(endpoints.getWatcherToken.initiate({ location: 'myworld.dcl.eth', identity: 'watch:1' })),
      'https://gk.test/cast/watcher-token',
      { location: 'myworld.dcl.eth', identity: 'watch:1' }
    ],
    [
      'getPresentationBotToken',
      s => s.dispatch(endpoints.getPresentationBotToken.initiate({ streamingKey: 'stream-key' })),
      'https://gk.test/cast/presentation-bot-token',
      { streamingKey: 'stream-key' }
    ],
    [
      'uploadPresentationFromUrl with a presenterIdentity',
      s => s.dispatch(endpoints.uploadPresentationFromUrl.initiate({ url: DECK_URL, ...LIVEKIT, presenterIdentity: 'stream:p:1' })),
      'https://presenter.test/presentations',
      { url: DECK_URL, ...LIVEKIT, presenterIdentity: 'stream:p:1' }
    ],
    [
      'uploadPresentationFromUrl without a presenterIdentity',
      s => s.dispatch(endpoints.uploadPresentationFromUrl.initiate({ url: DECK_URL, ...LIVEKIT })),
      'https://presenter.test/presentations',
      { url: DECK_URL, ...LIVEKIT }
    ]
  ])('when %s is dispatched', (_label, dispatch, url, body) => {
    let sentBody: unknown

    beforeEach(async () => {
      await dispatch(store)
      request = fetchSpy.mock.calls[0][0] as Request
      sentBody = await request.json()
    })

    it('should post exactly the expected JSON body to the endpoint', () => {
      expect({ url: request.url, method: request.method, body: sentBody }).toEqual({ url, method: 'POST', body })
    })
  })

  describe.each<[string, string | undefined, Record<string, unknown>]>([
    ['a presenterIdentity', 'stream:p:1', { presenterIdentity: 'stream:p:1' }],
    ['no presenterIdentity', undefined, {}]
  ])('when uploadPresentation is dispatched with %s', (_label, presenterIdentity, identityField) => {
    let form: FormData

    beforeEach(async () => {
      const file = new File(['deck'], 'deck.pdf', { type: 'application/pdf' })
      await store.dispatch(endpoints.uploadPresentation.initiate({ file, ...LIVEKIT, presenterIdentity }))
      request = fetchSpy.mock.calls[0][0] as Request
      form = await request.formData()
    })

    it('should post the file and the LiveKit credentials as form data to the presenter server', () => {
      expect({ url: request.url, method: request.method, ...Object.fromEntries(form) }).toEqual({
        url: 'https://presenter.test/presentations',
        method: 'POST',
        file: expect.anything(),
        ...LIVEKIT,
        ...identityField
      })
    })
  })

  describe.each<[string, (store: TestStore) => Subscription, string, { type: 'StreamInfo' | 'WorldScenes'; id: string }]>([
    [
      'getStreamInfo',
      s => s.dispatch(endpoints.getStreamInfo.initiate('key/with space')),
      'https://gk.test/cast/stream-info/key%2Fwith%20space',
      { type: 'StreamInfo', id: 'key/with space' }
    ],
    [
      'getWorldScenes',
      s => s.dispatch(endpoints.getWorldScenes.initiate('MyWorld.dcl.eth')),
      'https://wc.test/world/myworld.dcl.eth/scenes',
      { type: 'WorldScenes', id: 'myworld.dcl.eth' }
    ]
  ])('when %s is queried', (_label, subscribe, url, tag) => {
    let subscription: Subscription

    beforeEach(async () => {
      subscription = subscribe(store)
      await subscription
    })

    afterEach(() => {
      subscription.unsubscribe()
    })

    it('should request the encoded resource URL', () => {
      expect((fetchSpy.mock.calls[0][0] as Request).url).toBe(url)
    })

    describe('and its tag is invalidated', () => {
      beforeEach(async () => {
        store.dispatch(cast2Client.util.invalidateTags([tag]))
        await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
      })

      it('should refetch the same resource', () => {
        expect((fetchSpy.mock.calls[1][0] as Request).url).toBe(url)
      })
    })
  })
})
