import { Component, Suspense, lazy } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { CircularProgress } from 'decentraland-ui2'
import { ErrorContainer, LoadingContainer } from './RemoteLoader.styled'

const isDev = import.meta.env.DEV

async function loadRemoteModule(remoteName: string, exposedModule: string): Promise<{ default: ComponentType }> {
  const runtimeUrl = window.__REMOTE_URLS__?.[remoteName]

  if (runtimeUrl) {
    const container = await import(/* @vite-ignore */ runtimeUrl)
    if (container.init) {
      await container.init({})
    }
    const factory = await container.get(exposedModule)
    return { default: factory() }
  }

  // eslint-disable-next-line import/no-unresolved
  return import('whats_on/App')
}

const WhatsOnRemote = lazy(() => loadRemoteModule('whats_on', './App'))

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
