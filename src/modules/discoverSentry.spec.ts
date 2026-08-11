const captureExceptionMock = jest.fn()

jest.mock('./sentry', () => ({}))
jest.mock('@sentry/browser', () => ({ captureException: captureExceptionMock }))

import { captureDiscoverError } from './discoverSentry'

describe('when capturing a discover error', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and Sentry loads normally', () => {
    it('should send the exception with the feature tag and defined tags only', async () => {
      const error = new Error('places-api down')

      await captureDiscoverError(error, { scope: 'getDiscoverPlaces', status: '502', empty: undefined })

      expect(captureExceptionMock).toHaveBeenCalledWith(error, {
        tags: { feature: 'discover', scope: 'getDiscoverPlaces', status: '502' }
      })
    })
  })

  describe('and a caller passes an undefined feature tag', () => {
    it('should keep the discover feature tag rather than letting it be dropped', async () => {
      const error = new Error('places-api down')

      await captureDiscoverError(error, { feature: undefined, scope: 'getHotScenes' })

      expect(captureExceptionMock).toHaveBeenCalledWith(error, {
        tags: { feature: 'discover', scope: 'getHotScenes' }
      })
    })
  })

  describe('and Sentry itself throws', () => {
    it('should swallow the error and resolve (never break the page)', async () => {
      captureExceptionMock.mockImplementation(() => {
        throw new Error('sentry blocked')
      })

      await expect(captureDiscoverError(new Error('x'), {})).resolves.toBeUndefined()
    })
  })
})
