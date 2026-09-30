import { configureStore } from '@reduxjs/toolkit'
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
})
