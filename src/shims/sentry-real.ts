// Re-export the real @sentry/browser SDK.
// The sentry-lazy-redirect plugin in vite.config.ts skips redirection
// when the importer path contains 'sentry-real', so this resolves
// to the actual SDK in node_modules.
export { captureException, captureMessage, init, setUser, setTag, setExtra, addBreadcrumb, withScope } from '@sentry/browser'
