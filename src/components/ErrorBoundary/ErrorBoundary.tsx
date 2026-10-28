import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { captureHandledError } from '../../modules/captureHandledError'
import { FallbackContainer, FallbackMessage, FallbackTitle, ReloadButton } from './ErrorBoundary.styled'

// A failed dynamic import surfaces with browser-specific wording, so match on the
// shapes all of them share rather than on one engine's message.
const CHUNK_ERROR_PATTERNS = [/dynamically imported module/i, /Importing a module script failed/i, /error loading dynamically imported/i]
const CHUNK_RELOAD_KEY = 'dcl:chunk-reload-at'
const CHUNK_RELOAD_COOLDOWN_MS = 60_000
const CHUNK_REPORT_TIMEOUT_MS = 1500
const SENTRY_FLUSH_TIMEOUT_MS = 1000

const isChunkLoadError = (error: Error): boolean => CHUNK_ERROR_PATTERNS.some(pattern => pattern.test(error.message))

// A failed import is cached by the current document in some browsers. A single
// full reload gives the route a fresh module graph after a transient CDN failure.
// Keep the fallback after a second failure so a persistent outage cannot loop.
function reloadFailedChunkOnce(): void {
  try {
    const now = Date.now()
    const previous = window.sessionStorage.getItem(CHUNK_RELOAD_KEY)
    const elapsed = now - Number(previous)
    if (previous !== null && elapsed >= 0 && elapsed < CHUNK_RELOAD_COOLDOWN_MS) return

    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now))
    window.location.reload()
  } catch {
    // Storage can be blocked; leave the existing fallback and manual reload CTA.
  }
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  /**
   * When this changes while an error is showing, the boundary clears it. Passing
   * the pathname lets a back/forward navigation recover without a reload.
   *
   * Deliberately NOT a `key` on the boundary: keying it would remount the entire
   * routed tree on every navigation, throwing away component state site-wide.
   */
  resetKey?: string
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const chunkError = isChunkLoadError(error)
    const report = captureHandledError(error, {
      /* eslint-disable @typescript-eslint/naming-convention -- Sentry tag keys are
         data read in the Sentry UI, where the convention is snake_case. */
      tags: {
        boundary: 'route',
        chunk_load_error: String(chunkError),
        // Distinguishes "the user went offline" from "the asset is unreachable
        // while the connection is up", which need different follow-ups.
        //
        // `navigator.onLine` is unreliable: several browsers report `true` for any
        // link-layer connection even with no route to the internet, and a few have
        // shipped it stuck. That is acceptable here precisely because this is a
        // triage hint on an error we already caught, never control flow — do not
        // promote it into a condition that decides what the app does.
        online: typeof navigator === 'undefined' ? undefined : String(navigator.onLine)
      },
      /* eslint-enable @typescript-eslint/naming-convention */
      extra: { componentStack: errorInfo.componentStack },
      flushTimeoutMs: chunkError ? SENTRY_FLUSH_TIMEOUT_MS : undefined
    })
    if (!chunkError) return

    // Give Sentry time to load and send this diagnostic before navigation.
    // A blocked SDK must not leave the user on the error page indefinitely.
    let timer: ReturnType<typeof setTimeout>
    const timeout = new Promise<void>(resolve => {
      timer = setTimeout(resolve, CHUNK_REPORT_TIMEOUT_MS)
    })
    const finish = () => {
      clearTimeout(timer)
      reloadFailedChunkOnce()
    }
    void Promise.race([report, timeout]).then(finish, finish)
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps): void {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

const ErrorFallback = () => {
  const l = useFormatMessage()
  return (
    <FallbackContainer>
      <FallbackTitle variant="h5">{l('component.error_boundary.title')}</FallbackTitle>
      <FallbackMessage variant="body1">{l('component.error_boundary.message')}</FallbackMessage>
      <ReloadButton variant="contained" color="primary" onClick={() => window.location.reload()}>
        {l('component.error_boundary.reload')}
      </ReloadButton>
    </FallbackContainer>
  )
}

/**
 * Route-level error boundary. Without one, a rejected lazy import unmounts the whole
 * React tree and the user is left staring at a blank page with no way out.
 */
const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary fallback={<ErrorFallback />} resetKey={pathname}>
      {children}
    </ErrorBoundary>
  )
}

export { ErrorBoundary, ErrorFallback, RouteErrorBoundary }
