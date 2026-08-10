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

// Propagate trace headers to nothing. An empty list makes the SDK's
// `shouldAttachHeaders` return false for every URL, so `browserTracingIntegration`
// stops adding `sentry-trace`/`baggage` to outgoing requests.
//
// Restricting this to first-party hosts was not enough: Decentraland's own services
// do not all allow those headers. On the 0.54.4 zone deploy, `peer.decentraland.zone`
// (the Catalyst content server) rejected the preflight with "Request header field
// sentry-trace is not allowed by Access-Control-Allow-Headers", which broke the
// whats-on deployer enrichment. Other hosts (events, realm-provider) accepted them,
// so a per-host allowlist would break again the moment a backend's CORS config drifts.
//
// Browser-side performance data (page load, navigation, resource timing) is
// unaffected. Only front-to-back trace correlation is given up, and re-enabling it
// requires every Decentraland backend to allow both headers first.
const TRACE_PROPAGATION_TARGETS: (string | RegExp)[] = []

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
