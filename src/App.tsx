import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RemoteLoader } from './components/RemoteLoader'
import { DownloadPage } from './pages/download'
import { IndexPage } from './pages/index.tsx'
import { SignInRedirect } from './pages/SignInRedirect'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/download" element={<DownloadPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/sign-in" element={<SignInRedirect />} />
          <Route path="/whats-on/*" element={<RemoteLoader name="whats-on" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export { App }
