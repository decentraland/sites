import { Component, Suspense, lazy } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { Box, CircularProgress, styled } from 'decentraland-ui2'

/**
 * Loads a remote Module Federation component.
 *
 * In production, the Cloudflare Worker injects window.__REMOTE_URLS__ with
 * versioned CDN URLs. The remote is loaded via dynamic import() from that URL.
 *
 * In development (no __REMOTE_URLS__), falls back to the build-time federation
 * import which resolves to localhost.
 */
async function loadRemoteModule(remoteName: string, exposedModule: string): Promise<{ default: ComponentType }> {
  const runtimeUrl = window.__REMOTE_URLS__?.[remoteName]

  if (runtimeUrl) {
    // Production: load from worker-injected URL

    const container = await import(/* @vite-ignore */ runtimeUrl)
    if (container.init) {
      await container.init({})
    }
    const factory = await container.get(exposedModule)
    return { default: factory() }
  }

  // Development: use build-time federation import
  // eslint-disable-next-line import/no-unresolved
  return import('whats_on/App')
}

const WhatsOnRemote = lazy(() => loadRemoteModule('whats_on', './App'))

const remoteMap: Record<string, LazyExoticComponent<ComponentType>> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'whats-on': WhatsOnRemote
}

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(10, 0)
}))

const ErrorContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(10, 0)
}))

class RemoteErrorBoundary extends Component<{ children: ReactNode; name: string }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorContainer>Failed to load {this.props.name}. Please try refreshing the page.</ErrorContainer>
    }
    return this.props.children
  }
}

function RemoteLoader({ name }: { name: string }) {
  const Remote = remoteMap[name]
  if (!Remote) return null

  return (
    <RemoteErrorBoundary name={name}>
      <Suspense
        fallback={
          <LoadingContainer>
            <CircularProgress color="inherit" />
          </LoadingContainer>
        }
      >
        <Remote />
      </Suspense>
    </RemoteErrorBoundary>
  )
}

export { RemoteLoader }
