import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RemoteLoader } from './components/RemoteLoader'
import { IndexPage } from './pages/index.tsx'
import { SignInRedirect } from './pages/SignInRedirect'

const DownloadSuccessPage = lazy(() => import('./pages/DownloadSuccess').then(m => ({ default: m.DownloadSuccess })))

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/download_success"
          element={
            <Suspense fallback={null}>
              <DownloadSuccessPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<IndexPage />} />
                <Route path="/sign-in" element={<SignInRedirect />} />
                <Route path="/whats-on/*" element={<RemoteLoader name="whats-on" />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export { App }
