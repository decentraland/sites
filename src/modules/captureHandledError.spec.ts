const captureExceptionMock = jest.fn()

jest.mock('./sentry', () => ({}))
jest.mock('@sentry/browser', () => ({ captureException: captureExceptionMock }))

import { captureHandledError } from './captureHandledError'

describe('when capturing a handled error', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and tags and extra context are provided', () => {
    it('should forward both to Sentry', async () => {
      const error = new Error('boom')

      await captureHandledError(error, { tags: { feature: 'download' }, extra: { milestones: ['clicked'] } })

      expect(captureExceptionMock).toHaveBeenCalledWith(error, {
        tags: { feature: 'download' },
        extra: { milestones: ['clicked'] }
      })
    })
  })

  describe('and a tag value is undefined', () => {
    it('should strip it so it does not render as the string "undefined"', async () => {
      const error = new Error('boom')

      await captureHandledError(error, { tags: { scope: 'getHotScenes', status: undefined } })

      expect(captureExceptionMock).toHaveBeenCalledWith(error, { tags: { scope: 'getHotScenes' }, extra: undefined })
    })
  })

  describe('and no options are provided', () => {
    it('should still capture the error with empty tags', async () => {
      const error = new Error('boom')

      await captureHandledError(error)

      expect(captureExceptionMock).toHaveBeenCalledWith(error, { tags: {}, extra: undefined })
    })
  })

  describe('and Sentry itself throws', () => {
    it('should swallow the error and resolve so the caller never breaks', async () => {
      captureExceptionMock.mockImplementation(() => {
        throw new Error('sentry blocked')
      })

      await expect(captureHandledError(new Error('x'))).resolves.toBeUndefined()
    })
  })
})
