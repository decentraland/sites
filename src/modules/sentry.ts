import { init } from '@sentry/browser'
import { Env, getEnv as getRuntimeEnv } from '@dcl/ui-env'
import { getEnv } from '../config/env'

const dsn = getEnv('SENTRY_DSN')

if (dsn) {
  init({
    dsn,
    environment: getEnv('ENVIRONMENT'),
    enabled: getRuntimeEnv() !== Env.DEVELOPMENT
  })
  // @dcl/hooks' internal `sentry(tracker)` wrapper gates its captureException
  // call on `window.Sentry` being truthy. Marking it here lets errors from
  // useAsyncState / useAsyncTask / useAsyncEffect flow to Sentry as well.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Sentry = true
}
