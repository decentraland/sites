import { Component, Suspense, lazy } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { CircularProgress } from 'decentraland-ui2'
import { ErrorContainer, LoadingContainer } from './RemoteLoader.styled'

const isDev = import.meta.env.DEV

/**
 * If runtime URLs are injected by the worker, override the federation
 * remote config before the first lazy load. This uses the plugin's
 * internal __federation_method_setRemote to update the URL while keeping
 * the shared scope resolution intact.
 */
async function initRuntimeRemotes() {
  const urls = window.__REMOTE_URLS__
  if (!urls) return

  try {
    // eslint-disable-next-line import/no-unresolved
    const federation = await import('virtual:__federation__')
    for (const [remoteName, url] of Object.entries(urls)) {
      federation.__federation_method_setRemote(remoteName, {
        url,
        format: 'esm',
        from: 'vite'
      })
    }
  } catch (e) {
    console.error('[RemoteLoader] Failed to set runtime remote URLs:', e)
  }
}

const remoteInitPromise = initRuntimeRemotes()

const WhatsOnRemote = lazy(async () => {
  await remoteInitPromise
  // eslint-disable-next-line import/no-unresolved
  return import('whats_on/App')
})

const remoteMap: Record<string, LazyExoticComponent<ComponentType>> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'whats-on': WhatsOnRemote
}

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
      if (isDev) return null
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
