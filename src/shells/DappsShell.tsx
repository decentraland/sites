import { Suspense } from 'react'
import { Provider } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { CircularProgress } from 'decentraland-ui2'
import { CenteredBox } from '../App.styled'
import { store } from './store'

function DappsShellFallback() {
  return (
    <CenteredBox>
      <CircularProgress color="inherit" />
    </CenteredBox>
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
