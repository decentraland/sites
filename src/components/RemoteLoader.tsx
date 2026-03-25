import { Component, Suspense, lazy } from 'react'
import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { Box, CircularProgress, styled } from 'decentraland-ui2'

// eslint-disable-next-line import/no-unresolved
const WhatsOnRemote = lazy(() => import('whats_on/App'))

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
