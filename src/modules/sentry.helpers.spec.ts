import type { Breadcrumb, ErrorEvent } from '@sentry/browser'
import { isBlockedAnalyticsScriptError, redactBreadcrumbUrl, redactEventUrls, redactSensitiveUrl } from './sentry.helpers'

const SEGMENT_LOADER_FILENAME = 'webpack://Destination/../browser-destination-runtime/dist/esm/load-script.js'

const buildLoaderEvent = (value: string, filename = SEGMENT_LOADER_FILENAME): ErrorEvent =>
  ({
    exception: { values: [{ value, stacktrace: { frames: [{ filename }] } }] }
  }) as ErrorEvent

describe('when deciding whether an event is a blocked analytics script', () => {
  describe('and the Google tag failed to load through the Segment loader', () => {
    it('should treat it as blocked-analytics noise', () => {
      const event = buildLoaderEvent('Failed to load https://www.googletagmanager.com/gtag/js?id=G-7DM7BF7RJG')
      expect(isBlockedAnalyticsScriptError(event)).toBe(true)
    })

    it('should also match the google-analytics host', () => {
      const event = buildLoaderEvent('Failed to load https://www.google-analytics.com/analytics.js')
      expect(isBlockedAnalyticsScriptError(event)).toBe(true)
    })

    it('should match when the useful text sits on a chained exception', () => {
      const event = {
        exception: {
          values: [
            { value: 'wrapper', stacktrace: { frames: [{ filename: SEGMENT_LOADER_FILENAME }] } },
            { value: 'Failed to load https://www.googletagmanager.com/gtag/js' }
          ]
        }
      } as ErrorEvent
      expect(isBlockedAnalyticsScriptError(event)).toBe(true)
    })

    it('should match when the host is on the event message instead', () => {
      const event = {
        message: 'Failed to load https://www.googletagmanager.com/gtag/js',
        exception: { values: [{ stacktrace: { frames: [{ filename: SEGMENT_LOADER_FILENAME }] } }] }
      } as ErrorEvent
      expect(isBlockedAnalyticsScriptError(event)).toBe(true)
    })
  })

  // The whole point of pairing the frame with the host: a genuine outage of any
  // other Segment destination has to keep reaching Sentry.
  describe('and a different Segment destination failed to load', () => {
    it('should NOT treat it as noise', () => {
      const event = buildLoaderEvent('Failed to load https://cdn.some-vendor.example/destination.js')
      expect(isBlockedAnalyticsScriptError(event)).toBe(false)
    })
  })

  describe('and our own code failed while merely mentioning the analytics host', () => {
    it('should NOT treat it as noise', () => {
      const event = buildLoaderEvent('Failed to load https://www.googletagmanager.com/gtag/js', '/assets/index-abc123.js')
      expect(isBlockedAnalyticsScriptError(event)).toBe(false)
    })
  })

  describe('and the event has no exception at all', () => {
    it('should NOT treat it as noise', () => {
      expect(isBlockedAnalyticsScriptError({ message: 'boom' } as ErrorEvent)).toBe(false)
    })
  })

  describe('and the exception has no stacktrace', () => {
    it('should NOT treat it as noise', () => {
      const event = { exception: { values: [{ value: 'googletagmanager.com' }] } } as ErrorEvent
      expect(isBlockedAnalyticsScriptError(event)).toBe(false)
    })
  })
})

