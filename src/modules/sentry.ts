import { type ErrorEvent, init } from '@sentry/browser'
import { getEnv } from '../config/env'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', ''])

const isLocalHost = (): boolean => {
  if (typeof window === 'undefined') return false
  const { hostname } = window.location
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.local')
}

const errorFilters: RegExp[] = [/The play\(\) request was interrupted/i, /paused to save power/i]

const dsn = getEnv('SENTRY_DSN')

if (dsn && !isLocalHost()) {
  init({
    dsn,
    environment: getEnv('ENVIRONMENT'),
    ignoreErrors: errorFilters,
    beforeSend: (event: ErrorEvent): ErrorEvent | null => {
      const framesMatch = event.exception?.values?.some(exception =>
        exception.stacktrace?.frames?.some(frame => frame.filename?.includes('gtm') || frame.filename?.includes('stag'))
      )
      if (framesMatch) return null

      const errorMessage = event.message ?? event.exception?.values?.[0]?.value ?? ''
      if (errorFilters.some(filter => filter.test(errorMessage))) return null

      return event
    }
  })
  // @dcl/hooks' internal `sentry(tracker)` wrapper gates its captureException
  // call on `window.Sentry` being truthy. Marking it here lets errors from
  // useAsyncState / useAsyncTask / useAsyncEffect flow to Sentry as well.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Sentry = true
}
