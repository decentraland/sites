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
    let consoleWarnSpy: jest.SpyInstance

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      captureExceptionMock.mockImplementation(() => {
        throw new Error('sentry blocked')
      })
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })

    it('should swallow the error and resolve so the caller never breaks', async () => {
      await expect(captureHandledError(new Error('x'))).resolves.toBeUndefined()
    })

    // A silent catch is right for users but is also how a broken reporting path
    // hides, so outside production the failure has to be visible somewhere.
    it('should warn outside production so a broken reporting path is noticeable', async () => {
      await captureHandledError(new Error('x'))

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[captureHandledError] failed to report to Sentry',
        expect.any(Error),
        'original error:',
        expect.any(Error)
      )
    })

    it('should stay silent in production', async () => {
      const previousEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      await captureHandledError(new Error('x'))

      expect(consoleWarnSpy).not.toHaveBeenCalled()
      process.env.NODE_ENV = previousEnv
    })
  })
})
