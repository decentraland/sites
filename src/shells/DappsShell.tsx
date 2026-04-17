import { Suspense } from 'react'
import { Provider } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { CircularProgress } from 'decentraland-ui2'
import { store } from './store'
import { FallbackContainer } from './DappsShell.styled'

function DappsShellFallback() {
  return (
    <FallbackContainer>
      <CircularProgress color="inherit" />
    </FallbackContainer>
  )
}

function DappsShell() {
  return (
    <Provider store={store}>
      <Suspense fallback={<DappsShellFallback />}>
        <Outlet />
      </Suspense>
    </Provider>
  )
}

export { DappsShell }
