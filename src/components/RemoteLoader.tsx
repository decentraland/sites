import { Component, Suspense, lazy, useMemo } from 'react'
import type { ComponentType, ErrorInfo, LazyExoticComponent, ReactNode } from 'react'
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
      const normalizedName = remoteName.replace(/-/g, '_')
      federation.__federation_method_setRemote(normalizedName, {
        url,
        format: 'esm',
        from: 'vite'
      })
    }
  } catch (e) {
    console.error('[RemoteLoader] Failed to set runtime remote URLs:', e)
    throw e
  }
}

const remoteInitPromise = initRuntimeRemotes()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const remoteCache = new Map<string, LazyExoticComponent<ComponentType<any>>>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRemoteComponent(remoteName: string): LazyExoticComponent<ComponentType<any>> {
  const cached = remoteCache.get(remoteName)
  if (cached) return cached

  const component = lazy(async () => {
    await remoteInitPromise

    // If no runtime URLs were injected (e.g. Vercel preview without the
    // sites-deployer worker), skip loading to avoid fetching the build-time
    // placeholder URL which does not exist.
    const urls = window.__REMOTE_URLS__
    const normalizedName = remoteName.replace(/-/g, '_')
    if (!urls || !(remoteName in urls || normalizedName in urls)) {
      throw new Error(`[RemoteLoader] No runtime URL for remote "${remoteName}"`)
    }

    // eslint-disable-next-line import/no-unresolved
    const federation = await import('virtual:__federation__')
    const remoteModule = await federation.__federation_method_getRemote(normalizedName, './App')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { default: (remoteModule.default ?? remoteModule) as ComponentType<any> }
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[RemoteLoader] Failed to load remote "${this.props.name}":`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (isDev) {
        return <ErrorContainer>[DEV] Failed to load remote &quot;{this.props.name}&quot;. Check the console for details.</ErrorContainer>
      }
      return <ErrorContainer>Failed to load {this.props.name}. Please try refreshing the page.</ErrorContainer>
    }
    return this.props.children
  }
}

type RemoteLoaderProps = {
  name: string
  [key: string]: unknown
}

function RemoteLoader({ name, ...remoteProps }: RemoteLoaderProps) {
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
        <Remote {...remoteProps} />
      </Suspense>
    </RemoteErrorBoundary>
  )
}

export { RemoteLoader }
