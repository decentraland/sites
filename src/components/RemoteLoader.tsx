import { Component, Suspense, lazy, useMemo } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { CircularProgress } from 'decentraland-ui2'
import { ErrorContainer, LoadingContainer } from './RemoteLoader.styled'

const isDev = import.meta.env.DEV

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

const remoteCache = new Map<string, LazyExoticComponent<ComponentType>>()

function getRemoteComponent(remoteName: string): LazyExoticComponent<ComponentType> {
  const cached = remoteCache.get(remoteName)
  if (cached) return cached

  const component = lazy(async () => {
    await remoteInitPromise
    // eslint-disable-next-line import/no-unresolved
    const federation = await import('virtual:__federation__')
    const factory = await federation.__federation_method_getRemote(remoteName, './App')
    return { default: factory() as ComponentType }
  })

  remoteCache.set(remoteName, component)
  return component
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
  const Remote = useMemo(() => getRemoteComponent(name), [name])

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
