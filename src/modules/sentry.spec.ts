import type { BrowserOptions, ErrorEvent, init as sentryInit } from '@sentry/browser'

jest.mock('@sentry/browser', () => ({
  browserTracingIntegration: jest.fn(() => ({ name: 'BrowserTracing' })),
  init: jest.fn(),
  replayIntegration: jest.fn(() => ({ name: 'Replay' }))
}))

jest.mock('../config/env', () => ({ getEnv: jest.fn() }))

const DSN = 'https://examplekey@o0.ingest.us.sentry.io/1'

interface LoadOptions {
  dsn?: string
  environment?: string
  hostname?: string
  release?: string
}

/**
 * `sentry.ts` runs its `init()` at import time, so every case needs a fresh
 * module registry. The mocked modules are re-imported after the reset so the
 * spec holds the same instances the module under test received.
 */
const loadSentryModule = async (options: LoadOptions = {}): Promise<jest.MockedFunction<typeof sentryInit>> => {
  const { environment = 'production', hostname = 'decentraland.org', release } = options
  // Read through `in` rather than a default parameter so an explicit
  // `{ dsn: undefined }` models a missing DSN instead of falling back to one.
  const dsn = 'dsn' in options ? options.dsn : DSN
  Object.defineProperty(window, 'location', { configurable: true, value: { hostname }, writable: true })
  if (release === undefined) {
    delete process.env.SENTRY_RELEASE
  } else {
    process.env.SENTRY_RELEASE = release
  }
  jest.resetModules()
  const { getEnv } = await import('../config/env')
  ;(getEnv as jest.MockedFunction<typeof getEnv>).mockImplementation((key: string) => {
    if (key === 'SENTRY_DSN') return dsn
    if (key === 'ENVIRONMENT') return environment
    return undefined
  })
  const sentryBrowser = await import('@sentry/browser')
  await import('./sentry')
  return sentryBrowser.init as jest.MockedFunction<typeof sentryInit>
}

const getOptions = (mockedInit: jest.MockedFunction<typeof sentryInit>): BrowserOptions => {
  const options = mockedInit.mock.calls[0]?.[0]
  if (!options) throw new Error('init was not called')
  return options
}

afterEach(() => {
  delete process.env.SENTRY_RELEASE
  jest.resetAllMocks()
})

describe('when the module loads on a deployed host with a DSN', () => {
  it('should initialize Sentry', async () => {
    const mockedInit = await loadSentryModule()
    expect(mockedInit).toHaveBeenCalledTimes(1)
  })

  it('should pass the DSN and environment through', async () => {
    const mockedInit = await loadSentryModule({ environment: 'staging' })
    expect(getOptions(mockedInit)).toMatchObject({ dsn: DSN, environment: 'staging' })
  })

  it('should enable performance tracing and error-only replay sampling', async () => {
    const mockedInit = await loadSentryModule()
    expect(getOptions(mockedInit)).toMatchObject({
      replaysOnErrorSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      tracesSampleRate: 0.1
    })
  })

  it('should register the tracing and replay integrations', async () => {
    const mockedInit = await loadSentryModule()
    expect(getOptions(mockedInit).integrations).toEqual([{ name: 'BrowserTracing' }, { name: 'Replay' }])
  })

  it('should restrict trace propagation to first-party hosts', async () => {
    const mockedInit = await loadSentryModule()
    const targets = getOptions(mockedInit).tracePropagationTargets as RegExp[]
    const propagatesTo = (url: string): boolean => targets.some(target => target.test(url))
    expect(propagatesTo('https://decentraland.org/api')).toBe(true)
    expect(propagatesTo('https://places.decentraland.org/api')).toBe(true)
    expect(propagatesTo('https://cdn.contentful.com/spaces')).toBe(false)
    // A lookalike host must not receive the trace headers.
    expect(propagatesTo('https://evildecentraland.org/api')).toBe(false)
  })

  it('should mark window.Sentry so @dcl/hooks forwards its captures', async () => {
    await loadSentryModule()
    expect((window as unknown as { Sentry?: unknown }).Sentry).toBe(true)
  })
})

describe('when a release is injected at build time', () => {
  it('should forward it so uploaded source maps match', async () => {
    const mockedInit = await loadSentryModule({ release: 'sites@1.2.3' })
    expect(getOptions(mockedInit).release).toBe('sites@1.2.3')
  })
})

describe('when the module loads without a release', () => {
  it('should leave the release undefined', async () => {
    const mockedInit = await loadSentryModule()
    expect(getOptions(mockedInit).release).toBeUndefined()
  })
})

describe('when the module loads on localhost', () => {
  it('should not initialize Sentry', async () => {
    const mockedInit = await loadSentryModule({ hostname: 'localhost' })
    expect(mockedInit).not.toHaveBeenCalled()
  })
})

describe('when the module loads on a .local host', () => {
  it('should not initialize Sentry', async () => {
    const mockedInit = await loadSentryModule({ hostname: 'my-machine.local' })
    expect(mockedInit).not.toHaveBeenCalled()
  })
})

describe('when the DSN is missing', () => {
  it('should not initialize Sentry', async () => {
    const mockedInit = await loadSentryModule({ dsn: undefined })
    expect(mockedInit).not.toHaveBeenCalled()
  })
})

describe('when beforeSend inspects an event', () => {
  const send = async (event: ErrorEvent): Promise<ErrorEvent | null> => {
    const mockedInit = await loadSentryModule()
    const { beforeSend } = getOptions(mockedInit)
    if (!beforeSend) throw new Error('beforeSend was not configured')
    return beforeSend(event, {}) as ErrorEvent | null
  }

  describe('and a stack frame comes from a third-party tag script', () => {
    it('should drop the event', async () => {
      const event = {
        exception: { values: [{ stacktrace: { frames: [{ filename: 'https://x/gtm.js' }] } }] }
      } as ErrorEvent
      expect(await send(event)).toBeNull()
    })
  })

  describe('and the message matches a filtered error', () => {
    it('should drop the event', async () => {
      expect(await send({ message: 'The play() request was interrupted' } as ErrorEvent)).toBeNull()
    })
  })

  describe('and the exception value matches a filtered error', () => {
    it('should drop the event', async () => {
      const event = { exception: { values: [{ value: 'paused to save power' }] } } as ErrorEvent
      expect(await send(event)).toBeNull()
    })
  })

  describe('and the event carries a sensitive request URL', () => {
    it('should redact it before sending', async () => {
      const event = { request: { url: 'https://decentraland.org/cast/s/tok' } } as ErrorEvent
      const result = await send(event)
      expect(result?.request?.url).toBe('https://decentraland.org/cast/s/[redacted]')
    })
  })

  describe('and the event is unremarkable', () => {
    it('should keep it', async () => {
      const result = await send({ message: 'boom' } as ErrorEvent)
      expect(result).toMatchObject({ message: 'boom' })
    })
  })
})

describe('when beforeBreadcrumb inspects a breadcrumb', () => {
  it('should redact a sensitive URL', async () => {
    const mockedInit = await loadSentryModule()
    const { beforeBreadcrumb } = getOptions(mockedInit)
    if (!beforeBreadcrumb) throw new Error('beforeBreadcrumb was not configured')
    const result = beforeBreadcrumb({ category: 'navigation', data: { url: '/account/confirm-email/tok' } }, {})
    expect(result?.data?.url).toBe('/account/confirm-email/[redacted]')
  })
})
