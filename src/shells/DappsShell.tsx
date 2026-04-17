import { Suspense } from 'react'
import { Provider } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { CircularProgress } from 'decentraland-ui2'
import { store } from './store'

function DappsShellFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress color="inherit" />
    </div>
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
