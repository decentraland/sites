import { configureStore } from '@reduxjs/toolkit'
import { waitFor } from '@testing-library/react'
import { cast2Client } from '../../services/cast2Client'
import { cast2Endpoints } from './cast2.client'

jest.mock('./cast2.helpers', () => ({
  getPresenterServerUrl: () => 'https://presenter.test',
  getGatekeeperUrl: () => 'https://gk.test',
  getWorldsContentUrl: () => 'https://wc.test'
}))

const PRESENTATION_INFO = { id: 'deck-1', slideCount: 3, currentSlide: 0, fileType: 'pdf' }

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })

const createTestStore = () =>
  configureStore({
    reducer: { [cast2Client.reducerPath]: cast2Client.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cast2Client.middleware)
  })

describe('cast2Endpoints', () => {
  let fetchSpy: jest.SpyInstance
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(PRESENTATION_INFO))
    store = createTestStore()
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('when uploadPresentation is dispatched', () => {
    let file: File
    let request: Request
    let form: FormData

    beforeEach(() => {
      file = new File(['deck'], 'deck.pdf', { type: 'application/pdf' })
    })

    describe('and a presenterIdentity is given', () => {
      beforeEach(async () => {
        await store.dispatch(
          cast2Endpoints.endpoints.uploadPresentation.initiate({
            file,
            livekitToken: 'lk-token',
            livekitUrl: 'wss://lk.test',
            presenterIdentity: 'stream:p:1'
          })
        )
        request = fetchSpy.mock.calls[0][0] as Request
        form = await request.formData()
      })

      it('should post to the presenter server presentations endpoint', () => {
        expect({ url: request.url, method: request.method }).toEqual({ url: 'https://presenter.test/presentations', method: 'POST' })
      })

      it('should send the presenterIdentity form field', () => {
        expect(form.get('presenterIdentity')).toBe('stream:p:1')
      })

      it('should keep sending the file and the LiveKit credentials', () => {
        expect({ hasFile: form.has('file'), livekitToken: form.get('livekitToken'), livekitUrl: form.get('livekitUrl') }).toEqual({
          hasFile: true,
          livekitToken: 'lk-token',
          livekitUrl: 'wss://lk.test'
        })
      })
    })

    describe('and no presenterIdentity is given', () => {
      beforeEach(async () => {
        await store.dispatch(
          cast2Endpoints.endpoints.uploadPresentation.initiate({ file, livekitToken: 'lk-token', livekitUrl: 'wss://lk.test' })
        )
        request = fetchSpy.mock.calls[0][0] as Request
        form = await request.formData()
      })

      it('should not send a presenterIdentity form field', () => {
        expect(form.has('presenterIdentity')).toBe(false)
      })
    })
  })

  describe('when uploadPresentationFromUrl is dispatched', () => {
    let body: Record<string, unknown>

    describe('and a presenterIdentity is given', () => {
      beforeEach(async () => {
        await store.dispatch(
          cast2Endpoints.endpoints.uploadPresentationFromUrl.initiate({
            url: 'https://docs.test/deck.pdf',
            livekitToken: 'lk-token',
            livekitUrl: 'wss://lk.test',
            presenterIdentity: 'stream:p:1'
          })
        )
        body = await (fetchSpy.mock.calls[0][0] as Request).json()
      })

      it('should include the presenterIdentity in the JSON body', () => {
        expect(body).toEqual({
          url: 'https://docs.test/deck.pdf',
          livekitToken: 'lk-token',
          livekitUrl: 'wss://lk.test',
          presenterIdentity: 'stream:p:1'
        })
      })
    })

    describe('and no presenterIdentity is given', () => {
      beforeEach(async () => {
        await store.dispatch(
          cast2Endpoints.endpoints.uploadPresentationFromUrl.initiate({
            url: 'https://docs.test/deck.pdf',
            livekitToken: 'lk-token',
            livekitUrl: 'wss://lk.test'
          })
        )
        body = await (fetchSpy.mock.calls[0][0] as Request).json()
      })

      it('should not include a presenterIdentity key in the JSON body', () => {
        expect(body).not.toHaveProperty('presenterIdentity')
      })
    })
  })

  describe('when getStreamerToken is dispatched', () => {
    let request: Request
    let body: Record<string, unknown>

    beforeEach(async () => {
      await store.dispatch(cast2Endpoints.endpoints.getStreamerToken.initiate({ token: 'stream-key', identity: 'stream:p:1' }))
      request = fetchSpy.mock.calls[0][0] as Request
      body = await request.json()
    })

    it('should post to the gatekeeper streamer-token endpoint', () => {
      expect({ url: request.url, method: request.method }).toEqual({ url: 'https://gk.test/cast/streamer-token', method: 'POST' })
    })

    it('should send the token and the identity', () => {
      expect(body).toEqual({ token: 'stream-key', identity: 'stream:p:1' })
    })
  })

  describe('when getWatcherToken is dispatched', () => {
    let request: Request
    let body: Record<string, unknown>

    describe('and a parcel is given', () => {
      beforeEach(async () => {
        await store.dispatch(
          cast2Endpoints.endpoints.getWatcherToken.initiate({ location: 'myworld.dcl.eth', identity: 'watch:1', parcel: '10,20' })
        )
        request = fetchSpy.mock.calls[0][0] as Request
        body = await request.json()
      })

      it('should post to the gatekeeper watcher-token endpoint', () => {
        expect({ url: request.url, method: request.method }).toEqual({ url: 'https://gk.test/cast/watcher-token', method: 'POST' })
      })

      it('should send the location, the identity and the parcel', () => {
        expect(body).toEqual({ location: 'myworld.dcl.eth', identity: 'watch:1', parcel: '10,20' })
      })
    })

    describe('and no parcel is given', () => {
      beforeEach(async () => {
        await store.dispatch(cast2Endpoints.endpoints.getWatcherToken.initiate({ location: 'myworld.dcl.eth', identity: 'watch:1' }))
        body = await (fetchSpy.mock.calls[0][0] as Request).json()
      })

      it('should not send a parcel key', () => {
        expect(body).toEqual({ location: 'myworld.dcl.eth', identity: 'watch:1' })
      })
    })
  })

  describe('when getPresentationBotToken is dispatched', () => {
    let request: Request
    let body: Record<string, unknown>

    beforeEach(async () => {
      await store.dispatch(cast2Endpoints.endpoints.getPresentationBotToken.initiate({ streamingKey: 'stream-key' }))
      request = fetchSpy.mock.calls[0][0] as Request
      body = await request.json()
    })

    it('should post to the gatekeeper presentation-bot-token endpoint', () => {
      expect({ url: request.url, method: request.method }).toEqual({
        url: 'https://gk.test/cast/presentation-bot-token',
        method: 'POST'
      })
    })

    it('should send the streaming key', () => {
      expect(body).toEqual({ streamingKey: 'stream-key' })
    })
  })

  describe('when getStreamInfo is queried', () => {
    let subscription: { unsubscribe: () => void }

    beforeEach(async () => {
      fetchSpy.mockImplementation(() =>
        Promise.resolve(jsonResponse({ placeName: 'Plaza', placeId: 'p-1', location: '0,0', isWorld: false }))
      )
      subscription = store.dispatch(cast2Endpoints.endpoints.getStreamInfo.initiate('key/with space'))
      await subscription
    })

    afterEach(() => {
      subscription.unsubscribe()
    })

    it('should request the URL-encoded streaming key from the gatekeeper', () => {
      expect((fetchSpy.mock.calls[0][0] as Request).url).toBe('https://gk.test/cast/stream-info/key%2Fwith%20space')
    })

    it('should expose the stream info', () => {
      expect(cast2Endpoints.endpoints.getStreamInfo.select('key/with space')(store.getState()).data).toEqual({
        placeName: 'Plaza',
        placeId: 'p-1',
        location: '0,0',
        isWorld: false
      })
    })

    describe('and its StreamInfo tag is invalidated', () => {
      beforeEach(async () => {
        store.dispatch(cast2Client.util.invalidateTags([{ type: 'StreamInfo', id: 'key/with space' }]))
        await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
      })

      it('should refetch the stream info', () => {
        expect((fetchSpy.mock.calls[1][0] as Request).url).toBe('https://gk.test/cast/stream-info/key%2Fwith%20space')
      })
    })
  })

  describe('when getWorldScenes is queried', () => {
    let subscription: { unsubscribe: () => void }

    beforeEach(async () => {
      fetchSpy.mockImplementation(() => Promise.resolve(jsonResponse({ scenes: [], total: 0 })))
      subscription = store.dispatch(cast2Endpoints.endpoints.getWorldScenes.initiate('MyWorld.dcl.eth'))
      await subscription
    })

    afterEach(() => {
      subscription.unsubscribe()
    })

    it('should request the lowercased world from worlds-content', () => {
      expect((fetchSpy.mock.calls[0][0] as Request).url).toBe('https://wc.test/world/myworld.dcl.eth/scenes')
    })

    describe('and its lowercased WorldScenes tag is invalidated', () => {
      beforeEach(async () => {
        store.dispatch(cast2Client.util.invalidateTags([{ type: 'WorldScenes', id: 'myworld.dcl.eth' }]))
        await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
      })

      it('should refetch the world scenes', () => {
        expect((fetchSpy.mock.calls[1][0] as Request).url).toBe('https://wc.test/world/myworld.dcl.eth/scenes')
      })
    })
  })
})
