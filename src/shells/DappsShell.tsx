import { Suspense } from 'react'
import { Provider } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { CircularProgress } from 'decentraland-ui2'
import { CenteredBox } from '../App.styled'
import { persistor, store } from './store'

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
      <PersistGate loading={null} persistor={persistor}>
        <Suspense fallback={<DappsShellFallback />}>
          <Outlet />
        </Suspense>
      </PersistGate>
    </Provider>
  )
}

export { DappsShell }
