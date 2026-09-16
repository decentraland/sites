import { DownloadCountsHttpError, isReportableDownloadCountsFailure } from './explorerDownloads.helpers'

describe('when the request never reached a server', () => {
  // One case per engine wording, because the platform gives us nothing but the message.
  it.each([
    ['Chrome', 'Failed to fetch'],
    ['Chrome with the host appended', 'Failed to fetch (cdn-data.decentraland.org)'],
    ['Firefox', 'NetworkError when attempting to fetch resource.'],
    ['Safari', 'Load failed']
  ])('should not report the %s wording', (_engine, message) => {
    expect(isReportableDownloadCountsFailure(new TypeError(message))).toBe(false)
  })

  it('should ignore the casing of the message', () => {
    expect(isReportableDownloadCountsFailure(new TypeError('FAILED TO FETCH'))).toBe(false)
  })
})

describe('when the request was aborted', () => {
  it.each(['AbortError', 'TimeoutError'])('should not report a %s', name => {
    const error = new Error('Fetch is aborted')
    error.name = name

    expect(isReportableDownloadCountsFailure(error)).toBe(false)
  })
})

describe('when the endpoint answered', () => {
  it('should not report a 304, which carries no body but is not a failure', () => {
    expect(isReportableDownloadCountsFailure(new DownloadCountsHttpError(304))).toBe(false)
  })

  it.each([404, 500, 502, 503])('should report a %s', status => {
    expect(isReportableDownloadCountsFailure(new DownloadCountsHttpError(status))).toBe(true)
  })

  it('should report a malformed payload', () => {
    expect(isReportableDownloadCountsFailure(new SyntaxError('Unexpected end of JSON input'))).toBe(true)
  })
})

describe('when the thrown value is not an Error', () => {
  it.each([
    ['a string', 'boom'],
    ['undefined', undefined],
    ['null', null]
  ])('should report %s rather than swallow it', (_label, thrown) => {
    expect(isReportableDownloadCountsFailure(thrown)).toBe(true)
  })
})

describe('when building the error', () => {
  it('should keep the status readable in the message', () => {
    const error = new DownloadCountsHttpError(503)

    expect(error.message).toBe('HTTP error! status: 503')
    expect(error.name).toBe('DownloadCountsHttpError')
    expect(error.status).toBe(503)
  })
})