describe('when redacting a sensitive URL', () => {
  describe('and the path carries a cast streaming token', () => {
    it('should replace the token segment', () => {
      expect(redactSensitiveUrl('/cast/s/eyJhbGciOiJIUzI1NiJ9')).toBe('/cast/s/[redacted]')
    })

    it('should keep the literal streaming route readable', () => {
      expect(redactSensitiveUrl('/cast/s/streaming')).toBe('/cast/s/streaming')
    })

    it('should keep the literal streaming route readable when a query follows', () => {
      expect(redactSensitiveUrl('/cast/s/streaming?debug=1')).toBe('/cast/s/streaming?debug=1')
    })

    it('should redact a token that merely starts with the literal route name', () => {
      expect(redactSensitiveUrl('/cast/s/streamingABC123')).toBe('/cast/s/[redacted]')
    })

    it('should redact the token inside an absolute URL', () => {
      expect(redactSensitiveUrl('https://decentraland.org/cast/s/abc123')).toBe('https://decentraland.org/cast/s/[redacted]')
    })
  })

  describe('and the path carries an email confirmation token', () => {
    it('should redact the challenge route while keeping the segment name', () => {
      expect(redactSensitiveUrl('/account/confirm-email-challenge/tok_123')).toBe('/account/confirm-email-challenge/[redacted]')
    })

    it('should redact the legacy confirm-email route', () => {
      expect(redactSensitiveUrl('/account/confirm-email/tok_123')).toBe('/account/confirm-email/[redacted]')
    })

    it('should redact the legacy credits route', () => {
      expect(redactSensitiveUrl('/account/credits-email-confirmed/tok_123')).toBe('/account/credits-email-confirmed/[redacted]')
    })
  })

  describe('and the path carries a public wallet address', () => {
    it('should leave an invite referrer intact', () => {
      expect(redactSensitiveUrl('/invite/0x1234567890abcdef')).toBe('/invite/0x1234567890abcdef')
    })

    it('should leave a storage player address intact', () => {
      expect(redactSensitiveUrl('/storage/players/0x1234567890abcdef')).toBe('/storage/players/0x1234567890abcdef')
    })
  })

  describe('and the query string carries a sensitive value', () => {
    it('should redact the value but keep the key', () => {
      expect(redactSensitiveUrl('/sign-in?token=secret123')).toBe('/sign-in?token=%5Bredacted%5D')
    })

    it('should redact regardless of key casing', () => {
      expect(redactSensitiveUrl('/sign-in?TOKEN=secret123')).toBe('/sign-in?TOKEN=%5Bredacted%5D')
    })

    it('should redact every sensitive key while leaving the others', () => {
      const result = redactSensitiveUrl('/callback?code=abc&state=keep&email=a@b.com')
      expect(result).toContain('state=keep')
      expect(result).not.toContain('abc')
      expect(result).not.toContain('a%40b.com')
    })

    it('should keep the origin of an absolute URL', () => {
      expect(redactSensitiveUrl('https://decentraland.org/x?signature=abc')).toBe('https://decentraland.org/x?signature=%5Bredacted%5D')
    })

    it('should preserve the hash fragment', () => {
      expect(redactSensitiveUrl('/x?token=abc#section')).toBe('/x?token=%5Bredacted%5D#section')
    })
  })

  describe('and the query string has nothing sensitive', () => {
    it('should return the URL untouched', () => {
      expect(redactSensitiveUrl('/whats-on?page=2&sort=asc')).toBe('/whats-on?page=2&sort=asc')
    })
  })

  describe('and the URL has no query string', () => {
    it('should return the URL untouched', () => {
      expect(redactSensitiveUrl('/discover/communities')).toBe('/discover/communities')
    })
  })

  describe('and the URL cannot be parsed', () => {
    it('should return the URL untouched instead of throwing', () => {
      expect(redactSensitiveUrl('http://?token=1')).toBe('http://?token=1')
    })
  })
})

describe('when redacting a breadcrumb URL', () => {
  describe('and the breadcrumb has no data', () => {
    it('should return the breadcrumb unchanged', () => {
      const breadcrumb: Breadcrumb = { category: 'ui.click' }
      expect(redactBreadcrumbUrl(breadcrumb)).toBe(breadcrumb)
    })
  })

  describe('and the breadcrumb data has no URL', () => {
    it('should return the breadcrumb unchanged', () => {
      const breadcrumb: Breadcrumb = { category: 'fetch', data: { method: 'GET' } }
      expect(redactBreadcrumbUrl(breadcrumb)).toBe(breadcrumb)
    })
  })

  describe('and the breadcrumb URL is not a string', () => {
    it('should return the breadcrumb unchanged', () => {
      const breadcrumb: Breadcrumb = { category: 'fetch', data: { url: 42 } }
      expect(redactBreadcrumbUrl(breadcrumb)).toBe(breadcrumb)
    })
  })

  describe('and the breadcrumb URL is sensitive', () => {
    it('should redact the URL and keep the remaining data', () => {
      const breadcrumb: Breadcrumb = { category: 'navigation', data: { method: 'GET', url: '/cast/s/tok' } }
      expect(redactBreadcrumbUrl(breadcrumb)).toEqual({
        category: 'navigation',
        data: { method: 'GET', url: '/cast/s/[redacted]' }
      })
    })
  })
})

describe('when redacting the URLs on an event', () => {
  describe('and the event has a sensitive request URL', () => {
    it('should redact it', () => {
      const event = { request: { url: 'https://decentraland.org/cast/s/tok' } } as ErrorEvent
      expect(redactEventUrls(event).request?.url).toBe('https://decentraland.org/cast/s/[redacted]')
    })

    it('should not mutate the original event', () => {
      const event = { request: { url: 'https://decentraland.org/cast/s/tok' } } as ErrorEvent
      redactEventUrls(event)
      expect(event.request?.url).toBe('https://decentraland.org/cast/s/tok')
    })
  })

  describe('and the event has breadcrumbs with sensitive URLs', () => {
    it('should redact every breadcrumb URL', () => {
      const event = {
        breadcrumbs: [{ category: 'navigation', data: { url: '/account/confirm-email/tok' } }, { category: 'ui.click' }]
      } as ErrorEvent
      expect(redactEventUrls(event).breadcrumbs).toEqual([
        { category: 'navigation', data: { url: '/account/confirm-email/[redacted]' } },
        { category: 'ui.click' }
      ])
    })
  })

  describe('and the event has neither a request nor breadcrumbs', () => {
    it('should return an equivalent event', () => {
      const event = { message: 'boom' } as ErrorEvent
      expect(redactEventUrls(event)).toEqual({ message: 'boom' })
    })
  })

  describe('and the request URL is not a string', () => {
    it('should leave the request untouched', () => {
      const event = { request: { method: 'GET' } } as ErrorEvent
      expect(redactEventUrls(event).request).toEqual({ method: 'GET' })
    })
  })
})
