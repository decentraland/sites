const captureExceptionMock = jest.fn()

jest.mock('./sentry', () => ({}))
jest.mock('@sentry/browser', () => ({ captureException: captureExceptionMock }))

import { captureDownloadError, recordDownloadMilestone } from './downloadFunnelSentry'

describe('downloadFunnelSentry', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when an error is captured after milestones were recorded', () => {
    it('should send the exception with defined tags and the milestone buffer', async () => {
      recordDownloadMilestone('download_success_arrived')
      recordDownloadMilestone('download_started')

      await captureDownloadError(new Error('boom'), {
        feature: 'download_funnel',
        click_id: 'c-1',
        os: undefined
      })

      expect(captureExceptionMock).toHaveBeenCalledTimes(1)
      const [error, options] = captureExceptionMock.mock.calls[0]
      expect(error).toBeInstanceOf(Error)
      expect(options.tags).toEqual({ feature: 'download_funnel', click_id: 'c-1' })
      expect(options.tags).not.toHaveProperty('os')
      expect(options.extra.milestones).toEqual(expect.arrayContaining([expect.objectContaining({ event: 'download_started' })]))
    })
  })

  describe('when reporting to Sentry throws', () => {
    it('should swallow the error and resolve (never break the download flow)', async () => {
      captureExceptionMock.mockImplementation(() => {
        throw new Error('sentry blew up')
      })

      await expect(captureDownloadError(new Error('boom'), {})).resolves.toBeUndefined()
    })
  })
})
