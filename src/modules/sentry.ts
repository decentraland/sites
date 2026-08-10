import { type ErrorEvent, browserTracingIntegration, init, replayIntegration } from '@sentry/browser'
import { getEnv } from '../config/env'
import { redactBreadcrumbUrl, redactEventUrls } from './sentry.helpers'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', ''])

const isLocalHost = (): boolean => {
  if (typeof window === 'undefined') return false
  const { hostname } = window.location
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.local')
}

const errorFilters: RegExp[] = [/The play\(\) request was interrupted/i, /paused to save power/i]

// Only propagate `sentry-trace`/`baggage` headers to first-party hosts. Attaching
// them to third-party requests (Contentful, Segment, the CDN) adds headers their
// CORS preflight allowlists reject, which would turn working calls into network
// errors — a tracing feature causing the very errors it is meant to observe.
// The `([^/]*\.)?` group is anchored on purpose: an unanchored `[^/]*` would also
// match a lookalike host like `evildecentraland.org` and leak trace headers to it.
const TRACE_PROPAGATION_TARGETS: RegExp[] = [/^https:\/\/([^/]*\.)?decentraland\.(org|zone|today)(\/|$)/i]

// Replay is by far the heaviest signal we send, so no session is recorded merely
// for existing — only a tenth of the sessions that actually hit an error.
const REPLAY_SESSION_SAMPLE_RATE = 0
const REPLAY_ON_ERROR_SAMPLE_RATE = 0.1
const TRACES_SAMPLE_RATE = 0.1

const dsn = getEnv('SENTRY_DSN')

if (dsn && !isLocalHost()) {
  init({
    dsn,
    environment: getEnv('ENVIRONMENT'),
    // Injected by `define` in vite.config.ts and kept identical to the release
    // the Sentry vite plugin uploads source maps under. Without it every stack
    // trace stays minified, which is how this project ran until now.
    release: process.env.SENTRY_RELEASE,
    ignoreErrors: errorFilters,
    integrations: [
      browserTracingIntegration(),
      // These three are already the SDK defaults; spelled out because this app
      // renders wallet addresses and email inputs, so a future SDK default flip
      // would silently start recording them.
      replayIntegration({ blockAllMedia: true, maskAllInputs: true, maskAllText: true })
    ],
    tracePropagationTargets: TRACE_PROPAGATION_TARGETS,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    replaysOnErrorSampleRate: REPLAY_ON_ERROR_SAMPLE_RATE,
    replaysSessionSampleRate: REPLAY_SESSION_SAMPLE_RATE,
    beforeBreadcrumb: redactBreadcrumbUrl,
    beforeSend: (event: ErrorEvent): ErrorEvent | null => {
      const framesMatch = event.exception?.values?.some(exception =>
        exception.stacktrace?.frames?.some(frame => frame.filename?.includes('gtm') || frame.filename?.includes('stag'))
      )
      if (framesMatch) return null

      const errorMessage = event.message ?? event.exception?.values?.[0]?.value ?? ''
      if (errorFilters.some(filter => filter.test(errorMessage))) return null

      return redactEventUrls(event)
    }
  })
  // @dcl/hooks' internal `sentry(tracker)` wrapper gates its captureException
  // call on `window.Sentry` being truthy. Marking it here lets errors from
  // useAsyncState / useAsyncTask / useAsyncEffect flow to Sentry as well.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Sentry = true
}
